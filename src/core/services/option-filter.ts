function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterOptionsByName<T extends { name: string }>(
  options: readonly T[],
  query: string
): T[] {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return [...options];

  return options.filter((option) =>
    normalizeName(option.name).includes(normalizedQuery)
  );
}
