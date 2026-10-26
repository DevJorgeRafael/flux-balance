import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useTheme } from './UIProvider';
import type { Theme } from './types';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function createStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (theme: Theme) => T | NamedStyles<T>
): () => T {
  const cache = new WeakMap<Theme, T>();

  return function useStyles(): T {
    const theme = useTheme();
    const cached = cache.get(theme);
    if (cached) {
      return cached;
    }
    const styles = StyleSheet.create(factory(theme) as any) as T;
    cache.set(theme, styles);
    return styles;
  };
}

