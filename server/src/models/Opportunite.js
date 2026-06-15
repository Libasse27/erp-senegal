const mongoose = require('mongoose');

const opportuniteSchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    reference:   { type: String, required: true },

    titre:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },

    client:      { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   default: null },

    etape: {
      type: String,
      enum: ['prospect', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu'],
      default: 'prospect',
      index: true,
    },

    probabilite:   { type: Number, default: 10, min: 0, max: 100 },
    montantEstime: { type: Number, default: 0, min: 0 },
    dateEcheance:  { type: Date, default: null },

    sourceContact: {
      type: String,
      enum: ['appel_entrant', 'email', 'site_web', 'recommandation', 'salon', 'prospection', 'autre'],
      default: 'autre',
    },

    notes:    { type: String, default: '', maxlength: 2000 },
    devisId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Devis', default: null },
    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

opportuniteSchema.index({ companyId: 1, etape: 1, isActive: 1 });
opportuniteSchema.index({ companyId: 1, reference: 1 }, { unique: true });

module.exports = mongoose.model('Opportunite', opportuniteSchema);
