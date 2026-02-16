const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du role est requis'],
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, "Le nom d'affichage est requis"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });

// Index compose isActive + createdAt
roleSchema.index({ isActive: 1, createdAt: -1 });

// Exclure les soft-deleted par defaut
roleSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// Methode softDelete
roleSchema.methods.softDelete = function (userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false;
  return this.save();
};

// Virtual: nombre de permissions
roleSchema.virtual('permissionCount').get(function () {
  return this.permissions ? this.permissions.length : 0;
});

module.exports = mongoose.model('Role', roleSchema);
