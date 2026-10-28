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
import { spacing, useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useCurrency } from '@/core/currency/useCurrency';
import { AccountCard, ACCOUNT_CARD_HEIGHT } from './AccountCard';
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
  const { format } = useCurrency();
  const { t } = useTranslation();

  return (
    <>
      {showHeader && (
        <View style={styles.sectionHeaderRow}>
          <View style={styles.titleWithBadge}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('accounts')}</Text>
            <View style={[styles.counterBadge, { backgroundColor: colors.cardRaised, borderColor: colors.border }]}>
              <Text style={[styles.counterBadgeText, { color: colors.textLight }]}>{accounts.length}</Text>
            </View>
          </View>

          {showNewAccount && (
            <TouchableOpacity
              style={[styles.addAccountHeaderBtn, { backgroundColor: colors.cardRaised, borderColor: colors.border }]}
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
        <Card style={styles.emptyContainer}>
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
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalCardsScroll}
          contentContainerStyle={styles.horizontalCardsTrack}
        >
          {showAllFilter && (
            <TouchableOpacity
              style={styles.allAccountsPressable}
              onPress={() => onSelectAccountFilter?.(null)}
              activeOpacity={0.8}
            >
              <Card
                variant={selectedFilterAccountId === null ? 'raised' : 'default'}
                shadowSize="sm"
                style={styles.allAccountsCard}
              >
                <View style={styles.accountCardHeader}>
                  <Text
                    style={[styles.accountTypeHeader, { color: colors.textLight }]}
                    numberOfLines={1}
                  >
                    {t('allAccounts').toUpperCase()}
                  </Text>

                  {selectedFilterAccountId === null && (
                    <View style={[styles.tnaBadge, { backgroundColor: colors.primarySoft }]}>
                      <Text style={[styles.tnaBadgeText, { color: colors.primaryText }]}>
                        {t('active')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.accountCardTitleRow}>
                  <Layers size={16} color={colors.text} />
                  <Text
                    style={[styles.accountCardTitle, { color: colors.text, marginBottom: 0 }]}
                    numberOfLines={1}
                  >
                    {t('allAccounts')}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.accountCardBalance,
                    {
                      color:
                        selectedFilterAccountId === null ? colors.primaryText : colors.text,
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {format(totalBalance)}
                </Text>

                <View
                  style={[
                    styles.filterNoticeBadge,
                    {
                      backgroundColor:
                        selectedFilterAccountId === null
                          ? colors.primarySoft
                          : colors.surfaceMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterNoticeText,
                      {
                        color:
                          selectedFilterAccountId === null
                            ? colors.primaryText
                            : colors.textLight,
                      },
                    ]}
                  >
                    {selectedFilterAccountId === null ? t('showingAll') : t('tapToShowAll')}
                  </Text>
                </View>
              </Card>
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
              style={styles.addAccountPressable}
              onPress={onOpenCreateAccountModal}
              activeOpacity={0.8}
            >
              <Card borderStyle="dashed" style={styles.addAccountDashedCard}>
                <View style={[styles.addAccountIconCircle, { backgroundColor: colors.primarySoft }]}>
                  <Plus size={20} color={colors.primaryText} strokeWidth={2.5} />
                </View>
                <Text style={[styles.addAccountDashedTitle, { color: colors.text }]}>{t('newAccount')}</Text>
                <Text style={[styles.addAccountDashedSubtext, { color: colors.textLight }]}>
                  {t('addAnother')}
                </Text>
              </Card>
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
    alignItems: 'center',
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
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
    // Carrusel a sangre: cancela el margen de la hoja para que las cards se
    // recorten contra el borde de la pantalla y no contra el margen interior.
    marginHorizontal: -24,
  },
  horizontalCardsTrack: {
    // Margen de reposo: la primera y la última card alinean con el resto.
    paddingHorizontal: 24,
    // 16px verticales: aire para la sombra (offsetY 2 + blur 6) para que el
    // ScrollView no la recorte y el ritmo entre secciones siga en 16px.
    paddingVertical: spacing.lg,
    gap: 14,
  },
  allAccountsPressable: {
    width: 220,
  },
  allAccountsCard: {
    width: 220,
    minHeight: ACCOUNT_CARD_HEIGHT,
    padding: spacing.lg,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  accountTypeHeader: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tnaBadge: {
    flexShrink: 0,
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
    marginBottom: spacing.xs,
  },
  accountCardBalance: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
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
  addAccountPressable: {
    width: 140,
  },
  addAccountDashedCard: {
    width: 140,
    minHeight: ACCOUNT_CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
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
