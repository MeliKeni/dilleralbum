import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AdminLayout() {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!profile?.is_admin) return <Redirect href="/(tabs)/album" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stickers/index" />
      <Stack.Screen name="stickers/new" />
      <Stack.Screen name="stickers/[id]" />
      <Stack.Screen name="extras/new" />
      <Stack.Screen name="codes/index" />
      <Stack.Screen name="codes/new" />
      <Stack.Screen name="users/index" />
      <Stack.Screen name="users/[userId]" />
      <Stack.Screen name="packs/index" />
    </Stack>
  );
}
