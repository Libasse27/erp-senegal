const mongoose = require('mongoose');

/**
 * Transaction — Trace financière unifiée pour le reporting Super Admin.
 * Agrège tous les flux financiers SaaS (paiements, remboursements, crédits).
 */
const transactionSchema = new mongoose.Schema(
  {
    entrepriseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    abonnementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Abonnement',
    },
    paiementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaiementSaaS',
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },

    type: {
      type: String,
      enum: ['PAIEMENT', 'REMBOURSEMENT', 'CREDIT', 'AJUSTEMENT'],
      required: true,
      index: true,
    },

    montant:  { type: Number, required: true },  // positif = entrée, négatif = sortie
    devise:   { type: String, default: 'XOF' },
    methode:  { type: String },  // WAVE, ORANGE_MONEY, etc.

    // Référence PSP
    reference:     { type: String, trim: true, index: true },
    transactionId: { type: String, trim: true },

    statut: {
      type: String,
      enum: ['EN_ATTENTE', 'COMPLETE', 'ECHOUE', 'ANNULE'],
      default: 'EN_ATTENTE',
      index: true,
    },

    description: { type: String, trim: true },
    metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },

    // Période de facturation concernée
    periodeDebut: { type: Date },
    periodeFin:   { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

transactionSchema.index({ entrepriseId: 1, type: 1, createdAt: -1 });
transactionSchema.index({ statut: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
