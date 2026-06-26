import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { Code } from '@/types/app';

export default function AdminCodesScreen() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCodes(); }, []);

  async function fetchCodes() {
    const { data } = await supabase
      .from('codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCodes(data);
    setLoading(false);
  }

  async function toggleCode(code: Code) {
    await supabase.from('codes').update({ is_active: !code.is_active }).eq('id', code.id);
    setCodes((prev) => prev.map((c) => c.id === code.id ? { ...c, is_active: !c.is_active } : c));
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1">Códigos ({codes.length})</Text>
        <TouchableOpacity
          onPress={() => router.push('/admin/codes/new')}
          className="bg-primary rounded-xl px-4 py-2"
        >
          <Text className="text-white font-semibold text-sm">+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={codes}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 1 }}>
            <View className="flex-row items-center justify-between">
              <Text className="font-black text-lg tracking-widest text-gray-900">{item.code}</Text>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleCode(item)}
                trackColor={{ true: '#1B4FD8' }}
              />
            </View>
            <View className="flex-row gap-3 flex-wrap">
              <Badge label={`${item.packs_amount} sobre${item.packs_amount > 1 ? 's' : ''}`} variant="primary" />
              <Badge
                label={item.max_uses ? `${item.uses_count}/${item.max_uses} usos` : `${item.uses_count} usos`}
                variant="default"
              />
              {item.is_single_use_per_user && <Badge label="1 por usuario" variant="default" />}
              {item.expires_at && (
                <Badge
                  label={`Vence ${formatDate(item.expires_at)}`}
                  variant={new Date(item.expires_at) < new Date() ? 'error' : 'accent'}
                />
              )}
            </View>
            {item.description && (
              <Text className="text-xs text-gray-500">{item.description}</Text>
            )}
            <Text className="text-xs text-gray-400">Creado {formatDate(item.created_at)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
