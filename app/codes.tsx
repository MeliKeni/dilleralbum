import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { callFunction } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function CodesScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ packs: number } | null>(null);

  async function handleRedeem() {
    if (!code.trim()) return Alert.alert('Error', 'Ingresá un código');
    setLoading(true);
    try {
      const data = await callFunction<{ success: boolean; packs_received?: number; error?: string }>(
        'redeem-code', { code: code.trim() }
      );
      if (data.success) {
        setSuccess({ packs: data.packs_received ?? 1 });
        setCode('');
      } else {
        Alert.alert('Código inválido', data.error ?? 'No se pudo canjear el código');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Canjear código</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 p-6 gap-6">
          {success ? (
            <View className="flex-1 items-center justify-center gap-5">
              <Text className="text-6xl">🎉</Text>
              <Text className="text-2xl font-black text-gray-900 text-center">¡Código canjeado!</Text>
              <View className="bg-primary rounded-2xl px-8 py-4 items-center">
                <Text className="text-white text-4xl font-black">{success.packs}</Text>
                <Text className="text-white/80 text-sm">sobre{success.packs > 1 ? 's' : ''} recibidos</Text>
              </View>
              <Button title="Abrir sobres" onPress={() => router.push('/(tabs)/packs')} />
              <Button title="Canjear otro" variant="outline" onPress={() => setSuccess(null)} />
            </View>
          ) : (
            <View className="gap-6 mt-8">
              <View className="items-center gap-3">
                <Text className="text-5xl">🎟</Text>
                <Text className="text-xl font-black text-gray-900">¿Tenés un código?</Text>
                <Text className="text-gray-500 text-sm text-center">
                  Ingresalo para recibir sobres adicionales
                </Text>
              </View>

              <Input
                label="Código"
                placeholder="EJEMPLO-CODIGO"
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                style={{ fontSize: 20, fontWeight: '700', letterSpacing: 2, textAlign: 'center' }}
              />

              <Button title="Canjear" onPress={handleRedeem} loading={loading} size="lg" />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
