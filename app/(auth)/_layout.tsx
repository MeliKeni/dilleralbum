import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AuthLayout() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (user) return <Redirect href="/(tabs)/album" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
