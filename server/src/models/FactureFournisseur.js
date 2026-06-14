const mongoose = require('mongoose');

const ligneFfSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    designation: { type: String, required: true, trim: true },
    reference: { type: String, trim: true },
    quantite: { type: Number, required: true, min: 0.01 },
    prixUnitaire: { type: Number, required: true, min: 0 },
    remise: { type: Number, default: 0, min: 0, max: 100 },
    tauxTVA: { type: Number, enum: [0, 18], default: 18 },
    unite: { type: String, default: 'Unite', trim: true },
    montantHT: { type: Number, default: 0 },
    montantTVA: { type: Number, default: 0 },
    montantTTC: { type: Number, default: 0 },
  },
  { _id: true }
);

const factureFournisseurSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    numero: { type: String, trim: true },

    commandeAchat: { type: mongoose.Schema.Types.ObjectId, ref: 'CommandeAchat' },
    fournisseur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fournisseur',
      required: [true, 'Le fournisseur est requis'],
    },
    fournisseurSnapshot: {
      raisonSociale: String,
      email: String,
      phone: String,
      ninea: String,
      rccm: String,
      address: {
        street: String,
        city: String,
        region: String,
        postalCode: String,
        country: String,
      },
    },

    // N° de facture émis par le fournisseur lui-même
    referenceFournisseur: { type: String, trim: true },

    dateFacture: { type: Date, default: Date.now },
    dateEcheance: { type: Date },

    statut: {
      type: String,
      enum: ['brouillon', 'validee', 'partiellement_payee', 'payee', 'annulee'],
      default: 'brouillon',
    },

    lignes: {
      type: [ligneFfSchema],
      validate: { validator: (v) => v.length > 0, message: 'Au moins une ligne est requise' },
    },

    remiseGlobale: { type: Number, default: 0, min: 0, max: 100 },
    totalHT: { type: Number, default: 0 },
    totalTVA: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    montantPaye: { type: Number, default: 0, min: 0 },

    conditionsPaiement: { type: String, trim: true },
    notes: { type: String, maxlength: 2000 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

factureFournisseurSchema.virtual('montantRestant').get(function () {
  return Math.max(0, (this.totalTTC || 0) - (this.montantPaye || 0));
});

factureFournisseurSchema.index({ companyId: 1, numero: 1 }, { unique: true, sparse: true });
factureFournisseurSchema.index({ companyId: 1, fournisseur: 1, statut: 1 });
factureFournisseurSchema.index({ companyId: 1, dateFacture: -1 });

const calcLignes = (lignes) => {
  lignes.forEach((l) => {
    l.montantHT = Math.round(l.quantite * l.prixUnitaire * (1 - l.remise / 100));
    l.montantTVA = Math.round((l.montantHT * l.tauxTVA) / 100);
    l.montantTTC = l.montantHT + l.montantTVA;
  });
};

const calcTotals = (doc) => {
  const sumHT = doc.lignes.reduce((s, l) => s + l.montantHT, 0);
  const sumTVA = doc.lignes.reduce((s, l) => s + l.montantTVA, 0);
  const f = doc.remiseGlobale > 0 ? 1 - doc.remiseGlobale / 100 : 1;
  doc.totalHT = Math.round(sumHT * f);
  doc.totalTVA = Math.round(sumTVA * f);
  doc.totalTTC = doc.totalHT + doc.totalTVA;
};

factureFournisseurSchema.pre('save', async function (next) {
  if (!this.numero && this.companyId) {
    const count = await this.constructor.countDocuments({ companyId: this.companyId });
    const year = new Date().getFullYear();
    this.numero = `FF${year}-${String(count + 1).padStart(5, '0')}`;
  }
  if (this.lignes && this.lignes.length > 0) {
    calcLignes(this.lignes);
    calcTotals(this);
  }
  next();
});

factureFournisseurSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

module.exports = mongoose.model('FactureFournisseur', factureFournisseurSchema);
