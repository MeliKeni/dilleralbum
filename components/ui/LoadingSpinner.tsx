import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  label?: string;
  color?: string;
}

export function LoadingSpinner({ fullScreen = false, label, color = '#1B4FD8' }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-surface gap-3">
        <ActivityIndicator size="large" color={color} />
        {label && <Text className="text-gray-500 text-sm">{label}</Text>}
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-8 gap-2">
      <ActivityIndicator size="large" color={color} />
      {label && <Text className="text-gray-500 text-sm">{label}</Text>}
    </View>
  );
}
