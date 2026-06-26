import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import type { Sticker } from '@/types/app';
import { getImageUrl } from '@/lib/supabase';

interface StickerSlotProps {
  sticker: Sticker;
  isPlaced: boolean;
  canPlace: boolean;
  onPress: (sticker: Sticker) => void;
  style?: ViewStyle;
}

export function StickerSlot({ sticker, isPlaced, canPlace, onPress, style }: StickerSlotProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(withSpring(0.9), withSpring(1));
    onPress(sticker);
  }

  const imageUrl = getImageUrl(sticker.image_url);

  return (
    <Animated.View style={[{ position: 'absolute', ...style }, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={{ width: '100%', height: '100%' }}
      >
        {isPlaced && imageUrl ? (
          // Figurita pegada — muestra la imagen con overlay del número
          <View style={{
            width: '100%', height: '100%', borderRadius: 6, overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
          }}>
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={300}
            />
            {/* Número overlay */}
            <View style={{
              position: 'absolute', top: 2, left: 2,
              backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 4,
              paddingHorizontal: 4, paddingVertical: 1,
            }}>
              <Text style={{ color: '#F59E0B', fontSize: 7, fontWeight: '800' }}>
                {sticker.sticker_number}
              </Text>
            </View>
          </View>
        ) : (
          // Slot vacío — estilo Panini: tarjeta blanca con número y nombre
          <View style={{
            width: '100%', height: '100%', borderRadius: 6,
            backgroundColor: canPlace ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
            borderWidth: canPlace ? 2 : 1,
            borderColor: canPlace ? '#3B82F6' : 'rgba(255,255,255,0.4)',
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
          }}>
            {/* Número arriba */}
            <View style={{
              backgroundColor: canPlace ? '#3B82F6' : '#F59E0B',
              paddingHorizontal: 4, paddingVertical: 2,
            }}>
              <Text style={{
                color: '#FFFFFF', fontSize: 7, fontWeight: '800',
                textAlign: 'center', letterSpacing: 0.3,
              }}>
                {sticker.sticker_number}
              </Text>
            </View>

            {/* Centro con el "26" watermark */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{
                color: 'rgba(0,0,0,0.06)', fontSize: 28, fontWeight: '900',
                position: 'absolute',
              }}>
                26
              </Text>
              {canPlace && (
                <View style={{
                  width: 18, height: 18, borderRadius: 9,
                  backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>+</Text>
                </View>
              )}
            </View>

            {/* Nombre abajo */}
            <View style={{ paddingHorizontal: 2, paddingBottom: 3, alignItems: 'center' }}>
              {sticker.display_name.includes(' ') ? (
                <>
                  <Text style={{ color: 'rgba(0,0,0,0.4)', fontSize: 5, fontWeight: '500' }} numberOfLines={1}>
                    {sticker.display_name.split(' ').slice(0, -1).join(' ')}
                  </Text>
                  <Text style={{ color: '#F59E0B', fontSize: 6, fontWeight: '800' }} numberOfLines={1}>
                    {sticker.display_name.split(' ').slice(-1)[0]}
                  </Text>
                </>
              ) : (
                <Text style={{ color: '#F59E0B', fontSize: 6, fontWeight: '800' }} numberOfLines={1}>
                  {sticker.display_name}
                </Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
