import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src/app', 'src/components'];
const files = [];

function collect(path) {
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    if (statSync(full).isDirectory()) collect(full);
    else if (full.endsWith('.tsx')) files.push(full);
  }
}
for (const root of roots) collect(root);

const violations = [];

function multiButtonAlerts(source, file) {
  let from = 0;
  while (true) {
    const start = source.indexOf('appAlert({', from);
    if (start < 0) break;
    const buttons = source.indexOf('buttons: [', start);
    if (buttons < 0 || buttons - start > 1200) {
      from = start + 1;
      continue;
    }
    let depth = 0;
    let end = buttons;
    for (; end < source.length; end += 1) {
      if (source[end] === '[') depth += 1;
      if (source[end] === ']') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const block = source.slice(buttons, end + 1);
    const count = (block.match(/text:/g) ?? []).length;
    if (count >= 2) {
      violations.push(`${file}: appAlert con ${count} botones (usar appConfirm)`);
    }
    from = end + 1;
  }
}

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  multiButtonAlerts(source, file);
  if (/placeholder[^\n]*YYYY-MM-DD/.test(source)) {
    violations.push(`${file}: placeholder con YYYY-MM-DD (usar DatePicker)`);
  }
}

if (violations.length > 0) {
  console.error(`Reglas de UI violadas (${violations.length}):`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log('Reglas de UI: sin violaciones.');
}
