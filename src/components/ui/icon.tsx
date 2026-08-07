import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

type IconProps = {
  name: SymbolViewProps['name'];
  color: ColorValue;
  size?: number;
};

export function Icon({ name, color, size = 20 }: IconProps) {
  return <SymbolView name={name} tintColor={color} size={size} />;
}
