const Warehouse = require('../models/Warehouse');
const Stock = require('../models/Stock');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all warehouses
 * @route   GET /api/warehouses
 * @access  Private
 */
const getWarehouses = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [warehouses, total] = await Promise.all([
      Warehouse.find(filter)
        .populate('responsable', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Warehouse.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.json({
      success: true,
      data: warehouses,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single warehouse with stock summary
 * @route   GET /api/warehouses/:id
 * @access  Private
 */
const getWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate(
      'responsable',
      'firstName lastName email'
    );

    if (!warehouse) {
      return next(new AppError('Depot non trouve.', 404));
    }

    // Get stock summary for this warehouse
    const stockSummary = await Stock.aggregate([
      { $match: { warehouse: warehouse._id, isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantite: { $sum: '$quantite' },
          totalValeur: { $sum: '$valeurStock' },
          totalReservee: { $sum: '$quantiteReservee' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        ...warehouse.toObject(),
        stockSummary: stockSummary[0] || {
          totalProducts: 0,
          totalQuantite: 0,
          totalValeur: 0,
          totalReservee: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create warehouse
 * @route   POST /api/warehouses
 * @access  Private
 */
const createWarehouse = async (req, res, next) => {
  try {
    // If setting as default, unset previous default
    if (req.body.isDefault) {
      await Warehouse.updateMany({ isDefault: true }, { isDefault: false });
    }

    const warehouse = await Warehouse.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Depot cree avec succes',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update warehouse
 * @route   PUT /api/warehouses/:id
 * @access  Private
 */
const updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return next(new AppError('Depot non trouve.', 404));
    }

    req._previousData = warehouse.toObject();

    // If setting as default, unset previous default
    if (req.body.isDefault) {
      await Warehouse.updateMany(
        { _id: { $ne: req.params.id }, isDefault: true },
        { isDefault: false }
      );
    }

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('responsable', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Depot modifie avec succes',
      data: updatedWarehouse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete warehouse
 * @route   DELETE /api/warehouses/:id
 * @access  Private
 */
const deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return next(new AppError('Depot non trouve.', 404));
    }

    // Check if warehouse has stock
    const stockCount = await Stock.countDocuments({
      warehouse: warehouse._id,
      quantite: { $gt: 0 },
      isActive: true,
    });

    if (stockCount > 0) {
      return next(
        new AppError(
          `Ce depot contient encore du stock (${stockCount} produit(s)). Transferez le stock avant de supprimer.`,
          400
        )
      );
    }

    if (warehouse.isDefault) {
      return next(new AppError('Le depot par defaut ne peut pas etre supprime.', 400));
    }

    await warehouse.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Depot supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
};
