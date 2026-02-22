const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // Numero assigned at validation
    numero: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // Internal reference for drafts
    referenceInterne: {
      type: String,
      trim: true,
    },

    // Type: client payment or supplier payment
    typePaiement: {
      type: String,
      enum: ['client', 'fournisseur'],
      required: [true, 'Le type de paiement est requis'],
    },

    // Mode de paiement
    modePaiement: {
      type: String,
      enum: ['especes', 'cheque', 'virement', 'orange_money', 'wave', 'carte_bancaire'],
      required: [true, 'Le mode de paiement est requis'],
    },

    // Date du paiement
    datePaiement: {
      type: Date,
      required: [true, 'La date de paiement est requise'],
      default: Date.now,
    },

    // Montant
    montant: {
      type: Number,
      required: [true, 'Le montant est requis'],
      min: [1, 'Le montant doit etre superieur a 0'],
    },

    // Client or Fournisseur
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    fournisseur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fournisseur',
    },

    // Tiers snapshot
    tiersSnapshot: {
      displayName: String,
      email: String,
      phone: String,
    },

    // Associated invoice(s)
    facture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facture',
    },
    factureFournisseur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseInvoice',
    },

    // Multi-facture payment allocation
    allocations: [
      {
        facture: { type: mongoose.Schema.Types.ObjectId, ref: 'Facture' },
        montant: { type: Number, required: true, min: 0 },
      },
    ],

    // Bank account
    compteBancaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
    },

    // Cheque details
    detailsCheque: {
      numeroCheque: String,
      banqueEmettrice: String,
      dateEncaissement: Date,
    },

    // Mobile Money details
    detailsMobileMoney: {
      numeroTransaction: String,
      operateur: { type: String, enum: ['orange_money', 'wave'] },
      numeroTelephone: String,
    },

    // Virement details
    detailsVirement: {
      referenceBancaire: String,
      banqueOrigine: String,
    },

    // Status
    statut: {
      type: String,
      enum: ['brouillon', 'valide', 'annule'],
      default: 'brouillon',
    },

    // Ecriture comptable reference
    ecritureComptable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EcritureComptable',
    },

    // Notes
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
paymentSchema.index({ isActive: 1, createdAt: -1 });
paymentSchema.index({ typePaiement: 1 });
paymentSchema.index({ modePaiement: 1 });
paymentSchema.index({ statut: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ fournisseur: 1 });
paymentSchema.index({ facture: 1 });
paymentSchema.index({ compteBancaire: 1 });
paymentSchema.index({ datePaiement: 1 });

// === VIRTUALS ===
paymentSchema.virtual('displayNumero').get(function () {
  return this.numero || this.referenceInterne;
});

// === PRE-SAVE ===
paymentSchema.pre('save', async function (next) {
  // Generate internal reference for new payments
  if (!this.referenceInterne) {
    const count = await mongoose.model('Payment').countDocuments();
    this.referenceInterne = `TMP-PA-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// === PRE-VALIDATE ===
paymentSchema.pre('validate', function (next) {
  // Client payment must have client
  if (this.typePaiement === 'client' && !this.client) {
    this.invalidate('client', 'Le client est requis pour un paiement client');
  }
  // Supplier payment must have fournisseur
  if (this.typePaiement === 'fournisseur' && !this.fournisseur) {
    this.invalidate('fournisseur', 'Le fournisseur est requis pour un paiement fournisseur');
  }
  // Bank-based payments must have a bank account
  if (['cheque', 'virement'].includes(this.modePaiement) && !this.compteBancaire) {
    this.invalidate('compteBancaire', 'Le compte bancaire est requis pour ce mode de paiement');
  }
  next();
});

// === SOFT DELETE FILTER ===
paymentSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
paymentSchema.methods.softDelete = async function (userId) {
  if (this.statut === 'valide') {
    throw new Error('Un paiement valide ne peut pas etre supprime. Utilisez l\'annulation.');
  }
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);
