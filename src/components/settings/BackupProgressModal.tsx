import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { fontSize, radius, spacing, useColors, useInsets } from '@/components/ui/theme';

interface BackupProgressModalProps {
  visible: boolean;
  message: string;
}

export function BackupProgressModal({
  visible,
  message,
}: BackupProgressModalProps) {
  const colors = useColors();
  const insets = useInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
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
        <Card style={styles.dialog}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <ActivityIndicator color={colors.primaryText} />
          </View>
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    padding: spacing.xxl,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: fontSize.md,
    fontWeight: '700',
    textAlign: 'center',
  },
});
