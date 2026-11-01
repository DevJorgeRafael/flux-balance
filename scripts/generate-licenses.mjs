import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = join(root, 'package-lock.json');
const vendoredPath = join(root, 'src', 'constants', 'vendoredLicenses.json');
const outputPath = join(root, 'src', 'constants', 'thirdPartyLicenses.json');
const LICENSE_FILE_PATTERN = /^(licen[cs]e|copying)([.-].*)?$/i;
const COMBINED_LICENSE_PATTERN = /\b(?:AND|OR)\b|[()]/;
const NODE_MODULES_SEGMENT = 'node_modules/';

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const packageMap = new Map();

function normalizeLicense(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value.map(normalizeLicense).filter(Boolean).join(' OR ');
  }
  if (value && typeof value === 'object' && typeof value.type === 'string') {
    return value.type.trim();
  }
  return '';
}

function readDeclaredLicense(location) {
  try {
    const pkg = JSON.parse(readFileSync(join(root, location, 'package.json'), 'utf8'));
    return normalizeLicense(pkg.license) || normalizeLicense(pkg.licenses);
  } catch {
    return '';
  }
}

for (const [location, entry] of Object.entries(lock.packages ?? {})) {
  if (!location || entry.dev || entry.link || !entry.version) continue;

  const markerIndex = location.lastIndexOf(NODE_MODULES_SEGMENT);
  if (markerIndex < 0) continue;

  const name = entry.name ?? location.slice(markerIndex + NODE_MODULES_SEGMENT.length);
  if (!name) continue;

  const license = normalizeLicense(entry.license) || readDeclaredLicense(location);
  if (!license) continue;

  const key = `${name}\u0000${entry.version}\u0000${license}`;
  const existing = packageMap.get(key);
  const packagePath = join(root, location);

  if (existing) {
    if (!existing.paths.includes(packagePath)) existing.paths.push(packagePath);
  } else {
    packageMap.set(key, {
      name,
      version: entry.version,
      license,
      paths: [packagePath],
    });
  }
}

const packagesByLicense = new Map();

for (const pkg of packageMap.values()) {
  const list = packagesByLicense.get(pkg.license);
  if (list) list.push(pkg);
  else packagesByLicense.set(pkg.license, [pkg]);
}

for (const packages of packagesByLicense.values()) {
  packages.sort(
    (a, b) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) ||
      a.version.localeCompare(b.version)
  );
}

function isCombinedLicense(license) {
  return COMBINED_LICENSE_PATTERN.test(license);
}

function findLicenseFile(dir) {
  let entries;

  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  const files = entries
    .filter(
      (entry) =>
        (entry.isFile() || entry.isSymbolicLink()) && LICENSE_FILE_PATTERN.test(entry.name)
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'));

  return files.length > 0 ? join(dir, files[0]) : null;
}

function normalizeText(text) {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fromMarker(text, marker) {
  const index = text.search(marker);
  return index >= 0 ? text.slice(index).trim() : text.trim();
}

function canonicalizeLicenseText(license, rawText) {
  let text = normalizeText(rawText);

  if (license === 'MIT') {
    text = `MIT License\n\n${fromMarker(
      text,
      /Permission is hereby granted, free of charge/i
    )}`;
  } else if (license === 'ISC') {
    text = `ISC License\n\n${fromMarker(
      text,
      /Permission to use, copy, modify, and\/or distribute this software/i
    )}`;
  } else if (license === '0BSD') {
    text = `Zero-Clause BSD\n\n${fromMarker(
      text,
      /Permission to use, copy, modify, and\/or distribute this software/i
    )}`;
  } else if (license === 'BSD-2-Clause') {
    text = `BSD 2-Clause License\n\n${fromMarker(
      text,
      /Redistribution and use in source and binary forms/i
    )}`;
  } else if (license === 'BSD-3-Clause') {
    text = `BSD 3-Clause License\n\n${fromMarker(
      text,
      /Redistribution and use in source and binary forms/i
    )}`;
  } else if (license === 'Apache-2.0') {
    text = fromMarker(text, /Apache License\s+Version 2\.0/i);
    const endMarker = 'limitations under the License.';
    const end = text.lastIndexOf(endMarker);
    if (end >= 0) text = text.slice(0, end + endMarker.length);
  }

  return normalizeText(text);
}

function pickMostCommonText(texts) {
  const counts = new Map();

  for (const text of texts) {
    const key = text.replace(/\s+/g, ' ').trim();
    if (!key) continue;

    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { count: 1, text });
  }

  return (
    [...counts.values()].sort(
      (a, b) => b.count - a.count || a.text.length - b.text.length
    )[0]?.text ?? ''
  );
}

const fileTextCache = new Map();

function readLicenseText(file) {
  if (!fileTextCache.has(file)) {
    fileTextCache.set(file, normalizeText(readFileSync(file, 'utf8')));
  }

  return fileTextCache.get(file);
}

const groups = [];

for (const [license, packages] of packagesByLicense) {
  let text = '';

  if (!isCombinedLicense(license)) {
    const texts = [];

    for (const pkg of packages) {
      for (const dir of pkg.paths) {
        const file = findLicenseFile(dir);
        if (!file) continue;

        const canonical = canonicalizeLicenseText(license, readLicenseText(file));
        if (canonical) texts.push(canonical);
      }
    }

    text = pickMostCommonText(texts);
  }

  groups.push({
    license,
    text,
    packages: packages.map(({ name, version }) => ({ name, version })),
  });
}

const vendored = JSON.parse(readFileSync(vendoredPath, 'utf8'));

for (const vendoredGroup of vendored.groups ?? []) {
  let group = groups.find((candidate) => candidate.license === vendoredGroup.license);

  if (!group) {
    group = {
      license: vendoredGroup.license,
      text: vendoredGroup.text ?? '',
      packages: [],
    };
    groups.push(group);
  }

  for (const pkg of vendoredGroup.packages ?? []) {
    const existingPackage = group.packages.find(
      (candidate) => candidate.name === pkg.name && candidate.version === pkg.version
    );

    if (existingPackage) {
      if (!existingPackage.noticeKey && pkg.noticeKey) {
        existingPackage.noticeKey = pkg.noticeKey;
      }
    } else {
      group.packages.push({
        name: pkg.name,
        version: pkg.version,
        ...(pkg.noticeKey ? { noticeKey: pkg.noticeKey } : {}),
      });
    }
  }

  if (!group.text && vendoredGroup.text) group.text = vendoredGroup.text;
}

for (const group of groups) {
  group.packages.sort(
    (a, b) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) ||
      a.version.localeCompare(b.version)
  );
}

groups.sort(
  (a, b) =>
    b.packages.length - a.packages.length ||
    a.license.localeCompare(b.license, 'en', { sensitivity: 'base' })
);

const total = groups.reduce((sum, group) => sum + group.packages.length, 0);
const summary = { groups: groups.length, packages: total };
const combined = groups.filter((group) => isCombinedLicense(group.license)).length;
const missing = groups
  .filter((group) => !group.text && !isCombinedLicense(group.license))
  .map((group) => group.license);

writeFileSync(outputPath, `${JSON.stringify({ summary, groups }, null, 2)}\n`);

console.log(
  `Licencias: ${total} paquetes en ${groups.length} grupos (${combined} combinados) guardados en ${outputPath}`
);

if (missing.length > 0) {
  console.log(`Aviso: grupos sin texto: ${missing.join(', ')}`);
}
