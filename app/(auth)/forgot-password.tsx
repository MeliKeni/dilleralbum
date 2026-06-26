import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email) return Alert.alert('Error', 'Ingresá tu email');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'albumdiller://auth/reset-password',
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else setSent(true);
  }

  return (
    <View className="flex-1">
      <LinearGradient colors={['#1B4FD8', '#3BBFBF']} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="items-center pt-16 pb-6 px-6">
            <Text className="text-white text-3xl font-black">Recuperar contraseña</Text>
          </View>

          <View className="flex-1 bg-white rounded-t-[2rem] px-6 pt-8 pb-12 gap-5">
            {sent ? (
              <View className="flex-1 items-center justify-center gap-4">
                <Text className="text-5xl">📧</Text>
                <Text className="text-xl font-bold text-gray-900 text-center">Revisá tu email</Text>
                <Text className="text-gray-500 text-center text-sm">
                  Te enviamos un link para restablecer tu contraseña.
                </Text>
                <Button title="Volver al login" onPress={() => router.replace('/(auth)/login')} />
              </View>
            ) : (
              <>
                <Text className="text-gray-600 text-sm">
                  Ingresá tu email y te mandaremos un link para resetear tu contraseña.
                </Text>
                <Input
                  label="Email"
                  placeholder="tu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button title="Enviar link" onPress={handleReset} loading={loading} />
                <TouchableOpacity onPress={() => router.back()} className="items-center">
                  <Text className="text-primary font-medium">Volver</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
