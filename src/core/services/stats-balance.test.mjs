import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBalanceStats } from './stats-balance.ts';

const CREATED = new Date(2026, 0, 1, 9).toISOString();
const ON = (day, month = 9, year = 2026) => new Date(year, month, day, 12).toISOString();

function account({
  id = 'a',
  balance = 0,
  createdAt = CREATED,
  fixedTermDeposits,
} = {}) {
  return {
    id,
    name: `Cuenta ${id}`,
    type: 'CHECKING',
    balance,
    currency: 'ARS',
    isArchived: false,
    createdAt,
    updatedAt: createdAt,
    fixedTermDeposits,
  };
}

function split(accountId, amount) {
  return {
    id: `sp-${accountId}-${amount}`,
    transactionId: 'tx',
    accountId,
    categoryId: 'cat',
    amount,
  };
}

function transaction({ id = 'tx', type = 'EXPENSE', date = ON(1), splits } = {}) {
  const resolvedSplits = splits ?? [split('a', 100)];

  return {
    id,
    type,
    totalAmount: resolvedSplits.reduce((sum, item) => sum + item.amount, 0),
    date,
    createdAt: date,
    splits: resolvedSplits,
  };
}

function build(options) {
  return buildBalanceStats({ year: 2026, monthIndex: 9, ...options });
}

test('reconstruye el saldo diario desde el saldo actual y los movimientos del mes', () => {
  const stats = build({
    accounts: [account({ balance: 1000 })],
    transactions: [
      transaction({
        id: 'september-income',
        type: 'INCOME',
        date: ON(20, 8),
        splits: [split('a', 200)],
      }),
      transaction({ id: 'october-2', date: ON(2), splits: [split('a', 100)] }),
      transaction({
        id: 'october-5',
        type: 'INCOME',
        date: ON(5),
        splits: [split('a', 300)],
      }),
      transaction({ id: 'october-10', date: ON(10), splits: [split('a', 50)] }),
    ],
  });

  assert.equal(stats.points.length, 31);
  assert.equal(stats.startBalance, 850);
  assert.equal(stats.points[1].balance, 750);
  assert.equal(stats.points[4].balance, 1050);
  assert.equal(stats.points[9].balance, 1000);
  assert.equal(stats.endBalance, 1000);
  assert.equal(stats.change, 150);
  assert.equal(stats.minBalance, 750);
  assert.equal(stats.maxBalance, 1050);
});

test('filtra por cuenta y suma todas las cuentas', () => {
  const accounts = [
    account({ id: 'a', balance: 500 }),
    account({ id: 'b', balance: 300 }),
  ];
  const transactions = [
    transaction({ id: 'a-expense', date: ON(2), splits: [split('a', 100)] }),
    transaction({
      id: 'b-income',
      type: 'INCOME',
      date: ON(3),
      splits: [split('b', 100)],
    }),
  ];

  const all = build({ accounts, transactions });
  assert.equal(all.startBalance, 800);
  assert.equal(all.points[1].balance, 700);
  assert.equal(all.points[2].balance, 800);
  assert.equal(all.endBalance, 800);

  const onlyA = build({ accounts, transactions, accountId: 'a' });
  assert.equal(onlyA.startBalance, 600);
  assert.equal(onlyA.points[1].balance, 500);
  assert.equal(onlyA.endBalance, 500);

  const onlyB = build({ accounts, transactions, accountId: 'b' });
  assert.equal(onlyB.startBalance, 200);
  assert.equal(onlyB.points[2].balance, 300);
  assert.equal(onlyB.endBalance, 300);

  assert.deepEqual(build({ accounts, transactions, accountId: 'missing' }), {
    points: [],
    startBalance: 0,
    endBalance: 0,
    change: 0,
    minBalance: 0,
    maxBalance: 0,
  });
});

test('incluye el principal de los depósitos a plazo en su fecha de creación', () => {
  const stats = build({
    accounts: [
      account({
        balance: 1500,
        fixedTermDeposits: [
          {
            id: 'deposit',
            accountId: 'a',
            principalAmount: 500,
            annualRate: 0.08,
            termMonths: 3,
            startDate: '2026-10-05',
            maturityDate: '2027-01-05',
            status: 'ACTIVE',
            createdAt: ON(5),
          },
        ],
      }),
    ],
    transactions: [],
  });

  assert.equal(stats.startBalance, 1000);
  assert.equal(stats.points[4].balance, 1500);
  assert.equal(stats.endBalance, 1500);
  assert.equal(stats.change, 500);
});

test('no muestra saldo en los meses anteriores a la creación de la cuenta', () => {
  const createdInOctober = account({ balance: 200, createdAt: ON(15) });

  const september = build({
    accounts: [createdInOctober],
    transactions: [],
    monthIndex: 8,
  });
  assert.equal(september.startBalance, 0);
  assert.equal(september.endBalance, 0);
  assert.equal(september.points.every((point) => point.balance === 0), true);

  const october = build({ accounts: [createdInOctober], transactions: [] });
  assert.equal(october.startBalance, 0);
  assert.equal(october.points[14].balance, 200);
  assert.equal(october.endBalance, 200);
});

test('soporta saldos negativos', () => {
  const stats = build({
    accounts: [account({ balance: -50 })],
    transactions: [transaction({ date: ON(2), splits: [split('a', 50)] })],
  });

  assert.equal(stats.startBalance, 0);
  assert.equal(stats.points[1].balance, -50);
  assert.equal(stats.endBalance, -50);
  assert.equal(stats.change, -50);
  assert.equal(stats.minBalance, -50);
  assert.equal(stats.maxBalance, 0);
});

test('recorta el mes en curso en endDay', () => {
  const stats = build({
    accounts: [account({ balance: 900 })],
    transactions: [transaction({ date: ON(20), splits: [split('a', 100)] })],
    endDay: 15,
  });

  assert.equal(stats.points.length, 15);
  assert.equal(stats.startBalance, 1000);
  assert.equal(stats.endBalance, 1000);
  assert.equal(stats.change, 0);
});

test('ignora transferencias, fechas inválidas y montos no finitos', () => {
  const stats = build({
    accounts: [account({ balance: 100 })],
    transactions: [
      transaction({ id: 'transfer', type: 'TRANSFER', date: ON(2), splits: [split('a', 999)] }),
      transaction({ id: 'invalid-date', date: 'no-es-fecha', splits: [split('a', 999)] }),
      transaction({
        id: 'invalid-amount',
        date: ON(3),
        splits: [split('a', Number.NaN)],
      }),
      transaction({ id: 'valid', date: ON(4), splits: [split('a', 30)] }),
    ],
  });

  assert.equal(stats.startBalance, 130);
  assert.equal(stats.points[3].balance, 100);
  assert.equal(stats.endBalance, 100);
  assert.equal(stats.change, -30);
});
