const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const ligneRelanceSchema = new Schema(
  {
    facture:    { type: ObjectId, ref: 'Facture', required: true },
    numero:     { type: String },
    dateFacture: { type: Date },
    dateEcheance: { type: Date },
    montantTTC: { type: Number, default: 0 },
    montantPaye: { type: Number, default: 0 },
    montantDu:  { type: Number, default: 0 },
    joursRetard: { type: Number, default: 0 },
  },
  { _id: true }
);

const relanceSchema = new Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true, index: true },
    reference: { type: String, trim: true },

    client: { type: ObjectId, ref: 'Client', required: [true, 'Le client est requis'] },
    clientSnapshot: {
      name:  { type: String },
      email: { type: String },
      phone: { type: String },
    },

    factures: {
      type: [ligneRelanceSchema],
      validate: [(v) => v && v.length > 0, 'Au moins une facture est requise'],
    },

    niveau: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },
    statut: {
      type: String,
      enum: ['brouillon', 'envoyee', 'acquittee', 'annulee'],
      default: 'brouillon',
    },
    mode: {
      type: String,
      enum: ['email', 'telephone', 'courrier', 'sms'],
      default: 'email',
    },

    dateRelance: { type: Date, default: Date.now },
    dateEcheanceRelance: { type: Date }, // delai de réponse client

    montantTotalDu: { type: Number, default: 0 },
    notes: { type: String, trim: true, maxlength: 2000 },

    // Audit
    createdBy:    { type: ObjectId, ref: 'User' },
    acquittedBy:  { type: ObjectId, ref: 'User' },
    acquittedAt:  { type: Date },
    cancelledBy:  { type: ObjectId, ref: 'User' },
    cancelledAt:  { type: Date },

    // Soft delete
    isActive:  { type: Boolean, default: true },
    deletedAt: { type: Date },
    deletedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

relanceSchema.index({ companyId: 1, reference: 1 }, { unique: true, sparse: true });
relanceSchema.index({ companyId: 1, client: 1, statut: 1 });
relanceSchema.index({ companyId: 1, statut: 1, dateRelance: -1 });

// Auto-reference RLC2025-00001
relanceSchema.pre('save', async function (next) {
  if (!this.reference) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ companyId: this.companyId });
    this.reference = `RLC${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Soft delete filter
relanceSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

module.exports = mongoose.model('Relance', relanceSchema);
