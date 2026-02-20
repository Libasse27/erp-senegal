const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/sequenceHelper');

const ligneBLSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Le produit est requis'],
    },
    designation: {
      type: String,
      required: [true, 'La designation est requise'],
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    quantite: {
      type: Number,
      required: [true, 'La quantite est requise'],
      min: [0.01, 'La quantite doit etre superieure a 0'],
    },
    unite: {
      type: String,
      default: 'Unite',
      trim: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Le depot est requis'],
    },
    // Reference to commande line _id
    ligneCommandeId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { _id: true }
);

const bonLivraisonSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      unique: true,
      trim: true,
    },

    // Source commande
    commande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commande',
      required: [true, 'La commande est requise'],
    },

    // Client reference
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Le client est requis'],
    },
    clientSnapshot: {
      displayName: String,
      email: String,
      phone: String,
      address: {
        street: String,
        city: String,
        region: String,
        postalCode: String,
        country: String,
      },
    },

    // Dates
    dateLivraison: {
      type: Date,
      default: Date.now,
    },

    // Status
    statut: {
      type: String,
      enum: ['brouillon', 'valide', 'annule'],
      default: 'brouillon',
    },

    // Lines
    lignes: {
      type: [ligneBLSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Le bon de livraison doit contenir au moins une ligne',
      },
    },

    // Client signature
    signatureClient: {
      nom: { type: String, trim: true },
      date: { type: Date },
      commentaire: { type: String, maxlength: 500 },
    },

    // Address
    adresseLivraison: {
      street: String,
      city: String,
      region: String,
      postalCode: String,
      country: String,
    },

    // Generated facture reference
    facture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facture',
    },

    notes: {
      type: String,
      maxlength: 2000,
    },

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validatedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// === INDEXES ===
// numero already indexed via unique: true
bonLivraisonSchema.index({ commande: 1 });
bonLivraisonSchema.index({ client: 1 });
bonLivraisonSchema.index({ statut: 1 });
bonLivraisonSchema.index({ isActive: 1, createdAt: -1 });

// === PRE-SAVE ===
bonLivraisonSchema.pre('save', async function (next) {
  if (!this.numero) {
    const { numero } = await getNextSequence('deliveryNote');
    this.numero = numero;
  }
  next();
});

// === SOFT DELETE FILTER ===
bonLivraisonSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
bonLivraisonSchema.methods.softDelete = async function (userId) {
  if (this.statut !== 'brouillon') {
    throw new Error('Seuls les bons de livraison en brouillon peuvent etre supprimes');
  }
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

module.exports = mongoose.model('BonLivraison', bonLivraisonSchema);
