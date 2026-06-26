import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAlbumStore } from '@/store/albumStore';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { UserStats } from '@/types/app';

export default function ProfileScreen() {
  const { user, profile } = useAuthStore();
  const resetAlbum = useAlbumStore((s) => s.reset);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    if (!user) return;
    const { data } = await supabase.rpc('get_user_stats', { p_user_id: user.id });
    if (data) setStats(data as UserStats);
    setLoading(false);
  }

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          resetAlbum();
        },
      },
    ]);
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <LinearGradient colors={['#1B4FD8', '#3BBFBF']} className="px-4 py-8 items-center gap-3">
          <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center border-2 border-white/40">
            <Text className="text-white text-3xl font-black">
              {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="text-white text-xl font-black">{profile?.display_name}</Text>
          <Text className="text-white/70 text-sm">@{profile?.username}</Text>
          {profile?.is_admin && (
            <View className="bg-accent/90 rounded-full px-3 py-1">
              <Text className="text-white text-xs font-bold">ADMINISTRADOR</Text>
            </View>
          )}
        </LinearGradient>

        {/* Estadísticas */}
        {stats && (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-5 gap-5" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 }}>
            <Text className="font-bold text-gray-800 text-base">Progreso del álbum</Text>
            <ProgressBar progress={stats.completion_pct} label="Figuritas pegadas" />

            <View className="flex-row flex-wrap gap-4">
              <StatBox label="Pegadas" value={`${stats.placed_stickers}`} max={stats.total_album_slots} color="#1B4FD8" />
              <StatBox label="Completado" value={`${stats.completion_pct}%`} color="#3BBFBF" />
              <StatBox label="Extras" value={`${stats.extras_collected}`} max={stats.total_extras_slots} color="#E8A020" />
              <StatBox label="Repetidas" value={`${stats.duplicates}`} color="#6B7280" />
              <StatBox label="Sobres abiertos" value={`${stats.packs_opened}`} color="#7C3AED" />
            </View>
          </View>
        )}

        {/* Acciones */}
        <View className="mx-4 mt-4 gap-3">
          {profile?.is_admin && (
            <MenuItem
              emoji="⚙️"
              label="Panel de administración"
              onPress={() => router.push('/admin')}
              accent
            />
          )}
          <MenuItem emoji="🎟" label="Canjear código" onPress={() => router.push('/codes')} />
          <MenuItem emoji="🔄" label="Intercambios" onPress={() => router.push('/(tabs)/trade')} />
          <MenuItem emoji="🔔" label="Notificaciones" onPress={() => router.push('/notifications')} />
        </View>

        {/* Logout */}
        <View className="mx-4 mt-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="border border-red-200 rounded-2xl h-12 items-center justify-center"
          >
            <Text className="text-red-500 font-semibold">Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, max, color }: { label: string; value: string; max?: number; color: string }) {
  return (
    <View className="bg-gray-50 rounded-xl px-4 py-3 gap-0.5" style={{ minWidth: '42%', flex: 1 }}>
      <Text className="text-xl font-black" style={{ color }}>{value}{max ? `/${max}` : ''}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}

function MenuItem({ emoji, label, onPress, accent }: { emoji: string; label: string; onPress: () => void; accent?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`flex-row items-center gap-3 rounded-2xl px-4 h-14 ${accent ? 'bg-primary' : 'bg-white'}`}
      style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 }}
    >
      <Text className="text-xl">{emoji}</Text>
      <Text className={`flex-1 font-semibold ${accent ? 'text-white' : 'text-gray-800'}`}>{label}</Text>
      <Text className={accent ? 'text-white/70' : 'text-gray-300'}>›</Text>
    </TouchableOpacity>
  );
}
