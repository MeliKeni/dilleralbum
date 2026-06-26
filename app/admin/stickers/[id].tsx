import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { supabase, getImageUrl } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Sticker } from '@/types/app';

export default function EditStickerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [posX, setPosX] = useState('');
  const [posY, setPosY] = useState('');
  const [posW, setPosW] = useState('');
  const [posH, setPosH] = useState('');
  const [panoramicGroup, setPanoramicGroup] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSticker(); }, []);

  async function fetchSticker() {
    const { data } = await supabase.from('stickers').select('*').eq('id', id).single();
    if (data) {
      setSticker(data);
      setDisplayName(data.display_name);
      setPosX(data.pos_x?.toString() ?? '');
      setPosY(data.pos_y?.toString() ?? '');
      setPosW(data.pos_width?.toString() ?? '');
      setPosH(data.pos_height?.toString() ?? '');
      setPanoramicGroup(data.panoramic_group ?? '');
    }
    setLoading(false);
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [2, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!sticker) return;
    setSaving(true);

    let imageUrl = sticker.image_url;
    if (imageUri) {
      const ext = imageUri.split('.').pop() ?? 'jpg';
      const path = `${sticker.is_extra ? 'extras' : 'stickers'}/${sticker.sticker_number.toLowerCase()}.${ext}`;
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const { error: uploadErr } = await supabase.storage.from('album-assets').upload(path, blob, { upsert: true });
      if (!uploadErr) imageUrl = path;
    }

    const { error } = await supabase.from('stickers').update({
      display_name: displayName,
      image_url: imageUrl,
      pos_x: posX ? parseFloat(posX) : null,
      pos_y: posY ? parseFloat(posY) : null,
      pos_width: posW ? parseFloat(posW) : null,
      pos_height: posH ? parseFloat(posH) : null,
      panoramic_group: panoramicGroup || null,
    }).eq('id', id);

    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('¡Guardado!', undefined, [{ text: 'OK', onPress: () => router.back() }]);
  }

  if (loading || !sticker) return <LoadingSpinner fullScreen />;

  const imgUrl = imageUri ?? getImageUrl(sticker.image_url);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1">{sticker.sticker_number}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Imagen */}
        <TouchableOpacity onPress={pickImage}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={{ width: '100%', height: 200, borderRadius: 12 }} contentFit="cover" />
          ) : (
            <View className="w-full h-40 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 items-center justify-center">
              <Text className="text-gray-400">Cambiar imagen</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input label="Nombre visible" value={displayName} onChangeText={setDisplayName} />

        {!sticker.is_extra && (
          <View className="bg-white rounded-2xl p-4 gap-4" style={{ elevation: 1 }}>
            <Text className="font-bold text-gray-800">Posición en la página (%)</Text>
            <View className="flex-row gap-3">
              <View className="flex-1"><Input label="X" value={posX} onChangeText={setPosX} keyboardType="numeric" /></View>
              <View className="flex-1"><Input label="Y" value={posY} onChangeText={setPosY} keyboardType="numeric" /></View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1"><Input label="Ancho" value={posW} onChangeText={setPosW} keyboardType="numeric" /></View>
              <View className="flex-1"><Input label="Alto" value={posH} onChangeText={setPosH} keyboardType="numeric" /></View>
            </View>
            <Input label="Grupo panorámico" value={panoramicGroup} onChangeText={setPanoramicGroup} placeholder="argentina-panoramic" />
          </View>
        )}

        <Button title="Guardar cambios" onPress={handleSave} loading={saving} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}
