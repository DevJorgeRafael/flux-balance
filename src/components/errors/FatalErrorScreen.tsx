import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { getLocales } from 'expo-localization';
import * as SplashScreen from 'expo-splash-screen';
import { AlertTriangle, RefreshCw, Share2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  darkPalette,
  fontSize,
  fontWeight,
  lightPalette,
  lineHeight,
  radius,
  spacing,
} from '@/components/ui/theme';
import type { Language } from '@/core/i18n/translations';
import { translations } from '@/core/i18n/translations';
import { resolveLanguage } from '@/core/preferences/preferences';
import {
  ErrorReportError,
  shareErrorReport,
} from '@/infrastructure/diagnostics/errorReport';

interface FatalErrorScreenProps {
  kind: 'startup' | 'unexpected';
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
}

function resolveDeviceLanguage(): Language {
  try {
    return resolveLanguage('system', getLocales()[0]?.languageCode);
  } catch {
    return 'en';
  }
}

export function FatalErrorScreen({
  kind,
  error,
  onRetry,
  retrying = false,
}: FatalErrorScreenProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkPalette : lightPalette;
  const language = resolveDeviceLanguage();
  const copy = translations[language];
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  const handleShare = useCallback(async () => {
    if (sharing) return;

    setSharing(true);
    try {
      await shareErrorReport(error, language, copy.startupErrorReportDialogTitle);
    } catch (shareError) {
      const message =
        shareError instanceof ErrorReportError && shareError.code === 'unavailable'
          ? copy.startupErrorReportUnavailable
          : copy.startupErrorReportFailed;
      Alert.alert(copy.error, message);
    } finally {
      setSharing(false);
    }
  }, [copy, error, language, sharing]);

  const title =
    kind === 'startup' ? copy.startupErrorTitle : copy.startupErrorBoundaryTitle;
  const message =
    kind === 'startup'
      ? copy.startupErrorDatabaseMessage
      : copy.startupErrorBoundaryMessage;

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xxxl,
          paddingBottom: insets.bottom + spacing.xxl,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.errorSoft }]}>
          <AlertTriangle color={colors.error} size={32} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textLight }]}>{message}</Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: retrying }}
            disabled={retrying}
            onPress={onRetry}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.primary,
                opacity: retrying ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {retrying ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <RefreshCw color={colors.onPrimary} size={18} />
            )}
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              {retrying ? copy.startupErrorRetrying : copy.startupErrorRetry}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: sharing }}
            disabled={sharing}
            onPress={() => void handleShare()}
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: sharing ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {sharing ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Share2 color={colors.primaryText} size={18} />
            )}
            <Text style={[styles.buttonText, { color: colors.primaryText }]}>
              {sharing
                ? copy.startupErrorSharingReport
                : copy.startupErrorShareReport}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: colors.textLight }]}>
          {copy.startupErrorReportHint}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.lg,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    minHeight: 52,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  hint: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
