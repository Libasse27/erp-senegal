const Category = require('../models/Category');
const Product = require('../models/Product');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Get all categories as tree structure
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = async (req, res, next) => {
  try {
    // Flat list with optional parent filter
    const filter = {};
    if (req.query.parent === 'null' || req.query.parent === '') {
      filter.parent = null;
    } else if (req.query.parent) {
      filter.parent = req.query.parent;
    }

    const categories = await Category.find(filter)
      .populate('parent', 'name slug')
      .populate('productCount')
      .sort('order name');

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get full category tree (hierarchical)
 * @route   GET /api/categories/tree
 * @access  Private
 */
const getCategoryTree = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate('productCount')
      .sort('order name')
      .lean();

    // Build tree structure
    const map = {};
    const tree = [];

    categories.forEach((cat) => {
      map[cat._id.toString()] = { ...cat, children: [] };
    });

    categories.forEach((cat) => {
      if (cat.parent) {
        const parentId = cat.parent.toString();
        if (map[parentId]) {
          map[parentId].children.push(map[cat._id.toString()]);
        }
      } else {
        tree.push(map[cat._id.toString()]);
      }
    });

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single category
 * @route   GET /api/categories/:id
 * @access  Private
 */
const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate('productCount');

    if (!category) {
      return next(new AppError('Categorie non trouvee.', 404));
    }

    // Get children
    const children = await Category.find({ parent: category._id })
      .populate('productCount')
      .sort('order name');

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        children,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Private
 */
const createCategory = async (req, res, next) => {
  try {
    // Validate parent exists if provided
    if (req.body.parent) {
      const parentExists = await Category.findById(req.body.parent);
      if (!parentExists) {
        return next(new AppError('Categorie parent non trouvee.', 404));
      }
    }

    const category = await Category.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Categorie creee avec succes',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private
 */
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return next(new AppError('Categorie non trouvee.', 404));
    }

    // Prevent setting self as parent
    if (req.body.parent && req.body.parent === req.params.id) {
      return next(new AppError('Une categorie ne peut pas etre son propre parent.', 400));
    }

    // Validate parent if provided
    if (req.body.parent) {
      const parentExists = await Category.findById(req.body.parent);
      if (!parentExists) {
        return next(new AppError('Categorie parent non trouvee.', 404));
      }
    }

    req._previousData = category.toObject();

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    res.json({
      success: true,
      message: 'Categorie modifiee avec succes',
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete category
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return next(new AppError('Categorie non trouvee.', 404));
    }

    // Check for child categories
    const childCount = await Category.countDocuments({ parent: category._id });
    if (childCount > 0) {
      return next(
        new AppError(
          `Cette categorie a ${childCount} sous-categorie(s). Supprimez-les ou reassignez-les d'abord.`,
          400
        )
      );
    }

    // Check for products in this category
    const productCount = await Product.countDocuments({ category: category._id, isActive: true });
    if (productCount > 0) {
      return next(
        new AppError(
          `Cette categorie contient ${productCount} produit(s). Reassignez-les avant de supprimer.`,
          400
        )
      );
    }

    await category.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Categorie supprimee avec succes',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
