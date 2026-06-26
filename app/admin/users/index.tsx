import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import type { Profile } from '@/types/app';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers(q?: string) {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
    if (q) query = query.ilike('username', `%${q}%`);
    const { data } = await query;
    if (data) setUsers(data);
    setLoading(false);
  }

  async function handleSearch(q: string) {
    setSearch(q);
    fetchUsers(q);
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="bg-white px-4 pt-4 pb-3 gap-3 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary text-2xl">‹</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold flex-1">Usuarios ({users.length})</Text>
        </View>
        <View className="flex-row items-center bg-surface rounded-xl px-3 h-10 gap-2 border border-gray-200">
          <Text className="text-gray-400">🔍</Text>
          <TextInput
            className="flex-1 text-sm"
            placeholder="Buscar usuario..."
            value={search}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/admin/users/${item.id}`)}
            className="bg-white rounded-2xl p-4 flex-row items-center gap-3"
            style={{ elevation: 1 }}
          >
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Text className="font-black text-primary">{item.display_name[0]}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-gray-900">{item.display_name}</Text>
                {item.is_admin && <Badge label="Admin" variant="primary" size="sm" />}
                {item.is_blocked && <Badge label="Bloqueado" variant="error" size="sm" />}
              </View>
              <Text className="text-xs text-gray-400">@{item.username}</Text>
            </View>
            <Text className="text-gray-300">›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
