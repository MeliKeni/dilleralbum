import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelative } from '@/lib/utils';
import type { Notification } from '@/types/app';

const notifIcons: Record<string, string> = {
  trade_received: '🔄',
  trade_accepted: '✅',
  trade_rejected: '❌',
  trade_cancelled: '🚫',
  packs_received: '🎁',
  code_redeemed: '🎟',
  sticker_gifted: '🎁',
};

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const { setUnreadNotifications } = useUIStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
    setLoading(false);

    // Marcar como leídas
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadNotifications(0);
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1">Notificaciones</Text>
      </View>

      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="Sin notificaciones" description="Acá aparecerán tus notificaciones" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <View
              className={`flex-row items-start gap-3 px-4 py-3 border-b border-gray-50 ${!item.is_read ? 'bg-primary-50' : 'bg-white'}`}
            >
              <Text className="text-2xl mt-0.5">{notifIcons[item.type] ?? '📣'}</Text>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 text-sm">{item.title}</Text>
                <Text className="text-gray-500 text-xs mt-0.5">{item.body}</Text>
                <Text className="text-gray-300 text-xs mt-1">{formatRelative(item.created_at)}</Text>
              </View>
              {!item.is_read && <View className="w-2 h-2 rounded-full bg-primary mt-2" />}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
