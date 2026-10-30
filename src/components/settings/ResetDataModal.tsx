import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import {
  fontSize,
  lineHeight,
  radius,
  spacing,
  useColors,
  useInsets,
} from '@/components/ui/theme';
import { isResetConfirmationValid } from '@/core/services/reset-data-confirmation';
import { useTranslation } from '@/core/i18n/useTranslation';

type ResetStep = 'warning' | 'confirm';

interface ResetDataModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

interface DialogButtonProps {
  label: string;
  onPress: () => void;
  variant: 'secondary' | 'primary' | 'destructive';
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
    variant === 'primary'
      ? colors.primary
      : variant === 'destructive'
        ? colors.error
        : colors.surfaceMuted;
  const textColor =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'destructive'
        ? colors.onError
        : colors.text;

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

export function ResetDataModal({ visible, onClose, onConfirm }: ResetDataModalProps) {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();

  const [step, setStep] = useState<ResetStep>('warning');
  const [confirmation, setConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const confirmationWord = t('resetConfirmationWord');
  const isConfirmationValid = isResetConfirmationValid(confirmation, confirmationWord);
  const canReset = isConfirmationValid && !isResetting;

  const resetState = () => {
    setStep('warning');
    setConfirmation('');
    setIsResetting(false);
    setHasError(false);
  };

  const handleClose = () => {
    if (isResetting) return;
    resetState();
    onClose();
  };

  const handleConfirm = async () => {
    if (!canReset) return;

    setIsResetting(true);
    setHasError(false);

    try {
      await onConfirm();
      resetState();
    } catch (error) {
      console.error('Error resetting data:', error);
      setHasError(true);
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackToWarning = () => {
    setStep('warning');
    setConfirmation('');
    setHasError(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Card style={styles.dialog}>
              <View style={[styles.iconCircle, { backgroundColor: colors.errorSoft }]}>
                <TriangleAlert size={22} color={colors.errorText} strokeWidth={2.2} />
              </View>

              {step === 'warning' ? (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t('resetDataWarningTitle')}
                  </Text>
                  <Text style={[styles.message, { color: colors.textLight }]}>
                    {t('resetDataWarningMessage')}
                  </Text>

                  <View style={styles.actions}>
                    <DialogButton
                      label={t('cancel')}
                      onPress={handleClose}
                      variant="secondary"
                    />
                    <DialogButton
                      label={t('resetDataContinue')}
                      onPress={() => setStep('confirm')}
                      variant="primary"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t('resetDataConfirmTitle')}
                  </Text>
                  <Text style={[styles.message, { color: colors.textLight }]}>
                    {t('resetDataConfirmMessage', { word: confirmationWord })}
                  </Text>

                  <TextInput
                    value={confirmation}
                    onChangeText={(value) => {
                      setConfirmation(value);
                      setHasError(false);
                    }}
                    placeholder={confirmationWord}
                    placeholderTextColor={colors.textLight}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoFocus
                    editable={!isResetting}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (canReset) void handleConfirm();
                    }}
                    accessibilityLabel={t('resetDataConfirmMessage', { word: confirmationWord })}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: hasError ? colors.error : colors.border,
                        color: colors.text,
                      },
                    ]}
                  />

                  {hasError ? (
                    <Text style={[styles.errorText, { color: colors.errorText }]}>
                      {t('resetDataErrorMessage')}
                    </Text>
                  ) : null}

                  <View style={styles.actions}>
                    <DialogButton
                      label={t('goBack')}
                      onPress={handleBackToWarning}
                      variant="secondary"
                      disabled={isResetting}
                    />
                    <DialogButton
                      label={t('resetData')}
                      onPress={() => void handleConfirm()}
                      variant="destructive"
                      disabled={!canReset}
                      loading={isResetting}
                    />
                  </View>
                </>
              )}
            </Card>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.sm,
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
