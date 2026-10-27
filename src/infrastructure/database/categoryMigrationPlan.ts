import type { CategoryType } from '../../core/models/category';
import { pickUnusedPaletteColor } from '../../core/constants/categoryPalettes';
import { DEFAULT_CATEGORIES, type DefaultCategorySeed } from './schema.sql';

export interface LegacyCategoryRow {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  is_default: number;
  created_at: string;
}

interface CategoryColorRow {
  id: string;
  name: string;
  color: string | null;
  is_default: number;
}

export interface MigratedCategoryRow {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  is_default: number;
  sort_order: number;
  created_at: string;
}

export interface CategoryMigrationPlan {
  income: MigratedCategoryRow[];
  expense: MigratedCategoryRow[];
}

const CUSTOM_SORT_ORDER_START = 1000;

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeNullable(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

const defaultsById = new Map<string, DefaultCategorySeed>(
  DEFAULT_CATEGORIES.map((category) => [category.id, category])
);

const defaultsByName = new Map<string, DefaultCategorySeed>(
  DEFAULT_CATEGORIES.map((category) => [normalizeName(category.name), category])
);

const LEGACY_DEFAULT_COLORS = new Set(
  [
    '#10B981',
    '#34D399',
    '#059669',
    '#6EE7B7',
    '#EF4444',
    '#F87171',
    '#FBBF24',
    '#8B5CF6',
    '#F59E0B',
    '#EC4899',
    '#9CA3AF',
  ].map((color) => color.toLowerCase())
);

function findDefaultCategory(
  category: Pick<CategoryColorRow, 'id' | 'name' | 'is_default'>
): DefaultCategorySeed | undefined {
  const byId = defaultsById.get(category.id);
  if (byId) return byId;

  if (category.is_default === 1) {
    return defaultsByName.get(normalizeName(category.name));
  }

  return undefined;
}

export function assignCategoryPaletteColors<T extends CategoryColorRow>(
  type: CategoryType,
  rows: readonly T[]
): T[] {
  const usedColors = new Set<string>();

  return rows.map((row) => {
    const defaultCategory = findDefaultCategory(row);
    const currentColor = normalizeNullable(row.color);
    let color: string;

    if (defaultCategory) {
      color =
        !currentColor || LEGACY_DEFAULT_COLORS.has(currentColor.toLowerCase())
          ? defaultCategory.color
          : currentColor;
    } else {
      color = currentColor ?? pickUnusedPaletteColor(type, usedColors);
    }

    usedColors.add(color.toLowerCase());
    return { ...row, color };
  });
}

export function classifyLegacyCategory(
  category: LegacyCategoryRow
): CategoryType[] {
  const defaultCategory = findDefaultCategory(category);

  if (defaultCategory) {
    return [defaultCategory.type];
  }

  return ['INCOME', 'EXPENSE'];
}

export function buildCategoryMigrationPlan(
  legacyCategories: readonly LegacyCategoryRow[]
): CategoryMigrationPlan {
  const plan: CategoryMigrationPlan = { income: [], expense: [] };
  const sorted = [...legacyCategories].sort((a, b) => a.id.localeCompare(b.id));
  let nextCustomSortOrder = CUSTOM_SORT_ORDER_START;

  for (const category of sorted) {
    const defaultCategory = findDefaultCategory(category);
    const sortOrder = defaultCategory?.sort_order ?? nextCustomSortOrder++;

    if (!defaultCategory) {
      nextCustomSortOrder = Math.max(nextCustomSortOrder, sortOrder + 1);
    }

    const migrated: MigratedCategoryRow = {
      id: category.id,
      name: category.name,
      color: normalizeNullable(category.color),
      icon: normalizeNullable(category.icon),
      is_default: category.is_default === 1 ? 1 : 0,
      sort_order: sortOrder,
      created_at: category.created_at,
    };

    for (const type of classifyLegacyCategory(category)) {
      if (type === 'INCOME') {
        plan.income.push({ ...migrated });
      } else {
        plan.expense.push({ ...migrated });
      }
    }
  }

  const income = plan.income.sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  );
  const expense = plan.expense.sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  );

  return {
    income: assignCategoryPaletteColors('INCOME', income),
    expense: assignCategoryPaletteColors('EXPENSE', expense),
  };
}
