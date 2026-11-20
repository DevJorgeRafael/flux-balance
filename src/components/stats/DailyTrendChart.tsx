import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { radius, spacing, useColors, withAlpha } from '@/components/ui/theme';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { StatsTransactionType } from '@/core/services/stats-breakdown';
import type { DailyStatPoint } from '@/core/services/stats-daily';

interface DailyTrendChartProps {
  points: DailyStatPoint[];
  type: StatsTransactionType;
  month: Date;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}

const HEIGHT = 200;
const PADDING = { top: 14, right: 8, bottom: 24, left: 52 };
const GRADIENT_ID = 'daily-trend-fill';

function getNiceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;

  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const fraction = value / magnitude;
  const niceFraction =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;

  return niceFraction * magnitude;
}

function formatDay(month: Date, day: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(month.getFullYear(), month.getMonth(), day));
}

export function DailyTrendChart({
  points,
  type,
  month,
  selectedDay,
  onSelectDay,
}: DailyTrendChartProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { format, locale } = useCurrency();
  const [width, setWidth] = useState(0);

  const lineColor = type === 'INCOME' ? colors.successText : colors.errorText;
  const maxAmount = points.reduce((max, point) => Math.max(max, point.amount), 0);
  const scaleMax = getNiceMax(maxAmount);
  const totalAmount = points.reduce((sum, point) => sum + point.amount, 0);
  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const axisDecimals =
    scaleMax >= 100 ? 0 : scaleMax >= 10 ? (Number.isInteger(scaleMax / 2) ? 0 : 1) : 2;

  const xForIndex = (index: number) =>
    points.length <= 1
      ? PADDING.left + plotWidth / 2
      : PADDING.left + (index / (points.length - 1)) * plotWidth;
  const yForAmount = (amount: number) =>
    PADDING.top + plotHeight - (amount / scaleMax) * plotHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForIndex(index)} ${yForAmount(point.amount)}`)
    .join(' ');
  const areaPath =
    points.length > 1
      ? `${linePath} L ${xForIndex(points.length - 1)} ${
          PADDING.top + plotHeight
        } L ${xForIndex(0)} ${PADDING.top + plotHeight} Z`
      : '';

  const selectedIndex =
    selectedDay === null ? -1 : points.findIndex((point) => point.day === selectedDay);
  const selectedPoint = selectedIndex >= 0 ? points[selectedIndex] : null;

  const lastDay = points.length > 0 ? points[points.length - 1].day : 0;
  const tickDays =
    points.length === 0
      ? []
      : [1, 8, 15, 22, lastDay].filter(
          (day, index, all) =>
            day > 0 && day <= lastDay && all.indexOf(day) === index
        );

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const handleTouch = useCallback(
    (event: GestureResponderEvent) => {
      if (points.length === 0 || width <= 0) return;

      const ratio = (event.nativeEvent.locationX - PADDING.left) / plotWidth;
      const rawIndex =
        points.length <= 1
          ? 0
          : Math.round(ratio * (points.length - 1));
      const index = Math.min(points.length - 1, Math.max(0, rawIndex));
      const day = points[index]?.day ?? null;

      if (day !== null && day !== selectedDay) {
        onSelectDay(day);
      }
    },
    [onSelectDay, plotWidth, points, selectedDay, width]
  );

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${t(type === 'INCOME' ? 'income' : 'expense')}: ${format(
          totalAmount
        )}`}
        style={styles.chart}
        onLayout={handleLayout}
      >
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity={0.3} />
                <Stop offset="1" stopColor={lineColor} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>

            {[0, 0.5, 1].map((level) => {
              const y = PADDING.top + plotHeight - level * plotHeight;
              const label = format(scaleMax * level, {
                showCurrency: false,
                decimals: axisDecimals,
              });

              return (
                <G key={level}>
                  <Line
                    x1={PADDING.left}
                    x2={width - PADDING.right}
                    y1={y}
                    y2={y}
                    stroke={colors.border}
                    strokeWidth={1}
                    opacity={level === 0 ? 0.5 : 0.32}
                  />
                  <SvgText
                    x={PADDING.left - 8}
                    y={y + 3}
                    fontSize={8.5}
                    fill={colors.textLight}
                    textAnchor="end"
                  >
                    {label}
                  </SvgText>
                </G>
              );
            })}

            {areaPath ? (
              <Path d={areaPath} fill={`url(#${GRADIENT_ID})`} />
            ) : null}

            {points.length > 1 ? (
              <Path
                d={linePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {selectedPoint ? (
              <Line
                x1={xForIndex(selectedIndex)}
                x2={xForIndex(selectedIndex)}
                y1={PADDING.top}
                y2={PADDING.top + plotHeight}
                stroke={lineColor}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.5}
              />
            ) : null}

            {points.map((point, index) => {
              if (point.amount <= 0) return null;

              const isSelected = index === selectedIndex;
              return (
                <Circle
                  key={point.day}
                  cx={xForIndex(index)}
                  cy={yForAmount(point.amount)}
                  r={isSelected ? 4 : 2.3}
                  fill={lineColor}
                  stroke={colors.surface}
                  strokeWidth={isSelected ? 1.5 : 0.8}
                />
              );
            })}

            {selectedPoint && selectedPoint.amount <= 0 ? (
              <Circle
                cx={xForIndex(selectedIndex)}
                cy={yForAmount(0)}
                r={4}
                fill={lineColor}
                stroke={colors.surface}
                strokeWidth={1.5}
              />
            ) : null}

            {tickDays.map((day, index) => {
              const isFirst = index === 0;
              const isLast = index === tickDays.length - 1;
              const textAnchor =
                tickDays.length === 1
                  ? 'middle'
                  : isFirst
                    ? 'start'
                    : isLast
                      ? 'end'
                      : 'middle';

              return (
                <SvgText
                  key={day}
                  x={xForIndex(day - 1)}
                  y={HEIGHT - 5}
                  fontSize={9}
                  fill={colors.textLight}
                  textAnchor={textAnchor}
                >
                  {day}
                </SvgText>
              );
            })}
          </Svg>
        ) : null}

        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
          onResponderTerminationRequest={() => true}
        />
      </View>

      <View style={styles.selectionRow}>
        {selectedPoint ? (
          <>
            <View style={[styles.selectionDot, { backgroundColor: lineColor }]} />
            <Text
              style={[styles.selectionDate, { color: colors.textLight }]}
              numberOfLines={1}
            >
              {formatDay(month, selectedPoint.day, locale)}
            </Text>
            <Text
              style={[
                styles.selectionAmount,
                { color: lineColor, backgroundColor: withAlpha(lineColor, 0.12) },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {format(selectedPoint.amount)}
            </Text>
          </>
        ) : (
          <Text style={[styles.hint, { color: colors.textLight }]}>
            {t('tapDayForDetail')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chart: {
    width: '100%',
    height: HEIGHT,
  },
  selectionRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  selectionDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  selectionDate: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectionAmount: {
    maxWidth: '72%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  hint: {
    fontSize: 11,
  },
});
