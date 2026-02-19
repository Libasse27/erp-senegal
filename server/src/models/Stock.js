const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Le produit est requis'],
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Le depot est requis'],
    },
    quantite: {
      type: Number,
      default: 0,
      min: [0, 'La quantite ne peut pas etre negative'],
    },
    quantiteReservee: {
      type: Number,
      default: 0,
      min: 0,
    },
    // CUMP = Cout Unitaire Moyen Pondere
    cump: {
      type: Number,
      default: 0,
      min: 0,
    },
    valeurStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMovementDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
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
stockSchema.index({ product: 1, warehouse: 1 }, { unique: true });
stockSchema.index({ isActive: 1 });
stockSchema.index({ quantite: 1 });
stockSchema.index({ product: 1 });
stockSchema.index({ warehouse: 1 });

// === VIRTUALS ===
stockSchema.virtual('quantiteDisponible').get(function () {
  return Math.max(0, this.quantite - this.quantiteReservee);
});

stockSchema.virtual('isEnRupture').get(function () {
  return this.quantite <= 0;
});

stockSchema.virtual('isEnAlerte').get(function () {
  if (this.populated('product') && this.product) {
    return this.quantite > 0 && this.quantite <= (this.product.stockAlerte || 0);
  }
  return false;
});

// === PRE-SAVE: Recalculate stock value ===
stockSchema.pre('save', function (next) {
  this.valeurStock = Math.round(this.quantite * this.cump);
  next();
});

// === SOFT DELETE FILTER ===
stockSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
stockSchema.methods.softDelete = async function (userId) {
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

/**
 * Update CUMP (Cout Unitaire Moyen Pondere) on stock entry
 * New CUMP = (old qty * old CUMP + new qty * unit cost) / (old qty + new qty)
 */
stockSchema.methods.updateCUMP = function (newQuantity, unitCost) {
  const totalOldValue = this.quantite * this.cump;
  const totalNewValue = newQuantity * unitCost;
  const totalQuantity = this.quantite + newQuantity;

  if (totalQuantity > 0) {
    this.cump = Math.round((totalOldValue + totalNewValue) / totalQuantity);
  }
  this.quantite = totalQuantity;
  this.valeurStock = Math.round(this.quantite * this.cump);
  this.lastMovementDate = new Date();
};

module.exports = mongoose.model('Stock', stockSchema);
