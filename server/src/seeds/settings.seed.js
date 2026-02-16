/**
 * Default settings for the ERP application
 */
const getSettingsData = () => {
  return {
    numbering: {
      invoice: {
        prefix: 'FA',
        currentSequence: 0,
        format: 'FA{YYYY}-{NNNNN}',
      },
      quote: {
        prefix: 'DE',
        currentSequence: 0,
        format: 'DE{YYYY}-{NNNNN}',
      },
      purchaseOrder: {
        prefix: 'BC',
        currentSequence: 0,
        format: 'BC{YYYY}-{NNNNN}',
      },
      deliveryNote: {
        prefix: 'BL',
        currentSequence: 0,
        format: 'BL{YYYY}-{NNNNN}',
      },
      creditNote: {
        prefix: 'AV',
        currentSequence: 0,
        format: 'AV{YYYY}-{NNNNN}',
      },
      payment: {
        prefix: 'PA',
        currentSequence: 0,
        format: 'PA{YYYY}-{NNNNN}',
      },
    },
    fiscalYear: {
      startMonth: 1,
      startDay: 1,
      currentYear: 2026,
    },
    general: {
      defaultPaymentTermDays: 30,
      defaultTvaRate: 18,
      currency: 'XOF',
      language: 'fr',
      timezone: 'Africa/Dakar',
      dateFormat: 'DD/MM/YYYY',
    },
    emailNotifications: {
      onInvoiceCreated: true,
      onPaymentReceived: true,
      onQuoteAccepted: true,
      onLowStock: true,
    },
  };
};

module.exports = getSettingsData;
