import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Tag from 'lucide-react-native/icons/tag';
import CreditCard from 'lucide-react-native/icons/credit-card';
import Calendar from 'lucide-react-native/icons/calendar';
import Clock from 'lucide-react-native/icons/clock';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import FileText from 'lucide-react-native/icons/file-text';
import Receipt from 'lucide-react-native/icons/receipt';
import Plus from 'lucide-react-native/icons/plus';
import Minus from 'lucide-react-native/icons/minus';
import Trash from 'lucide-react-native/icons/trash';
import { Transaction } from '@/core/models/transaction';
import { useColors } from '@/components/ui/theme';
import { Card } from '@/components/ui/Card';
import { useCurrency } from '@/core/currency/useCurrency';
import { useTranslation } from '@/core/i18n/useTranslation';

interface TransactionDetailCardProps {
  transaction: Transaction;
  isDeleting: boolean;
  onDelete: () => void;
}

export function TransactionDetailCard({
  transaction,
  isDeleting,
  onDelete,
}: TransactionDetailCardProps) {
  const colors = useColors();
  const { format, locale } = useCurrency();
  const { t } = useTranslation();

  const isIncome = transaction.type === 'INCOME';
  const primarySplit = transaction.splits?.[0];
  const categoryName = primarySplit?.categoryName || t('uncategorized');
  const categoryColor = primarySplit?.categoryColor || (isIncome ? colors.success : colors.error);
  const accountName = primarySplit?.accountName || t('account');
  const notes = primarySplit?.notes;

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const formatted = d.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string, createdAtStr?: string) => {
    try {
      let d = new Date(dateStr);
      if (isNaN(d.getTime()) || (d.getHours() === 0 && d.getMinutes() === 0 && createdAtStr)) {
        d = new Date(createdAtStr!);
      }
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '--:--';
    }
  };

  return (
    <>
      {/* HERO CARD TICKET */}
      <Card style={styles.heroCard}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: isIncome ? colors.successSoft : colors.errorSoft },
          ]}
        >
          {isIncome ? (
            <Plus size={14} color={colors.successText} strokeWidth={3} />
          ) : (
            <Minus size={14} color={colors.errorText} strokeWidth={3} />
          )}
          <Text
            style={[
              styles.typeBadgeText,
              { color: isIncome ? colors.successText : colors.errorText },
            ]}
          >
            {t(isIncome ? 'incomeRegistered' : 'expenseRegistered')}
          </Text>
        </View>

        <Text
          style={[
            styles.heroAmountText,
            { color: isIncome ? colors.successText : colors.text },
          ]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {format(isIncome ? transaction.totalAmount : -transaction.totalAmount, { showSign: isIncome })}
        </Text>

        <Text style={[styles.heroDescription, { color: colors.text }]}>
          {transaction.description || t(isIncome ? 'generalIncome' : 'generalExpense')}
        </Text>

        <View style={[styles.statusChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <CircleCheck size={14} color={colors.successText} strokeWidth={2.5} />
          <Text style={[styles.statusChipText, { color: colors.textLight }]}>
            {t('confirmedInAccount')}
          </Text>
        </View>
      </Card>

      {/* DETALLES DE LA OPERACIÓN */}
      <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('operationDetails')}</Text>

      <Card style={styles.detailsGroupCard}>
        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: `${categoryColor}22` }]}>
            <Tag size={18} color={categoryColor} strokeWidth={2.5} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>{t('category')}</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{categoryName}</Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: colors.primarySoft }]}>
            <CreditCard size={18} color={colors.primaryText} strokeWidth={2.5} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>
              {t('associatedAccount')}
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{accountName}</Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: colors.surfaceMuted }]}>
            <Calendar size={18} color={colors.text} strokeWidth={2.2} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>{t('date')}</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatFullDate(transaction.date)}
            </Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: colors.surfaceMuted }]}>
            <Clock size={18} color={colors.text} strokeWidth={2.2} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>
              {t('recordedTime')}
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatTime(transaction.date, transaction.createdAt)}
            </Text>
          </View>
        </View>
      </Card>

      {/* NOTAS Y REFERENCIA */}
      <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 24 }]}>
        {t('additionalInformation')}
      </Text>

      <Card style={styles.detailsGroupCard}>
        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: colors.surfaceMuted }]}>
            <FileText size={18} color={colors.textLight} strokeWidth={2.2} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>
              {t('notesObservations')}
            </Text>
            <Text style={[styles.detailValue, { color: notes ? colors.text : colors.textLight }]}>
              {notes || t('noNotes')}
            </Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: colors.surfaceMuted }]}>
            <Receipt size={18} color={colors.textLight} strokeWidth={2.2} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>
              {t('internalIdentifier')}
            </Text>
            <Text style={[styles.idValueText, { color: colors.textLight }]} numberOfLines={1}>
              {transaction.id}
            </Text>
          </View>
        </View>
      </Card>

      {/* DESGLOSE SPLITS */}
      {transaction.splits && transaction.splits.length > 1 && (
        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            {t('transactionBreakdown', { count: transaction.splits.length })}
          </Text>

          <Card style={styles.detailsGroupCard}>
            {transaction.splits.map((split, sIdx) => {
              const isLastSplit = sIdx === transaction.splits.length - 1;
              return (
                <View key={split.id || sIdx}>
                  <View style={styles.splitRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.splitCategory, { color: colors.text }]}>
                        {split.categoryName || t('general')}
                      </Text>
                      <Text style={[styles.splitAccount, { color: colors.textLight }]}>
                        {split.accountName || t('account')}
                      </Text>
                      {split.notes && (
                        <Text style={[styles.splitNotes, { color: colors.textLight }]}>
                          {split.notes}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.splitAmount, { color: isIncome ? colors.successText : colors.text }]}>
                      {format(isIncome ? split.amount : -split.amount, { showSign: isIncome })}
                    </Text>
                  </View>
                  {!isLastSplit && (
                    <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              );
            })}
          </Card>
        </View>
      )}

      {/* Botón Eliminar Destacado */}
      <Pressable
        style={({ pressed }) => [
          styles.deleteActionButton,
          { backgroundColor: colors.errorSoft, borderColor: colors.error },
          pressed && styles.pressed,
        ]}
        onPress={onDelete}
        disabled={isDeleting}
        accessibilityRole="button"
        accessibilityLabel={isDeleting ? t('deleting') : t('deleteThisMovement')}
        accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
      >
        <Trash size={18} color={colors.errorText} strokeWidth={2.5} />
        <Text style={[styles.deleteActionButtonText, { color: colors.errorText }]}>
          {isDeleting ? t('deleting') : t('deleteThisMovement')}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroAmountText: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginVertical: 4,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  detailsGroupCard: {
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  detailIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  idValueText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  rowDivider: {
    height: 1,
    marginLeft: 68,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  splitCategory: {
    fontSize: 14,
    fontWeight: '800',
  },
  splitAccount: {
    fontSize: 12,
    marginTop: 2,
  },
  splitNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  deleteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 32,
  },
  deleteActionButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
