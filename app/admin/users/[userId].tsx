import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { callFunction, supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import type { Profile, UserStats } from '@/types/app';

export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [user, setUser] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [packsToGive, setPacksToGive] = useState('5');

  useEffect(() => { fetchUser(); }, []);

  async function fetchUser() {
    const [{ data: u }, { data: s }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.rpc('get_user_stats', { p_user_id: userId }),
    ]);
    if (u) setUser(u);
    if (s) setStats(s as UserStats);
    setLoading(false);
  }

  async function toggleBlock() {
    if (!user) return;
    Alert.alert(
      user.is_blocked ? 'Desbloquear usuario' : 'Bloquear usuario',
      `¿${user.is_blocked ? 'Desbloquear' : 'Bloquear'} a ${user.display_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: user.is_blocked ? 'Desbloquear' : 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('profiles')
              .update({ is_blocked: !user.is_blocked })
              .eq('id', userId);
            setUser({ ...user, is_blocked: !user.is_blocked });
          },
        },
      ]
    );
  }

  async function grantPacks() {
    const n = parseInt(packsToGive);
    if (isNaN(n) || n < 1) return Alert.alert('Error', 'Cantidad inválida');
    setActionLoading(true);
    try {
      await callFunction('grant-packs', { target_user_id: userId, packs_amount: n });
      Alert.alert('¡Listo!', `Se enviaron ${n} sobres a ${user?.display_name}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !user) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1">{user.display_name}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Info */}
        <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 1 }}>
          <Text className="font-bold text-gray-800">Información</Text>
          <InfoRow label="Username" value={`@${user.username}`} />
          <InfoRow label="Registrado" value={formatDate(user.created_at)} />
          <InfoRow label="Admin" value={user.is_admin ? 'Sí' : 'No'} />
          <InfoRow label="Estado" value={user.is_blocked ? '🔴 Bloqueado' : '🟢 Activo'} />
        </View>

        {/* Stats */}
        {stats && (
          <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 1 }}>
            <Text className="font-bold text-gray-800">Estadísticas</Text>
            <InfoRow label="Figuritas pegadas" value={`${stats.placed_stickers}/${stats.total_album_slots}`} />
            <InfoRow label="Completado" value={`${stats.completion_pct}%`} />
            <InfoRow label="Extras" value={`${stats.extras_collected}`} />
            <InfoRow label="Repetidas" value={`${stats.duplicates}`} />
            <InfoRow label="Sobres abiertos" value={`${stats.packs_opened}`} />
          </View>
        )}

        {/* Enviar sobres */}
        <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 1 }}>
          <Text className="font-bold text-gray-800">Enviar sobres</Text>
          <Input
            label="Cantidad de sobres"
            value={packsToGive}
            onChangeText={setPacksToGive}
            keyboardType="numeric"
          />
          <Button
            title={`Enviar ${packsToGive} sobre${parseInt(packsToGive) > 1 ? 's' : ''}`}
            onPress={grantPacks}
            loading={actionLoading}
            variant="secondary"
          />
        </View>

        {/* Bloquear */}
        <Button
          title={user.is_blocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
          variant={user.is_blocked ? 'outline' : 'danger'}
          onPress={toggleBlock}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-semibold text-gray-900">{value}</Text>
    </View>
  );
}
