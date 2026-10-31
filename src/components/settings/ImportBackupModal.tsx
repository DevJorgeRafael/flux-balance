import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CircleAlert, TriangleAlert } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import {
  fontSize,
  lineHeight,
  radius,
  spacing,
  useColors,
  useInsets,
} from '@/components/ui/theme';
import { getCurrencyName } from '@/core/constants/currencies';
import type {
  BackupPreview,
  BackupValidationError,
} from '@/core/models/backup';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  formatBackupError,
  isExcelFormatError,
} from './backupErrorFormat';

interface ImportBackupModalProps {
  visible: boolean;
  preview: BackupPreview | null;
  errors: BackupValidationError[] | null;
  isImporting: boolean;
  isExportingTemplate?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExportTemplate?: () => void;
}

interface SummaryRowProps {
  label: string;
  value: string;
  hint?: string;
}

function SummaryRow({ label, value, hint }: SummaryRowProps) {
  const colors = useColors();

  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryTexts}>
        <Text style={[styles.summaryLabel, { color: colors.textLight }]}>{label}</Text>
        {hint ? (
          <Text style={[styles.summaryHint, { color: colors.textLight }]}>{hint}</Text>
        ) : null}
      </View>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

interface DialogButtonProps {
  label: string;
  onPress: () => void;
  variant: 'secondary' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
}

function DialogButton({
  label,
  onPress,
  variant,
  disabled = false,
  loading = false,
}: DialogButtonProps) {
  const colors = useColors();
  const backgroundColor =
    variant === 'destructive' ? colors.error : colors.surfaceMuted;
  const textColor =
    variant === 'destructive' ? colors.onError : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        disabled && !loading && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonLabel, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function ImportBackupModal({
  visible,
  preview,
  errors,
  isImporting,
  isExportingTemplate = false,
  onClose,
  onConfirm,
  onExportTemplate,
}: ImportBackupModalProps) {
  const colors = useColors();
  const insets = useInsets();
  const { language, t } = useTranslation();

  const hasErrors = Boolean(errors && errors.length > 0);
  const shownErrors = errors?.slice(0, 5) ?? [];
  const remainingErrors = Math.max((errors?.length ?? 0) - shownErrors.length, 0);
  const canExportTemplate = Boolean(
    onExportTemplate && errors?.some(isExcelFormatError)
  );

  const exportedAt = preview
    ? new Date(preview.exportedAt).toLocaleString(
        language === 'es' ? 'es-ES' : 'en-US'
      )
    : '';
  const categoryTotal = preview
    ? preview.incomeCategories + preview.expenseCategories
    : 0;

  const handleClose = () => {
    if (isImporting) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: colors.overlay,
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={styles.dialogWrapper} pointerEvents="box-none">
          <ScrollView
            style={styles.dialogScroll}
            contentContainerStyle={styles.dialogScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Card style={styles.dialog}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: hasErrors ? colors.errorSoft : colors.primarySoft },
                ]}
              >
                {hasErrors ? (
                  <CircleAlert size={22} color={colors.errorText} strokeWidth={2.2} />
                ) : (
                  <TriangleAlert size={22} color={colors.primaryText} strokeWidth={2.2} />
                )}
              </View>

              {hasErrors ? (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t('backupImportErrorsTitle')}
                  </Text>
                  <Text style={[styles.message, { color: colors.textLight }]}>
                    {t('backupImportErrorsMessage')}
                  </Text>

                  <View style={styles.errorList}>
                    {shownErrors.map((error, index) => (
                      <Text
                        key={`${error.code}-${error.path ?? index}`}
                        style={[styles.errorItem, { color: colors.errorText }]}
                      >
                        • {formatBackupError(error, t)}
                      </Text>
                    ))}
                  </View>

                  {remainingErrors > 0 ? (
                    <Text style={[styles.moreErrors, { color: colors.textLight }]}>
                      {t('backupImportErrorsMore', { count: remainingErrors })}
                    </Text>
                  ) : null}

                  <View style={styles.actions}>
                    {canExportTemplate ? (
                      <DialogButton
                        label={t('backupExcelTemplate')}
                        onPress={onExportTemplate ?? (() => {})}
                        variant="secondary"
                        disabled={isExportingTemplate}
                        loading={isExportingTemplate}
                      />
                    ) : null}
                    <DialogButton
                      label={t('close')}
                      onPress={handleClose}
                      variant="secondary"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t('backupImportSummaryTitle')}
                  </Text>
                  <Text style={[styles.message, { color: colors.textLight }]}>
                    {t('backupImportSummaryMessage')}
                  </Text>

                  <View style={styles.summary}>
                    <SummaryRow
                      label={t('backupSummaryAccounts')}
                      value={String(preview?.accounts ?? 0)}
                    />
                    <SummaryRow
                      label={t('backupSummaryCategories')}
                      value={String(categoryTotal)}
                      hint={t('backupSummaryCategoryBreakdown', {
                        income: preview?.incomeCategories ?? 0,
                        expense: preview?.expenseCategories ?? 0,
                      })}
                    />
                    <SummaryRow
                      label={t('backupSummaryTransactions')}
                      value={String(preview?.transactions ?? 0)}
                    />
                    <SummaryRow
                      label={t('backupSummaryExportedAt')}
                      value={exportedAt}
                    />
                    <SummaryRow
                      label={t('backupSummaryCurrency')}
                      value={
                        preview
                          ? `${getCurrencyName(preview.currency, language)} (${preview.currency})`
                          : ''
                      }
                    />
                  </View>

                  <Text
                    style={[
                      styles.warning,
                      {
                        color: colors.errorText,
                        backgroundColor: colors.errorSoft,
                      },
                    ]}
                  >
                    {t('backupImportWarning')}
                  </Text>

                  <View style={styles.actions}>
                    <DialogButton
                      label={t('cancel')}
                      onPress={handleClose}
                      variant="secondary"
                      disabled={isImporting}
                    />
                    <DialogButton
                      label={t('backupImportReplace')}
                      onPress={onConfirm}
                      variant="destructive"
                      disabled={isImporting}
                      loading={isImporting}
                    />
                  </View>
                </>
              )}
            </Card>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  dialogWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  dialogScroll: {
    flexGrow: 0,
    flexShrink: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  dialogScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  dialog: {
    padding: spacing.xxl,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    fontWeight: '500',
    lineHeight: lineHeight.lg,
  },
  summary: {
    marginTop: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryTexts: {
    flex: 1,
    gap: spacing.xxs,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  summaryHint: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: '800',
    textAlign: 'right',
  },
  warning: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: fontSize.sm,
    fontWeight: '700',
    lineHeight: lineHeight.md,
  },
  errorList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  errorItem: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    lineHeight: lineHeight.md,
  },
  moreErrors: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
});
