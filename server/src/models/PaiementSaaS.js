const mongoose = require('mongoose');

const paiementSaasSchema = new mongoose.Schema(
  {
    entrepriseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, "L'entreprise est requise"],
      index: true,
    },
    abonnementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Abonnement',
      required: [true, "L'abonnement est requis"],
    },

    montant: {
      type: Number,
      required: [true, 'Le montant est requis'],
      min: [0, 'Le montant ne peut pas etre negatif'],
    },
    devise: { type: String, default: 'XOF' },

    methode: {
      type: String,
      enum: ['WAVE', 'ORANGE_MONEY', 'STRIPE', 'CARTE', 'VIREMENT', 'ESPECES'],
      required: [true, 'Le mode de paiement est requis'],
    },

    // Clé d'idempotence — empêche les doublons de paiement
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // Référence interne (générée par l'ERP)
    reference: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },

    // ID retourné par le PSP (Wave / Orange Money / Stripe)
    transactionId: { type: String, trim: true, sparse: true },

    // URL de paiement retournée par le PSP
    checkoutUrl: { type: String, trim: true },

    statut: {
      type: String,
      enum: ['EN_ATTENTE', 'REUSSI', 'ECHOUE', 'REMBOURSE'],
      default: 'EN_ATTENTE',
      index: true,
    },

    datePaiement:  { type: Date, default: null },
    dateExpiration:{ type: Date, default: null },

    // Données brutes retournées par le PSP (pour audit)
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Signature de webhook (sécurité HMAC — ne pas exposer)
    webhookSignature:  { type: String, select: false },
    webhookReceivedAt: { type: Date, default: null },

    // ── Coupon appliqué ───────────────────────────────────────────────────────
    couponId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    montantOriginal: { type: Number, default: null },  // montant avant remise
    montantRemise:   { type: Number, default: 0 },     // remise appliquée

    notes:     { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

paiementSaasSchema.index({ entrepriseId: 1, statut: 1, createdAt: -1 });
paiementSaasSchema.index({ transactionId: 1 }, { sparse: true });

module.exports = mongoose.model('PaiementSaaS', paiementSaasSchema);
