import { Stack } from 'expo-router';

export default function TradeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" />
      <Stack.Screen name="[tradeId]" />
    </Stack>
  );
}
