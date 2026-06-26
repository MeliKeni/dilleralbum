import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ALBUM_ID, PAGE_ID } from '@/lib/constants';

export default function NewStickerScreen() {
  const [stickerNumber, setStickerNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isExtra, setIsExtra] = useState(false);
  const [posX, setPosX] = useState('');
  const [posY, setPosY] = useState('');
  const [posW, setPosW] = useState('16');
  const [posH, setPosH] = useState('22');
  const [panoramicGroup, setPanoramicGroup] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('ARG');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [2, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handleCreate() {
    if (!stickerNumber || !displayName) return Alert.alert('Error', 'Número y nombre son requeridos');
    setLoading(true);

    let imageUrl = '';
    if (imageUri) {
      const ext = imageUri.split('.').pop() ?? 'jpg';
      const path = `${isExtra ? 'extras' : 'stickers'}/${stickerNumber.toLowerCase()}.${ext}`;
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const { error: uploadErr } = await supabase.storage.from('album-assets').upload(path, blob, { upsert: true });
      if (uploadErr) {
        setLoading(false);
        return Alert.alert('Error', `No se pudo subir la imagen: ${uploadErr.message}`);
      }
      imageUrl = path;
    }

    const { error } = await supabase.from('stickers').insert({
      album_id: ALBUM_ID,
      page_id: isExtra ? null : PAGE_ID,
      sticker_number: stickerNumber.trim().toUpperCase(),
      name: displayName.trim().toLowerCase().replace(/\s+/g, '-'),
      display_name: displayName.trim(),
      image_url: imageUrl,
      is_extra: isExtra,
      pos_x: posX ? parseFloat(posX) : null,
      pos_y: posY ? parseFloat(posY) : null,
      pos_width: posW ? parseFloat(posW) : null,
      pos_height: posH ? parseFloat(posH) : null,
      panoramic_group: panoramicGroup || null,
      metadata: { birthdate: birthdate || null, city: city || null, country: country || null },
      is_active: true,
      sort_order: 0,
    });
    setLoading(false);

    if (error) {
      if (error.code === '23505') Alert.alert('Error', 'Ya existe una figurita con ese número');
      else Alert.alert('Error', error.message);
    } else {
      Alert.alert('¡Figurita creada!', undefined, [{ text: 'OK', onPress: () => router.back() }]);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1">Nueva figurita</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Imagen */}
        <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 1 }}>
          <Text className="font-bold text-gray-800">Imagen</Text>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} contentFit="cover" />
            ) : (
              <View className="w-full h-40 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 items-center justify-center gap-2">
                <Text className="text-3xl">📷</Text>
                <Text className="text-gray-400 text-sm">Tocar para elegir imagen</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Datos básicos */}
        <View className="bg-white rounded-2xl p-4 gap-4" style={{ elevation: 1 }}>
          <Text className="font-bold text-gray-800">Datos básicos</Text>
          <Input label="Número" placeholder="ARG001" value={stickerNumber} onChangeText={setStickerNumber} autoCapitalize="characters" />
          <Input label="Nombre visible" placeholder="NOMBRE APELLIDO" value={displayName} onChangeText={setDisplayName} />
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-700">Es Extra Sticker</Text>
            <Switch value={isExtra} onValueChange={setIsExtra} trackColor={{ true: '#3BBFBF' }} />
          </View>
        </View>

        {/* Posición en el álbum */}
        {!isExtra && (
          <View className="bg-white rounded-2xl p-4 gap-4" style={{ elevation: 1 }}>
            <Text className="font-bold text-gray-800">Posición en la página (%)</Text>
            <View className="flex-row gap-3">
              <View className="flex-1"><Input label="X (left)" placeholder="5.0" value={posX} onChangeText={setPosX} keyboardType="numeric" /></View>
              <View className="flex-1"><Input label="Y (top)" placeholder="12.0" value={posY} onChangeText={setPosY} keyboardType="numeric" /></View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1"><Input label="Ancho" placeholder="16.0" value={posW} onChangeText={setPosW} keyboardType="numeric" /></View>
              <View className="flex-1"><Input label="Alto" placeholder="22.0" value={posH} onChangeText={setPosH} keyboardType="numeric" /></View>
            </View>
            <Input label="Grupo panorámico (opcional)" placeholder="argentina-panoramic" value={panoramicGroup} onChangeText={setPanoramicGroup} />
          </View>
        )}

        {/* Metadatos */}
        <View className="bg-white rounded-2xl p-4 gap-4" style={{ elevation: 1 }}>
          <Text className="font-bold text-gray-800">Metadatos</Text>
          <Input label="Fecha de nacimiento" placeholder="02-03-2010" value={birthdate} onChangeText={setBirthdate} />
          <Input label="Ciudad" placeholder="Buenos Aires" value={city} onChangeText={setCity} />
          <Input label="País (código)" placeholder="ARG" value={country} onChangeText={setCountry} autoCapitalize="characters" />
        </View>

        <Button title="Crear figurita" onPress={handleCreate} loading={loading} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}
