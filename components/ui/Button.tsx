import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import type { TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-primary active:bg-primary-800',
  secondary: 'bg-secondary active:bg-secondary-600',
  outline: 'bg-transparent border-2 border-primary',
  ghost: 'bg-transparent',
  danger: 'bg-red-600 active:bg-red-700',
};

const textVariants = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary',
  ghost: 'text-primary',
  danger: 'text-white',
};

const sizes = {
  sm: 'h-9 px-4',
  md: 'h-12 px-6',
  lg: 'h-14 px-8',
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = true,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-2xl flex-row items-center justify-center gap-2
        ${isDisabled ? 'opacity-50' : ''}
        ${className ?? ''}
      `}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? '#1B4FD8' : '#fff'} />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text className={`${textVariants[variant]} ${textSizes[size]} font-semibold`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
