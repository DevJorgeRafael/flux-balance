import { Directory, File, Paths } from 'expo-file-system';

import { isExportCacheFileName } from '@/core/services/exportCachePolicy';

export function deleteCachedFile(file: File): void {
  try {
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Si el archivo ya no existe o no se puede borrar, no bloqueamos el flujo.
  }
}

export function cleanupExportCache(): void {
  try {
    const cache = new Directory(Paths.cache);
    if (!cache.exists) return;

    for (const entry of cache.list()) {
      if (entry instanceof File && isExportCacheFileName(entry.name)) {
        deleteCachedFile(entry);
      }
    }

    const sharingStaging = new Directory(Paths.cache, 'expo-sharing-tmp');
    if (sharingStaging.exists) {
      sharingStaging.delete();
    }
  } catch {
    // La limpieza es best-effort y no debe romper el arranque.
  }
}
