const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // === IDENTIFICATION ===
    code: {
      type: String,
      unique: true,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, 'Le nom du produit est requis'],
      trim: true,
      maxlength: [200, 'Le nom ne peut pas depasser 200 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'La description ne peut pas depasser 2000 caracteres'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'La description courte ne peut pas depasser 500 caracteres'],
    },

    // === CLASSIFICATION ===
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categorie est requise'],
    },
    type: {
      type: String,
      enum: ['produit', 'service'],
      default: 'produit',
    },
    marque: {
      type: String,
      trim: true,
    },
    unite: {
      type: String,
      trim: true,
      default: 'Unite',
    },

    // === PRIX (en FCFA, entiers) ===
    prixAchat: {
      type: Number,
      required: [true, 'Le prix d\'achat est requis'],
      min: [0, 'Le prix d\'achat ne peut pas etre negatif'],
    },
    prixVente: {
      type: Number,
      required: [true, 'Le prix de vente est requis'],
      min: [0, 'Le prix de vente ne peut pas etre negatif'],
    },
    prixVenteGros: {
      type: Number,
      min: 0,
      default: null,
    },
    prixVenteSpecial: {
      type: Number,
      min: 0,
      default: null,
    },

    // === TVA ===
    tauxTVA: {
      type: Number,
      enum: [0, 18],
      default: 18,
    },
    isExonere: {
      type: Boolean,
      default: false,
    },

    // === STOCK ===
    isStockable: {
      type: Boolean,
      default: true,
    },
    stockMinimum: {
      type: Number,
      default: 5,
      min: 0,
    },
    stockMaximum: {
      type: Number,
      default: 1000,
      min: 0,
    },
    stockAlerte: {
      type: Number,
      default: 10,
      min: 0,
    },

    // === IMAGES ===
    images: [
      {
        url: { type: String },
        alt: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // === DIMENSIONS / POIDS ===
    poids: {
      type: Number,
      min: 0,
      default: null,
    },
    dimensions: {
      longueur: { type: Number, min: 0 },
      largeur: { type: Number, min: 0 },
      hauteur: { type: Number, min: 0 },
    },

    // === PEREMPTION ===
    hasExpiry: {
      type: Boolean,
      default: false,
    },
    defaultExpiryDays: {
      type: Number,
      min: 0,
      default: null,
    },

    // === NOTES ===
    notes: {
      type: String,
      maxlength: 2000,
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
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ type: 1 });
productSchema.index({ prixVente: 1 });
productSchema.index({ name: 'text', description: 'text', code: 'text', barcode: 'text' });

// === VIRTUALS ===
productSchema.virtual('margeBrute').get(function () {
  if (!this.prixVente || !this.prixAchat) return 0;
  return this.prixVente - this.prixAchat;
});

productSchema.virtual('tauxMarge').get(function () {
  if (!this.prixAchat || this.prixAchat === 0) return 0;
  return Math.round(((this.prixVente - this.prixAchat) / this.prixAchat) * 100 * 100) / 100;
});

productSchema.virtual('prixVenteHT').get(function () {
  if (!this.prixVente) return 0;
  if (this.isExonere || this.tauxTVA === 0) return this.prixVente;
  return Math.round(this.prixVente / (1 + this.tauxTVA / 100));
});

productSchema.virtual('primaryImage').get(function () {
  if (!this.images || this.images.length === 0) return null;
  const primary = this.images.find((img) => img.isPrimary);
  return primary ? primary.url : this.images[0].url;
});

// === PRE-SAVE: Auto-generate product code ===
productSchema.pre('save', async function (next) {
  if (!this.code) {
    const count = await mongoose.model('Product').countDocuments();
    this.code = `PRD-${String(count + 1).padStart(5, '0')}`;
  }
  // Sync TVA
  if (this.isExonere) {
    this.tauxTVA = 0;
  }
  next();
});

// === SOFT DELETE FILTER ===
productSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
productSchema.methods.softDelete = async function (userId) {
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

module.exports = mongoose.model('Product', productSchema);
