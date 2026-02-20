const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/sequenceHelper');

// Shared line item schema for sales documents
const ligneSchema = new mongoose.Schema(
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
      min: [0, 'La remise ne peut pas etre negative'],
      max: [100, 'La remise ne peut pas depasser 100%'],
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

const devisSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      unique: true,
      trim: true,
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
    dateDevis: {
      type: Date,
      default: Date.now,
    },
    dateValidite: {
      type: Date,
      required: [true, 'La date de validite est requise'],
    },

    // Status
    statut: {
      type: String,
      enum: ['brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'converti'],
      default: 'brouillon',
    },

    // Lines
    lignes: {
      type: [ligneSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Le devis doit contenir au moins une ligne',
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

    // Conditions
    conditionsPaiement: {
      type: String,
      trim: true,
      default: 'Paiement a 30 jours',
    },
    notes: {
      type: String,
      maxlength: 2000,
    },

    // Conversion reference
    commandeGeneree: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commande',
    },

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
// numero already indexed via unique: true
devisSchema.index({ client: 1 });
devisSchema.index({ statut: 1 });
devisSchema.index({ isActive: 1, createdAt: -1 });
devisSchema.index({ dateValidite: 1 });
devisSchema.index({ commercial: 1 });

// === VIRTUALS ===
devisSchema.virtual('isExpire').get(function () {
  if (this.statut !== 'envoye') return false;
  return new Date() > this.dateValidite;
});

// === CALCULATE LINE AMOUNTS ===
const calculateLignes = (lignes) => {
  lignes.forEach((ligne) => {
    ligne.montantHT = Math.round(ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100));
    ligne.montantTVA = Math.round(ligne.montantHT * ligne.tauxTVA / 100);
    ligne.montantTTC = ligne.montantHT + ligne.montantTVA;
  });
};

// === CALCULATE TOTALS ===
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
devisSchema.pre('save', async function (next) {
  // Auto-generate numero
  if (!this.numero) {
    const { numero } = await getNextSequence('quote');
    this.numero = numero;
  }

  // Calculate line amounts and totals
  if (this.lignes && this.lignes.length > 0) {
    calculateLignes(this.lignes);
    calculateTotals(this);
  }

  next();
});

// === SOFT DELETE FILTER ===
devisSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
devisSchema.methods.changerStatut = async function (nouveauStatut) {
  const transitions = {
    brouillon: ['envoye'],
    envoye: ['accepte', 'refuse', 'expire'],
    accepte: ['converti'],
    refuse: [],
    expire: [],
    converti: [],
  };

  const allowed = transitions[this.statut];
  if (!allowed || !allowed.includes(nouveauStatut)) {
    throw new Error(
      `Transition de statut invalide: ${this.statut} -> ${nouveauStatut}`
    );
  }

  this.statut = nouveauStatut;
  return this.save();
};

devisSchema.methods.softDelete = async function (userId) {
  if (this.statut !== 'brouillon') {
    throw new Error('Seuls les devis en brouillon peuvent etre supprimes');
  }
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Devis', devisSchema);
