export type CategoryPaletteType = 'INCOME' | 'EXPENSE';
export type CategoryColorPalette = readonly (readonly string[])[];

export const CATEGORY_COLOR_PALETTES: Record<CategoryPaletteType, CategoryColorPalette> = {
  EXPENSE: [
    ['#DFD19A', '#DFC89A', '#DFBF9A', '#DFB69A', '#DFAD9A', '#DFA39A', '#DF9A9A', '#DF9AAA', '#DF9ABA'],
    ['#DCC874', '#DCBA74', '#DCAC74', '#DC9E74', '#DC9074', '#DC8274', '#DC7474', '#DC748D', '#DC74A5'],
    ['#DBBE4D', '#DBAB4D', '#DB994D', '#DB864D', '#DB734D', '#DB604D', '#DB4D4D', '#DB4D6E', '#DB4D8F'],
    ['#D9B526', '#D99D26', '#D98526', '#D96E26', '#D95626', '#D93E26', '#D92626', '#D92650', '#D9267A'],
    ['#B49722', '#B48322', '#B47022', '#B45D22', '#B44922', '#B43622', '#B42222', '#B42244', '#B42266'],
    ['#8C7721', '#8C6921', '#8C5A21', '#8C4C21', '#8C3E21', '#8C2F21', '#8C2121', '#8C213A', '#8C2153'],
  ],
  INCOME: [
    ['#9DDDB8', '#9DDDC4', '#9DDDD0', '#9DDDDB', '#9DD2DD', '#9DC6DD', '#9DBBDD', '#9DB2DD', '#9DAADD'],
    ['#78D9A2', '#78D9B4', '#78D9C5', '#78D9D7', '#78C9D9', '#78B7D9', '#78A5D9', '#7898D9', '#788BD9'],
    ['#51D68B', '#51D6A3', '#51D6BC', '#51D6D4', '#51C0D6', '#51A8D6', '#518FD6', '#517ED6', '#516CD6'],
    ['#2BD474', '#2BD493', '#2BD4B2', '#2BD4D1', '#2BB8D4', '#2B99D4', '#2B7AD4', '#2B63D4', '#2B4DD4'],
    ['#27B062', '#27B07B', '#27B094', '#27B0AD', '#2799B0', '#2780B0', '#2767B0', '#2754B0', '#2742B0'],
    ['#248950', '#248962', '#248975', '#248987', '#247889', '#246689', '#245389', '#244689', '#243989'],
  ],
};

export const CATEGORY_PALETTE_ROW_ORDER = [3, 4, 2, 5, 1, 0] as const;

export const CATEGORY_TYPE_ACCENTS: Record<CategoryPaletteType, string> = {
  INCOME: '#2767B0',
  EXPENSE: '#B45D22',
};

export function isPaletteColor(type: CategoryPaletteType, color: string): boolean {
  const normalized = color.toLowerCase();
  return CATEGORY_COLOR_PALETTES[type].some((row) =>
    row.some((candidate) => candidate.toLowerCase() === normalized)
  );
}

export function pickUnusedPaletteColor(
  type: CategoryPaletteType,
  usedColors: ReadonlySet<string>
): string {
  for (const rowIndex of CATEGORY_PALETTE_ROW_ORDER) {
    for (const color of CATEGORY_COLOR_PALETTES[type][rowIndex] ?? []) {
      if (!usedColors.has(color.toLowerCase())) return color;
    }
  }

  return CATEGORY_COLOR_PALETTES[type][0]![0]!;
}
