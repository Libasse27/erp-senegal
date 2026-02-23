const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Le type de mouvement est requis'],
      enum: ['entree', 'sortie', 'transfert', 'ajustement', 'retour'],
    },
    motif: {
      type: String,
      required: [true, 'Le motif est requis'],
      enum: [
        'achat',
        'vente',
        'transfert',
        'inventaire',
        'retour_client',
        'retour_fournisseur',
        'ajustement_positif',
        'ajustement_negatif',
        'perte',
        'don',
        'production',
        'autre',
      ],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Le produit est requis'],
    },
    warehouseSource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    warehouseDestination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    quantite: {
      type: Number,
      required: [true, 'La quantite est requise'],
      min: [1, 'La quantite doit etre superieure a 0'],
    },
    coutUnitaire: {
      type: Number,
      default: 0,
      min: 0,
    },
    coutTotal: {
      type: Number,
      default: 0,
    },

    // Stock before/after for traceability
    stockAvant: {
      type: Number,
      default: 0,
    },
    stockApres: {
      type: Number,
      default: 0,
    },

    // Reference to the source document (order, invoice, inventory, etc.)
    documentReference: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ['commande', 'facture', 'bon_livraison', 'inventaire', 'commande_fournisseur', 'reception', 'manuel'],
      default: 'manuel',
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: 1000,
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
// reference already indexed via unique: true in schema definition
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ warehouseSource: 1, createdAt: -1 });
stockMovementSchema.index({ warehouseDestination: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1 });

// === PRE-SAVE ===
stockMovementSchema.pre('save', async function (next) {
  if (!this.reference) {
    const count = await mongoose.model('StockMovement').countDocuments();
    const prefix = this.type === 'entree' ? 'MVE' : this.type === 'sortie' ? 'MVS' : 'MVT';
    this.reference = `${prefix}-${String(count + 1).padStart(6, '0')}`;
  }
  this.coutTotal = Math.round(this.quantite * this.coutUnitaire);
  next();
});

// === SOFT DELETE FILTER ===
stockMovementSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
stockMovementSchema.methods.softDelete = async function (userId) {
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

module.exports = mongoose.model('StockMovement', stockMovementSchema);
