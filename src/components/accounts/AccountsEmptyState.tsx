import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CreditCard, Plus } from 'lucide-react-native';
import { shadow, useColors, useThemeMode } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountsEmptyStateProps {
  onCreateAccount: () => void;
}

export function AccountsEmptyState({ onCreateAccount }: AccountsEmptyStateProps) {
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        !isDark && shadow.md,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <CreditCard size={28} color={colors.primaryText} strokeWidth={1.8} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{t('noAccounts')}</Text>
      <Text style={[styles.hint, { color: colors.textLight }]}>
        {t('noAccountsHint')}
      </Text>

      <Pressable
        onPress={onCreateAccount}
        accessibilityRole="button"
        accessibilityLabel={t('createAccount')}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary },
          pressed && styles.pressed,
        ]}
      >
        <Plus size={17} color={colors.onPrimary} strokeWidth={2.6} />
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {t('createAccount')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  hint: {
    maxWidth: 250,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 22,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
