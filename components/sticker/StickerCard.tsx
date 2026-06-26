import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import type { Sticker } from '@/types/app';
import { getImageUrl } from '@/lib/supabase';

interface StickerCardProps {
  sticker: Sticker;
  quantity?: number;
  isPlaced?: boolean;
  isNew?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  dimmed?: boolean;
}

const CARD_W = { sm: 90, md: 110, lg: 140 };
const CARD_H = { sm: 126, md: 154, lg: 196 };

export function StickerCard({
  sticker, quantity = 0, isPlaced = false, isNew = false,
  onPress, size = 'md', dimmed = false,
}: StickerCardProps) {
  const imageUrl = getImageUrl(sticker.image_url);
  const W = CARD_W[size];
  const H = CARD_H[size];
  const isDuplicate = quantity > 1;

  // Determinar colores de la tarjeta basados en el número
  const isExtra = sticker.is_extra;
  const cardColors: [string, string] = isExtra
    ? ['#065F46', '#064E3B']
    : ['#1E3A8A', '#1B4FD8'];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={{ opacity: dimmed ? 0.4 : 1 }}>
      <View style={{
        width: W, height: H, borderRadius: 10, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
      }}>
        {/* FONDO GRADIENTE */}
        <View style={{ flex: 1, backgroundColor: cardColors[0] }}>

          {/* HEADER con número */}
          <View style={{
            backgroundColor: cardColors[1],
            paddingHorizontal: 6, paddingVertical: 3,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Text style={{ color: '#F59E0B', fontSize: size === 'sm' ? 8 : 9, fontWeight: '900', letterSpacing: 0.5 }}>
              {sticker.sticker_number}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '700' }}>DTF</Text>
          </View>

          {/* IMAGEN o placeholder */}
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Watermark "26" */}
            <Text style={{
              position: 'absolute', bottom: 0, right: 2,
              fontSize: H * 0.45, fontWeight: '900',
              color: 'rgba(255,255,255,0.07)', lineHeight: H * 0.45,
            }}>
              26
            </Text>

            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <View style={{
                  width: W * 0.55, height: W * 0.55, borderRadius: W * 0.275,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: W * 0.22, color: 'rgba(255,255,255,0.4)' }}>?</Text>
                </View>
              </View>
            )}
          </View>

          {/* NOMBRE */}
          <View style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            paddingHorizontal: 5, paddingVertical: 4,
          }}>
            {sticker.display_name.includes(' ') ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: size === 'sm' ? 6 : 7, fontWeight: '500' }} numberOfLines={1}>
                  {sticker.display_name.split(' ').slice(0, -1).join(' ')}
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: size === 'sm' ? 8 : 9, fontWeight: '900', letterSpacing: 0.3 }} numberOfLines={1}>
                  {sticker.display_name.split(' ').slice(-1)[0]}
                </Text>
              </>
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: size === 'sm' ? 8 : 9, fontWeight: '900' }} numberOfLines={1}>
                {sticker.display_name}
              </Text>
            )}
          </View>
        </View>

        {/* BADGES */}
        {isDuplicate && (
          <View style={{
            position: 'absolute', top: 6, right: 6,
            backgroundColor: '#F59E0B', borderRadius: 10,
            width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: '#FFFFFF',
          }}>
            <Text style={{ color: '#000', fontSize: 9, fontWeight: '900' }}>x{quantity}</Text>
          </View>
        )}

        {isPlaced && (
          <View style={{
            position: 'absolute', top: 6, left: 6,
            backgroundColor: '#10B981', borderRadius: 10,
            width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: '#FFFFFF',
          }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>✓</Text>
          </View>
        )}

        {isNew && !isPlaced && (
          <View style={{ position: 'absolute', top: -4, left: '50%', marginLeft: -10 }}>
            <Text style={{ fontSize: 18 }}>⭐</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
