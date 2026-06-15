const mongoose = require('mongoose');

const congeSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    employe:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employe', required: true },

    type: {
      type: String,
      enum: ['conge_annuel', 'maladie', 'maternite', 'paternite', 'sans_solde', 'autre'],
      required: true,
    },

    dateDebut: { type: Date, required: true },
    dateFin:   { type: Date, required: true },
    nbJours:   { type: Number, required: true, min: 0.5 },

    statut: {
      type: String,
      enum: ['en_attente', 'approuve', 'refuse', 'annule'],
      default: 'en_attente',
      index: true,
    },

    motif:           { type: String, default: '', maxlength: 500 },
    commentaireRH:   { type: String, default: '', maxlength: 500 },
    approuvePar:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dateApprobation: { type: Date, default: null },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

congeSchema.index({ companyId: 1, employe: 1, statut: 1 });
congeSchema.index({ companyId: 1, dateDebut: 1 });

module.exports = mongoose.model('Conge', congeSchema);
