const mongoose = require('mongoose');

/**
 * Coupon — Code promotionnel appliqué à la souscription.
 * Type POURCENTAGE ou MONTANT_FIXE, limité par date et par usage.
 */
const couponSchema = new mongoose.Schema(
  {
    // Code alphanumérique unique tapé par l'utilisateur (ex: PROMO30)
    code: {
      type: String,
      required: [true, 'Le code coupon est requis'],
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: { type: String, trim: true },

    type: {
      type: String,
      enum: ['POURCENTAGE', 'MONTANT_FIXE'],
      required: [true, 'Le type de remise est requis'],
    },

    valeur: {
      type: Number,
      required: [true, 'La valeur de la remise est requise'],
      min: 0,
    },

    // Plans éligibles (vide = tous)
    plansEligibles: { type: [String], default: [] },

    // Periodicités éligibles (vide = toutes)
    periodicitesEligibles: {
      type: [String],
      enum: ['MENSUEL', 'ANNUEL'],
      default: [],
    },

    dateDebut:   { type: Date, default: Date.now },
    dateExpiration: { type: Date, default: null },

    usagesMax:     { type: Number, default: null },  // null = illimité
    usagesActuels: { type: Number, default: 0 },

    actif: { type: Boolean, default: true },

    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

couponSchema.index({ actif: 1 });
couponSchema.index({ dateExpiration: 1 });

// Coupon valide à cet instant ?
couponSchema.virtual('estValide').get(function () {
  const now = new Date();
  if (!this.actif) return false;
  if (this.dateExpiration && this.dateExpiration < now) return false;
  if (this.usagesMax !== null && this.usagesActuels >= this.usagesMax) return false;
  return true;
});

// Calcule la remise sur un montant donné
couponSchema.methods.calculerRemise = function (montantBase) {
  if (this.type === 'POURCENTAGE') {
    return Math.round((montantBase * this.valeur) / 100);
  }
  return Math.min(this.valeur, montantBase);
};

module.exports = mongoose.model('Coupon', couponSchema);
