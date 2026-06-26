import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister() {
    if (!displayName || !username || !email || !password) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      Alert.alert('Error', 'El nombre de usuario solo puede tener letras, números y guiones bajos');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim(), username: username.trim().toLowerCase() },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error al registrarse', error.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8 gap-5">
        <Text className="text-6xl">✅</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center">¡Cuenta creada!</Text>
        <Text className="text-gray-500 text-center text-sm leading-5">
          Revisá tu email para confirmar tu cuenta y después podés iniciar sesión.
        </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity className="bg-primary rounded-2xl h-12 w-full items-center justify-center">
            <Text className="text-white font-semibold">Ir al login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient colors={['#1B4FD8', '#3BBFBF']} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="items-center pt-16 pb-6 px-6">
            <Text className="text-white text-3xl font-black">Crear cuenta</Text>
            <Text className="text-white/70 text-sm mt-1">Official Sticker Album DTF</Text>
          </View>

          <View className="flex-1 bg-white rounded-t-[2rem] px-6 pt-8 pb-12 gap-5">
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />

            <Input
              label="Nombre de usuario"
              placeholder="juanperez"
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase())}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={<Text className="text-gray-400 text-sm">{showPassword ? '🙈' : '👁'}</Text>}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Button title="Crear cuenta" onPress={handleRegister} loading={loading} />

            <View className="flex-row justify-center gap-1">
              <Text className="text-gray-500 text-sm">¿Ya tenés cuenta?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold text-sm">Iniciar sesión</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
