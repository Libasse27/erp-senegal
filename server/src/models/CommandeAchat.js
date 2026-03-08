const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/sequenceHelper');

const ligneCmdAchatSchema = new mongoose.Schema(
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
    reference: { type: String, trim: true },
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
    remise: { type: Number, default: 0, min: 0, max: 100 },
    tauxTVA: { type: Number, enum: [0, 18], default: 18 },
    unite: { type: String, default: 'Unite', trim: true },
    montantHT: { type: Number, default: 0 },
    montantTVA: { type: Number, default: 0 },
    montantTTC: { type: Number, default: 0 },
    quantiteRecue: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const commandeAchatSchema = new mongoose.Schema(
  {
    numero: { type: String, unique: true, trim: true },

    fournisseur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fournisseur',
      required: [true, 'Le fournisseur est requis'],
    },
    fournisseurSnapshot: {
      raisonSociale: String,
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

    dateCommande: { type: Date, default: Date.now },
    dateReceptionPrevue: { type: Date },

    statut: {
      type: String,
      enum: ['brouillon', 'envoyee', 'confirmee', 'partiellement_recue', 'recue', 'annulee'],
      default: 'brouillon',
    },

    lignes: {
      type: [ligneCmdAchatSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'La commande achat doit contenir au moins une ligne',
      },
    },

    remiseGlobale: { type: Number, default: 0, min: 0, max: 100 },
    totalHT: { type: Number, default: 0 },
    totalTVA: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },

    conditionsPaiement: { type: String, trim: true },
    notes: { type: String, maxlength: 2000 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
commandeAchatSchema.index({ fournisseur: 1, statut: 1 });
commandeAchatSchema.index({ statut: 1, createdAt: -1 });

// === VIRTUALS ===
commandeAchatSchema.virtual('isFullyReceived').get(function () {
  return this.lignes.every((l) => l.quantiteRecue >= l.quantite);
});

// === CALCULATE HELPERS ===
const calculateLignes = (lignes) => {
  lignes.forEach((ligne) => {
    ligne.montantHT = Math.round(ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100));
    ligne.montantTVA = Math.round((ligne.montantHT * ligne.tauxTVA) / 100);
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
commandeAchatSchema.pre('save', async function (next) {
  if (!this.numero) {
    const { numero } = await getNextSequence('purchaseOrder');
    this.numero = numero;
  }
  if (this.lignes && this.lignes.length > 0) {
    calculateLignes(this.lignes);
    calculateTotals(this);
  }
  next();
});

// === SOFT DELETE FILTER ===
commandeAchatSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
commandeAchatSchema.methods.changerStatut = async function (nouveauStatut) {
  const transitions = {
    brouillon: ['envoyee', 'annulee'],
    envoyee: ['confirmee', 'annulee'],
    confirmee: ['partiellement_recue', 'recue', 'annulee'],
    partiellement_recue: ['recue', 'annulee'],
    recue: [],
    annulee: [],
  };

  const allowed = transitions[this.statut];
  if (!allowed || !allowed.includes(nouveauStatut)) {
    throw new Error(`Transition de statut invalide: ${this.statut} -> ${nouveauStatut}`);
  }

  this.statut = nouveauStatut;
  return this.save();
};

commandeAchatSchema.methods.softDelete = async function (userId) {
  if (this.statut !== 'brouillon') {
    throw new Error('Seules les commandes achat en brouillon peuvent etre supprimees');
  }
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

module.exports = mongoose.model('CommandeAchat', commandeAchatSchema);
