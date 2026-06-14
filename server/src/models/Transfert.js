const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const ligneTransfertSchema = new Schema(
  {
    product: { type: ObjectId, ref: 'Product', required: true },
    productSnapshot: {
      name:  { type: String },
      code:  { type: String },
      unite: { type: String },
    },
    quantite: {
      type: Number,
      required: [true, 'La quantité est requise'],
      min: [1, 'La quantité doit être supérieure ou égale à 1'],
    },
    stockSource: { type: Number, default: 0 }, // snapshot au moment de la validation
  },
  { _id: true }
);

const transfertSchema = new Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true, index: true },
    reference: { type: String, trim: true },
    warehouseSource:      { type: ObjectId, ref: 'Warehouse', required: [true, 'Le dépôt source est requis'] },
    warehouseDestination: { type: ObjectId, ref: 'Warehouse', required: [true, 'Le dépôt de destination est requis'] },
    lignes: {
      type: [ligneTransfertSchema],
      validate: [(v) => v && v.length > 0, 'Au moins une ligne de produit est requise'],
    },
    statut: {
      type: String,
      enum: ['brouillon', 'valide', 'annule'],
      default: 'brouillon',
    },
    dateTransfert: { type: Date, default: Date.now },
    motif: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 1000 },

    // Audit
    createdBy:    { type: ObjectId, ref: 'User' },
    validatedBy:  { type: ObjectId, ref: 'User' },
    validatedAt:  { type: Date },
    cancelledBy:  { type: ObjectId, ref: 'User' },
    cancelledAt:  { type: Date },

    // Soft delete
    isActive:  { type: Boolean, default: true },
    deletedAt: { type: Date },
    deletedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

transfertSchema.index({ companyId: 1, reference: 1 }, { unique: true, sparse: true });
transfertSchema.index({ companyId: 1, statut: 1, dateTransfert: -1 });

// Auto-reference: TRF2025-00001
transfertSchema.pre('save', async function (next) {
  if (!this.reference) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ companyId: this.companyId });
    this.reference = `TRF${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Soft delete filter
transfertSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

module.exports = mongoose.model('Transfert', transfertSchema);
