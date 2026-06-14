const mongoose = require('mongoose');
const { Schema } = mongoose;

const ligneSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    designation: { type: String, required: true },
    reference: String,
    quantite: { type: Number, required: true, min: 0 },
    prixUnitaire: { type: Number, required: true, min: 0 },
    remise: { type: Number, default: 0, min: 0, max: 100 },
    tauxTVA: { type: Number, enum: [0, 18], default: 18 },
    unite: String,
    montantHT: Number,
    montantTVA: Number,
    montantTTC: Number,
  },
  { _id: true }
);

const occurrenceSchema = new Schema(
  {
    factureId: { type: Schema.Types.ObjectId, ref: 'Facture' },
    numero: String,
    dateGeneration: { type: Date, default: Date.now },
    statut: { type: String, enum: ['generee', 'erreur'], default: 'generee' },
    erreur: String,
  },
  { _id: true }
);

const factureRecurrenteSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    clientSnapshot: {
      displayName: String,
      email: String,
      phone: String,
      address: Schema.Types.Mixed,
      ninea: String,
      rccm: String,
    },
    lignes: { type: [ligneSchema], required: true, validate: (v) => v.length > 0 },
    frequence: {
      type: String,
      enum: ['hebdomadaire', 'mensuel', 'trimestriel', 'semestriel', 'annuel'],
      required: true,
    },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, default: null },
    prochainGeneration: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    remiseGlobale: { type: Number, default: 0, min: 0, max: 100 },
    totalHT: { type: Number, default: 0 },
    totalTVA: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    conditionsPaiement: String,
    modePaiement: String,
    notes: String,
    occurrences: [occurrenceSchema],
    nbOccurrences: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: Date,
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Index composé pour le scan quotidien du cron
factureRecurrenteSchema.index({ companyId: 1, isActive: 1, prochainGeneration: 1 });

module.exports = mongoose.model('FactureRecurrente', factureRecurrenteSchema);
