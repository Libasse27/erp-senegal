const APP_CONFIG = {
  APP_NAME: 'ERP Senegal',
  APP_DESCRIPTION: 'ERP Commercial & Comptable pour PME/TPE au Senegal',
  VERSION: '1.0.0',

  // Currency
  CURRENCY: 'XOF',
  CURRENCY_SYMBOL: 'FCFA',
  LOCALE: 'fr-FR',
  TIMEZONE: 'Africa/Dakar',

  // Fiscal
  TVA_RATE: 18,
  ACCOUNTING_STANDARD: 'SYSCOHADA',

  // Pagination
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],

  // Date format
  DATE_FORMAT: 'dd/MM/yyyy',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',

  // File upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf', 'application/msword', 'text/csv'],
};

export default APP_CONFIG;
