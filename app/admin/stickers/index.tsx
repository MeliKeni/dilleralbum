import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { supabase, getImageUrl } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import type { Sticker } from '@/types/app';
import { ALBUM_ID } from '@/lib/constants';

export default function AdminStickersScreen() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'album' | 'extras'>('album');

  useEffect(() => { fetchStickers(); }, []);

  async function fetchStickers() {
    const { data } = await supabase
      .from('stickers')
      .select('*')
      .eq('album_id', ALBUM_ID)
      .order('sort_order');
    if (data) setStickers(data);
    setLoading(false);
  }

  async function toggleActive(s: Sticker) {
    await supabase.from('stickers').update({ is_active: !s.is_active }).eq('id', s.id);
    setStickers((prev) => prev.map((st) => st.id === s.id ? { ...st, is_active: !st.is_active } : st));
  }

  const filtered = stickers.filter((s) => {
    if (filter === 'album') return !s.is_extra;
    if (filter === 'extras') return s.is_extra;
    return true;
  });

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="bg-white px-4 pt-4 pb-3 gap-3 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary text-2xl">‹</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold flex-1">Figuritas ({filtered.length})</Text>
          <TouchableOpacity
            onPress={() => router.push('/admin/stickers/new')}
            className="bg-primary rounded-xl px-4 py-2"
          >
            <Text className="text-white font-semibold text-sm">+ Nueva</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row gap-2">
          {(['album', 'extras', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full ${filter === f ? 'bg-primary' : 'bg-gray-100'}`}
            >
              <Text className={`text-xs font-semibold ${filter === f ? 'text-white' : 'text-gray-600'}`}>
                {f === 'album' ? 'Álbum' : f === 'extras' ? 'Extras' : 'Todas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/admin/stickers/${item.id}`)}
            className="bg-white rounded-2xl p-3 flex-row items-center gap-3"
            style={{ elevation: 1, opacity: item.is_active ? 1 : 0.5 }}
          >
            <View className="w-12 h-16 rounded-xl overflow-hidden bg-secondary-50">
              {item.image_url ? (
                <Image source={{ uri: getImageUrl(item.image_url) ?? '' }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text>⭐</Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-secondary font-bold">{item.sticker_number}</Text>
                {item.is_extra && <Badge label="EXTRA" variant="secondary" size="sm" />}
              </View>
              <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.display_name}</Text>
              {item.pos_x != null ? (
                <Text className="text-xs text-gray-400">Pos: {item.pos_x}%, {item.pos_y}%</Text>
              ) : (
                <Text className="text-xs text-orange-400">⚠ Sin posición</Text>
              )}
            </View>
            <Switch
              value={item.is_active}
              onValueChange={() => toggleActive(item)}
              trackColor={{ true: '#1B4FD8' }}
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
