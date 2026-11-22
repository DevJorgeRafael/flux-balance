export const CATEGORY_TABLES_DDL = `
CREATE TABLE IF NOT EXISTS income_categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expense_categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export const CATEGORY_INDEXES_DDL = `
CREATE INDEX IF NOT EXISTS idx_income_categories_order ON income_categories(sort_order, name);
CREATE INDEX IF NOT EXISTS idx_expense_categories_order ON expense_categories(sort_order, name);
`;

export const SPLIT_INDEXES_DDL = `
CREATE INDEX IF NOT EXISTS idx_splits_tx ON transaction_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_splits_account ON transaction_splits(account_id);
CREATE INDEX IF NOT EXISTS idx_splits_category ON transaction_splits(category_id);
`;

export interface DefaultCategorySeed {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  is_default: number;
  sort_order: number;
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  // Ingresos
  { id: 'cat_inc_salary', name: 'Salario / Nómina', type: 'INCOME', icon: 'briefcase', color: '#2767B0', is_default: 1, sort_order: 0 },
  { id: 'cat_inc_freelance', name: 'Freelance / Honorarios', type: 'INCOME', icon: 'laptop', color: '#248987', is_default: 1, sort_order: 1 },
  { id: 'cat_inc_invest', name: 'Rendimientos / Inversión', type: 'INCOME', icon: 'trending-up', color: '#248950', is_default: 1, sort_order: 2 },
  { id: 'cat_inc_other', name: 'Otros Ingresos', type: 'INCOME', icon: 'plus-circle', color: '#2799B0', is_default: 1, sort_order: 3 },
  // Gastos
  { id: 'cat_exp_housing', name: 'Vivienda y Alquiler', type: 'EXPENSE', icon: 'home', color: '#B42222', is_default: 1, sort_order: 0 },
  { id: 'cat_exp_food', name: 'Alimentación y Supermercado', type: 'EXPENSE', icon: 'shopping-cart', color: '#B45D22', is_default: 1, sort_order: 1 },
  { id: 'cat_exp_services', name: 'Servicios Públicos', type: 'EXPENSE', icon: 'zap', color: '#B48322', is_default: 1, sort_order: 2 },
  { id: 'cat_exp_entertainment', name: 'Ocio y Entretenimiento', type: 'EXPENSE', icon: 'film', color: '#B42266', is_default: 1, sort_order: 3 },
  { id: 'cat_exp_transport', name: 'Transporte', type: 'EXPENSE', icon: 'car', color: '#B44922', is_default: 1, sort_order: 4 },
  { id: 'cat_exp_health', name: 'Salud y Farmacia', type: 'EXPENSE', icon: 'heart', color: '#B42244', is_default: 1, sort_order: 5 },
  { id: 'cat_exp_other', name: 'Otros Gastos', type: 'EXPENSE', icon: 'help-circle', color: '#B43622', is_default: 1, sort_order: 6 },
];
