const mongoose = require('mongoose');

const fournisseurSchema = new mongoose.Schema(
  {
    // === IDENTIFICATION ===
    code: {
      type: String,
      unique: true,
      trim: true,
    },
    raisonSociale: {
      type: String,
      required: [true, 'La raison sociale est requise'],
      trim: true,
      maxlength: [200, 'La raison sociale ne peut pas depasser 200 caracteres'],
    },
    ninea: {
      type: String,
      trim: true,
      uppercase: true,
    },
    rccm: {
      type: String,
      trim: true,
    },

    // === CONTACT ===
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    fax: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    contactPerson: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      position: { type: String, trim: true },
    },

    // === ADRESSE ===
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true, default: 'Dakar' },
      region: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Senegal' },
    },

    // === COMMERCIAL ===
    category: {
      type: String,
      enum: ['local', 'international', 'fabricant', 'distributeur', 'prestataire', 'autre'],
      default: 'local',
    },
    delaiPaiement: {
      type: Number,
      default: 30,
      min: 0,
      max: 365,
    },
    delaiLivraison: {
      type: Number,
      default: 7,
      min: 0,
    },
    conditionsPaiement: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    devises: {
      type: String,
      default: 'XOF',
      trim: true,
    },

    // === EVALUATION ===
    rating: {
      qualite: { type: Number, min: 1, max: 5, default: 3 },
      delai: { type: Number, min: 1, max: 5, default: 3 },
      prix: { type: Number, min: 1, max: 5, default: 3 },
      service: { type: Number, min: 1, max: 5, default: 3 },
    },

    // === BANCAIRE ===
    bankInfo: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      iban: { type: String, trim: true },
      swift: { type: String, trim: true },
    },

    // === FINANCIER ===
    totalAchats: {
      type: Number,
      default: 0,
    },
    totalDettes: {
      type: Number,
      default: 0,
    },
    nombreCommandes: {
      type: Number,
      default: 0,
    },

    // === NOTES ===
    notes: {
      type: String,
      maxlength: [2000, 'Les notes ne peuvent pas depasser 2000 caracteres'],
    },

    // === AUDIT ===
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// === INDEXES ===
// code already indexed via unique: true in schema definition
fournisseurSchema.index({ email: 1 }, { sparse: true });
fournisseurSchema.index({ isActive: 1, createdAt: -1 });
fournisseurSchema.index({ raisonSociale: 'text', email: 'text' });

// === VIRTUALS ===
fournisseurSchema.virtual('ratingMoyen').get(function () {
  if (!this.rating) return 0;
  const { qualite, delai, prix, service } = this.rating;
  return Math.round(((qualite + delai + prix + service) / 4) * 10) / 10;
});

fournisseurSchema.virtual('fullAddress').get(function () {
  const parts = [];
  if (this.address?.street) parts.push(this.address.street);
  if (this.address?.city) parts.push(this.address.city);
  if (this.address?.region) parts.push(this.address.region);
  if (this.address?.country) parts.push(this.address.country);
  return parts.join(', ');
});

// === PRE-SAVE: Auto-generate code ===
fournisseurSchema.pre('save', async function (next) {
  if (!this.code) {
    const count = await mongoose.model('Fournisseur').countDocuments();
    this.code = `FRN-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// === SOFT DELETE FILTER ===
fournisseurSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
fournisseurSchema.methods.softDelete = async function (userId) {
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

module.exports = mongoose.model('Fournisseur', fournisseurSchema);
