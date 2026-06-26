import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { supabase, callFunction, getImageUrl } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAlbumStore } from '@/store/albumStore';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PACK_CONFIG_ID } from '@/lib/constants';
import type { Sticker, OpenPackResult } from '@/types/app';

export default function PacksScreen() {
  const { user } = useAuthStore();
  const { userPacks, setUserPacks, addStickers, decrementPack, incrementPack } = useAlbumStore();
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<OpenPackResult | null>(null);
  const [currentStickerIdx, setCurrentStickerIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Animación del sobre
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const availablePacks = userPacks.find((p) => p.pack_config_id === PACK_CONFIG_ID)?.quantity ?? 0;

  useEffect(() => { fetchPacks(); }, []);

  async function fetchPacks() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_packs')
      .select('*')
      .eq('user_id', user.id);
    if (data) setUserPacks(data);
    setLoading(false);
  }

  async function claimDaily() {
    setClaimingDaily(true);
    try {
      const data = await callFunction<{ success: boolean; already_claimed?: boolean; packs_given?: number; error?: string }>(
        'claim-daily', {}
      );
      if (data.already_claimed) {
        Alert.alert('Ya reclamaste', 'Tus sobres diarios ya fueron reclamados hoy. ¡Volvé mañana!');
      } else if (data.success) {
        Alert.alert('¡Sobres recibidos!', `Recibiste ${data.packs_given} sobres. ¡A abrir!`);
        incrementPack(PACK_CONFIG_ID, data.packs_given ?? 2);
        fetchPacks();
      } else {
        Alert.alert('Error', data.error ?? 'No se pudo reclamar');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setClaimingDaily(false);
    }
  }

  async function openPack() {
    if (availablePacks < 1) {
      Alert.alert('Sin sobres', 'No tenés sobres disponibles. ¡Reclamá los diarios o usá un código!');
      return;
    }

    // Animación del sobre
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    setTimeout(async () => {
      setOpening(true);
      try {
        const data = await callFunction<OpenPackResult>('open-pack', { pack_config_id: PACK_CONFIG_ID });
        if (data.success) {
          decrementPack(PACK_CONFIG_ID);
          addStickers(data.stickers.map((s) => ({ sticker_id: s.id, user_id: user!.id, quantity: 1 })) as any);
          setResult(data);
          setCurrentStickerIdx(0);
          setShowModal(true);
          scaleAnim.setValue(1);
          shakeAnim.setValue(0);
        } else {
          Alert.alert('Error', 'No se pudo abrir el sobre');
          scaleAnim.setValue(1);
        }
      } catch (e: any) {
        Alert.alert('Error', e.message);
        scaleAnim.setValue(1);
      } finally {
        setOpening(false);
      }
    }, 700);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPacks();
    setRefreshing(false);
  }, []);

  if (loading) return <LoadingSpinner fullScreen label="Cargando..." />;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4FD8" />}
      >
        {/* Header */}
        <LinearGradient colors={['#1B4FD8', '#3BBFBF']} className="px-4 py-6 items-center gap-2">
          <Text className="text-white text-2xl font-black">Sobres</Text>
          <View className="bg-white/20 rounded-2xl px-6 py-2">
            <Text className="text-white text-4xl font-black text-center">{availablePacks}</Text>
            <Text className="text-white/80 text-xs text-center">disponibles</Text>
          </View>
        </LinearGradient>

        <View className="px-4 mt-6 gap-4">
          {/* Sobre animado */}
          <View className="items-center py-8">
            <Animated.View
              style={{
                transform: [
                  { translateX: shakeAnim },
                  { scale: scaleAnim },
                ],
              }}
            >
              <TouchableOpacity
                onPress={openPack}
                disabled={opening || availablePacks < 1}
                activeOpacity={0.9}
                style={{ opacity: availablePacks < 1 ? 0.4 : 1 }}
              >
                <LinearGradient
                  colors={['#E8A020', '#F59E0B']}
                  className="w-48 h-64 rounded-2xl items-center justify-center"
                  style={{ elevation: 12, shadowColor: '#E8A020', shadowOpacity: 0.4, shadowRadius: 16 }}
                >
                  <Text className="text-white text-6xl">⭐</Text>
                  <Text className="text-white font-black text-xl mt-2">SOBRE</Text>
                  <Text className="text-white/80 text-xs">DTF 2026</Text>
                  {availablePacks > 0 && !opening && (
                    <Text className="text-white/90 text-xs mt-4 font-medium">Tocá para abrir</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {opening && (
              <View className="mt-4">
                <Text className="text-gray-500 text-sm">Abriendo...</Text>
              </View>
            )}
          </View>

          {/* Botón abrir */}
          <Button
            title={availablePacks > 0 ? `Abrir sobre (${availablePacks} disponibles)` : 'Sin sobres'}
            onPress={openPack}
            loading={opening}
            disabled={availablePacks < 1}
            size="lg"
          />

          {/* Separador */}
          <View className="flex-row items-center gap-3 my-2">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-gray-400 text-sm">acciones</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Reclamo diario */}
          <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 }}>
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">🎯</Text>
              <View className="flex-1">
                <Text className="font-bold text-gray-900">Sobres diarios</Text>
                <Text className="text-xs text-gray-500">Recibís 2 sobres gratis cada día</Text>
              </View>
            </View>
            <Button
              title="Reclamar sobres del día"
              variant="secondary"
              onPress={claimDaily}
              loading={claimingDaily}
            />
          </View>

          {/* Código */}
          <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 }}>
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">🎟</Text>
              <View className="flex-1">
                <Text className="font-bold text-gray-900">Tenés un código</Text>
                <Text className="text-xs text-gray-500">Canjéalo para conseguir más sobres</Text>
              </View>
            </View>
            <Button
              title="Canjear código"
              variant="outline"
              onPress={() => router.push('/codes')}
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal de apertura */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
            <LinearGradient colors={['#1B4FD8', '#3BBFBF']} className="px-6 py-4">
              <Text className="text-white font-black text-xl text-center">
                {currentStickerIdx < (result?.stickers.length ?? 0)
                  ? `Figurita ${currentStickerIdx + 1} de ${result?.stickers.length}`
                  : '¡Sobre abierto!'}
              </Text>
            </LinearGradient>

            <View className="p-6">
              {result && currentStickerIdx < result.stickers.length ? (
                <StickerReveal
                  sticker={result.stickers[currentStickerIdx]}
                  isDuplicate={result.stickers[currentStickerIdx].was_duplicate}
                  onNext={() => setCurrentStickerIdx((i) => i + 1)}
                  isLast={currentStickerIdx === result.stickers.length - 1}
                />
              ) : (
                <View className="items-center gap-4 py-4">
                  <Text className="text-4xl">🎉</Text>
                  <Text className="text-lg font-bold text-gray-900 text-center">
                    ¡Conseguiste {result?.stickers.length} figuritas!
                  </Text>
                  <Button
                    title="Ver colección"
                    onPress={() => {
                      setShowModal(false);
                      router.push('/(tabs)/collection');
                    }}
                    variant="secondary"
                  />
                  <Button
                    title="Cerrar"
                    onPress={() => setShowModal(false)}
                    variant="ghost"
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StickerReveal({
  sticker,
  isDuplicate,
  onNext,
  isLast,
}: {
  sticker: Sticker & { was_duplicate: boolean };
  isDuplicate: boolean;
  onNext: () => void;
  isLast: boolean;
}) {
  const imageUrl = getImageUrl(sticker.image_url);

  return (
    <View className="items-center gap-4">
      {isDuplicate && (
        <View className="bg-amber-100 rounded-full px-3 py-1">
          <Text className="text-amber-700 text-xs font-semibold">Repetida</Text>
        </View>
      )}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 160, height: 200, borderRadius: 12 }}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View className="w-40 h-48 bg-secondary-100 rounded-xl items-center justify-center">
          <Text className="text-4xl">⭐</Text>
        </View>
      )}
      <Text className="text-xs text-secondary font-bold">{sticker.sticker_number}</Text>
      <Text className="text-lg font-black text-gray-900 text-center">{sticker.display_name}</Text>
      <Button
        title={isLast ? '¡Ver resultado!' : 'Siguiente →'}
        onPress={onNext}
        size="lg"
      />
    </View>
  );
}
