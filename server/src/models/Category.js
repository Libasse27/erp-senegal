const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la categorie est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas depasser 100 caracteres'],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La description ne peut pas depasser 500 caracteres'],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },

    // === AUDIT ===
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
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

// === INDEXES ===
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, order: 1 });
categorySchema.index({ name: 'text' });

// === VIRTUALS ===
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

// === PRE-SAVE: Generate slug ===
categorySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// === SOFT DELETE FILTER ===
categorySchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  } else {
    delete this._conditions.includeDeleted;
  }
  next();
});

// === METHODS ===
categorySchema.methods.softDelete = async function (userId) {
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

/**
 * Get the full category path from root to this category
 */
categorySchema.methods.getPath = async function () {
  const path = [this];
  let current = this;
  while (current.parent) {
    current = await mongoose.model('Category').findById(current.parent);
    if (!current) break;
    path.unshift(current);
  }
  return path;
};

module.exports = mongoose.model('Category', categorySchema);
