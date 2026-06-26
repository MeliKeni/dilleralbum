import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Ingresá tu email y contraseña');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#060D1F', '#0F2060', '#1B4FD8']}
        locations={[0, 0.5, 1]}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={{ alignItems: 'center', paddingTop: 72, paddingBottom: 48, paddingHorizontal: 24 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              borderRadius: 100,
              paddingHorizontal: 16,
              paddingVertical: 6,
              marginBottom: 24,
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', letterSpacing: 2 }}>
                DTF INTERNATIONAL CONGRESS
              </Text>
            </View>

            <Text style={{
              fontSize: 120,
              fontWeight: '900',
              color: 'rgba(255,255,255,0.06)',
              position: 'absolute',
              top: 40,
              letterSpacing: -4,
            }}>
              26
            </Text>

            <Text style={{
              fontSize: 42,
              fontWeight: '900',
              color: '#FFFFFF',
              letterSpacing: -1,
              textAlign: 'center',
              lineHeight: 46,
            }}>
              WE ARE{'\n'}26
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 10, letterSpacing: 0.5 }}>
              Official Sticker Album
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 32 }}>
              {['⭐', '🏆', '🌍', '🎴', '✨'].map((e, i) => (
                <View key={i} style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 28,
            paddingTop: 36,
            paddingBottom: 48,
            flex: 1,
          }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#0D1B2A', marginBottom: 6 }}>
              Iniciar sesión
            </Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 28 }}>
              Entrá a tu álbum y completá tu colección
            </Text>

            {/* Email */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, letterSpacing: 0.5 }}>
              EMAIL
            </Text>
            <View style={{
              backgroundColor: '#F5F7FA', borderRadius: 16,
              paddingHorizontal: 18, height: 54, justifyContent: 'center', marginBottom: 16,
            }}>
              <TextInput
                placeholder="tu@email.com"
                placeholderTextColor="#C4C4C4"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={{ fontSize: 15, color: '#0D1B2A' }}
              />
            </View>

            {/* Password */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, letterSpacing: 0.5 }}>
              CONTRASEÑA
            </Text>
            <View style={{
              backgroundColor: '#F5F7FA', borderRadius: 16,
              paddingHorizontal: 18, height: 54, flexDirection: 'row',
              alignItems: 'center', marginBottom: 12,
            }}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#C4C4C4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{ fontSize: 15, color: '#0D1B2A', flex: 1 }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 16, color: '#9CA3AF' }}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 28 }}>
                <Text style={{ fontSize: 13, color: '#1B4FD8', fontWeight: '600' }}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: '#1B4FD8',
                borderRadius: 18,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                shadowColor: '#1B4FD8',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>Iniciar sesión</Text>
              }
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>¿No tenés cuenta?</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={{ color: '#1B4FD8', fontWeight: '700', fontSize: 14 }}>Registrate</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
