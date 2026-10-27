import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Account } from '@/core/models/account';
import { useColors } from '@/components/ui/theme';
import { AccountRowCard } from './AccountRowCard';

interface AccountGroupSectionProps {
  title: string;
  accounts: Account[];
  movementCounts: Record<string, number>;
  isBalanceVisible: boolean;
  onPressAccount: (id: string) => void;
}

export function AccountGroupSection({
  title,
  accounts,
  movementCounts,
  isBalanceVisible,
  onPressAccount,
}: AccountGroupSectionProps) {
  const colors = useColors();

  return (
    <View>
      <Text style={[styles.title, { color: colors.textLight }]}>{title}</Text>

      <View style={styles.list}>
        {accounts.map((account) => (
          <AccountRowCard
            key={account.id}
            account={account}
            movementCount={movementCounts[account.id] ?? 0}
            isBalanceVisible={isBalanceVisible}
            onPress={() => onPressAccount(account.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  list: {
    gap: 10,
  },
});
