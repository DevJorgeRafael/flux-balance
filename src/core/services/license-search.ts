export interface LicensePackage {
  name: string;
  version: string;
  noticeKey?: string;
}

export interface LicenseGroup {
  license: string;
  text: string;
  packages: LicensePackage[];
}

export interface LicenseSearchResult {
  groups: LicenseGroup[];
  total: number;
}

export interface LicenseCatalogSummary {
  groups: number;
  packages: number;
}

export interface LicenseCatalogData {
  summary: LicenseCatalogSummary;
  groups: LicenseGroup[];
}

export function countLicensePackages(groups: LicenseGroup[]): number {
  return groups.reduce((total, group) => total + group.packages.length, 0);
}

export function isCombinedLicense(license: string): boolean {
  return /\b(?:AND|OR)\b/.test(license) || /[()]/.test(license);
}

export function filterLicenseGroups(
  groups: LicenseGroup[],
  query: string
): LicenseSearchResult {
  const term = query.trim().toLowerCase();

  if (!term) {
    return { groups, total: countLicensePackages(groups) };
  }

  const filtered = groups
    .map((group) => ({
      ...group,
      packages: group.packages.filter((pkg) =>
        pkg.name.toLowerCase().includes(term)
      ),
    }))
    .filter((group) => group.packages.length > 0);

  return { groups: filtered, total: countLicensePackages(filtered) };
}
