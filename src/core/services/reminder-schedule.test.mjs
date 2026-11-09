import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidReminderDate,
  isValidReminderTime,
  nextReminderOccurrence,
  nextReminderRunAt,
} from './reminder-schedule.ts';

const MONTHLY_31 = {
  recurrence: 'MONTHLY',
  time: '09:00',
  startDate: '2026-01-31',
};

function localDate(year, monthIndex, day, hours = 9, minutes = 0) {
  return new Date(year, monthIndex, day, hours, minutes, 0, 0);
}

test('mensual conserva el día ancla cuando el mes no lo tiene', () => {
  const january = nextReminderOccurrence(MONTHLY_31, localDate(2026, 0, 1, 8));
  assert.equal(january.getMonth(), 0);
  assert.equal(january.getDate(), 31);

  const february = nextReminderOccurrence(
    MONTHLY_31,
    localDate(2026, 0, 31, 9)
  );
  assert.equal(february.getMonth(), 1);
  assert.equal(february.getDate(), 28);

  const march = nextReminderOccurrence(
    MONTHLY_31,
    localDate(2026, 1, 28, 9)
  );
  assert.equal(march.getMonth(), 2);
  assert.equal(march.getDate(), 31);

  const april = nextReminderOccurrence(MONTHLY_31, localDate(2026, 2, 31, 9));
  assert.equal(april.getMonth(), 3);
  assert.equal(april.getDate(), 30);
});

test('mensual usa el 29 de febrero en años bisiestos', () => {
  const leapYear = {
    recurrence: 'MONTHLY',
    time: '09:00',
    startDate: '2024-01-31',
  };

  const february = nextReminderOccurrence(
    leapYear,
    localDate(2024, 0, 31, 9)
  );
  assert.equal(february.getMonth(), 1);
  assert.equal(february.getDate(), 29);

  const march = nextReminderOccurrence(leapYear, localDate(2024, 1, 29, 9));
  assert.equal(march.getMonth(), 2);
  assert.equal(march.getDate(), 31);
});

test('mensual no arrastra el día ajustado cuando el ancla es el 30', () => {
  const schedule = {
    recurrence: 'MONTHLY',
    time: '09:00',
    startDate: '2026-01-30',
  };

  const february = nextReminderOccurrence(
    schedule,
    localDate(2026, 0, 30, 9)
  );
  assert.equal(february.getMonth(), 1);
  assert.equal(february.getDate(), 28);

  const march = nextReminderOccurrence(schedule, localDate(2026, 1, 28, 9));
  assert.equal(march.getMonth(), 2);
  assert.equal(march.getDate(), 30);
});

test('la primera ocurrencia respeta una fecha de inicio futura', () => {
  const schedule = {
    recurrence: 'MONTHLY',
    time: '18:30',
    startDate: '2026-05-10',
  };

  const first = nextReminderOccurrence(schedule, localDate(2026, 0, 1, 8));
  assert.equal(first.getMonth(), 4);
  assert.equal(first.getDate(), 10);
  assert.equal(first.getHours(), 18);
  assert.equal(first.getMinutes(), 30);
});

test('ONCE devuelve la fecha solo si todavía no pasó', () => {
  const schedule = {
    recurrence: 'ONCE',
    time: '09:00',
    startDate: '2026-01-31',
  };

  const future = nextReminderOccurrence(schedule, localDate(2026, 0, 1, 8));
  assert.equal(future.getDate(), 31);

  const past = nextReminderOccurrence(schedule, localDate(2026, 1, 1, 8));
  assert.equal(past, null);
});

test('DAILY y WEEKLY avanzan en calendario local', () => {
  const daily = {
    recurrence: 'DAILY',
    time: '08:00',
    startDate: '2026-01-01',
  };
  const weekly = {
    recurrence: 'WEEKLY',
    time: '08:00',
    startDate: '2026-01-01',
  };

  const tomorrow = nextReminderOccurrence(daily, localDate(2026, 0, 1, 8));
  assert.equal(tomorrow.getDate(), 2);

  const nextWeek = nextReminderOccurrence(weekly, localDate(2026, 0, 1, 8));
  assert.equal(nextWeek.getDate(), 8);
});

test('valida fechas y horas reales', () => {
  assert.equal(isValidReminderDate('2026-02-28'), true);
  assert.equal(isValidReminderDate('2026-02-30'), false);
  assert.equal(isValidReminderDate('2026-13-01'), false);
  assert.equal(isValidReminderTime('00:00'), true);
  assert.equal(isValidReminderTime('23:59'), true);
  assert.equal(isValidReminderTime('24:00'), false);
  assert.equal(isValidReminderTime('9:00'), false);
});

test('nextReminderRunAt devuelve ISO UTC', () => {
  const runAt = nextReminderRunAt(MONTHLY_31, localDate(2026, 0, 1, 8));
  assert.equal(runAt, localDate(2026, 0, 31, 9).toISOString());
});
