const MIUI_BRANDS = ['xiaomi', 'redmi', 'poco'];

export interface DeviceBrandInfo {
  manufacturer?: string | null;
  brand?: string | null;
}

function matchesMiuiBrand(value: string | null | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return false;
  return MIUI_BRANDS.some((brand) => normalized.includes(brand));
}

export function isMiuiDevice({
  manufacturer,
  brand,
}: DeviceBrandInfo): boolean {
  return matchesMiuiBrand(manufacturer) || matchesMiuiBrand(brand);
}
