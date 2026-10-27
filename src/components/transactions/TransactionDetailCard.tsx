import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import {
  Tag,
  CreditCard,
  Calendar,
  Clock,
  CircleCheck,
  FileText,
  Receipt,
  Plus,
  Minus,
  Trash,
} from 'lucide-react-native';
import { Transaction } from '@/core/models/transaction';
import { useColors } from '@/components/ui/theme';
import { formatCurrency } from '@/core/utils/currency';

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

  const isIncome = transaction.type === 'INCOME';
  const primarySplit = transaction.splits?.[0];
  const categoryName = primarySplit?.categoryName || 'Sin categoría';
  const categoryColor = primarySplit?.categoryColor || (isIncome ? colors.success : colors.error);
  const accountName = primarySplit?.accountName || 'Cuenta';
  const notes = primarySplit?.notes;

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const formatted = d.toLocaleDateString('es-ES', {
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
      return (
        d.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }) + ' hs'
      );
    } catch {
      return '--:--';
    }
  };

  return (
    <>
      {/* HERO CARD TICKET */}
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
            {isIncome ? 'Ingreso registrado' : 'Gasto registrado'}
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
          {isIncome ? '+' : '-'}{formatCurrency(transaction.totalAmount)}
        </Text>

        <Text style={[styles.heroDescription, { color: colors.text }]}>
          {transaction.description || (isIncome ? 'Ingreso General' : 'Gasto General')}
        </Text>

        <View style={[styles.statusChip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <CircleCheck size={14} color={colors.successText} strokeWidth={2.5} />
          <Text style={[styles.statusChipText, { color: colors.textLight }]}>Confirmado en cuenta</Text>
        </View>
      </View>

      {/* DETALLES DE LA OPERACIÓN */}
      <Text style={[styles.sectionHeading, { color: colors.text }]}>Detalles de la Operación</Text>

      <View style={[styles.detailsGroupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: `${categoryColor}22` }]}>
            <Tag size={18} color={categoryColor} strokeWidth={2.5} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>Categoría</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{categoryName}</Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: colors.primarySoft }]}>
            <CreditCard size={18} color={colors.primaryText} strokeWidth={2.5} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>Cuenta asociada</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{accountName}</Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: colors.surfaceMuted }]}>
            <Calendar size={18} color={colors.text} strokeWidth={2.2} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>Fecha</Text>
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
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>Hora registrada</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatTime(transaction.date, transaction.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* NOTAS Y REFERENCIA */}
      <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 24 }]}>Información Adicional</Text>

      <View style={[styles.detailsGroupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: colors.surfaceMuted }]}>
            <FileText size={18} color={colors.textLight} strokeWidth={2.2} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>Notas / Observaciones</Text>
            <Text style={[styles.detailValue, { color: notes ? colors.text : colors.textLight }]}>
              {notes || 'Sin observaciones'}
            </Text>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <View style={[styles.detailIconBox, { backgroundColor: colors.surfaceMuted }]}>
            <Receipt size={18} color={colors.textLight} strokeWidth={2.2} />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>Identificador interno</Text>
            <Text style={[styles.idValueText, { color: colors.textLight }]} numberOfLines={1}>
              {transaction.id}
            </Text>
          </View>
        </View>
      </View>

      {/* DESGLOSE SPLITS */}
      {transaction.splits && transaction.splits.length > 1 && (
        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Desglose de la Transacción ({transaction.splits.length})
          </Text>

          <View style={[styles.detailsGroupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {transaction.splits.map((split, sIdx) => {
              const isLastSplit = sIdx === transaction.splits.length - 1;
              return (
                <View key={split.id || sIdx}>
                  <View style={styles.splitRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.splitCategory, { color: colors.text }]}>
                        {split.categoryName || 'General'}
                      </Text>
                      <Text style={[styles.splitAccount, { color: colors.textLight }]}>
                        {split.accountName || 'Cuenta'}
                      </Text>
                      {split.notes && (
                        <Text style={[styles.splitNotes, { color: colors.textLight }]}>
                          {split.notes}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.splitAmount, { color: isIncome ? colors.successText : colors.text }]}>
                      {isIncome ? '+' : '-'}{formatCurrency(split.amount)}
                    </Text>
                  </View>
                  {!isLastSplit && (
                    <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Botón Eliminar Destacado */}
      <TouchableOpacity
        style={[styles.deleteActionButton, { backgroundColor: colors.errorSoft, borderColor: colors.error }]}
        onPress={onDelete}
        activeOpacity={0.8}
        disabled={isDeleting}
      >
        <Trash size={18} color={colors.errorText} strokeWidth={2.5} />
        <Text style={[styles.deleteActionButtonText, { color: colors.errorText }]}>
          {isDeleting ? 'Eliminando...' : 'Eliminar este movimiento'}
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
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
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
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
});
