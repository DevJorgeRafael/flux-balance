import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { CreditCard, Plus, Layers } from 'lucide-react-native';
import { Account } from '@/core/models/account';
import { useColors } from '@/components/ui/theme';
import { formatCurrency } from '@/core/utils/currency';
import { AccountCard } from './AccountCard';
import { useTranslation } from '@/core/i18n/useTranslation';

interface AccountCarouselProps {
  accounts: Account[];
  totalBalance: number;
  selectedFilterAccountId?: string | null;
  onSelectAccountFilter?: (id: string | null) => void;
  onOpenCreateAccountModal: () => void;
  showNewAccount?: boolean;
  showHeader?: boolean;
  showAllFilter?: boolean;
  onPressAccount?: (id: string) => void;
}

export function AccountCarousel({
  accounts,
  totalBalance,
  selectedFilterAccountId = null,
  onSelectAccountFilter,
  onOpenCreateAccountModal,
  showNewAccount = true,
  showHeader = true,
  showAllFilter = true,
  onPressAccount,
}: AccountCarouselProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <>
      {showHeader && (
        <View style={styles.sectionHeaderRow}>
          <View style={styles.titleWithBadge}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('accounts')}</Text>
            <View style={[styles.counterBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.counterBadgeText, { color: colors.textLight }]}>{accounts.length}</Text>
            </View>
          </View>

          {showNewAccount && (
            <TouchableOpacity
              style={[styles.addAccountHeaderBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onOpenCreateAccountModal}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Plus size={15} color={colors.primaryText} strokeWidth={2.5} />
              <Text style={[styles.addAccountHeaderText, { color: colors.primaryText }]}>{t('newAccount')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {accounts.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ marginBottom: 12 }}>
            <CreditCard size={36} color={colors.textLight} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyHeading, { color: colors.text }]}>{t('noAccounts')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
            {t('createFirstAccount')}
          </Text>
          {showNewAccount && (
            <TouchableOpacity
              style={[styles.createAccountPrimaryBtn, { backgroundColor: colors.primary }]}
              onPress={onOpenCreateAccountModal}
              activeOpacity={0.85}
            >
              <Plus size={18} color={colors.onPrimary} strokeWidth={2.5} />
              <Text style={[styles.createAccountPrimaryBtnText, { color: colors.onPrimary }]}>
                {t('createFirstAccount')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalCardsScroll}
          contentContainerStyle={styles.horizontalCardsTrack}
        >
          {showAllFilter && (
            <TouchableOpacity
              style={[
                styles.modernAccountCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: selectedFilterAccountId === null ? colors.primary : colors.border,
                  borderWidth: selectedFilterAccountId === null ? 2 : 1,
                },
              ]}
              onPress={() => onSelectAccountFilter?.(null)}
              activeOpacity={0.8}
            >
            <View style={styles.accountCardHeader}>
              <Text style={[styles.accountTypeHeader, { color: colors.textLight }]}>
                {t('allAccounts').toUpperCase()}
              </Text>
              <View
                style={[
                  styles.tnaBadge,
                  {
                    backgroundColor:
                      selectedFilterAccountId === null ? colors.primarySoft : colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tnaBadgeText,
                    {
                      color:
                        selectedFilterAccountId === null ? colors.primaryText : colors.textLight,
                    },
                  ]}
                >
                  {selectedFilterAccountId === null ? t('active') : t('allAccounts')}
                </Text>
              </View>
            </View>

            <View style={styles.accountCardTitleRow}>
              <Layers size={16} color={colors.text} />
              <Text style={[styles.accountCardTitle, { color: colors.text, marginBottom: 0 }]} numberOfLines={1}>
                {t('allAccounts')}
              </Text>
            </View>

            <Text style={[styles.accountCardBalance, { color: colors.text }]}>
              {formatCurrency(totalBalance, false)}
            </Text>

            <View
              style={[
                styles.filterNoticeBadge,
                {
                  backgroundColor:
                    selectedFilterAccountId === null ? colors.primarySoft : colors.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterNoticeText,
                  {
                    color:
                      selectedFilterAccountId === null ? colors.primaryText : colors.textLight,
                  },
                ]}
              >
                {selectedFilterAccountId === null ? t('showingAll') : t('tapToShowAll')}
              </Text>
            </View>
          </TouchableOpacity>
          )}

          {/* Tarjetas individuales de Cuentas */}
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              isSelected={showAllFilter && selectedFilterAccountId === acc.id}
              onPress={() => {
                if (onPressAccount) {
                  onPressAccount(acc.id);
                } else {
                  onSelectAccountFilter?.(acc.id);
                }
              }}
            />
          ))}

          {/* Tarjeta para Añadir Otra Cuenta */}
          {showNewAccount && (
            <TouchableOpacity
              style={[
                styles.addAccountDashedCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={onOpenCreateAccountModal}
              activeOpacity={0.8}
            >
              <View style={[styles.addAccountIconCircle, { backgroundColor: colors.primarySoft }]}>
                <Plus size={20} color={colors.primaryText} strokeWidth={2.5} />
              </View>
              <Text style={[styles.addAccountDashedTitle, { color: colors.text }]}>{t('newAccount')}</Text>
              <Text style={[styles.addAccountDashedSubtext, { color: colors.textLight }]}>
                {t('addAnother')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  counterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  counterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addAccountHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  addAccountHeaderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 28,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyHeading: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  createAccountPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    marginTop: 8,
  },
  createAccountPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  horizontalCardsScroll: {
    flexGrow: 0,
  },
  horizontalCardsTrack: {
    paddingRight: 8,
    gap: 14,
  },
  modernAccountCard: {
    width: 220,
    borderRadius: 28,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accountTypeHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tnaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tnaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  accountCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  accountCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  accountCardBalance: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  filterNoticeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  filterNoticeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addAccountDashedCard: {
    width: 140,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 6,
  },
  addAccountIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addAccountDashedTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  addAccountDashedSubtext: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
