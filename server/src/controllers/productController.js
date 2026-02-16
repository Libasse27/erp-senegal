const Product = require('../models/Product');
const Category = require('../models/Category');
const Stock = require('../models/Stock');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all products with pagination, filters, and search
 * @route   GET /api/products
 * @access  Private
 */
const getProducts = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = {};

    if (req.query.category) filter.category = req.query.category;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.marque) filter.marque = { $regex: req.query.marque, $options: 'i' };
    if (req.query.tauxTVA !== undefined) filter.tauxTVA = Number(req.query.tauxTVA);

    // Price range filter
    if (req.query.prixMin || req.query.prixMax) {
      filter.prixVente = {};
      if (req.query.prixMin) filter.prixVente.$gte = Number(req.query.prixMin);
      if (req.query.prixMax) filter.prixVente.$lte = Number(req.query.prixMax);
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
        { barcode: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: products,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product with stock levels per warehouse
 * @route   GET /api/products/:id
 * @access  Private
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');

    if (!product) {
      return next(new AppError('Produit non trouve.', 404));
    }

    // Get stock levels per warehouse
    const stocks = await Stock.find({ product: product._id, isActive: true })
      .populate('warehouse', 'name code type')
      .sort('warehouse');

    const totalStock = stocks.reduce((sum, s) => sum + s.quantite, 0);
    const totalReserved = stocks.reduce((sum, s) => sum + s.quantiteReservee, 0);
    const totalValue = stocks.reduce((sum, s) => sum + s.valeurStock, 0);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        stocks,
        stockSummary: {
          totalStock,
          totalReserved,
          totalDisponible: totalStock - totalReserved,
          totalValue,
          isEnRupture: totalStock <= 0,
          isEnAlerte: totalStock > 0 && totalStock <= product.stockAlerte,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create product
 * @route   POST /api/products
 * @access  Private
 */
const createProduct = async (req, res, next) => {
  try {
    // Validate category exists
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return next(new AppError('Categorie non trouvee.', 404));
    }

    const product = await Product.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Produit cree avec succes',
      data: populatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new AppError('Produit non trouve.', 404));
    }

    // Validate category if being changed
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return next(new AppError('Categorie non trouvee.', 404));
      }
    }

    req._previousData = product.toObject();

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Produit modifie avec succes',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete product
 * @route   DELETE /api/products/:id
 * @access  Private
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new AppError('Produit non trouve.', 404));
    }

    // Check if product has stock
    const totalStock = await Stock.aggregate([
      { $match: { product: product._id, isActive: true } },
      { $group: { _id: null, total: { $sum: '$quantite' } } },
    ]);

    if (totalStock.length > 0 && totalStock[0].total > 0) {
      return next(
        new AppError(
          `Ce produit a encore ${totalStock[0].total} unites en stock. Videz le stock avant de supprimer.`,
          400
        )
      );
    }

    await product.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Produit supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
