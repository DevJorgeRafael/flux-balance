import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useColors } from '@/components/ui/theme';

interface GoalProgressRingProps {
  ratio: number;
  size?: number;
}

export function GoalProgressRing({ ratio, size = 56 }: GoalProgressRingProps) {
  const colors = useColors();
  const strokeWidth = 5;
  const radius = size / 2 - strokeWidth - 1;
  const circumference = 2 * Math.PI * radius;
  const safeRatio = Math.min(1, Math.max(0, ratio));
  const percent = Math.round(safeRatio * 100);

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessible
      accessibilityLabel={`${percent}%`}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.controlTrack}
          strokeWidth={strokeWidth}
        />
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={[circumference, circumference]}
            strokeDashoffset={circumference * (1 - safeRatio)}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <Text style={[styles.percent, { color: colors.text }]}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  percent: { position: 'absolute', fontSize: 13, fontWeight: '800' },
});
