import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'error';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: 'bg-gray-100',
  primary: 'bg-primary-100',
  secondary: 'bg-secondary-100',
  accent: 'bg-amber-100',
  success: 'bg-green-100',
  error: 'bg-red-100',
};

const textStyles = {
  default: 'text-gray-700',
  primary: 'text-primary-700',
  secondary: 'text-secondary-700',
  accent: 'text-amber-700',
  success: 'text-green-700',
  error: 'text-red-700',
};

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <View className={`${variantStyles[variant]} rounded-full ${size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
      <Text className={`${textStyles[variant]} ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium`}>
        {label}
      </Text>
    </View>
  );
}
