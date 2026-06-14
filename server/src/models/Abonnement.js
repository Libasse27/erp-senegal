const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema(
  {
    entrepriseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, "L'entreprise est requise"],
      index: true,
    },
    forfaitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Forfait',
      required: [true, 'Le forfait est requis'],
    },
    periodicite: {
      type: String,
      enum: ['MENSUEL', 'ANNUEL'],
      required: [true, 'La periodicite est requise'],
      default: 'MENSUEL',
    },
    dateDebut: {
      type: Date,
      required: true,
    },
    dateFin: {
      type: Date,
      required: true,
    },
    montant: {
      type: Number,
      required: true,
      min: 0,
    },
    statut: {
      type: String,
      enum: ['ACTIF', 'EXPIRE', 'SUSPENDU', 'EN_ATTENTE'],
      default: 'EN_ATTENTE',
      index: true,
    },
    renouvellementAuto: {
      type: Boolean,
      default: false,
    },
    paiementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaiementSaaS',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

abonnementSchema.index({ entrepriseId: 1, statut: 1 });
abonnementSchema.index({ dateFin: 1, statut: 1 });

abonnementSchema.virtual('joursRestants').get(function () {
  if (!this.dateFin) return null;
  const diff = this.dateFin - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

abonnementSchema.virtual('estExpire').get(function () {
  return this.dateFin < new Date();
});

module.exports = mongoose.model('Abonnement', abonnementSchema);
