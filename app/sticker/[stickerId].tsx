import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, getImageUrl } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAlbumStore } from '@/store/albumStore';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import type { Sticker } from '@/types/app';

export default function StickerDetailScreen() {
  const { stickerId } = useLocalSearchParams<{ stickerId: string }>();
  const { user } = useAuthStore();
  const { stickers, userStickers, placements, addPlacement } = useAlbumStore();
  const [sticker, setSticker] = useState<Sticker | null>(stickers.find((s) => s.id === stickerId) ?? null);
  const [loading, setLoading] = useState(!sticker);

  useEffect(() => {
    if (!sticker) fetchSticker();
  }, []);

  async function fetchSticker() {
    const { data } = await supabase.from('stickers').select('*').eq('id', stickerId).single();
    if (data) setSticker(data);
    setLoading(false);
  }

  async function handlePlace() {
    if (!user || !sticker) return;
    Alert.alert('Pegar figurita', `¿Pegás "${sticker.display_name}" en tu álbum?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Pegar',
        onPress: async () => {
          const { error } = await supabase
            .from('album_placements')
            .insert({ user_id: user.id, sticker_id: sticker.id });
          if (!error) {
            addPlacement(sticker.id);
            Alert.alert('¡Pegada!', 'La figurita fue pegada en tu álbum ✅');
          }
        },
      },
    ]);
  }

  if (loading || !sticker) return <LoadingSpinner fullScreen />;

  const qty = userStickers.get(sticker.id) ?? 0;
  const isPlaced = placements.has(sticker.id);
  const imageUrl = getImageUrl(sticker.image_url);
  const meta = sticker.metadata as any;

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 pt-12 pb-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{sticker.sticker_number}</Text>
        {sticker.is_extra && <Badge label="EXTRA" variant="secondary" />}
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24, gap: 20 }}>
        {/* Imagen */}
        <View style={{ elevation: 12, shadowColor: '#1B4FD8', shadowOpacity: 0.25, shadowRadius: 20 }}>
          <View
            className="rounded-2xl overflow-hidden"
            style={{ width: 220, height: 280 }}
          >
            <LinearGradient colors={['#3BBFBF', '#1B4FD8']} style={{ flex: 1 }}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-white text-5xl">⭐</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Info */}
        <View className="items-center gap-1">
          <Text className="text-xs text-secondary font-bold">{sticker.sticker_number}</Text>
          <Text className="text-2xl font-black text-gray-900 text-center">{sticker.display_name}</Text>
          {meta?.city && (
            <Text className="text-gray-500 text-sm">{meta.city}{meta.country ? ` (${meta.country})` : ''}</Text>
          )}
          {meta?.birthdate && (
            <Text className="text-gray-400 text-xs">{meta.birthdate}{meta.age ? ` · ${meta.age} años` : ''}</Text>
          )}
        </View>

        {/* Estado */}
        <View className="flex-row gap-3 w-full">
          <View className={`flex-1 rounded-2xl p-4 items-center gap-1 ${qty > 0 ? 'bg-primary-50' : 'bg-gray-50'}`}>
            <Text className={`text-2xl font-black ${qty > 0 ? 'text-primary' : 'text-gray-300'}`}>{qty}</Text>
            <Text className="text-xs text-gray-500">en colección</Text>
          </View>
          <View className={`flex-1 rounded-2xl p-4 items-center gap-1 ${isPlaced ? 'bg-green-50' : 'bg-gray-50'}`}>
            <Text className={`text-2xl ${isPlaced ? '✅' : '🔲'}`}>{isPlaced ? '✅' : '🔲'}</Text>
            <Text className="text-xs text-gray-500">{isPlaced ? 'pegada' : 'sin pegar'}</Text>
          </View>
        </View>

        {/* Acciones */}
        {!sticker.is_extra && qty > 0 && !isPlaced && (
          <Button title="Pegar en el álbum" onPress={handlePlace} size="lg" />
        )}
        {qty > 1 && (
          <Button
            title="Proponer intercambio"
            variant="outline"
            onPress={() => router.push('/trade/new')}
          />
        )}
        {qty === 0 && (
          <Text className="text-gray-400 text-sm text-center">
            No tenés esta figurita. ¡Abrí sobres para conseguirla!
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
