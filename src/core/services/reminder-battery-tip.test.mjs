import test from 'node:test';
import assert from 'node:assert/strict';

import { isReminderBatteryTipVisible } from './reminder-battery-tip.ts';

test('la nota genérica solo aparece con recordatorios activos', () => {
  assert.equal(isReminderBatteryTipVisible(0, false), false);
  assert.equal(isReminderBatteryTipVisible(1, false), true);
});

test('la nota genérica se oculta al pulsar Entendido', () => {
  assert.equal(isReminderBatteryTipVisible(1, true), false);
});
