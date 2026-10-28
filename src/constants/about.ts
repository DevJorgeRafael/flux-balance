// La versión y el nombre se leen en tiempo de ejecución con expo-constants
// (Constants.expoConfig). El build sale de Constants.platform y, cuando es
// null (Expo Go), del valor configurado en app.json.

/** Enlace público del repositorio del proyecto. */
export const REPO_URL = 'https://github.com/DevJorgeRafael/flux-balance';

/** Enlace directo al archivo LICENSE del repositorio. */
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

/** Autor que aparece en la licencia y en la sección Acerca de. */
export const AUTHOR_NAME = 'Jorge Rafael Rosero';

/** Enlace de apoyo (Ko-fi). Si queda vacío, la fila de apoyo no se muestra. */
export const SUPPORT_URL = 'https://ko-fi.com/devjorgerafael';

/** Enlace de la política de privacidad. Si queda vacío, la fila no se muestra. */
export const PRIVACY_URL = '';

/** Interruptor general de la sección de apoyo. */
export const SHOW_DONATION = true;

/** El apoyo solo se muestra con la donación activa y una URL configurada. */
export function isSupportVisible(showDonation: boolean, supportUrl: string): boolean {
  return showDonation && supportUrl.trim().length > 0;
}
