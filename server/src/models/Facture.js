const mongoose = require('mongoose');

const ligneFactureSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Le produit est requis'],
    },
    designation: {
      type: String,
      required: [true, 'La designation est requise'],
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    quantite: {
      type: Number,
      required: [true, 'La quantite est requise'],
      min: [0.01, 'La quantite doit etre superieure a 0'],
    },
    prixUnitaire: {
      type: Number,
      required: [true, 'Le prix unitaire est requis'],
      min: [0, 'Le prix unitaire ne peut pas etre negatif'],
    },
    remise: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tauxTVA: {
      type: Number,
      enum: [0, 18],
      default: 18,
    },
    unite: {
      type: String,
      default: 'Unite',
      trim: true,
    },
    montantHT: { type: Number, default: 0 },
    montantTVA: { type: Number, default: 0 },
    montantTTC: { type: Number, default: 0 },
  },
  { _id: true }
);

// Embedded accounting entry (SYSCOHADA)
const ecritureComptableSchema = new mongoose.Schema(
  {
    journal: {
      type: String,
      required: true,
      enum: ['VE', 'AC', 'BQ', 'CA', 'OD'],
    },
    dateEcriture: {
      type: Date,
      required: true,
    },
    libelle: {
      type: String,
      required: true,
    },
    lignes: [
      {
        compte: { type: String, required: true },
        libelle: { type: String, required: true },
        debit: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
      },
    ],
  },
  { _id: true }
);

const factureSchema = new mongoose.Schema(
  {
    // Numero assigned ONLY at validation (DGI compliance - no gaps)
    numero: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // Internal reference for drafts
    referenceInterne: {
      type: String,
      trim: true,
    },

    // Type: facture or avoir (credit note)
    typeDocument: {
      type: String,
      enum: ['facture', 'avoir'],
      default: 'facture',
    },

    // For avoir: reference to original facture
    factureOrigine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facture',
    },

    // Source documents
    commande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commande',
    },
    bonLivraison: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BonLivraison',
    },

    // Client reference + snapshot
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Le client est requis'],
    },
    clientSnapshot: {
      displayName: String,
      email: String,
      phone: String,
      address: {
        street: String,
        city: String,
        region: String,
        postalCode: String,
        country: String,
      },
      ninea: String,
      rccm: String,
    },

    // Dates
    dateFacture: {
      type: Date,
      default: Date.now,
    },
    dateEcheance: {
      type: Date,
    },

    // Status
    statut: {
      type: String,
      enum: ['brouillon', 'validee', 'envoyee', 'partiellement_payee', 'payee', 'annulee'],
      default: 'brouillon',
    },

    // Lines
    lignes: {
      type: [ligneFactureSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'La facture doit contenir au moins une ligne',
      },
    },

    // Totals
    remiseGlobale: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalHT: { type: Number, default: 0 },
    totalTVA: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },

    // Payment tracking
    montantPaye: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Conditions
    conditionsPaiement: {
      type: String,
      trim: true,
      default: 'Paiement a 30 jours',
    },
    modePaiement: {
      type: String,
      enum: ['especes', 'cheque', 'virement', 'orange_money', 'wave', 'carte_bancaire'],
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
    mentionsLegales: {
      type: String,
      default: 'En cas de retard de paiement, une penalite de 2% par mois sera appliquee. Pas d\'escompte pour paiement anticipe.',
    },

    // Embedded accounting entry (SYSCOHADA)
    ecritureComptable: ecritureComptableSchema,

    // Commercial
    commercial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validatedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// === INDEXES ===
// numero already indexed via unique+sparse: true
factureSchema.index({ client: 1 });
factureSchema.index({ statut: 1 });
factureSchema.index({ typeDocument: 1 });
factureSchema.index({ isActive: 1, createdAt: -1 });
factureSchema.index({ dateEcheance: 1, statut: 1 });
factureSchema.index({ commande: 1 });
factureSchema.index({ factureOrigine: 1 });
factureSchema.index({ commercial: 1 });

// === VIRTUALS ===
factureSchema.virtual('montantRestant').get(function () {
  return Math.max(0, this.totalTTC - this.montantPaye);
});

factureSchema.virtual('isEnRetard').get(function () {
  if (!this.dateEcheance) return false;
  if (['payee', 'annulee'].includes(this.statut)) return false;
  return new Date() > this.dateEcheance && this.montantRestant > 0;
});

factureSchema.virtual('tauxRecouvrement').get(function () {
  if (!this.totalTTC || this.totalTTC === 0) return 0;
  return Math.round((this.montantPaye / this.totalTTC) * 100 * 100) / 100;
});

// === CALCULATE LINE AMOUNTS ===
const calculateLignes = (lignes) => {
  lignes.forEach((ligne) => {
    ligne.montantHT = Math.round(ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100));
    ligne.montantTVA = Math.round(ligne.montantHT * ligne.tauxTVA / 100);
    ligne.montantTTC = ligne.montantHT + ligne.montantTVA;
  });
};

const calculateTotals = (doc) => {
  const sumHT = doc.lignes.reduce((sum, l) => sum + l.montantHT, 0);
  const sumTVA = doc.lignes.reduce((sum, l) => sum + l.montantTVA, 0);

  if (doc.remiseGlobale > 0) {
    const factor = 1 - doc.remiseGlobale / 100;
    doc.totalHT = Math.round(sumHT * factor);
    doc.totalTVA = Math.round(sumTVA * factor);
  } else {
    doc.totalHT = sumHT;
    doc.totalTVA = sumTVA;
  }
  doc.totalTTC = doc.totalHT + doc.totalTVA;
};

// === PRE-SAVE ===
factureSchema.pre('save', async function (next) {
  // Generate internal reference for drafts (not DGI-compliant numero)
  if (!this.referenceInterne) {
    const count = await mongoose.model('Facture').countDocuments();
    const prefix = this.typeDocument === 'avoir' ? 'TMP-AV' : 'TMP-FA';
    this.referenceInterne = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate line amounts and totals
  if (this.lignes && this.lignes.length > 0) {
    calculateLignes(this.lignes);
    calculateTotals(this);
  }

  next();
});

// === SOFT DELETE FILTER ===
factureSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
factureSchema.methods.softDelete = async function (userId) {
  if (this.statut !== 'brouillon') {
    throw new Error('Seules les factures en brouillon peuvent etre supprimees');
  }
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Facture', factureSchema);
