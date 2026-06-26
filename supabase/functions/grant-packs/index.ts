import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Edge Function de admin: regalar sobres a un usuario específico
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

    // Verificar que es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!profile?.is_admin) return error('No autorizado', 403);

    const { target_user_id, packs_amount, pack_config_id } = await req.json();
    if (!target_user_id || !packs_amount) return error('target_user_id y packs_amount requeridos', 400);

    // Obtener config
    let configId = pack_config_id;
    if (!configId) {
      const { data: defaultConfig } = await supabase
        .from('pack_configs')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();
      configId = defaultConfig?.id;
    }
    if (!configId) return error('No hay config activa', 500);

    // Agregar sobres
    const { data: existing } = await supabase
      .from('user_packs')
      .select('quantity')
      .eq('user_id', target_user_id)
      .eq('pack_config_id', configId)
      .single();

    if (existing) {
      await supabase
        .from('user_packs')
        .update({ quantity: existing.quantity + packs_amount })
        .eq('user_id', target_user_id)
        .eq('pack_config_id', configId);
    } else {
      await supabase
        .from('user_packs')
        .insert({ user_id: target_user_id, pack_config_id: configId, quantity: packs_amount });
    }

    await supabase.from('notifications').insert({
      user_id: target_user_id,
      type: 'packs_received',
      title: '¡Recibiste sobres!',
      body: `El administrador te regaló ${packs_amount} sobre${packs_amount > 1 ? 's' : ''}`,
      data: { packs_amount },
    });

    return json({ success: true });
  } catch (err) {
    console.error('grant-packs error:', err);
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
