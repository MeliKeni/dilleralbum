import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PACK_CONFIG_ID } from '@/lib/constants';
import { generateCode } from '@/lib/utils';

export default function NewCodeScreen() {
  const { user } = useAuthStore();
  const [code, setCode] = useState(generateCode());
  const [description, setDescription] = useState('');
  const [packsAmount, setPacksAmount] = useState('1');
  const [maxUses, setMaxUses] = useState('');
  const [singlePerUser, setSinglePerUser] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!code.trim()) return Alert.alert('Error', 'El código no puede estar vacío');
    const packs = parseInt(packsAmount);
    if (isNaN(packs) || packs < 1) return Alert.alert('Error', 'La cantidad de sobres debe ser al menos 1');

    setLoading(true);
    const { error } = await supabase.from('codes').insert({
      code: code.trim().toUpperCase(),
      description: description || null,
      pack_config_id: PACK_CONFIG_ID,
      packs_amount: packs,
      max_uses: maxUses ? parseInt(maxUses) : null,
      is_single_use_per_user: singlePerUser,
      expires_at: expiresAt || null,
      is_active: true,
      created_by: user!.id,
    });
    setLoading(false);

    if (error) {
      if (error.code === '23505') Alert.alert('Error', 'Ese código ya existe');
      else Alert.alert('Error', error.message);
    } else {
      Alert.alert('¡Código creado!', `El código "${code}" fue creado exitosamente`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1">Nuevo código</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View className="bg-white rounded-2xl p-4 gap-4" style={{ elevation: 1 }}>
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-gray-700">Código</Text>
            <View className="flex-row gap-2">
              <View className="flex-1 bg-surface border border-gray-200 rounded-2xl h-12 px-4 justify-center">
                <Text className="text-gray-900 font-black text-base tracking-widest">{code}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCode(generateCode())}
                className="bg-primary rounded-2xl px-4 h-12 justify-center"
              >
                <Text className="text-white font-semibold">🎲</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => {
              const custom = code;
              Alert.prompt?.('Código personalizado', 'Ingresá el código', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'OK', onPress: (t: string | undefined) => t && setCode(t.toUpperCase()) },
              ], 'plain-text', custom);
            }}>
              <Text className="text-xs text-primary">Personalizar código</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Descripción (opcional)"
            placeholder="Ej: Código para el congreso"
            value={description}
            onChangeText={setDescription}
          />

          <Input
            label="Cantidad de sobres"
            placeholder="1"
            value={packsAmount}
            onChangeText={setPacksAmount}
            keyboardType="numeric"
          />

          <Input
            label="Máximo de usos (vacío = ilimitado)"
            placeholder="Ej: 100"
            value={maxUses}
            onChangeText={setMaxUses}
            keyboardType="numeric"
          />

          <Input
            label="Fecha de vencimiento (vacío = sin vencimiento)"
            placeholder="YYYY-MM-DD"
            value={expiresAt}
            onChangeText={setExpiresAt}
          />

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-medium text-gray-700">Un uso por usuario</Text>
              <Text className="text-xs text-gray-400">Cada usuario solo puede canjearlo una vez</Text>
            </View>
            <Switch
              value={singlePerUser}
              onValueChange={setSinglePerUser}
              trackColor={{ true: '#1B4FD8' }}
            />
          </View>
        </View>

        <Button title="Crear código" onPress={handleCreate} loading={loading} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}
