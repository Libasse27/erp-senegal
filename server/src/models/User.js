const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Le prenom est requis'],
      trim: true,
      maxlength: [50, 'Le prenom ne peut pas depasser 50 caracteres'],
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [50, 'Le nom ne peut pas depasser 50 caracteres'],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir un email valide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caracteres'],
      select: false,
    },
    phone: { type: String, trim: true },

    scope: {
      type: String,
      enum: ['PLATFORM', 'ENTREPRISE'],
      required: true,
      default: 'ENTREPRISE',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Le role est requis'],
    },

    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },

    // ── Auth tokens ───────────────────────────────────────────────────────────
    refreshToken: { type: String, select: false },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // ── MFA (TOTP) ────────────────────────────────────────────────────────────
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret:  { type: String, select: false },

    // ── Sécurité — verrouillage après tentatives échouées ─────────────────────
    tentativesEchouees: { type: Number, default: 0 },
    verrouilleJusqua:   { type: Date, default: null },

    // ── Audit ─────────────────────────────────────────────────────────────────
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt:  Date,
    deletedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Index ─────────────────────────────────────────────────────────────────────
userSchema.index({ companyId: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1, createdAt: -1 });
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ── Compte verrouillé ? ───────────────────────────────────────────────────────
userSchema.virtual('estVerrouille').get(function () {
  return this.verrouilleJusqua && this.verrouilleJusqua > new Date();
});

// ── Hooks ─────────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// ── Méthodes ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  return resetToken;
};

// Enregistre une tentative de connexion échouée. Verrouille après 5 échecs (30 min).
userSchema.methods.enregistrerEchecConnexion = async function () {
  this.tentativesEchouees += 1;
  if (this.tentativesEchouees >= 5) {
    this.verrouilleJusqua = new Date(Date.now() + 30 * 60 * 1000);
  }
  return this.save({ validateBeforeSave: false });
};

// Réinitialise le compteur d'échecs après connexion réussie.
userSchema.methods.reinitialiserEchecs = async function () {
  if (this.tentativesEchouees > 0 || this.verrouilleJusqua) {
    this.tentativesEchouees = 0;
    this.verrouilleJusqua = null;
    return this.save({ validateBeforeSave: false });
  }
};

userSchema.methods.softDelete = function (userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive  = false;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
