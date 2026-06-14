const mongoose = require('mongoose');

const ligneInventaireSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productSnapshot: {
      name: String,
      code: String,
      unite: String,
      prixAchat: Number,
    },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    warehouseName: String,
    stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock' },
    quantiteTheorique: { type: Number, default: 0, min: 0 },
    quantiteComptee: { type: Number, default: null },
    cump: { type: Number, default: 0 },
    notes: { type: String, maxlength: 500 },
  },
  { _id: true }
);

ligneInventaireSchema.virtual('ecart').get(function () {
  if (this.quantiteComptee === null || this.quantiteComptee === undefined) return null;
  return this.quantiteComptee - this.quantiteTheorique;
});

ligneInventaireSchema.virtual('valeurEcart').get(function () {
  const ecart = this.ecart;
  if (ecart === null) return null;
  return Math.round(ecart * (this.cump || 0));
});

const inventaireSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    reference: { type: String, trim: true },

    statut: {
      type: String,
      enum: ['brouillon', 'en_cours', 'valide', 'annule'],
      default: 'brouillon',
    },

    dateInventaire: { type: Date, default: Date.now },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    description: { type: String, maxlength: 1000 },

    lignes: { type: [ligneInventaireSchema], default: [] },

    // Computed at validation
    nbLignes: { type: Number, default: 0 },
    nbLignesComptees: { type: Number, default: 0 },
    nbLignesAvecEcart: { type: Number, default: 0 },
    totalEcartPositif: { type: Number, default: 0 },
    totalEcartNegatif: { type: Number, default: 0 },

    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

inventaireSchema.index({ companyId: 1, reference: 1 }, { sparse: true });
inventaireSchema.index({ companyId: 1, statut: 1, dateInventaire: -1 });

inventaireSchema.pre('save', async function (next) {
  if (!this.reference && this.companyId) {
    const count = await this.constructor.countDocuments({ companyId: this.companyId });
    const year = new Date().getFullYear();
    this.reference = `INV${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

inventaireSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

module.exports = mongoose.model('Inventaire', inventaireSchema);
