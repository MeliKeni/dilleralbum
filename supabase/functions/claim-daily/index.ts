import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_PACKS = 2;

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

    const today = new Date().toISOString().split('T')[0];

    // Intentar insertar el reclamo de hoy (UNIQUE lo previene si ya se hizo)
    const { error: claimError } = await supabase
      .from('daily_claims')
      .insert({ user_id: user.id, claimed_date: today, packs_given: DAILY_PACKS });

    if (claimError) {
      // Ya reclamó hoy
      if (claimError.code === '23505') {
        return json({ success: false, already_claimed: true, error: 'Ya reclamaste tus sobres de hoy' });
      }
      throw claimError;
    }

    // Obtener el pack config activo del primer álbum
    const { data: config } = await supabase
      .from('pack_configs')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!config) return error('No hay configuración de sobres activa', 500);

    // Agregar sobres al usuario
    const { data: existing } = await supabase
      .from('user_packs')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('pack_config_id', config.id)
      .single();

    if (existing) {
      await supabase
        .from('user_packs')
        .update({ quantity: existing.quantity + DAILY_PACKS })
        .eq('user_id', user.id)
        .eq('pack_config_id', config.id);
    } else {
      await supabase
        .from('user_packs')
        .insert({ user_id: user.id, pack_config_id: config.id, quantity: DAILY_PACKS });
    }

    return json({ success: true, packs_given: DAILY_PACKS });
  } catch (err) {
    console.error('claim-daily error:', err);
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
