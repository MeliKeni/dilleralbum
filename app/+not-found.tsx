import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-surface p-8 gap-4">
        <Text className="text-6xl">🔍</Text>
        <Text className="text-2xl font-bold text-gray-800">Página no encontrada</Text>
        <Link href="/(tabs)/album" className="text-primary font-semibold text-base underline">
          Volver al álbum
        </Link>
      </View>
    </>
  );
}
