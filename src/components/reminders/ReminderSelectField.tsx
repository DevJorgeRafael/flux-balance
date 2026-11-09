import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, ChevronRight, Search, X } from 'lucide-react-native';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { isHexColor, useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';
import { filterOptionsByName } from '@/core/services/option-filter';

export interface ReminderSelectOption {
  id: string;
  name: string;
  color?: string | null;
}

interface ReminderSelectFieldProps {
  label: string;
  title: string;
  emptyLabel: string;
  accessibilityLabel: string;
  options: ReminderSelectOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  showColor?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsLabel?: string;
}

const SEARCH_THRESHOLD = 8;

export function ReminderSelectField({
  label,
  title,
  emptyLabel,
  accessibilityLabel,
  options,
  selectedId,
  onSelect,
  showColor = false,
  searchable = false,
  searchPlaceholder,
  noResultsLabel,
}: ReminderSelectFieldProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find((option) => option.id === selectedId);
  const hasSelection = selectedOption !== undefined;
  const showSearch = searchable && options.length >= SEARCH_THRESHOLD;
  const filteredOptions = useMemo(
    () => filterOptionsByName(options, query),
    [options, query]
  );
  const selectedText = selectedOption?.name ?? emptyLabel;

  const openSheet = () => {
    Keyboard.dismiss();
    setQuery('');
    setIsOpen(true);
  };

  const closeSheet = () => {
    setIsOpen(false);
  };

  const selectOption = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setQuery('');
  };

  const renderDot = (color: string | null | undefined, empty: boolean) => (
    <View
      style={[
        styles.dot,
        empty
          ? { borderColor: colors.textLight, borderWidth: 1.5 }
          : { backgroundColor: isHexColor(color) ? color : colors.chartOther },
      ]}
    />
  );

  return (
    <View>
      <Text style={[styles.label, { color: colors.textLight }]}>{label}</Text>

      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: isOpen }}
        style={({ pressed }) => [
          styles.selectRow,
          { backgroundColor: colors.inputBackground },
          pressed && styles.pressed,
        ]}
      >
        {showColor ? renderDot(selectedOption?.color, !hasSelection) : null}
        <Text
          numberOfLines={1}
          style={[
            styles.selectText,
            { color: hasSelection ? colors.text : colors.textLight },
          ]}
        >
          {selectedText}
        </Text>
        <ChevronRight size={18} color={colors.textLight} strokeWidth={2.2} />
      </Pressable>

      <BottomSheetModal
        visible={isOpen}
        onClose={closeSheet}
        maxHeight="80%"
        bottomPaddingExtra={16}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
          <Pressable
            onPress={closeSheet}
            accessibilityRole="button"
            accessibilityLabel={t('close')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={colors.textLight} strokeWidth={2} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => selectOption('')}
          accessibilityRole="button"
          accessibilityLabel={emptyLabel}
          accessibilityState={{ selected: !hasSelection }}
          style={({ pressed }) => [
            styles.optionRow,
            pressed && styles.pressed,
          ]}
        >
          {showColor ? renderDot(null, true) : null}
          <Text style={[styles.optionText, { color: colors.text }]}>
            {emptyLabel}
          </Text>
          {!hasSelection ? (
            <Check size={18} color={colors.primary} strokeWidth={2.6} />
          ) : null}
        </Pressable>

        {options.length > 0 ? (
          <>
            {showSearch ? (
              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: colors.inputBackground },
                ]}
              >
                <Search size={18} color={colors.textLight} strokeWidth={2.2} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  style={[styles.searchInput, { color: colors.text }]}
                />
              </View>
            ) : null}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                noResultsLabel ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: colors.textLight }]}>
                      {noResultsLabel}
                    </Text>
                  </View>
                ) : undefined
              }
              renderItem={({ item }) => {
                const selected = item.id === selectedId;
                return (
                  <Pressable
                    onPress={() => selectOption(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    {showColor ? renderDot(item.color, false) : null}
                    <Text
                      numberOfLines={1}
                      style={[styles.optionText, { color: colors.text }]}
                    >
                      {item.name}
                    </Text>
                    {selected ? (
                      <Check size={18} color={colors.primary} strokeWidth={2.6} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </>
        ) : null}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 18,
  },
  selectRow: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pressed: {
    opacity: 0.72,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  optionRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  searchBox: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 0,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
