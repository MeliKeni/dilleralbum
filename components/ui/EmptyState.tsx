import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8 gap-4">
      <Text className="text-5xl">{icon}</Text>
      <Text className="text-xl font-bold text-gray-800 text-center">{title}</Text>
      {description && (
        <Text className="text-gray-500 text-center text-sm leading-5">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} className="mt-2" />
      )}
    </View>
  );
}
