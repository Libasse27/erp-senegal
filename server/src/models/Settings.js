const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Numerotation des documents
    numbering: {
      invoice: {
        prefix: { type: String, default: 'FA' },
        currentSequence: { type: Number, default: 0 },
        format: { type: String, default: 'FA-{YYYY}-{SEQ}' },
      },
      quote: {
        prefix: { type: String, default: 'DE' },
        currentSequence: { type: Number, default: 0 },
        format: { type: String, default: 'DE-{YYYY}-{SEQ}' },
      },
      purchaseOrder: {
        prefix: { type: String, default: 'BC' },
        currentSequence: { type: Number, default: 0 },
        format: { type: String, default: 'BC-{YYYY}-{SEQ}' },
      },
      deliveryNote: {
        prefix: { type: String, default: 'BL' },
        currentSequence: { type: Number, default: 0 },
        format: { type: String, default: 'BL-{YYYY}-{SEQ}' },
      },
      creditNote: {
        prefix: { type: String, default: 'AV' },
        currentSequence: { type: Number, default: 0 },
        format: { type: String, default: 'AV-{YYYY}-{SEQ}' },
      },
      payment: {
        prefix: { type: String, default: 'PA' },
        currentSequence: { type: Number, default: 0 },
        format: { type: String, default: 'PA-{YYYY}-{SEQ}' },
      },
    },

    // Exercice fiscal
    fiscalYear: {
      startMonth: { type: Number, default: 1, min: 1, max: 12 },
      startDay: { type: Number, default: 1, min: 1, max: 31 },
      currentYear: { type: Number, default: new Date().getFullYear() },
    },

    // Parametres generaux
    general: {
      defaultPaymentTermDays: { type: Number, default: 30 },
      defaultTvaRate: { type: Number, default: 18 },
      currency: { type: String, default: 'XOF' },
      language: { type: String, default: 'fr' },
      timezone: { type: String, default: 'Africa/Dakar' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
    },

    // Parametres email
    emailNotifications: {
      onInvoiceCreated: { type: Boolean, default: true },
      onPaymentReceived: { type: Boolean, default: true },
      onQuoteAccepted: { type: Boolean, default: true },
      onLowStock: { type: Boolean, default: true },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Exclure les soft-deleted
settingsSchema.pre(/^find/, function () {
  this.where({ deletedAt: { $exists: false } });
});

// Methode softDelete
settingsSchema.methods.softDelete = function (userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('Settings', settingsSchema);
