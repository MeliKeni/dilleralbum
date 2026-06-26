import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useState } from 'react';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({ label, error, rightIcon, onRightIconPress, className, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}
      <View
        className={`
          flex-row items-center bg-white rounded-2xl border px-4
          ${focused ? 'border-primary' : error ? 'border-red-400' : 'border-gray-200'}
          h-12
        `}
      >
        <TextInput
          className={`flex-1 text-base text-gray-900 ${className ?? ''}`}
          placeholderTextColor="#9CA3AF"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} className="pl-2">
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
