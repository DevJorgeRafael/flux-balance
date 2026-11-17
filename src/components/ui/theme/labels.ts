export interface Labels {
  close: string;
  cancel: string;
  confirm: string;
  loading: string;
  loadingMore: string;
  noResultsTitle: string;
  noResultsDescription: string;
  search: string;
  selectPlaceholder: string;
  /** Nombres de los meses, de enero a diciembre. */
  months: string[];
  /** Iniciales de los días, índice 0 = domingo (alinea con `Date.getDay()`). */
  weekdaysShort: string[];
  selectDate: string;
  clear: string;
  /** DatePicker: botón del mes anterior. */
  previousMonth: string;
  /** DatePicker: botón del mes siguiente. */
  nextMonth: string;
  /** TimePicker: etiqueta de la rueda de horas. */
  timeHour: string;
  /** TimePicker: etiqueta de la rueda de minutos. */
  timeMinute: string;
  /** TimePicker: periodo AM en formato de 12 horas. */
  am: string;
  /** TimePicker: periodo PM en formato de 12 horas. */
  pm: string;
  /** TimePicker: texto cuando todavía no hay una hora seleccionada. */
  timeUnselected: string;
}

export const defaultLabels: Labels = {
  close: 'Close',
  cancel: 'Cancel',
  confirm: 'OK',
  loading: 'Loading...',
  loadingMore: 'Loading more...',
  noResultsTitle: 'No results found',
  noResultsDescription: 'Try a different search term',
  search: 'Search...',
  selectPlaceholder: 'Select...',
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  weekdaysShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  selectDate: 'Select date',
  clear: 'Clear',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  timeHour: 'Hour',
  timeMinute: 'Minute',
  am: 'AM',
  pm: 'PM',
  timeUnselected: 'Not selected',
};
