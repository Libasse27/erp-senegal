const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'entreprise est requis"],
      trim: true,
    },
    legalForm: {
      type: String,
      trim: true,
      enum: ['SARL', 'SA', 'SAS', 'SASU', 'SNC', 'EI', 'GIE', 'Autre'],
    },
    ninea: { type: String, trim: true, uppercase: true },
    rccm:  { type: String, trim: true },

    address: {
      street:     { type: String, trim: true },
      city:       { type: String, trim: true, default: 'Dakar' },
      region:     { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country:    { type: String, trim: true, default: 'Senegal' },
    },

    phone:   { type: String, trim: true },
    fax:     { type: String, trim: true },
    email:   { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true },
    logo:    { type: String, default: null },

    bankInfo: {
      bankName:      { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      iban:          { type: String, trim: true },
      swift:         { type: String, trim: true },
    },

    fiscalInfo: {
      tvaRate:       { type: Number, default: 18 },
      isSubjectToTVA:{ type: Boolean, default: true },
      fiscalRegime: {
        type: String,
        enum: ['reel_normal', 'reel_simplifie', 'contribuable_unique'],
        default: 'reel_normal',
      },
    },

    currency: { type: String, default: 'XOF' },
    langue:   { type: String, default: 'fr-SN' },
    fuseauHoraire: { type: String, default: 'Africa/Dakar' },

    // ── SaaS — Statut & Abonnement ────────────────────────────────────────────
    /**
     * Statuts (uppercase, alignés sur le prompt v2) :
     *  ACTIVE            — entreprise active et abonnée
     *  ESSAI             — période d'essai gratuit en cours
     *  EN_ATTENTE_PAIEMENT — créée, en attente de premier paiement
     *  SUSPENDUE         — suspendue manuellement par le Super Admin
     *  EXPIREE           — abonnement expiré (non renouvelé)
     */
    status: {
      type: String,
      enum: ['ACTIVE', 'ESSAI', 'EN_ATTENTE_PAIEMENT', 'SUSPENDUE', 'EXPIREE'],
      default: 'EN_ATTENTE_PAIEMENT',
    },

    // Code du plan actuel (raccourci lisible, ex: 'STANDARD')
    plan: { type: String, trim: true, default: null },

    // Lien vers le document Plan
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },

    // Lien vers l'abonnement actif
    abonnementActifId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Abonnement',
      default: null,
    },

    // ── Métriques d'usage (maintenues à jour) ────────────────────────────────
    usage: {
      utilisateurs: { type: Number, default: 0 },
      stockageMo:   { type: Number, default: 0 },
    },

    sector:        { type: String, trim: true },
    employeeCount: { type: Number, default: 0, min: 0 },

    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Suspension
    suspendedAt:      { type: Date, default: null },
    suspendedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    suspensionReason: { type: String, trim: true },

    superAdminNotes:   { type: String, trim: true, maxlength: 2000 },
    subscriptionStartDate: { type: Date, default: Date.now },
    subscriptionEndDate:   { type: Date },

    isActive:   { type: Boolean, default: true },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt:  Date,
    deletedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

companySchema.index({ ninea: 1 });
companySchema.index({ status: 1 });
companySchema.index({ plan: 1 });
companySchema.index({ isActive: 1, createdAt: -1 });

companySchema.virtual('fullAddress').get(function () {
  const parts = [];
  if (this.address?.street)  parts.push(this.address.street);
  if (this.address?.city)    parts.push(this.address.city);
  if (this.address?.region)  parts.push(this.address.region);
  if (this.address?.country) parts.push(this.address.country);
  return parts.join(', ');
});

companySchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

companySchema.methods.softDelete = function (userId) {
  this.deletedAt  = new Date();
  this.deletedBy  = userId;
  this.isActive   = false;
  return this.save();
};

module.exports = mongoose.model('Company', companySchema);
