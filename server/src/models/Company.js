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
    ninea: {
      type: String,
      trim: true,
      uppercase: true,
    },
    rccm: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true, default: 'Dakar' },
      region: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Senegal' },
    },
    phone: {
      type: String,
      trim: true,
    },
    fax: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    bankInfo: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      iban: { type: String, trim: true },
      swift: { type: String, trim: true },
    },
    fiscalInfo: {
      tvaRate: { type: Number, default: 18 },
      isSubjectToTVA: { type: Boolean, default: true },
      fiscalRegime: {
        type: String,
        enum: ['reel_normal', 'reel_simplifie', 'contribuable_unique'],
        default: 'reel_normal',
      },
    },
    currency: {
      type: String,
      default: 'XOF',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: Date,
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

// Index
companySchema.index({ ninea: 1 });

// Virtual: adresse complete
companySchema.virtual('fullAddress').get(function () {
  const parts = [];
  if (this.address?.street) parts.push(this.address.street);
  if (this.address?.city) parts.push(this.address.city);
  if (this.address?.region) parts.push(this.address.region);
  if (this.address?.country) parts.push(this.address.country);
  return parts.join(', ');
});

// Index compose isActive + createdAt
companySchema.index({ isActive: 1, createdAt: -1 });

// Exclure les soft-deleted par defaut
companySchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// Methode softDelete
companySchema.methods.softDelete = function (userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('Company', companySchema);
