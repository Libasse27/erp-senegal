const mongoose = require('mongoose');

/**
 * Abonnement — instance de souscription d'une entreprise à un Plan.
 *
 * Champ clé : `planSnapshot` — copie figée des conditions commerciales
 * au moment de l'achat (grandfathering). Toute modification du Plan vivant
 * n'impacte PAS les abonnés existants. Les contrôles d'accès et de limites
 * doivent lire planSnapshot, pas le Plan courant.
 */
const historiqueEntrySchema = new mongoose.Schema(
  {
    date:        { type: Date, default: Date.now },
    action:      { type: String, required: true }, // 'creation','renouvellement','upgrade','downgrade','suspension','annulation'
    ancienPlan:  { type: String },
    nouveauPlan: { type: String },
    montant:     { type: Number },
    note:        { type: String },
  },
  { _id: false }
);

const abonnementSchema = new mongoose.Schema(
  {
    entrepriseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, "L'entreprise est requise"],
      index: true,
    },

    // Référence vers le Plan vivant (pour info — les contrôles lisent planSnapshot)
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Le plan est requis'],
    },

    /**
     * COPIE FIGÉE des conditions commerciales au moment de l'achat.
     * Garantit le grandfathering : si le Super Admin modifie les prix/limites
     * du Plan, les abonnés existants conservent leurs conditions d'origine.
     * Structure miroir de Plan : { code, nom, tarifs, limites, modules, features, version }
     */
    planSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Le snapshot du plan est requis'],
    },

    periodicite: {
      type: String,
      enum: ['MENSUEL', 'ANNUEL'],
      required: [true, 'La périodicité est requise'],
      default: 'MENSUEL',
    },

    dateDebut: { type: Date, required: true },
    dateFin:   { type: Date, required: true },
    montant:   { type: Number, required: true, min: 0 },
    devise:    { type: String, default: 'XOF' },

    statut: {
      type: String,
      enum: ['ESSAI', 'ACTIF', 'EN_PERIODE_GRACE', 'EXPIRE', 'SUSPENDU', 'ANNULE', 'EN_ATTENTE'],
      default: 'EN_ATTENTE',
      index: true,
    },

    renouvellementAuto: { type: Boolean, default: false },

    // Coupon appliqué lors de la souscription
    couponApplique: { type: String, trim: true, default: null },

    // Lien vers le paiement déclencheur
    paiementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaiementSaaS',
      default: null,
    },

    // Date de fin de la période de grâce (calculée lors de la transition ACTIF→EN_PERIODE_GRACE)
    graceEndsAt: { type: Date, default: null },

    // Historique des événements (upgrade, downgrade, renouvellement…)
    historique: { type: [historiqueEntrySchema], default: [] },

    notes: { type: String, trim: true, maxlength: 1000 },

    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
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

// Modules accessibles via le snapshot (source de vérité pour les gardes)
abonnementSchema.virtual('modulesActifs').get(function () {
  return this.planSnapshot?.modules || [];
});

// Limites effectives via le snapshot
abonnementSchema.virtual('limitesEffectives').get(function () {
  return this.planSnapshot?.limites || {};
});

module.exports = mongoose.model('Abonnement', abonnementSchema);
