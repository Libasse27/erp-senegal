const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Le nom du depot est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas depasser 100 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['principal', 'secondaire', 'transit', 'retour'],
      default: 'principal',
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true, default: 'Dakar' },
      region: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Senegal' },
    },
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    phone: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      min: 0,
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
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
warehouseSchema.index({ isActive: 1 });
warehouseSchema.index({ isDefault: 1 });
warehouseSchema.index({ name: 'text' });

// === PRE-SAVE ===
warehouseSchema.pre('save', async function (next) {
  if (!this.code) {
    const count = await mongoose.model('Warehouse').countDocuments();
    this.code = `DEP-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// === SOFT DELETE FILTER ===
warehouseSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
warehouseSchema.methods.softDelete = async function (userId) {
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

module.exports = mongoose.model('Warehouse', warehouseSchema);
