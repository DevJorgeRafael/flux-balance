import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import { Button } from '@/components/ui/atoms/Button';
import { IconButton } from '@/components/ui/atoms/IconButton';
import { Card } from '@/components/ui/Card';
import { spacing, useColors, useInsets } from '@/components/ui/theme';
import { getCurrencyDecimals } from '@/core/constants/currencies';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';
import { simulateSavings } from '@/core/services/financial-twin';
import { parseAmountInput } from '@/core/utils/money';

export default function SimulatorScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();
  const { currency, format, locale } = useCurrency();
  const decimals = getCurrencyDecimals(currency);
  const [initial, setInitial] = useState('0');
  const [monthly, setMonthly] = useState('');
  const [rate, setRate] = useState('');
  const [months, setMonths] = useState('12');
  const [result, setResult] = useState<ReturnType<typeof simulateSavings> | null>(null);

  const handleCalculate = () => {
    const parsedInitial = parseAmountInput(initial || '0', locale, decimals);
    const parsedMonthly = parseAmountInput(monthly || '0', locale, decimals);
    const parsedRate = Number(rate.replace(',', '.'));
    const parsedMonths = Number(months);
    if (
      !parsedInitial.ok ||
      !parsedMonthly.ok ||
      !Number.isFinite(parsedRate) ||
      !Number.isFinite(parsedMonths) ||
      parsedMonths < 1
    ) {
      setResult(null);
      return;
    }
    setResult(
      simulateSavings({
        initialBalance: parsedInitial.value,
        monthlyContribution: parsedMonthly.value,
        annualRate: parsedRate / 100,
        months: Math.trunc(parsedMonths),
      })
    );
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <IconButton
          icon={<ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />}
          accessibilityLabel={t('goBack')}
          onPress={() => router.back()}
        />
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t('simulator')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textLight }]}>
          {t('simulatorIntro')}
        </Text>

        <FormField
          label={`${t('simulatorInitial')} (${currency})`}
          value={initial}
          onChange={setInitial}
          placeholder="0"
        />
        <FormField
          label={`${t('simulatorMonthly')} (${currency})`}
          value={monthly}
          onChange={setMonthly}
          placeholder="100"
        />
        <FormField
          label={t('simulatorRate')}
          value={rate}
          onChange={setRate}
          placeholder="5"
        />
        <FormField
          label={t('simulatorMonths')}
          value={months}
          onChange={setMonths}
          placeholder="12"
        />

        <Button title={t('simulatorCalculate')} onPress={handleCalculate} />

        {result ? (
          <Card style={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {t('simulatorResult')}
            </Text>
            <ResultRow
              label={t('simulatorFinal')}
              value={format(result.finalBalance, { showCurrency: true })}
            />
            <ResultRow
              label={t('simulatorContributed')}
              value={format(result.totalContributed, { showCurrency: true })}
            />
            <ResultRow
              label={t('simulatorInterest')}
              value={format(result.totalInterest, { showCurrency: true })}
            />
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.textLight }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.inputBackground },
        ]}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
      />
    </View>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultLabel, { color: colors.textLight }]}>{label}</Text>
      <Text style={[styles.resultValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  content: { padding: spacing.lg, gap: spacing.md },
  intro: { fontSize: 13 },
  fieldGroup: { gap: spacing.sm },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: { padding: spacing.md, gap: spacing.sm },
  resultTitle: { fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: { fontSize: 13 },
  resultValue: { fontSize: 14, fontWeight: '800' },
});
