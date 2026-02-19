const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const logger = require('../config/logger');

/**
 * @desc    Get global stock overview with filters
 * @route   GET /api/stocks
 * @access  Private
 */
const getStocks = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = {};

    if (req.query.warehouse) filter.warehouse = req.query.warehouse;
    if (req.query.product) filter.product = req.query.product;

    // Stock status filters
    if (req.query.status === 'rupture') {
      filter.quantite = { $lte: 0 };
    } else if (req.query.status === 'alerte') {
      filter.quantite = { $gt: 0 };
    }

    const [stocks, total] = await Promise.all([
      Stock.find(filter)
        .populate('product', 'name code prixVente prixAchat stockMinimum stockAlerte unite isStockable')
        .populate('warehouse', 'name code type')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Stock.countDocuments(filter),
    ]);

    // Filter alert status after population (needs product.stockAlerte)
    let filteredStocks = stocks;
    if (req.query.status === 'alerte') {
      filteredStocks = stocks.filter(
        (s) => s.product && s.quantite <= s.product.stockAlerte && s.quantite > 0
      );
    }

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: filteredStocks,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single stock entry by ID
 * @route   GET /api/stocks/:id
 * @access  Private
 */
const getStock = async (req, res, next) => {
  try {
    const stock = await Stock.findById(req.params.id)
      .populate('product', 'name code prixVente prixAchat stockMinimum stockAlerte unite isStockable')
      .populate('warehouse', 'name code type');

    if (!stock) {
      return next(new AppError('Enregistrement de stock non trouve.', 404));
    }

    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single stock movement by ID
 * @route   GET /api/stocks/movements/:id
 * @access  Private
 */
const getMovement = async (req, res, next) => {
  try {
    const movement = await StockMovement.findById(req.params.id)
      .populate('product', 'name code unite')
      .populate('warehouseSource', 'name code')
      .populate('warehouseDestination', 'name code')
      .populate('createdBy', 'firstName lastName');

    if (!movement) {
      return next(new AppError('Mouvement de stock non trouve.', 404));
    }

    res.json({
      success: true,
      data: movement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get stock alerts (rupture, seuil, peremption)
 * @route   GET /api/stocks/alerts
 * @access  Private
 */
const getStockAlerts = async (req, res, next) => {
  try {
    const stocks = await Stock.find({ isActive: true })
      .populate('product', 'name code stockMinimum stockAlerte hasExpiry unite')
      .populate('warehouse', 'name code');

    const alerts = {
      rupture: [],
      seuilAlerte: [],
      seuilMinimum: [],
      peremption: [],
    };

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    stocks.forEach((stock) => {
      if (!stock.product) return;

      if (stock.quantite <= 0) {
        alerts.rupture.push(stock);
      } else if (stock.quantite <= stock.product.stockMinimum) {
        alerts.seuilMinimum.push(stock);
      } else if (stock.quantite <= stock.product.stockAlerte) {
        alerts.seuilAlerte.push(stock);
      }

      if (stock.expiryDate && stock.expiryDate <= in30Days) {
        alerts.peremption.push(stock);
      }
    });

    res.json({
      success: true,
      data: alerts,
      summary: {
        rupture: alerts.rupture.length,
        seuilAlerte: alerts.seuilAlerte.length,
        seuilMinimum: alerts.seuilMinimum.length,
        peremption: alerts.peremption.length,
        total:
          alerts.rupture.length +
          alerts.seuilAlerte.length +
          alerts.seuilMinimum.length +
          alerts.peremption.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get stock movement history
 * @route   GET /api/stocks/movements
 * @access  Private
 */
const getMovements = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = {};

    if (req.query.product) filter.product = req.query.product;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.motif) filter.motif = req.query.motif;
    if (req.query.warehouse) {
      filter.$or = [
        { warehouseSource: req.query.warehouse },
        { warehouseDestination: req.query.warehouse },
      ];
    }

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('product', 'name code unite')
        .populate('warehouseSource', 'name code')
        .populate('warehouseDestination', 'name code')
        .populate('createdBy', 'firstName lastName')
        .sort(sort || '-date')
        .skip(skip)
        .limit(limit),
      StockMovement.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: movements,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create manual stock movement (entry/exit/adjustment)
 * @route   POST /api/stocks/movements
 * @access  Private
 */
const createMovement = async (req, res, next) => {
  try {
    const { type, motif, product, warehouseSource, warehouseDestination, quantite, coutUnitaire, notes } = req.body;

    // Validate product exists
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return next(new AppError('Produit non trouve.', 404));
    }

    if (!productDoc.isStockable) {
      return next(new AppError('Ce produit n\'est pas stockable (service).', 400));
    }

    // Handle based on movement type
    if (type === 'entree') {
      if (!warehouseDestination) {
        return next(new AppError('Le depot de destination est requis pour une entree.', 400));
      }

      const warehouseDest = await Warehouse.findById(warehouseDestination);
      if (!warehouseDest) {
        return next(new AppError('Depot de destination non trouve.', 404));
      }

      // Find or create stock entry
      let stock = await Stock.findOne({ product, warehouse: warehouseDestination });
      if (!stock) {
        stock = new Stock({
          product,
          warehouse: warehouseDestination,
          quantite: 0,
          cump: coutUnitaire || productDoc.prixAchat,
          createdBy: req.user._id,
        });
      }

      const stockBefore = stock.quantite;
      stock.updateCUMP(quantite, coutUnitaire || productDoc.prixAchat);
      stock.modifiedBy = req.user._id;
      await stock.save();

      const movement = await StockMovement.create({
        type,
        motif,
        product,
        warehouseDestination,
        quantite,
        coutUnitaire: coutUnitaire || productDoc.prixAchat,
        stockAvant: stockBefore,
        stockApres: stock.quantite,
        notes,
        createdBy: req.user._id,
      });

      const populatedMovement = await StockMovement.findById(movement._id)
        .populate('product', 'name code')
        .populate('warehouseDestination', 'name code');

      return res.status(201).json({
        success: true,
        message: 'Mouvement d\'entree enregistre avec succes',
        data: populatedMovement,
      });
    }

    if (type === 'sortie') {
      if (!warehouseSource) {
        return next(new AppError('Le depot source est requis pour une sortie.', 400));
      }

      const stock = await Stock.findOne({ product, warehouse: warehouseSource });
      if (!stock) {
        return next(new AppError('Aucun stock trouve pour ce produit dans ce depot.', 404));
      }

      if (stock.quantiteDisponible < quantite) {
        return next(
          new AppError(
            `Stock insuffisant. Disponible: ${stock.quantiteDisponible}, Demande: ${quantite}`,
            400
          )
        );
      }

      const stockBefore = stock.quantite;
      stock.quantite -= quantite;
      stock.valeurStock = Math.round(stock.quantite * stock.cump);
      stock.lastMovementDate = new Date();
      stock.modifiedBy = req.user._id;
      await stock.save();

      const movement = await StockMovement.create({
        type,
        motif,
        product,
        warehouseSource,
        quantite,
        coutUnitaire: stock.cump,
        stockAvant: stockBefore,
        stockApres: stock.quantite,
        notes,
        createdBy: req.user._id,
      });

      const populatedMovement = await StockMovement.findById(movement._id)
        .populate('product', 'name code')
        .populate('warehouseSource', 'name code');

      // Emit alert if stock is low
      if (stock.quantite <= productDoc.stockAlerte) {
        const io = req.app.get('io');
        if (io) {
          io.to('role:gestionnaire_stock').emit('stock:alert', {
            type: stock.quantite <= 0 ? 'rupture' : 'alerte',
            product: { name: productDoc.name, code: productDoc.code },
            quantite: stock.quantite,
            warehouse: warehouseSource,
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Mouvement de sortie enregistre avec succes',
        data: populatedMovement,
      });
    }

    if (type === 'ajustement') {
      const warehouseId = warehouseDestination || warehouseSource;
      if (!warehouseId) {
        return next(new AppError('Un depot est requis pour un ajustement.', 400));
      }

      let stock = await Stock.findOne({ product, warehouse: warehouseId });
      if (!stock) {
        stock = new Stock({
          product,
          warehouse: warehouseId,
          quantite: 0,
          cump: productDoc.prixAchat,
          createdBy: req.user._id,
        });
      }

      const stockBefore = stock.quantite;

      if (motif === 'ajustement_positif') {
        stock.quantite += quantite;
      } else if (motif === 'ajustement_negatif' || motif === 'perte') {
        if (stock.quantite < quantite) {
          return next(new AppError(`Stock insuffisant pour cet ajustement. Stock actuel: ${stock.quantite}`, 400));
        }
        stock.quantite -= quantite;
      }

      stock.valeurStock = Math.round(stock.quantite * stock.cump);
      stock.lastMovementDate = new Date();
      stock.modifiedBy = req.user._id;
      await stock.save();

      const movement = await StockMovement.create({
        type: 'ajustement',
        motif,
        product,
        warehouseSource: motif === 'ajustement_negatif' || motif === 'perte' ? warehouseId : undefined,
        warehouseDestination: motif === 'ajustement_positif' ? warehouseId : undefined,
        quantite,
        coutUnitaire: stock.cump,
        stockAvant: stockBefore,
        stockApres: stock.quantite,
        notes,
        createdBy: req.user._id,
      });

      const populatedMovement = await StockMovement.findById(movement._id)
        .populate('product', 'name code')
        .populate('warehouseSource', 'name code')
        .populate('warehouseDestination', 'name code');

      return res.status(201).json({
        success: true,
        message: 'Ajustement de stock enregistre avec succes',
        data: populatedMovement,
      });
    }

    return next(new AppError('Type de mouvement invalide. Utilisez /api/stocks/transfer pour les transferts.', 400));
  } catch (error) {
    logger.error(`Erreur mouvement stock: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Transfer stock between warehouses
 * @route   POST /api/stocks/transfer
 * @access  Private
 */
const transferStock = async (req, res, next) => {
  try {
    const { product, warehouseSource, warehouseDestination, quantite, notes } = req.body;

    if (warehouseSource === warehouseDestination) {
      return next(new AppError('Le depot source et destination doivent etre differents.', 400));
    }

    // Validate entities
    const [productDoc, srcWarehouse, destWarehouse] = await Promise.all([
      Product.findById(product),
      Warehouse.findById(warehouseSource),
      Warehouse.findById(warehouseDestination),
    ]);

    if (!productDoc) return next(new AppError('Produit non trouve.', 404));
    if (!srcWarehouse) return next(new AppError('Depot source non trouve.', 404));
    if (!destWarehouse) return next(new AppError('Depot destination non trouve.', 404));

    // Check source stock
    const sourceStock = await Stock.findOne({ product, warehouse: warehouseSource });
    if (!sourceStock || sourceStock.quantiteDisponible < quantite) {
      return next(
        new AppError(
          `Stock insuffisant dans ${srcWarehouse.name}. Disponible: ${sourceStock ? sourceStock.quantiteDisponible : 0}`,
          400
        )
      );
    }

    // Decrease source
    const srcBefore = sourceStock.quantite;
    sourceStock.quantite -= quantite;
    sourceStock.valeurStock = Math.round(sourceStock.quantite * sourceStock.cump);
    sourceStock.lastMovementDate = new Date();
    sourceStock.modifiedBy = req.user._id;
    await sourceStock.save();

    // Increase destination
    let destStock = await Stock.findOne({ product, warehouse: warehouseDestination });
    if (!destStock) {
      destStock = new Stock({
        product,
        warehouse: warehouseDestination,
        quantite: 0,
        cump: sourceStock.cump,
        createdBy: req.user._id,
      });
    }

    const destBefore = destStock.quantite;
    destStock.updateCUMP(quantite, sourceStock.cump);
    destStock.modifiedBy = req.user._id;
    await destStock.save();

    // Create movement record
    const movement = await StockMovement.create({
      type: 'transfert',
      motif: 'transfert',
      product,
      warehouseSource,
      warehouseDestination,
      quantite,
      coutUnitaire: sourceStock.cump,
      stockAvant: srcBefore,
      stockApres: sourceStock.quantite,
      notes,
      createdBy: req.user._id,
    });

    const populatedMovement = await StockMovement.findById(movement._id)
      .populate('product', 'name code')
      .populate('warehouseSource', 'name code')
      .populate('warehouseDestination', 'name code');

    res.status(201).json({
      success: true,
      message: `Transfert de ${quantite} unite(s) de ${srcWarehouse.name} vers ${destWarehouse.name} effectue`,
      data: populatedMovement,
    });
  } catch (error) {
    logger.error(`Erreur transfert stock: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getStocks,
  getStock,
  getStockAlerts,
  getMovement,
  getMovements,
  createMovement,
  transferStock,
};
