import type { CategoryType } from '../models/category';

export const MIN_KEYWORD_LENGTH = 3;
export const MAX_KEYWORDS_PER_DESCRIPTION = 3;

const STOP_WORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o',
  'en', 'con', 'por', 'para', 'al', 'a', 'mi', 'su', 'se', 'que', 'es', 'no',
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'my', 'of', 'to', 'in',
]);

export interface CategoryRule {
  id: string;
  keyword: string;
  categoryId: string;
  type: CategoryType;
  hits: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRuleDraft {
  keyword: string;
  categoryId: string;
  type: CategoryType;
}

export interface CategorySuggestion {
  categoryId: string;
  keyword: string;
  hits: number;
}

export function normalizeKeyword(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function extractKeywords(
  description: string,
  max = MAX_KEYWORDS_PER_DESCRIPTION
): string[] {
  const normalized = normalizeKeyword(description);
  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= MIN_KEYWORD_LENGTH && !STOP_WORDS.has(token));
  const unique = [...new Set(tokens)];
  return unique
    .sort((left, right) => right.length - left.length || left.localeCompare(right))
    .slice(0, max);
}

export function suggestCategory(
  description: string,
  rules: readonly CategoryRule[],
  type: CategoryType
): CategorySuggestion | null {
  const normalized = normalizeKeyword(description);
  if (!normalized) return null;

  let best: CategorySuggestion | null = null;
  for (const rule of rules) {
    if (rule.type !== type) continue;
    const keyword = normalizeKeyword(rule.keyword);
    if (!keyword || !normalized.includes(keyword)) continue;
    if (
      !best ||
      keyword.length > best.keyword.length ||
      (keyword.length === best.keyword.length && rule.hits > best.hits)
    ) {
      best = {
        categoryId: rule.categoryId,
        keyword,
        hits: rule.hits,
      };
    }
  }
  return best;
}

export function buildLearnedRules(
  description: string,
  categoryId: string,
  type: CategoryType,
  existingRules: readonly CategoryRule[],
  max = MAX_KEYWORDS_PER_DESCRIPTION
): CategoryRuleDraft[] {
  if (!categoryId.trim()) return [];
  const known = new Set(
    existingRules
      .filter((rule) => rule.type === type)
      .map((rule) => `${normalizeKeyword(rule.keyword)}`)
  );

  return extractKeywords(description, max)
    .filter((keyword) => !known.has(keyword))
    .map((keyword) => ({ keyword, categoryId, type }));
}
