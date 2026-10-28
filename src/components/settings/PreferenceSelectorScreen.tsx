import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useColors, useInsets } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/core/i18n/useTranslation';

export interface PreferenceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface PreferenceSelectorScreenProps<T extends string> {
  title: string;
  options: readonly PreferenceOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
}

export function PreferenceSelectorScreen<T extends string>({
  title,
  options,
  selectedValue,
  onSelect,
}: PreferenceSelectorScreenProps<T>) {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topHeader}>
        <Pressable
          style={({ pressed }) => [
            styles.roundIconButton,
            { backgroundColor: colors.surface },
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            const isLast = index === options.length - 1;

            return (
              <Pressable
                key={option.value}
                onPress={() => onSelect(option.value)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.row,
                  !isLast && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.texts}>
                  <Text style={[styles.label, { color: colors.text }]}>{option.label}</Text>
                  {option.description ? (
                    <Text style={[styles.description, { color: colors.textLight }]}>
                      {option.description}
                    </Text>
                  ) : null}
                </View>

                {isSelected ? (
                  <Check size={20} color={colors.primary} strokeWidth={2.8} />
                ) : (
                  <View style={styles.checkSpacer} />
                )}
              </Pressable>
            );
          })}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
  },
  roundIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkSpacer: {
    width: 20,
    height: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});
