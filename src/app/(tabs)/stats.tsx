import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChartColumn } from 'lucide-react-native';
import { useColors, useInsets } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { TAB_BAR_CONTENT_GAP, TAB_BAR_CONTENT_OFFSET } from '@/components/navigation/tabBarLayout';

export default function StatsScreen() {
  const colors = useColors();
  const insets = useInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + TAB_BAR_CONTENT_OFFSET + TAB_BAR_CONTENT_GAP },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t('stats')}</Text>

        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <ChartColumn size={32} color={colors.primaryText} strokeWidth={1.8} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('comingSoon')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 24,
  },
  emptyCard: {
    minHeight: 260,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
