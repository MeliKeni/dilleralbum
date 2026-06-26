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

    const { trade_id, action } = await req.json();
    if (!trade_id || !action) return error('trade_id y action requeridos', 400);
    if (!['accept', 'reject', 'cancel'].includes(action)) return error('Acción inválida', 400);

    // Obtener el trade
    const { data: trade } = await supabase
      .from('trades')
      .select('*, trade_offered_stickers(*), trade_requested_stickers(*)')
      .eq('id', trade_id)
      .single();

    if (!trade) return error('Intercambio no encontrado', 404);
    if (trade.status !== 'pending') return error('Este intercambio ya no está activo', 400);
    if (new Date(trade.expires_at) < new Date()) {
      await supabase.from('trades').update({ status: 'expired' }).eq('id', trade_id);
      return error('Este intercambio venció', 400);
    }

    // Verificar permisos según acción
    if (action === 'cancel' && trade.proposer_id !== user.id) {
      return error('Solo el proponente puede cancelar', 403);
    }
    if ((action === 'accept' || action === 'reject') && trade.receiver_id !== user.id) {
      return error('Solo el receptor puede aceptar o rechazar', 403);
    }

    if (action === 'reject' || action === 'cancel') {
      await supabase
        .from('trades')
        .update({ status: action === 'reject' ? 'rejected' : 'cancelled' })
        .eq('id', trade_id);

      const notifType = action === 'reject' ? 'trade_rejected' : 'trade_cancelled';
      const notifUser = action === 'reject' ? trade.proposer_id : trade.receiver_id;
      await supabase.from('notifications').insert({
        user_id: notifUser,
        type: notifType,
        title: action === 'reject' ? 'Intercambio rechazado' : 'Intercambio cancelado',
        body: 'Un intercambio fue ' + (action === 'reject' ? 'rechazado' : 'cancelado'),
        data: { trade_id },
      });

      return json({ success: true });
    }

    // ACEPTAR: verificar inventarios y ejecutar transferencia atómica
    const offered = trade.trade_offered_stickers as { sticker_id: string; quantity: number }[];
    const requested = trade.trade_requested_stickers as { sticker_id: string; quantity: number }[];

    // Verificar que el proponente tiene lo que ofrece
    for (const item of offered) {
      const { data: inv } = await supabase
        .from('user_stickers')
        .select('quantity')
        .eq('user_id', trade.proposer_id)
        .eq('sticker_id', item.sticker_id)
        .single();
      if (!inv || inv.quantity < item.quantity) {
        return error('El proponente ya no tiene las figuritas ofrecidas', 400);
      }
    }

    // Verificar que el receptor tiene lo que se pide
    for (const item of requested) {
      const { data: inv } = await supabase
        .from('user_stickers')
        .select('quantity')
        .eq('user_id', trade.receiver_id)
        .eq('sticker_id', item.sticker_id)
        .single();
      if (!inv || inv.quantity < item.quantity) {
        return error('No tenés las figuritas solicitadas', 400);
      }
    }

    // Ejecutar transferencias
    await transferStickers(supabase, trade.proposer_id, trade.receiver_id, offered);
    await transferStickers(supabase, trade.receiver_id, trade.proposer_id, requested);

    // Marcar trade como completado
    await supabase
      .from('trades')
      .update({ status: 'accepted', completed_at: new Date().toISOString() })
      .eq('id', trade_id);

    // Notificar al proponente
    await supabase.from('notifications').insert({
      user_id: trade.proposer_id,
      type: 'trade_accepted',
      title: '¡Intercambio aceptado!',
      body: 'Tu propuesta de intercambio fue aceptada',
      data: { trade_id },
    });

    return json({ success: true });
  } catch (err) {
    console.error('execute-trade error:', err);
    return error('Error interno', 500);
  }
});

async function transferStickers(
  supabase: ReturnType<typeof createClient>,
  fromId: string,
  toId: string,
  items: { sticker_id: string; quantity: number }[]
) {
  for (const item of items) {
    // Decrementar del dador
    const { data: fromInv } = await supabase
      .from('user_stickers')
      .select('quantity')
      .eq('user_id', fromId)
      .eq('sticker_id', item.sticker_id)
      .single();

    await supabase
      .from('user_stickers')
      .update({ quantity: (fromInv?.quantity ?? 0) - item.quantity })
      .eq('user_id', fromId)
      .eq('sticker_id', item.sticker_id);

    // Incrementar al receptor
    const { data: toInv } = await supabase
      .from('user_stickers')
      .select('quantity')
      .eq('user_id', toId)
      .eq('sticker_id', item.sticker_id)
      .single();

    if (toInv) {
      await supabase
        .from('user_stickers')
        .update({ quantity: toInv.quantity + item.quantity })
        .eq('user_id', toId)
        .eq('sticker_id', item.sticker_id);
    } else {
      await supabase
        .from('user_stickers')
        .insert({ user_id: toId, sticker_id: item.sticker_id, quantity: item.quantity });
    }
  }
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
