const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    // === IDENTIFICATION ===
    type: {
      type: String,
      enum: ['particulier', 'professionnel'],
      default: 'professionnel',
    },
    code: {
      type: String,
      unique: true,
      trim: true,
    },
    raisonSociale: {
      type: String,
      trim: true,
      maxlength: [200, 'La raison sociale ne peut pas depasser 200 caracteres'],
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'Le prenom ne peut pas depasser 50 caracteres'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Le nom ne peut pas depasser 50 caracteres'],
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
    segment: {
      type: String,
      enum: ['A', 'B', 'C'],
      default: 'C',
    },
    category: {
      type: String,
      enum: ['grossiste', 'detaillant', 'distributeur', 'institutionnel', 'particulier', 'autre'],
      default: 'autre',
    },
    delaiPaiement: {
      type: Number,
      default: 30,
      min: 0,
      max: 365,
    },
    plafondCredit: {
      type: Number,
      default: 0,
      min: 0,
    },
    remiseGlobale: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    modePaiement: {
      type: String,
      enum: ['especes', 'cheque', 'virement', 'orange_money', 'wave', 'carte_bancaire'],
      default: 'especes',
    },

    // === FINANCIER ===
    totalCA: {
      type: Number,
      default: 0,
    },
    totalCreances: {
      type: Number,
      default: 0,
    },
    nombreFactures: {
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
clientSchema.index({ email: 1 }, { sparse: true });
clientSchema.index({ type: 1, segment: 1 });
clientSchema.index({ 'address.city': 1 });
clientSchema.index({ isActive: 1, createdAt: -1 });
clientSchema.index({
  raisonSociale: 'text',
  firstName: 'text',
  lastName: 'text',
  email: 'text',
});

// === VIRTUALS ===
clientSchema.virtual('displayName').get(function () {
  if (this.type === 'professionnel' && this.raisonSociale) {
    return this.raisonSociale;
  }
  return [this.firstName, this.lastName].filter(Boolean).join(' ') || 'Client sans nom';
});

clientSchema.virtual('fullAddress').get(function () {
  const parts = [];
  if (this.address?.street) parts.push(this.address.street);
  if (this.address?.city) parts.push(this.address.city);
  if (this.address?.region) parts.push(this.address.region);
  if (this.address?.country) parts.push(this.address.country);
  return parts.join(', ');
});

// === PRE-SAVE: Auto-generate client code ===
clientSchema.pre('save', async function (next) {
  if (!this.code) {
    const count = await mongoose.model('Client').countDocuments();
    this.code = `CLI-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// === SOFT DELETE FILTER ===
clientSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
clientSchema.methods.softDelete = async function (userId) {
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

/**
 * Update ABC segmentation based on total CA
 * A = top 20%, B = next 30%, C = bottom 50%
 */
clientSchema.statics.updateSegmentation = async function () {
  const clients = await this.find({ isActive: true }).sort({ totalCA: -1 });
  const total = clients.length;
  if (total === 0) return;

  const topA = Math.ceil(total * 0.2);
  const topB = Math.ceil(total * 0.5);

  const bulkOps = clients.map((client, index) => {
    let segment = 'C';
    if (index < topA) segment = 'A';
    else if (index < topB) segment = 'B';

    return {
      updateOne: {
        filter: { _id: client._id },
        update: { $set: { segment } },
      },
    };
  });

  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps);
  }
};

module.exports = mongoose.model('Client', clientSchema);
