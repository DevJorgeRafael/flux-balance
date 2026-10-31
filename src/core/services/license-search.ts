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

export function mergeLicenseGroups(
  groups: LicenseGroup[],
  vendoredGroups: LicenseGroup[]
): LicenseGroup[] {
  const merged = groups.map((group) => ({
    ...group,
    packages: group.packages.map((pkg) => ({ ...pkg })),
  }));

  for (const vendoredGroup of vendoredGroups) {
    const existing = merged.find((group) => group.license === vendoredGroup.license);

    if (!existing) {
      merged.push({
        ...vendoredGroup,
        packages: vendoredGroup.packages.map((pkg) => ({ ...pkg })),
      });
      continue;
    }

    for (const pkg of vendoredGroup.packages) {
      const existingPackage = existing.packages.find(
        (candidate) => candidate.name === pkg.name && candidate.version === pkg.version
      );

      if (existingPackage) {
        if (!existingPackage.noticeKey && pkg.noticeKey) {
          existingPackage.noticeKey = pkg.noticeKey;
        }
      } else {
        existing.packages.push({ ...pkg });
      }
    }

    if (!existing.text && vendoredGroup.text) {
      existing.text = vendoredGroup.text;
    }
  }

  for (const group of merged) {
    group.packages.sort(
      (a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) ||
        a.version.localeCompare(b.version)
    );
  }

  return merged;
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
