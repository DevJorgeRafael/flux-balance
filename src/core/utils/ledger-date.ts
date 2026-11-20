const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLedgerDate(value: string): Date | null {
  if (typeof value !== 'string' || value.length === 0) return null;

  const trimmed = value.trim();
  const match = DATE_ONLY.exec(trimmed);

  if (match) {
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, monthIndex, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== monthIndex ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}
