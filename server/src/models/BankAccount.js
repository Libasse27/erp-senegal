const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom du compte est requis'],
      trim: true,
    },
    banque: {
      type: String,
      required: [true, 'Le nom de la banque est requis'],
      trim: true,
    },
    numeroCompte: {
      type: String,
      required: [true, 'Le numero de compte est requis'],
      unique: true,
      trim: true,
    },
    iban: {
      type: String,
      trim: true,
    },
    swift: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['courant', 'epargne', 'mobile_money'],
      default: 'courant',
    },
    devise: {
      type: String,
      default: 'XOF',
    },

    // Soldes
    soldeInitial: {
      type: Number,
      default: 0,
    },
    soldeActuel: {
      type: Number,
      default: 0,
    },

    // Link to SYSCOHADA account (classe 5 - Tresorerie)
    compteComptable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompteComptable',
    },
    compteComptableNumero: {
      type: String,
      trim: true,
    },

    // Contact
    agence: {
      type: String,
      trim: true,
    },
    contactBanque: {
      type: String,
      trim: true,
    },
    telephoneBanque: {
      type: String,
      trim: true,
    },

    // Parametres
    isDefault: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      maxlength: 2000,
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
// numeroCompte already indexed via unique: true in schema definition
bankAccountSchema.index({ type: 1, isActive: 1 });

// === VIRTUALS ===
bankAccountSchema.virtual('soldeFormate').get(function () {
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.abs(this.soldeActuel));
  return this.soldeActuel >= 0 ? `${formatted} FCFA` : `-${formatted} FCFA`;
});

// === SOFT DELETE FILTER ===
bankAccountSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
bankAccountSchema.methods.softDelete = async function (userId) {
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

bankAccountSchema.methods.crediter = async function (montant) {
  this.soldeActuel += montant;
  return this.save();
};

bankAccountSchema.methods.debiter = async function (montant) {
  this.soldeActuel -= montant;
  return this.save();
};

// === STATICS ===
bankAccountSchema.statics.getDefault = function () {
  return this.findOne({ isDefault: true, isActive: true });
};

module.exports = mongoose.model('BankAccount', bankAccountSchema);
