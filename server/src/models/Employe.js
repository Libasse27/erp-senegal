const mongoose = require('mongoose');

const employeSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    matricule:  { type: String, required: true },

    // Identité
    nom:           { type: String, required: true, trim: true, maxlength: 100 },
    prenom:        { type: String, required: true, trim: true, maxlength: 100 },
    email:         { type: String, trim: true, lowercase: true, default: '' },
    telephone:     { type: String, trim: true, default: '' },
    genre:         { type: String, enum: ['M', 'F'], default: 'M' },
    dateNaissance: { type: Date, default: null },
    nationalite:   { type: String, default: 'Sénégalaise', maxlength: 60 },
    adresse:       { type: String, default: '', maxlength: 300 },

    // Poste
    poste:       { type: String, required: true, trim: true, maxlength: 150 },
    departement: { type: String, required: true, trim: true, maxlength: 100 },

    // Contrat
    dateEmbauche: { type: Date, required: true },
    dateFin:      { type: Date, default: null }, // null pour CDI
    typeContrat:  { type: String, enum: ['CDI', 'CDD', 'Stage', 'Freelance'], required: true },
    statut:       { type: String, enum: ['actif', 'inactif', 'conge', 'suspendu'], default: 'actif', index: true },

    // Rémunération
    salaireBrut: { type: Number, required: true, min: 0 },
    tauxIPRES:   { type: Number, default: 5.6, min: 0, max: 100 },  // % cotisation salariale IPRES
    tauxIR:      { type: Number, default: 0,   min: 0, max: 100 },  // % IR retenu à la source
    salaireNet:  { type: Number, default: 0 },                       // calculé auto

    // Paiement
    modePaiement:  { type: String, enum: ['virement', 'especes', 'cheque', 'orange_money', 'wave'], default: 'virement' },
    numeroCompte:  { type: String, default: '', maxlength: 50 },

    notes:     { type: String, default: '', maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Calcul automatique du salaire net avant sauvegarde
employeSchema.pre('save', function (next) {
  const cotisations = this.salaireBrut * (this.tauxIPRES / 100);
  const ir = this.salaireBrut * (this.tauxIR / 100);
  this.salaireNet = Math.round(this.salaireBrut - cotisations - ir);
  next();
});

employeSchema.index({ companyId: 1, matricule: 1 }, { unique: true });
employeSchema.index({ companyId: 1, statut: 1 });
employeSchema.index({ companyId: 1, departement: 1 });

module.exports = mongoose.model('Employe', employeSchema);
