import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import {
  ChevronRight,
  CodeXml,
  ExternalLink,
  FileText,
  Heart,
  Info,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { appAlert } from '@/components/ui/alert/appAlert';
import { Card } from '@/components/ui/Card';
import { fontSize, radius, spacing, useColors } from '@/components/ui/theme';
import { SectionLabel } from './SectionLabel';
import {
  AUTHOR_NAME,
  LICENSE_URL,
  PRIVACY_URL,
  SHOW_DONATION,
  SUPPORT_URL,
  isPrivacyVisible,
  isSupportVisible,
} from '@/constants/about';
import { useTranslation } from '@/core/i18n/useTranslation';

function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '—';
}

interface AboutRowProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  value?: string;
  isLast?: boolean;
  onPress?: () => void;
  accessibilityRole?: 'button' | 'link';
  opensExternally?: boolean;
}

function AboutRow({
  icon: Icon,
  label,
  description,
  value,
  isLast = false,
  onPress,
  accessibilityRole = 'button',
  opensExternally = false,
}: AboutRowProps) {
  const colors = useColors();

  const content = (
    <>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <Icon size={18} color={colors.primaryText} strokeWidth={2.2} />
      </View>

      <View style={styles.texts}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { color: colors.textLight }]}>{description}</Text>
        ) : null}
      </View>

      {value ? (
        <View style={[styles.valuePill, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.valueText, { color: colors.primaryText }]}>{value}</Text>
        </View>
      ) : null}

      {onPress ? (
        opensExternally ? (
          <ExternalLink size={17} color={colors.textLight} strokeWidth={2.4} />
        ) : (
          <ChevronRight size={17} color={colors.textLight} strokeWidth={2.4} />
        )
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    !isLast && {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
  ];

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={[label, description, value].filter(Boolean).join(', ')}
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export function AboutSection() {
  const { t } = useTranslation();
  const supportVisible = isSupportVisible(SHOW_DONATION, SUPPORT_URL);
  const privacyVisible = isPrivacyVisible(PRIVACY_URL);
  const version = getAppVersion();

  const openExternalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      void appAlert({
        type: 'error',
        title: t('linkErrorTitle'),
        message: t('linkErrorMessage'),
        buttons: [{ text: t('accept') }],
      });
    }
  };

  return (
    <>
      <SectionLabel>{t('about')}</SectionLabel>
      <Card style={styles.card}>
        <AboutRow
          icon={Info}
          label={t('version')}
          value={version}
        />

        <AboutRow
          icon={CodeXml}
          label={t('openSource')}
          description={`${t('mitLicense')} · ${AUTHOR_NAME}`}
          accessibilityRole="link"
          opensExternally
          onPress={() => void openExternalLink(LICENSE_URL)}
        />

        <AboutRow
          icon={FileText}
          label={t('thirdPartyLicenses')}
          isLast={!privacyVisible && !supportVisible}
          onPress={() => router.push('/settings/licenses')}
        />

        {privacyVisible ? (
          <AboutRow
            icon={ShieldCheck}
            label={t('privacyPolicy')}
            isLast={!supportVisible}
            accessibilityRole="link"
            opensExternally
            onPress={() => void openExternalLink(PRIVACY_URL)}
          />
        ) : null}

        {supportVisible ? (
          <AboutRow
            icon={Heart}
            label={t('supportProject')}
            description={t('supportSubtitle')}
            isLast
            accessibilityRole="link"
            opensExternally
            onPress={() => void openExternalLink(SUPPORT_URL)}
          />
        ) : null}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  valuePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.lg,
  },
  valueText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
