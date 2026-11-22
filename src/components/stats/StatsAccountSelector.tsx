import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import Wallet from 'lucide-react-native/icons/wallet';
import X from 'lucide-react-native/icons/x';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { radius, spacing, useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { Account } from '@/core/models/account';

interface StatsAccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onChange: (accountId: string | null) => void;
}

export function StatsAccountSelector({
  accounts,
  selectedAccountId,
  onChange,
}: StatsAccountSelectorProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId
  );
  const selectedName = selectedAccount?.name ?? t('allAccounts');

  const closeSheet = () => {
    setIsOpen(false);
  };

  const selectAccount = (accountId: string | null) => {
    onChange(accountId);
    setIsOpen(false);
  };

  const renderOption = (
    accountId: string | null,
    name: string,
    selected: boolean
  ) => (
    <Pressable
      onPress={() => selectAccount(accountId)}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
    >
      <Text numberOfLines={1} style={[styles.optionText, { color: colors.text }]}>
        {name}
      </Text>
      {selected ? (
        <Check size={18} color={colors.primary} strokeWidth={2.6} />
      ) : null}
    </Pressable>
  );

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('account')}: ${selectedName}`}
        accessibilityState={{ expanded: isOpen }}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
          pressed && styles.pressed,
        ]}
      >
        <Wallet size={16} color={colors.primaryText} strokeWidth={2.3} />
        <Text
          numberOfLines={1}
          style={[styles.triggerText, { color: colors.text }]}
        >
          {selectedName}
        </Text>
        <ChevronDown size={16} color={colors.textLight} strokeWidth={2.4} />
      </Pressable>

      <BottomSheetModal
        visible={isOpen}
        onClose={closeSheet}
        maxHeight="70%"
        bottomPaddingExtra={16}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {t('account')}
          </Text>
          <Pressable
            onPress={closeSheet}
            accessibilityRole="button"
            accessibilityLabel={t('close')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={colors.textLight} strokeWidth={2} />
          </Pressable>
        </View>

        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Pressable
              onPress={() => selectAccount(null)}
              accessibilityRole="button"
              accessibilityLabel={t('allAccounts')}
              accessibilityState={{ selected: selectedAccountId === null }}
              style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                {t('allAccounts')}
              </Text>
              {selectedAccountId === null ? (
                <Check size={18} color={colors.primary} strokeWidth={2.6} />
              ) : null}
            </Pressable>
          }
          renderItem={({ item }) =>
            renderOption(item.id, item.name, item.id === selectedAccountId)
          }
        />
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  optionRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.72,
  },
});
