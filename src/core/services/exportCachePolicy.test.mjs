import test from 'node:test';
import assert from 'node:assert/strict';

import { isExportCacheFileName } from './exportCachePolicy.ts';

test('reconoce las exportaciones JSON y XLSX de Flux Balance', () => {
  assert.equal(isExportCacheFileName('flux-balance-backup-2026-10-30.json'), true);
  assert.equal(isExportCacheFileName('flux-balance-backup-2026-10-30.xlsx'), true);
});

test('reconoce los informes técnicos de error', () => {
  assert.equal(isExportCacheFileName('flux-balance-error-report-1761868800000.txt'), true);
  assert.equal(
    isExportCacheFileName('flux-balance-error-report-2026-10-30T12.00.00.txt'),
    true
  );
});

test('no toca archivos ajenos ni nombres incompletos', () => {
  assert.equal(isExportCacheFileName('notes.txt'), false);
  assert.equal(isExportCacheFileName('flux-balance-backup-2026-10-30.json.bak'), false);
  assert.equal(isExportCacheFileName('flux-balance-backup-2026-1-2.json'), false);
  assert.equal(isExportCacheFileName('flux-balance-error-report.txt'), false);
  assert.equal(isExportCacheFileName('otra-app-error-report-1.txt'), false);
});
