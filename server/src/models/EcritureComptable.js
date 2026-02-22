const mongoose = require('mongoose');

const ligneEcritureSchema = new mongoose.Schema(
  {
    compte: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompteComptable',
      required: [true, 'Le compte est requis'],
    },
    compteNumero: {
      type: String,
      required: [true, 'Le numero de compte est requis'],
      trim: true,
    },
    compteLibelle: {
      type: String,
      trim: true,
    },
    libelle: {
      type: String,
      required: [true, 'Le libelle de la ligne est requis'],
      trim: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: [0, 'Le montant debit ne peut pas etre negatif'],
    },
    credit: {
      type: Number,
      default: 0,
      min: [0, 'Le montant credit ne peut pas etre negatif'],
    },
    lettrage: {
      type: String,
      trim: true,
      default: null,
    },
    dateLettrage: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const ecritureComptableSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    journal: {
      type: String,
      required: [true, 'Le journal est requis'],
      enum: ['VE', 'AC', 'BQ', 'CA', 'OD'],
    },
    dateEcriture: {
      type: Date,
      required: [true, "La date de l'ecriture est requise"],
    },
    dateSaisie: {
      type: Date,
      default: Date.now,
    },
    libelle: {
      type: String,
      required: [true, "Le libelle de l'ecriture est requis"],
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    exercice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExerciceComptable',
      required: [true, "L'exercice comptable est requis"],
    },
    lignes: {
      type: [ligneEcritureSchema],
      validate: {
        validator: (v) => v.length >= 2,
        message: "L'ecriture doit contenir au moins 2 lignes",
      },
    },
    statut: {
      type: String,
      enum: ['brouillon', 'validee'],
      default: 'brouillon',
    },

    // Total controls
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },

    // Source document
    sourceDocument: {
      type: {
        type: String,
        enum: ['facture', 'avoir', 'paiement', 'paiement_fournisseur', 'manuel'],
      },
      id: { type: mongoose.Schema.Types.ObjectId },
    },

    // Piece justificative
    pieceJustificative: {
      type: String,
      trim: true,
    },

    // Validation
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validatedAt: { type: Date },

    // Contrepassation
    isContrepassation: { type: Boolean, default: false },
    ecritureOrigine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EcritureComptable',
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
ecritureComptableSchema.index({ isActive: 1, createdAt: -1 });
ecritureComptableSchema.index({ journal: 1, dateEcriture: 1 });
ecritureComptableSchema.index({ exercice: 1 });
ecritureComptableSchema.index({ statut: 1 });
ecritureComptableSchema.index({ 'sourceDocument.type': 1, 'sourceDocument.id': 1 });
ecritureComptableSchema.index({ 'lignes.compte': 1 });
ecritureComptableSchema.index({ 'lignes.compteNumero': 1 });
ecritureComptableSchema.index({ 'lignes.lettrage': 1 });
ecritureComptableSchema.index({ dateEcriture: 1 });

// === VIRTUALS ===
ecritureComptableSchema.virtual('isEquilibree').get(function () {
  return this.totalDebit === this.totalCredit;
});

// === PRE-SAVE ===
ecritureComptableSchema.pre('save', function (next) {
  // Calculate totals
  if (this.lignes && this.lignes.length > 0) {
    this.totalDebit = this.lignes.reduce((sum, l) => sum + (l.debit || 0), 0);
    this.totalCredit = this.lignes.reduce((sum, l) => sum + (l.credit || 0), 0);
  }

  // Generate numero for new entries
  if (!this.numero) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.numero = `${this.journal}-${dateStr}-${random}`;
  }

  next();
});

// === PRE-VALIDATE ===
ecritureComptableSchema.pre('validate', function (next) {
  // Validate each line has either debit or credit (not both)
  if (this.lignes) {
    for (const ligne of this.lignes) {
      if (ligne.debit > 0 && ligne.credit > 0) {
        this.invalidate(
          'lignes',
          'Une ligne ne peut pas avoir a la fois un debit et un credit'
        );
        break;
      }
      if (ligne.debit === 0 && ligne.credit === 0) {
        this.invalidate(
          'lignes',
          'Une ligne doit avoir un debit ou un credit non nul'
        );
        break;
      }
    }
  }
  next();
});

// === SOFT DELETE FILTER ===
ecritureComptableSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
ecritureComptableSchema.methods.softDelete = async function (userId) {
  if (this.statut === 'validee') {
    throw new Error('Une ecriture validee ne peut pas etre supprimee. Utilisez la contrepassation.');
  }
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

ecritureComptableSchema.methods.valider = async function (userId) {
  if (this.statut === 'validee') {
    throw new Error('Cette ecriture est deja validee');
  }
  if (this.totalDebit !== this.totalCredit) {
    throw new Error(
      `L'ecriture n'est pas equilibree: Debit ${this.totalDebit} != Credit ${this.totalCredit}`
    );
  }
  this.statut = 'validee';
  this.validatedBy = userId;
  this.validatedAt = new Date();
  return this.save();
};

// === STATICS ===
ecritureComptableSchema.statics.findByJournal = function (journal, exerciceId) {
  const filter = { journal, isActive: true };
  if (exerciceId) filter.exercice = exerciceId;
  return this.find(filter).sort('dateEcriture');
};

ecritureComptableSchema.statics.findByCompte = function (compteNumero, options = {}) {
  const filter = { 'lignes.compteNumero': compteNumero, isActive: true };
  if (options.exercice) filter.exercice = options.exercice;
  if (options.dateFrom || options.dateTo) {
    filter.dateEcriture = {};
    if (options.dateFrom) filter.dateEcriture.$gte = new Date(options.dateFrom);
    if (options.dateTo) filter.dateEcriture.$lte = new Date(options.dateTo);
  }
  return this.find(filter).sort('dateEcriture');
};

module.exports = mongoose.model('EcritureComptable', ecritureComptableSchema);
