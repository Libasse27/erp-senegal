const mongoose = require('mongoose');

/**
 * Invoice — Facture d'abonnement SaaS (émise par la plateforme vers l'entreprise).
 * Distincte de `Facture` (facture métier émise par l'entreprise vers ses clients).
 */
const ligneSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantite:    { type: Number, required: true, min: 1 },
    prixUnitaire:{ type: Number, required: true, min: 0 },
    montantHT:   { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    // Numéro de facture d'abonnement (ex: INV-2026-00001)
    numero: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },

    entrepriseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    abonnementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Abonnement',
      required: true,
    },
    paiementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaiementSaaS',
    },

    dateEmission:  { type: Date, default: Date.now },
    dateEcheance:  { type: Date },

    lignes: { type: [ligneSchema], default: [] },

    totalHT:  { type: Number, required: true, min: 0 },
    taxes:    { type: Number, default: 0 },
    totalTTC: { type: Number, required: true, min: 0 },
    devise:   { type: String, default: 'XOF' },

    statut: {
      type: String,
      enum: ['EMISE', 'PAYEE', 'ANNULEE'],
      default: 'EMISE',
      index: true,
    },

    // URL ou chemin vers le PDF généré
    pdfUrl: { type: String, default: null },

    // Snapshot de l'entreprise pour le PDF
    entrepriseSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

invoiceSchema.index({ entrepriseId: 1, statut: 1 });
invoiceSchema.index({ dateEmission: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
