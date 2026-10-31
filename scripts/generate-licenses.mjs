import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = join(root, 'src', 'constants', 'thirdPartyLicenses.json');
const LICENSE_FILE_PATTERN = /^(licen[cs]e|copying)([.-].*)?$/i;
const COMBINED_LICENSE_PATTERN = /\b(?:AND|OR)\b|[()]/;

// pnpm es la fuente de verdad del árbol instalado. --production (alias de
// --prod) deja fuera las devDependencies y conserva las transitivas.
const raw = execSync('pnpm licenses list --production --json', {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

const grouped = JSON.parse(raw);
const packageMap = new Map();

for (const [groupLicense, entries] of Object.entries(grouped)) {
  for (const entry of entries) {
    const versions =
      Array.isArray(entry.versions) && entry.versions.length > 0 ? entry.versions : [''];
    const paths = Array.isArray(entry.paths) ? entry.paths : [];
    const license = entry.license ?? groupLicense;

    for (const version of versions) {
      const key = `${entry.name}\u0000${version}\u0000${license}`;
      const existing = packageMap.get(key);

      if (existing) {
        for (const path of paths) {
          if (!existing.paths.includes(path)) existing.paths.push(path);
        }
      } else {
        packageMap.set(key, { name: entry.name, version, license, paths: [...paths] });
      }
    }
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

groups.sort(
  (a, b) =>
    b.packages.length - a.packages.length ||
    a.license.localeCompare(b.license, 'en', { sensitivity: 'base' })
);

const total = groups.reduce((sum, group) => sum + group.packages.length, 0);
const combined = groups.filter((group) => isCombinedLicense(group.license)).length;
const missing = groups
  .filter((group) => !group.text && !isCombinedLicense(group.license))
  .map((group) => group.license);

writeFileSync(outputPath, `${JSON.stringify({ groups }, null, 2)}\n`);

console.log(
  `Licencias: ${total} paquetes en ${groups.length} grupos (${combined} combinados) guardados en ${outputPath}`
);

if (missing.length > 0) {
  console.log(`Aviso: grupos sin texto: ${missing.join(', ')}`);
}
