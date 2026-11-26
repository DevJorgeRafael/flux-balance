import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { CONTENT_MAX_WIDTH } from './theme/responsive';

interface ResponsiveContentProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ResponsiveContent({ children, style }: ResponsiveContentProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
});
