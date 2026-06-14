const mongoose = require('mongoose');

const forfaitSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      enum: ['STANDARD', 'PROFESSIONNEL', 'COMPLET'],
      required: [true, 'Le code du forfait est requis'],
      unique: true,
    },
    nom: {
      type: String,
      required: [true, 'Le nom du forfait est requis'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Tarification FCFA
    prixMensuel: {
      type: Number,
      required: true,
      min: 0,
    },
    prixAnnuel: {
      type: Number,
      required: true,
      min: 0,
    },

    // Modules inclus dans ce forfait
    modulesInclus: {
      type: [String],
      default: [],
    },

    // Limites d'utilisation
    limites: {
      maxUtilisateurs: { type: Number, default: 3 },
      maxFacturesMois: { type: Number, default: 100 },  // -1 = illimite
      stockageMo: { type: Number, default: 1024 },
      supportPrioritaire: { type: Boolean, default: false },
    },

    actif: {
      type: Boolean,
      default: true,
    },
    ordre: {
      type: Number,
      default: 0,
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

forfaitSchema.index({ actif: 1, ordre: 1 });

forfaitSchema.virtual('remiseAnnuelle').get(function () {
  if (!this.prixMensuel || !this.prixAnnuel) return 0;
  const annuelCalcule = this.prixMensuel * 12;
  return Math.round(((annuelCalcule - this.prixAnnuel) / annuelCalcule) * 100);
});

module.exports = mongoose.model('Forfait', forfaitSchema);
