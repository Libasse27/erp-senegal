const mongoose = require('mongoose');

/**
 * Plan SaaS — source unique de vérité commerciale.
 * Tous les champs commerciaux (prix, limites, modules) sont administrables
 * par le Super Admin sans redéploiement. Ne jamais coder de valeurs en dur.
 */
const planSchema = new mongoose.Schema(
  {
    // Identifiant stable (ex: 'STANDARD') — pas un prix, pas un libellé
    code: {
      type: String,
      required: [true, 'Le code du plan est requis'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    nom: {
      type: String,
      required: [true, 'Le nom du plan est requis'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // ── Tarification ─────────────────────────────────────────────────────────
    tarifs: {
      mensuel: { type: Number, required: true, min: 0 },
      annuel:  { type: Number, required: true, min: 0 },
      devise:  { type: String, default: 'XOF' },
    },

    // ── Limites d'utilisation ─────────────────────────────────────────────────
    limites: {
      maxUtilisateurs:  { type: Number, default: 3 },    // -1 = illimité
      maxStockageMo:    { type: Number, default: 1024 },
      maxFacturesMois:  { type: Number, default: 100 },  // -1 = illimité
    },

    // ── Modules inclus ────────────────────────────────────────────────────────
    // ex: ['GESCOM','FACTURATION','STOCK','COMPTABILITE','REPORTING','PAIE','API']
    modules: {
      type: [String],
      default: [],
    },

    // ── Fonctionnalités avancées ──────────────────────────────────────────────
    features: {
      supportPrioritaire:    { type: Boolean, default: false },
      apiAccess:             { type: Boolean, default: false },
      multiEtablissement:    { type: Boolean, default: false },
    },

    // ── Essai gratuit ─────────────────────────────────────────────────────────
    essaiGratuitJours: { type: Number, default: 0 },

    // ── Catalogue ─────────────────────────────────────────────────────────────
    visible:        { type: Boolean, default: true },   // affiché page publique ?
    actif:          { type: Boolean, default: true },
    ordreAffichage: { type: Number, default: 0 },

    // Numéro de version pour le grandfathering (voir Abonnement.planSnapshot)
    version: { type: Number, default: 1 },

    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

planSchema.index({ actif: 1, ordreAffichage: 1 });
planSchema.index({ visible: 1, actif: 1 });

// Pourcentage de remise si paiement annuel vs mensuel × 12
planSchema.virtual('remiseAnnuelle').get(function () {
  if (!this.tarifs?.mensuel || !this.tarifs?.annuel) return 0;
  const annuelCalcule = this.tarifs.mensuel * 12;
  return Math.round(((annuelCalcule - this.tarifs.annuel) / annuelCalcule) * 100);
});

module.exports = mongoose.model('Plan', planSchema);
