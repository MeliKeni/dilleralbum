import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { callFunction, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { StickerCard } from '@/components/sticker/StickerCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { formatDate, getTimeUntil } from '@/lib/utils';
import type { TradeWithDetails } from '@/types/app';

const statusConfig = {
  pending: { label: 'Pendiente', variant: 'accent' as const },
  accepted: { label: 'Aceptado', variant: 'success' as const },
  rejected: { label: 'Rechazado', variant: 'error' as const },
  cancelled: { label: 'Cancelado', variant: 'default' as const },
  expired: { label: 'Vencido', variant: 'default' as const },
};

export default function TradeDetailScreen() {
  const { tradeId } = useLocalSearchParams<{ tradeId: string }>();
  const { user } = useAuthStore();
  const [trade, setTrade] = useState<TradeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchTrade(); }, []);

  async function fetchTrade() {
    const { data } = await supabase
      .from('trades')
      .select(`
        *,
        proposer:profiles!trades_proposer_id_fkey(id, username, display_name, avatar_url),
        receiver:profiles!trades_receiver_id_fkey(id, username, display_name, avatar_url),
        trade_offered_stickers(*, sticker:stickers(*)),
        trade_requested_stickers(*, sticker:stickers(*))
      `)
      .eq('id', tradeId)
      .single();

    if (data) {
      const t: any = data;
      setTrade({
        ...t,
        offered_stickers: t.trade_offered_stickers.map((i: any) => ({ ...i.sticker, quantity: i.quantity })),
        requested_stickers: t.trade_requested_stickers.map((i: any) => ({ ...i.sticker, quantity: i.quantity })),
      });
    }
    setLoading(false);
  }

  async function handleAction(action: 'accept' | 'reject' | 'cancel') {
    const labels = { accept: 'Aceptar', reject: 'Rechazar', cancel: 'Cancelar' };
    Alert.alert(
      `${labels[action]} intercambio`,
      `¿Estás seguro de que querés ${labels[action].toLowerCase()} este intercambio?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: labels[action],
          style: action === 'accept' ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await callFunction('execute-trade', { trade_id: tradeId, action });
              Alert.alert('¡Listo!', `Intercambio ${action === 'accept' ? 'aceptado' : action === 'reject' ? 'rechazado' : 'cancelado'}`, [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  if (loading || !trade) return <LoadingSpinner fullScreen />;

  const isProposer = trade.proposer_id === user?.id;
  const status = statusConfig[trade.status];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">Intercambio</Text>
        <Badge label={status.label} variant={status.variant} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Usuarios */}
        <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 }}>
          <View className="flex-row items-center justify-between">
            <UserChip profile={trade.proposer} label="Proponente" />
            <Text className="text-2xl">⇄</Text>
            <UserChip profile={trade.receiver} label="Receptor" />
          </View>
          {trade.message && (
            <View className="bg-surface rounded-xl p-3">
              <Text className="text-xs text-gray-500 mb-0.5">Mensaje</Text>
              <Text className="text-sm text-gray-700">"{trade.message}"</Text>
            </View>
          )}
          <Text className="text-xs text-gray-400">
            Creado el {formatDate(trade.created_at)}
            {trade.status === 'pending' ? ` · ${getTimeUntil(trade.expires_at)}` : ''}
          </Text>
        </View>

        {/* Figuritas ofrecidas */}
        <StickerSection
          title={isProposer ? 'Ofrecés' : `${trade.proposer.display_name} ofrece`}
          stickers={trade.offered_stickers}
          emptyText="Nada (regalo)"
        />

        {/* Figuritas pedidas */}
        <StickerSection
          title={isProposer ? 'Pedís' : 'Te piden'}
          stickers={trade.requested_stickers}
          emptyText="Nada"
        />

        {/* Acciones */}
        {trade.status === 'pending' && (
          <View className="gap-3">
            {!isProposer && (
              <Button
                title="Aceptar intercambio"
                onPress={() => handleAction('accept')}
                loading={actionLoading}
                size="lg"
              />
            )}
            <Button
              title={isProposer ? 'Cancelar propuesta' : 'Rechazar'}
              variant="outline"
              onPress={() => handleAction(isProposer ? 'cancel' : 'reject')}
              loading={actionLoading}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function UserChip({ profile, label }: { profile: any; label: string }) {
  return (
    <View className="items-center gap-1">
      <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
        <Text className="font-black text-primary text-lg">{profile.display_name[0]}</Text>
      </View>
      <Text className="text-xs font-semibold text-gray-800">{profile.display_name}</Text>
      <Text className="text-xs text-gray-400">{label}</Text>
    </View>
  );
}

function StickerSection({ title, stickers, emptyText }: { title: string; stickers: any[]; emptyText: string }) {
  return (
    <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 1 }}>
      <Text className="font-bold text-gray-800">{title}</Text>
      {stickers.length === 0 ? (
        <Text className="text-gray-400 italic text-sm">{emptyText}</Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {stickers.map((s) => (
            <StickerCard key={s.id} sticker={s} quantity={s.quantity} size="sm" />
          ))}
        </View>
      )}
    </View>
  );
}
