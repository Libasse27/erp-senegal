const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: [true, 'Le module est requis'],
      trim: true,
    },
    action: {
      type: String,
      required: [true, "L'action est requise"],
      enum: ['create', 'read', 'update', 'delete', 'export'],
    },
    code: {
      type: String,
      required: [true, 'Le code est requis'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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

// Index compose module + action
permissionSchema.index({ module: 1, action: 1 }, { unique: true });
permissionSchema.index({ code: 1 });

// Exclure les soft-deleted
permissionSchema.pre(/^find/, function () {
  this.where({ deletedAt: { $exists: false } });
});

// Methode softDelete
permissionSchema.methods.softDelete = function (userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('Permission', permissionSchema);
