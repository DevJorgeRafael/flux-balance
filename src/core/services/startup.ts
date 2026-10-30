export interface StartupDependencies<T> {
  cleanup: () => void;
  initialize: () => Promise<unknown>;
  loadPreferences: () => Promise<T>;
}

export type StartupResult<T> =
  | { ok: true; preferences: T }
  | { ok: false; error: Error };

export function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    return new Error(value);
  }
  return new Error('Unknown error');
}

export async function runStartup<T>({
  cleanup,
  initialize,
  loadPreferences,
}: StartupDependencies<T>): Promise<StartupResult<T>> {
  try {
    cleanup();
  } catch {
    // La limpieza de caché nunca debe impedir que arranque la app.
  }

  try {
    await initialize();
  } catch (error) {
    return { ok: false, error: toError(error) };
  }

  try {
    const preferences = await loadPreferences();
    return { ok: true, preferences };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}
