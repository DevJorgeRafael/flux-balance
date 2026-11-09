# Migraciones de base de datos

Flux Balance usa SQLite (expo-sqlite). Las migraciones son funciones SQL versionadas que se ejecutan en orden al abrir la base de datos.

## Versión de esquema

- La versión se guarda con `PRAGMA user_version` (entero dentro del archivo de la base).
- `user_version = 0` significa base sin versionar. La última versión es 3.
- Cada migración sube la versión en una unidad.

## Versiones

| Versión | Archivo | Contenido |
|---|---|---|
| 1 | `migrations/001_baseline.ts` | Esquema actual: `accounts`, `fixed_term_deposits`, categorías, `transactions`, `transaction_splits`, índices y migración legacy de categorías. |
| 2 | `migrations/002_app_settings.ts` | Crea `app_settings`. Reemplaza la creación perezosa en `appSettings.ts`. |
| 3 | `migrations/003_reminders.ts` | Crea `reminders` con sus CHECK, FK a `accounts` y los índices `idx_reminders_due`, `idx_reminders_account` e `idx_reminders_category`. |

`categories_backup_v1` no tiene versión propia. Lo crea la migración 1 solo si existe la tabla legacy `categories`.

## Reglas

1. **Solo se agrega.** Nunca se edita una migración que ya se publicó. Un error se corrige con una migración nueva.
2. **Sin `down`.** En el teléfono del usuario no hay forma práctica de revertir. Si algo sale mal, se corrige hacia adelante.
3. **Cada migración corre en una transacción exclusiva.** `PRAGMA user_version` se actualiza dentro de la misma transacción, así que si falla, la versión no cambia y la base queda como antes.
4. **La migración 1 debe ser idempotente.** Instalaciones existentes tienen versión 0 y tablas ya creadas, así que todo debe usar `IF NOT EXISTS` o guardas equivalentes.
5. **Reconstrucciones de tabla** (como `transaction_splits`) requieren `PRAGMA foreign_keys = OFF`. Esa instrucción no tiene efecto dentro de una transacción, así que estas migraciones deben ejecutarse con la conexión fuera de transacción y reactivar las claves al final. La migración 3 solo crea una tabla nueva, así que no necesita desactivar las claves foráneas.
6. **Un solo punto de entrada.** `getDatabase()` llama a `runMigrations()` antes de devolver la conexión. Si una migración falla, se lanza un error y la app no sigue con una base a medias.
7. **Check de claves foráneas.** Después de migrar, `foreign_key_check` advierte por consola si hay filas inválidas y no bloquea el arranque. Nunca borra ni repara datos automáticamente.
8. **Cada migración actualiza `documentation/db/schema.dbml`** en el mismo commit.
9. **El formato del respaldo es independiente.** `BACKUP_SCHEMA_VERSION` solo cambia cuando cambia el JSON o Excel exportado. Al importar, el código mapea desde la versión del respaldo al esquema actual.

> Nota de implementación: la política del punto 7 se decidió al implementar el runner. Lanzar un error por filas huérfanas bloqueaba el arranque de la app en bases con datos inconsistentes; advertir por consola permite abrirla sin reparar ni borrar datos automáticamente.

## Limitaciones conocidas

- Los recordatorios no se incluyen en el respaldo JSON/Excel en esta fase. Al importar un respaldo, las referencias `account_id` y `category_id` de los recordatorios existentes se limpian, pero los recordatorios se conservan.
- `category_id` no tiene FK porque apunta a `income_categories` o `expense_categories` según `type`. La validación y la limpieza al borrar categorías se hacen en el repositorio y en `categoryManagement.ts`.

## Estructura

```
src/infrastructure/database/
  migrations/
    001_baseline.ts
    002_app_settings.ts
    003_reminders.ts
    index.ts        # lista ordenada de migraciones
  migrationRunner.ts
```

Cada migración exporta:

```ts
export const migration = {
  version: 2,
  name: 'app_settings',
  up: async (txn) => { /* SQL */ },
};
```

## Pruebas mínimas

- Instalación nueva: termina en la última versión.
- Base versión 0 con datos del esquema actual: migra sin perder filas.
- Base con tabla legacy `categories`: migra y crea `categories_backup_v1`.
- Migración que falla a propósito: `user_version` no cambia.
- Base con filas huérfanas: `runMigrations` advierte por consola y no bloquea el arranque.
- Migración 3: instalación nueva y base en versión 2 terminan en 3 con `reminders`, sus índices y la FK `account_id` con `ON DELETE SET NULL`.