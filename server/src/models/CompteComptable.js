const mongoose = require('mongoose');

const compteComptableSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      required: [true, 'Le numero de compte est requis'],
      unique: true,
      trim: true,
      match: [/^\d{1,10}$/, 'Le numero de compte doit etre compose de chiffres uniquement'],
    },
    libelle: {
      type: String,
      required: [true, 'Le libelle du compte est requis'],
      trim: true,
    },
    classe: {
      type: Number,
      required: [true, 'La classe du compte est requise'],
      min: 1,
      max: 8,
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: [true, 'Le type de compte est requis'],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompteComptable',
      default: null,
    },
    niveau: {
      type: Number,
      default: 1,
      min: 1,
    },
    isCollectif: {
      type: Boolean,
      default: false,
    },
    isImputable: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },

    // Soldes (mis a jour par les ecritures)
    soldeDebit: {
      type: Number,
      default: 0,
    },
    soldeCredit: {
      type: Number,
      default: 0,
    },

    // System flag - SYSCOHADA pre-configured accounts cannot be deleted
    isSystem: {
      type: Boolean,
      default: false,
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
compteComptableSchema.index({ isActive: 1, createdAt: -1 });
compteComptableSchema.index({ classe: 1, numero: 1 });
compteComptableSchema.index({ parent: 1 });
compteComptableSchema.index({ isImputable: 1 });

// === VIRTUALS ===
compteComptableSchema.virtual('solde').get(function () {
  // Comptes de type debit: solde = debits - credits
  // Comptes de type credit: solde = credits - debits
  if (this.type === 'debit') {
    return this.soldeDebit - this.soldeCredit;
  }
  return this.soldeCredit - this.soldeDebit;
});

compteComptableSchema.virtual('soldeFormate').get(function () {
  const solde = this.solde;
  const absValue = Math.abs(solde);
  const formatted = new Intl.NumberFormat('fr-FR').format(absValue);
  return solde >= 0 ? `${formatted} FCFA` : `-${formatted} FCFA`;
});

compteComptableSchema.virtual('children', {
  ref: 'CompteComptable',
  localField: '_id',
  foreignField: 'parent',
});

// === PRE-SAVE ===
compteComptableSchema.pre('save', function (next) {
  // Auto-detect classe from numero
  if (this.numero && !this.classe) {
    this.classe = parseInt(this.numero.charAt(0), 10);
  }

  // Auto-detect niveau from numero length
  this.niveau = this.numero.length;

  // Auto-detect type based on SYSCOHADA classes
  if (!this.type) {
    // Classes 1,4,5 depend on subaccount; Classes 2,3,6,8 = debit; 7 = credit
    const debitClasses = [2, 3, 6, 8];
    const creditClasses = [1, 7];
    if (debitClasses.includes(this.classe)) {
      this.type = 'debit';
    } else if (creditClasses.includes(this.classe)) {
      this.type = 'credit';
    }
    // Classes 4 and 5 default to debit but can be either
    if (!this.type) {
      this.type = 'debit';
    }
  }

  next();
});

// === SOFT DELETE FILTER ===
compteComptableSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
compteComptableSchema.methods.softDelete = async function (userId) {
  if (this.isSystem) {
    throw new Error('Les comptes systeme SYSCOHADA ne peuvent pas etre supprimes');
  }
  // Check if account has movements
  if (this.soldeDebit !== 0 || this.soldeCredit !== 0) {
    throw new Error('Un compte avec des mouvements ne peut pas etre supprime');
  }
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

compteComptableSchema.methods.updateSolde = async function (debit, credit) {
  this.soldeDebit += debit;
  this.soldeCredit += credit;
  return this.save();
};

// === STATICS ===
compteComptableSchema.statics.findByNumero = function (numero) {
  return this.findOne({ numero, isActive: true });
};

compteComptableSchema.statics.findByClasse = function (classe) {
  return this.find({ classe, isActive: true }).sort('numero');
};

compteComptableSchema.statics.getImputables = function () {
  return this.find({ isImputable: true, isActive: true }).sort('numero');
};

module.exports = mongoose.model('CompteComptable', compteComptableSchema);
