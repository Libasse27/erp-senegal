const mongoose = require('mongoose');

const activiteSchema = new mongoose.Schema(
  {
    companyId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    opportunite:  { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunite', default: null },
    client:       { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },

    type: {
      type: String,
      enum: ['appel', 'email', 'reunion', 'demonstration', 'relance', 'autre'],
      required: true,
    },

    titre:         { type: String, required: true, trim: true, maxlength: 200 },
    description:   { type: String, default: '', maxlength: 1000 },
    dateActivite:  { type: Date, required: true },
    dureeMinutes:  { type: Number, default: 0, min: 0 },

    statut: {
      type: String,
      enum: ['planifie', 'realise', 'annule'],
      default: 'planifie',
      index: true,
    },

    resultat:    { type: String, default: '', maxlength: 1000 },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

activiteSchema.index({ companyId: 1, opportunite: 1 });
activiteSchema.index({ companyId: 1, dateActivite: -1 });
activiteSchema.index({ companyId: 1, statut: 1 });

module.exports = mongoose.model('Activite', activiteSchema);
