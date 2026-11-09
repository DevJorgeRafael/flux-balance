import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReminderNotificationPlan,
  IOS_REMINDER_NOTIFICATION_LIMIT,
  reminderNotificationId,
} from './reminder-notification-plan.ts';
import { syncReminderNotifications } from './reminder-notification-sync.ts';

const NOW = new Date(2026, 0, 1, 8, 0, 0, 0);

function localDate(monthIndex, day, hours = 9, minutes = 0) {
  return new Date(2026, monthIndex, day, hours, minutes, 0, 0);
}

function makeReminder(overrides = {}) {
  return {
    id: 'rem-1',
    title: 'Pago de luz',
    type: 'EXPENSE',
    description: null,
    amount: null,
    accountId: null,
    categoryId: null,
    recurrence: 'DAILY',
    time: '09:00',
    startDate: '2026-01-01',
    nextRunAt: localDate(0, 1).toISOString(),
    isArchived: false,
    lastNotifiedAt: null,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

function contentFor(reminder) {
  return { title: reminder.title, body: `Body ${reminder.id}` };
}

test('planifica la ventana, respeta ONCE y cancela notificaciones vencidas', () => {
  const daily = makeReminder();
  const once = makeReminder({
    id: 'rem-once',
    recurrence: 'ONCE',
    startDate: '2026-01-05',
  });
  const oldIdentifier = reminderNotificationId(
    'rem-old',
    localDate(0, 1).toISOString()
  );
  const existingDaily = reminderNotificationId(
    daily.id,
    localDate(0, 1).toISOString()
  );

  const plan = buildReminderNotificationPlan({
    reminders: [daily, once],
    scheduledIdentifiers: [
      oldIdentifier,
      existingDaily,
      reminderNotificationId(once.id, localDate(0, 4).toISOString()),
    ],
    now: NOW,
    contentFor,
  });

  assert.deepEqual(plan.toCancel, [
    oldIdentifier,
    reminderNotificationId(once.id, localDate(0, 4).toISOString()),
  ]);
  assert.equal(plan.toSchedule.length, 10);
  assert.equal(
    plan.toSchedule.filter((request) => request.reminderId === daily.id).length,
    9
  );
  assert.equal(
    plan.toSchedule.filter((request) => request.reminderId === once.id).length,
    1
  );
  assert.equal(
    plan.toSchedule.find((request) => request.reminderId === once.id)
      ?.scheduledFor,
    localDate(0, 5).toISOString()
  );
  assert.equal(plan.toSchedule[0].title, 'Pago de luz');
  assert.equal(plan.toSchedule[0].body, 'Body rem-1');
});

test('el límite de iOS conserva las ocurrencias más próximas', () => {
  const reminders = Array.from({ length: 7 }, (_, index) =>
    makeReminder({ id: `rem-${index}` })
  );

  const plan = buildReminderNotificationPlan({
    reminders,
    scheduledIdentifiers: [],
    now: NOW,
    contentFor,
    maxScheduled: IOS_REMINDER_NOTIFICATION_LIMIT,
  });

  assert.equal(plan.toSchedule.length, IOS_REMINDER_NOTIFICATION_LIMIT);
  assert.equal(
    plan.toSchedule[0].scheduledFor,
    localDate(0, 1).toISOString()
  );
  assert.equal(
    plan.toSchedule.some(
      (request) => request.scheduledFor === localDate(0, 10).toISOString()
    ),
    false
  );
});

test('un recordatorio archivado cancela su agenda pendiente', () => {
  const reminder = makeReminder({ isArchived: true });
  const identifier = reminderNotificationId(
    reminder.id,
    localDate(0, 1).toISOString()
  );

  const plan = buildReminderNotificationPlan({
    reminders: [reminder],
    scheduledIdentifiers: [identifier, 'other-app:1'],
    now: NOW,
    contentFor,
  });

  assert.deepEqual(plan.toCancel, [identifier]);
  assert.deepEqual(plan.toSchedule, []);
});

test('forzar un recordatorio lo cancela y reprograma con el contenido nuevo', () => {
  const reminder = makeReminder({ title: 'Título nuevo' });
  const identifier = reminderNotificationId(
    reminder.id,
    localDate(0, 1).toISOString()
  );

  const plan = buildReminderNotificationPlan({
    reminders: [reminder],
    scheduledIdentifiers: [identifier],
    now: NOW,
    contentFor,
    forceReminderIds: [reminder.id],
  });

  assert.ok(plan.toCancel.includes(identifier));
  assert.ok(plan.toSchedule.some((request) => request.identifier === identifier));
});

test('la sincronización cancela antes de programar y devuelve el plan', async () => {
  const reminder = makeReminder();
  const stale = reminderNotificationId('rem-old', NOW.toISOString());
  const calls = [];

  const gateway = {
    async getScheduledReminderIdentifiers() {
      calls.push('get');
      return [stale];
    },
    async cancel(identifier) {
      calls.push(`cancel:${identifier}`);
    },
    async schedule(request) {
      calls.push(`schedule:${request.identifier}`);
    },
  };

  const plan = await syncReminderNotifications({
    gateway,
    reminders: [reminder],
    now: NOW,
    contentFor,
  });

  assert.equal(calls[0], 'get');
  assert.equal(calls[1], `cancel:${stale}`);
  assert.equal(calls.filter((call) => call.startsWith('schedule:')).length, 10);
  assert.deepEqual(plan.toCancel, [stale]);
  assert.equal(plan.toSchedule.length, 10);
});

test('la sincronización cancela todas las notificaciones de un recordatorio eliminado', async () => {
  const deletedId = 'rem-borrado';
  const first = reminderNotificationId(
    deletedId,
    localDate(0, 1).toISOString()
  );
  const second = reminderNotificationId(
    deletedId,
    localDate(0, 2).toISOString()
  );
  const calls = [];

  const gateway = {
    async getScheduledReminderIdentifiers() {
      calls.push('get');
      return [first, second];
    },
    async cancel(identifier) {
      calls.push(`cancel:${identifier}`);
    },
    async schedule(request) {
      calls.push(`schedule:${request.identifier}`);
    },
  };

  const plan = await syncReminderNotifications({
    gateway,
    reminders: [],
    now: NOW,
    contentFor,
    forceReminderIds: [deletedId],
  });

  assert.deepEqual(plan.toCancel, [first, second]);
  assert.deepEqual(plan.toSchedule, []);
  assert.deepEqual(calls, ['get', `cancel:${first}`, `cancel:${second}`]);
  assert.equal(calls.some((call) => call.startsWith('schedule:')), false);
});
