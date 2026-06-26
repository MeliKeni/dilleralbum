import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercent?: boolean;
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  label,
  showPercent = true,
  color = '#1B4FD8',
  height = 8,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View className="gap-1.5">
      {(label || showPercent) && (
        <View className="flex-row justify-between items-center">
          {label && <Text className="text-sm text-gray-600">{label}</Text>}
          {showPercent && (
            <Text className="text-sm font-semibold text-primary">{clamped.toFixed(1)}%</Text>
          )}
        </View>
      )}
      <View
        className="bg-gray-200 rounded-full overflow-hidden"
        style={{ height }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}
