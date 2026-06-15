const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    annee:     { type: Number, required: true },
    mois:      { type: Number, min: 1, max: 12, default: null }, // null = budget annuel
    type:      { type: String, enum: ['produits', 'charges'], required: true },
    categorie: { type: String, required: true, maxlength: 100 },
    libelle:   { type: String, required: true, maxlength: 200 },
    montantPrevu: { type: Number, required: true, min: 0 },
    notes:     { type: String, maxlength: 500, default: '' },
    isActive:  { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

budgetSchema.index({ companyId: 1, annee: 1, mois: 1, type: 1 });
budgetSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
