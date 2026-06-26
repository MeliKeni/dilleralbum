import { View, Text, TouchableOpacity } from 'react-native';
import type { TradeWithDetails } from '@/types/app';
import { formatRelative, getTimeUntil } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';

interface TradeCardProps {
  trade: TradeWithDetails;
  onPress: () => void;
}

const statusConfig = {
  pending: { label: 'Pendiente', variant: 'accent' as const },
  accepted: { label: 'Aceptado', variant: 'success' as const },
  rejected: { label: 'Rechazado', variant: 'error' as const },
  cancelled: { label: 'Cancelado', variant: 'default' as const },
  expired: { label: 'Vencido', variant: 'default' as const },
};

export function TradeCard({ trade, onPress }: TradeCardProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const isProposer = trade.proposer_id === userId;
  const otherUser = isProposer ? trade.receiver : trade.proposer;
  const status = statusConfig[trade.status];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-2xl p-4 mx-4 mb-3 gap-3"
      style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-primary font-bold text-sm">{otherUser.display_name[0]}</Text>
          </View>
          <View>
            <Text className="font-semibold text-gray-800">{otherUser.display_name}</Text>
            <Text className="text-xs text-gray-400">
              {isProposer ? 'Propuesta enviada' : 'Propuesta recibida'}
            </Text>
          </View>
        </View>
        <Badge label={status.label} variant={status.variant} />
      </View>

      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">
            {isProposer ? 'Ofrecés' : `${trade.proposer.display_name} ofrece`}
          </Text>
          {trade.offered_stickers.length > 0 ? (
            trade.offered_stickers.map((s) => (
              <Text key={s.id} className="text-sm font-medium text-gray-700">
                • {s.display_name} ×{s.quantity}
              </Text>
            ))
          ) : (
            <Text className="text-sm text-gray-400 italic">Nada (regalo)</Text>
          )}
        </View>
        <Text className="text-2xl">⇄</Text>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">
            {isProposer ? 'Pedís' : 'Te piden'}
          </Text>
          {trade.requested_stickers.length > 0 ? (
            trade.requested_stickers.map((s) => (
              <Text key={s.id} className="text-sm font-medium text-gray-700">
                • {s.display_name} ×{s.quantity}
              </Text>
            ))
          ) : (
            <Text className="text-sm text-gray-400 italic">Nada (regalo)</Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-400">{formatRelative(trade.created_at)}</Text>
        {trade.status === 'pending' && (
          <Text className="text-xs text-amber-600">{getTimeUntil(trade.expires_at)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
