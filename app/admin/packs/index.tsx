import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { PackConfig } from '@/types/app';
import { ALBUM_ID } from '@/lib/constants';

export default function AdminPacksScreen() {
  const [configs, setConfigs] = useState<PackConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PackConfig | null>(null);
  const [stickersPerPack, setStickersPerPack] = useState('5');
  const [includeExtras, setIncludeExtras] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfigs(); }, []);

  async function fetchConfigs() {
    const { data } = await supabase.from('pack_configs').select('*').eq('album_id', ALBUM_ID);
    if (data) {
      setConfigs(data);
      if (data[0]) {
        setEditing(data[0]);
        setStickersPerPack(data[0].stickers_per_pack.toString());
        setIncludeExtras(data[0].include_extras);
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!editing) return;
    const n = parseInt(stickersPerPack);
    if (isNaN(n) || n < 1 || n > 20) return Alert.alert('Error', 'La cantidad debe ser entre 1 y 20');
    setSaving(true);
    const { error } = await supabase.from('pack_configs').update({
      stickers_per_pack: n,
      include_extras: includeExtras,
    }).eq('id', editing.id);
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('¡Guardado!');
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1">Configuración de sobres</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {editing ? (
          <View className="bg-white rounded-2xl p-4 gap-5" style={{ elevation: 1 }}>
            <Text className="font-bold text-gray-800 text-base">{editing.name}</Text>

            <Input
              label="Figuritas por sobre"
              value={stickersPerPack}
              onChangeText={setStickersPerPack}
              keyboardType="numeric"
            />

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-gray-700">Incluir Extra Stickers</Text>
                <Text className="text-xs text-gray-400">Los extras pueden aparecer en sobres</Text>
              </View>
              <Switch
                value={includeExtras}
                onValueChange={setIncludeExtras}
                trackColor={{ true: '#3BBFBF' }}
              />
            </View>

            <View className="bg-blue-50 rounded-xl p-3 gap-1">
              <Text className="text-xs text-blue-600 font-semibold">ℹ Probabilidades</Text>
              <Text className="text-xs text-blue-500">
                Todas las figuritas tienen la misma probabilidad. El algoritmo selecciona aleatoriamente del pool completo de figuritas activas.
              </Text>
            </View>

            <Button title="Guardar configuración" onPress={handleSave} loading={saving} />
          </View>
        ) : (
          <Text className="text-gray-400 text-center">No hay configuración de sobres</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
