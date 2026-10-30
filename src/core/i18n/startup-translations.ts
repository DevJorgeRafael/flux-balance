export const startupTranslations = {
  es: {
    startupErrorTitle: 'No se pudo iniciar la app',
    startupErrorDatabaseMessage:
      'No pudimos abrir tu base de datos local. Tus datos no se han borrado. Reintenta; si el problema continúa, comparte un informe técnico.',
    startupErrorBoundaryTitle: 'La app encontró un problema',
    startupErrorBoundaryMessage:
      'Ocurrió un error inesperado. Puedes reintentar; si vuelve a pasar, comparte un informe técnico.',
    startupErrorRetry: 'Reintentar',
    startupErrorRetrying: 'Reintentando...',
    startupErrorShareReport: 'Compartir informe',
    startupErrorSharingReport: 'Preparando informe...',
    startupErrorReportHint:
      'El informe incluye la versión, la plataforma y el error; no incluye cuentas, movimientos ni montos.',
    startupErrorReportDialogTitle: 'Compartir informe técnico',
    startupErrorReportUnavailable: 'Compartir no está disponible en este dispositivo.',
    startupErrorReportFailed: 'No se pudo generar el informe técnico.',
    errorReportTitle: 'Informe técnico de Flux Balance',
    errorReportGeneratedAt: 'Generado',
    errorReportAppVersion: 'Versión de la app',
    errorReportPlatform: 'Plataforma',
    errorReportError: 'Error',
    errorReportNoMessage: 'Sin mensaje',
    errorReportUnknownError: 'Error desconocido',
  },
  en: {
    startupErrorTitle: 'The app could not start',
    startupErrorDatabaseMessage:
      'We could not open your local database. Your data has not been deleted. Try again; if the problem persists, share a technical report.',
    startupErrorBoundaryTitle: 'The app hit a problem',
    startupErrorBoundaryMessage:
      'An unexpected error occurred. You can try again; if it happens again, share a technical report.',
    startupErrorRetry: 'Try again',
    startupErrorRetrying: 'Trying again...',
    startupErrorShareReport: 'Share report',
    startupErrorSharingReport: 'Preparing report...',
    startupErrorReportHint:
      'The report includes the version, platform, and error; it does not include accounts, movements, or amounts.',
    startupErrorReportDialogTitle: 'Share technical report',
    startupErrorReportUnavailable: 'Sharing is not available on this device.',
    startupErrorReportFailed: 'The technical report could not be generated.',
    errorReportTitle: 'Flux Balance technical report',
    errorReportGeneratedAt: 'Generated',
    errorReportAppVersion: 'App version',
    errorReportPlatform: 'Platform',
    errorReportError: 'Error',
    errorReportNoMessage: 'No message',
    errorReportUnknownError: 'Unknown error',
  },
} as const;
