import test from 'node:test';
import assert from 'node:assert/strict';
import { selectUpcomingReminders } from './reminder-upcoming.ts';

function reminder(overrides = {}) {
  return {
    id: 'rem-1',
    title: 'Pagar la luz',
    type: 'EXPENSE',
    recurrence: 'MONTHLY',
    time: '09:00',
    startDate: '2026-11-22',
    isArchived: false,
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
    ...overrides,
  };
}

test('devuelve solo los próximos recordatorios activos en orden', () => {
  const reminders = [
    reminder({ id: 'later', nextRunAt: '2026-12-01T09:00:00.000Z' }),
    reminder({ id: 'archived', isArchived: true, nextRunAt: '2026-11-21T09:00:00.000Z' }),
    reminder({ id: 'soon', nextRunAt: '2026-11-21T09:00:00.000Z' }),
  ];

  assert.deepEqual(
    selectUpcomingReminders(reminders, 2).map((item) => item.id),
    ['soon', 'later']
  );
});

test('coloca los recordatorios sin próximo aviso al final', () => {
  const reminders = [
    reminder({ id: 'none' }),
    reminder({ id: 'invalid', nextRunAt: 'no-es-fecha' }),
    reminder({ id: 'scheduled', nextRunAt: '2026-11-21T09:00:00.000Z' }),
  ];

  assert.deepEqual(
    selectUpcomingReminders(reminders, 3).map((item) => item.id),
    ['scheduled', 'none', 'invalid']
  );
});

test('respeta el límite y tolera valores inválidos', () => {
  const reminders = [
    reminder({ id: 'a', nextRunAt: '2026-11-21T09:00:00.000Z' }),
    reminder({ id: 'b', nextRunAt: '2026-11-22T09:00:00.000Z' }),
    reminder({ id: 'c', nextRunAt: '2026-11-23T09:00:00.000Z' }),
  ];

  assert.deepEqual(selectUpcomingReminders(reminders, 1).map((item) => item.id), ['a']);
  assert.deepEqual(selectUpcomingReminders(reminders, 0), []);
  assert.deepEqual(selectUpcomingReminders(reminders, -2), []);
});
