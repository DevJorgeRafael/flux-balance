import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useColors, useInsets } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { CURRENCIES } from '@/core/constants/currencies';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function CurrencySelectorScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { language, t } = useTranslation();
  const { currency, setCurrency } = useCurrency();

  const handleSelect = (code: string) => {
    setCurrency(code);
    router.back();
  };

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
          {t('currency')}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.infoCard}>
          <Text style={[styles.infoText, { color: colors.textLight }]}>
            {t('currencyInfo')}
          </Text>
        </Card>

        <Card>
          {CURRENCIES.map((option) => {
            const isSelected = option.code === currency;

            return (
              <Pressable
                key={option.code}
                onPress={() => handleSelect(option.code)}
                accessibilityRole="button"
                accessibilityLabel={option.code}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Text style={[styles.code, { color: colors.text }]}>{option.code}</Text>

                <Text style={[styles.name, { color: colors.textLight }]} numberOfLines={1}>
                  {language === 'es' ? option.nameEs : option.nameEn}
                </Text>

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
  infoCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
  },
  list: {},
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  code: {
    width: 52,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  name: {
    flex: 1,
    fontSize: 14,
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
