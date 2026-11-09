import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

interface ReminderScreenHeaderProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}

export function ReminderScreenHeader({
  title,
  onBack,
  right,
}: ReminderScreenHeaderProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={styles.topHeader}>
      <Pressable
        style={({ pressed }) => [
          styles.roundIconButton,
          { backgroundColor: colors.surface },
          pressed && styles.pressed,
        ]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('goBack')}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
      </Pressable>

      {right ? <View style={styles.headerAction}>{right}</View> : null}

      <View style={styles.titleLayer} pointerEvents="none">
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
  },
  roundIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLayer: {
    position: 'absolute',
    top: 12,
    right: 24,
    bottom: 14,
    left: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
