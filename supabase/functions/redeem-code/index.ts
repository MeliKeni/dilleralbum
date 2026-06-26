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

    const { code: rawCode } = await req.json();
    if (!rawCode) return error('Código requerido', 400);

    const code = rawCode.trim().toUpperCase();

    // Buscar el código
    const { data: codeRow } = await supabase
      .from('codes')
      .select('*')
      .ilike('code', code)
      .single();

    if (!codeRow) return error('Código inválido', 404);
    if (!codeRow.is_active) return error('Este código está desactivado', 400);
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      return error('Este código ya venció', 400);
    }
    if (codeRow.max_uses !== null && codeRow.uses_count >= codeRow.max_uses) {
      return error('Este código ya alcanzó su límite de usos', 400);
    }

    // Verificar uso único por usuario
    if (codeRow.is_single_use_per_user) {
      const { data: redemption } = await supabase
        .from('code_redemptions')
        .select('id')
        .eq('code_id', codeRow.id)
        .eq('user_id', user.id)
        .single();
      if (redemption) return error('Ya canjeaste este código', 400);
    }

    const packConfigId = codeRow.pack_config_id;

    // Obtener config por defecto si no tiene asignado uno específico
    let configId = packConfigId;
    if (!configId) {
      const { data: defaultConfig } = await supabase
        .from('pack_configs')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();
      configId = defaultConfig?.id;
    }

    if (!configId) return error('No hay configuración de sobres', 500);

    // TRANSACCIÓN: registrar canje + incrementar usos + agregar sobres
    const { error: redemptionError } = await supabase
      .from('code_redemptions')
      .insert({ code_id: codeRow.id, user_id: user.id });
    if (redemptionError) throw redemptionError;

    await supabase
      .from('codes')
      .update({ uses_count: codeRow.uses_count + 1 })
      .eq('id', codeRow.id);

    // Agregar sobres al usuario
    const { data: existing } = await supabase
      .from('user_packs')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('pack_config_id', configId)
      .single();

    if (existing) {
      await supabase
        .from('user_packs')
        .update({ quantity: existing.quantity + codeRow.packs_amount })
        .eq('user_id', user.id)
        .eq('pack_config_id', configId);
    } else {
      await supabase
        .from('user_packs')
        .insert({ user_id: user.id, pack_config_id: configId, quantity: codeRow.packs_amount });
    }

    // Notificación
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'code_redeemed',
      title: '¡Código canjeado!',
      body: `Recibiste ${codeRow.packs_amount} sobre${codeRow.packs_amount > 1 ? 's' : ''}`,
      data: { packs_amount: codeRow.packs_amount },
    });

    return json({ success: true, packs_received: codeRow.packs_amount });
  } catch (err) {
    console.error('redeem-code error:', err);
    return error('Error interno', 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
function error(message: string, status = 400) {
  return json({ success: false, error: message }, status);
}
