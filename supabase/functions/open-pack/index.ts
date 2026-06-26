import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return error('Unauthorized', 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return error('Unauthorized', 401);

    // Verificar que no está bloqueado
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', user.id)
      .single();
    if (profile?.is_blocked) return error('Cuenta bloqueada', 403);

    const { pack_config_id } = await req.json();
    if (!pack_config_id) return error('pack_config_id requerido', 400);

    // Obtener config del sobre
    const { data: config } = await supabase
      .from('pack_configs')
      .select('*')
      .eq('id', pack_config_id)
      .eq('is_active', true)
      .single();
    if (!config) return error('Configuración de sobre no encontrada', 404);

    // Verificar que el usuario tiene sobres disponibles
    const { data: userPacks } = await supabase
      .from('user_packs')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('pack_config_id', pack_config_id)
      .single();

    if (!userPacks || userPacks.quantity < 1) {
      return error('No tenés sobres disponibles', 400);
    }

    // Obtener pool de figuritas del álbum
    const query = supabase
      .from('stickers')
      .select('id, is_extra')
      .eq('album_id', config.album_id)
      .eq('is_active', true);

    if (!config.include_extras) {
      query.eq('is_extra', false);
    }

    const { data: pool } = await query;
    if (!pool || pool.length === 0) return error('No hay figuritas disponibles', 400);

    // Seleccionar N figuritas aleatorias del pool
    const selected = shuffleAndPick(pool, config.stickers_per_pack);

    // TRANSACCIÓN ATÓMICA
    // 1. Decrementar sobre
    const { error: decrError } = await supabase
      .from('user_packs')
      .update({ quantity: userPacks.quantity - 1 })
      .eq('user_id', user.id)
      .eq('pack_config_id', pack_config_id);
    if (decrError) throw decrError;

    // 2. Crear registro de apertura
    const { data: opening, error: openErr } = await supabase
      .from('pack_openings')
      .insert({ user_id: user.id, pack_config_id })
      .select('id')
      .single();
    if (openErr) throw openErr;

    // 3. Obtener stickers ya poseídos para marcar duplicados
    const stickerIds = selected.map((s) => s.id);
    const { data: existing } = await supabase
      .from('user_stickers')
      .select('sticker_id, quantity')
      .eq('user_id', user.id)
      .in('sticker_id', stickerIds);

    const ownedMap = new Map(existing?.map((e) => [e.sticker_id, e.quantity]) ?? []);

    // 4. Insertar resultados de apertura
    const results = selected.map((s) => ({
      opening_id: opening.id,
      sticker_id: s.id,
      was_duplicate: (ownedMap.get(s.id) ?? 0) > 0,
    }));

    await supabase.from('pack_opening_results').insert(results);

    // 5. UPSERT inventario de figuritas
    for (const s of selected) {
      const current = ownedMap.get(s.id) ?? 0;
      if (current > 0) {
        await supabase
          .from('user_stickers')
          .update({ quantity: current + 1 })
          .eq('user_id', user.id)
          .eq('sticker_id', s.id);
      } else {
        await supabase
          .from('user_stickers')
          .insert({ user_id: user.id, sticker_id: s.id, quantity: 1 });
      }
    }

    // 6. Datos completos de stickers para la respuesta
    const { data: stickerDetails } = await supabase
      .from('stickers')
      .select('id, sticker_number, display_name, image_url, is_extra, panoramic_group')
      .in('id', stickerIds);

    const stickerMap = new Map(stickerDetails?.map((s) => [s.id, s]) ?? []);

    const responseStickers = results.map((r) => ({
      ...stickerMap.get(r.sticker_id),
      was_duplicate: r.was_duplicate,
    }));

    return json({ success: true, stickers: responseStickers, opening_id: opening.id });
  } catch (err) {
    console.error('open-pack error:', err);
    return error('Error interno', 500);
  }
});

function shuffleAndPick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function error(message: string, status = 400) {
  return json({ success: false, error: message }, status);
}
