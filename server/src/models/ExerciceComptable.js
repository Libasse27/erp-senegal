const mongoose = require('mongoose');

const exerciceComptableSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Le code de l'exercice est requis"],
      unique: true,
      trim: true,
    },
    libelle: {
      type: String,
      required: [true, "Le libelle de l'exercice est requis"],
      trim: true,
    },
    dateDebut: {
      type: Date,
      required: [true, 'La date de debut est requise'],
    },
    dateFin: {
      type: Date,
      required: [true, 'La date de fin est requise'],
    },
    statut: {
      type: String,
      enum: ['ouvert', 'cloture'],
      default: 'ouvert',
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    dateCloture: {
      type: Date,
    },
    cloturePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
exerciceComptableSchema.index({ isActive: 1, createdAt: -1 });
exerciceComptableSchema.index({ statut: 1 });
exerciceComptableSchema.index({ isCurrent: 1 });
exerciceComptableSchema.index({ dateDebut: 1, dateFin: 1 });

// === VIRTUALS ===
exerciceComptableSchema.virtual('isOpen').get(function () {
  return this.statut === 'ouvert';
});

exerciceComptableSchema.virtual('dureeJours').get(function () {
  if (!this.dateDebut || !this.dateFin) return 0;
  return Math.ceil((this.dateFin - this.dateDebut) / (1000 * 60 * 60 * 24));
});

// === VALIDATION ===
exerciceComptableSchema.pre('validate', function (next) {
  if (this.dateDebut && this.dateFin && this.dateFin <= this.dateDebut) {
    this.invalidate('dateFin', 'La date de fin doit etre posterieure a la date de debut');
  }
  next();
});

// === SOFT DELETE FILTER ===
exerciceComptableSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
exerciceComptableSchema.methods.softDelete = async function (userId) {
  if (this.statut === 'cloture') {
    throw new Error('Un exercice cloture ne peut pas etre supprime');
  }
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

exerciceComptableSchema.methods.cloturer = async function (userId) {
  if (this.statut === 'cloture') {
    throw new Error('Cet exercice est deja cloture');
  }
  this.statut = 'cloture';
  this.dateCloture = new Date();
  this.cloturePar = userId;
  this.isCurrent = false;
  return this.save();
};

// === STATICS ===
exerciceComptableSchema.statics.getCurrent = function () {
  return this.findOne({ isCurrent: true, isActive: true });
};

exerciceComptableSchema.statics.findByDate = function (date) {
  return this.findOne({
    dateDebut: { $lte: date },
    dateFin: { $gte: date },
    isActive: true,
  });
};

module.exports = mongoose.model('ExerciceComptable', exerciceComptableSchema);
