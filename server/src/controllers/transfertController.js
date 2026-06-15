const mongoose = require('mongoose');
const Transfert = require('../models/Transfert');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const { tc } = require('../utils/tenantHelper');

const getTransferts = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = { companyId: tc(req) };

    if (req.query.statut)               filter.statut = req.query.statut;
    if (req.query.warehouseSource)      filter.warehouseSource = req.query.warehouseSource;
    if (req.query.warehouseDestination) filter.warehouseDestination = req.query.warehouseDestination;
    if (req.query.search) {
      filter.reference = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.dateFrom || req.query.dateTo) {
      filter.dateTransfert = {};
      if (req.query.dateFrom) filter.dateTransfert.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo)   filter.dateTransfert.$lte = new Date(req.query.dateTo);
    }

    const [transferts, total] = await Promise.all([
      Transfert.find(filter)
        .populate('warehouseSource', 'name code')
        .populate('warehouseDestination', 'name code')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Transfert.countDocuments(filter),
    ]);

    const meta = buildPaginationResponse(total, page, limit);
    res.set('X-Total-Count', total);
    res.json({ success: true, data: transferts, meta });
  } catch (err) {
    next(err);
  }
};

const getTransfert = async (req, res, next) => {
  try {
    const t = await Transfert.findOne({ _id: req.params.id, companyId: tc(req) })
      .populate('warehouseSource', 'name code city')
      .populate('warehouseDestination', 'name code city')
      .populate('createdBy', 'firstName lastName')
      .populate('validatedBy', 'firstName lastName')
      .populate('cancelledBy', 'firstName lastName')
      .populate('lignes.product', 'name code unite');

    if (!t) return next(new AppError('Transfert introuvable', 404));
    res.json({ success: true, data: t });
  } catch (err) {
    next(err);
  }
};

const createTransfert = async (req, res, next) => {
  try {
    const { warehouseSource, warehouseDestination, lignes, dateTransfert, motif, notes } = req.body;
    const companyId = tc(req);

    if (String(warehouseSource) === String(warehouseDestination)) {
      return next(new AppError('Le dépôt source et de destination doivent être différents', 400));
    }
    if (!lignes || lignes.length === 0) {
      return next(new AppError('Au moins une ligne de produit est requise', 400));
    }

    // Snapshot product info
    const Product = mongoose.model('Product');
    const productIds = [...new Set(lignes.map((l) => l.product))];
    const products = await Product.find({ _id: { $in: productIds }, companyId }).lean();
    const productMap = {};
    products.forEach((p) => { productMap[String(p._id)] = p; });

    const lignesFormatted = lignes.map((l) => {
      const prod = productMap[String(l.product)];
      return {
        product: l.product,
        productSnapshot: prod
          ? { name: prod.name, code: prod.code, unite: prod.unite }
          : {},
        quantite: Number(l.quantite),
      };
    });

    const transfert = await Transfert.create({
      companyId,
      warehouseSource,
      warehouseDestination,
      lignes: lignesFormatted,
      dateTransfert: dateTransfert || new Date(),
      motif,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: transfert, message: 'Transfert créé' });
  } catch (err) {
    next(err);
  }
};

const updateTransfert = async (req, res, next) => {
  try {
    const t = await Transfert.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!t) return next(new AppError('Transfert introuvable', 404));
    if (t.statut !== 'brouillon') {
      return next(new AppError('Seul un transfert en brouillon peut être modifié', 400));
    }

    const { warehouseSource, warehouseDestination, lignes, dateTransfert, motif, notes } = req.body;

    if (warehouseSource && warehouseDestination &&
        String(warehouseSource) === String(warehouseDestination)) {
      return next(new AppError('Le dépôt source et de destination doivent être différents', 400));
    }

    if (warehouseSource)      t.warehouseSource = warehouseSource;
    if (warehouseDestination) t.warehouseDestination = warehouseDestination;
    if (dateTransfert)        t.dateTransfert = dateTransfert;
    if (motif !== undefined)  t.motif = motif;
    if (notes !== undefined)  t.notes = notes;

    if (lignes && Array.isArray(lignes)) {
      const Product = mongoose.model('Product');
      const productIds = [...new Set(lignes.map((l) => l.product))];
      const products = await Product.find({ _id: { $in: productIds }, companyId: tc(req) }).lean();
      const productMap = {};
      products.forEach((p) => { productMap[String(p._id)] = p; });

      t.lignes = lignes.map((l) => {
        const prod = productMap[String(l.product)];
        return {
          product: l.product,
          productSnapshot: prod ? { name: prod.name, code: prod.code, unite: prod.unite } : {},
          quantite: Number(l.quantite),
        };
      });
    }

    await t.save();
    res.json({ success: true, data: t, message: 'Transfert mis à jour' });
  } catch (err) {
    next(err);
  }
};

const deleteTransfert = async (req, res, next) => {
  try {
    const t = await Transfert.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!t) return next(new AppError('Transfert introuvable', 404));
    if (t.statut !== 'brouillon') {
      return next(new AppError('Seul un transfert en brouillon peut être supprimé', 400));
    }
    t.isActive = false;
    t.deletedAt = new Date();
    t.deletedBy = req.user._id;
    await t.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Transfert supprimé' });
  } catch (err) {
    next(err);
  }
};

const validerTransfert = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const companyId = tc(req);
    const t = await Transfert.findOne({ _id: req.params.id, companyId }).session(session);
    if (!t) { await session.abortTransaction(); return next(new AppError('Transfert introuvable', 404)); }
    if (t.statut !== 'brouillon') {
      await session.abortTransaction();
      return next(new AppError('Seul un transfert en brouillon peut être validé', 400));
    }

    // Check no duplicate products in lignes
    const productIds = t.lignes.map((l) => String(l.product));
    if (new Set(productIds).size !== productIds.length) {
      await session.abortTransaction();
      return next(new AppError('Un produit ne peut apparaître qu\'une seule fois par transfert', 400));
    }

    // Pre-check stock availability
    for (const ligne of t.lignes) {
      const stock = await Stock.findOne({
        companyId,
        product: ligne.product,
        warehouse: t.warehouseSource,
      }).session(session);

      if (!stock || stock.quantite < ligne.quantite) {
        await session.abortTransaction();
        const nom = ligne.productSnapshot?.name || String(ligne.product);
        const dispo = stock ? stock.quantite : 0;
        return next(new AppError(
          `Stock insuffisant pour "${nom}" : disponible ${dispo}, demandé ${ligne.quantite}`,
          400
        ));
      }
    }

    // Apply transfers
    for (const ligne of t.lignes) {
      // --- SOURCE ---
      const srcStock = await Stock.findOne({
        companyId, product: ligne.product, warehouse: t.warehouseSource,
      }).session(session);

      const stockAvantSrc = srcStock.quantite;
      const sourceCump = srcStock.cump || 0;
      srcStock.quantite -= ligne.quantite;
      srcStock.valeurStock = Math.round(srcStock.quantite * sourceCump);
      srcStock.lastMovementDate = new Date();
      await srcStock.save({ session });

      // snapshot stock au moment de la validation
      ligne.stockSource = stockAvantSrc;

      // --- DESTINATION ---
      let dstStock = await Stock.findOne({
        companyId, product: ligne.product, warehouse: t.warehouseDestination,
      }).session(session);

      if (!dstStock) {
        // Create new stock entry for this product/warehouse
        [dstStock] = await Stock.create(
          [{
            companyId,
            product: ligne.product,
            warehouse: t.warehouseDestination,
            quantite: 0,
            cump: sourceCump,
            valeurStock: 0,
            createdBy: req.user._id,
          }],
          { session }
        );
      }

      dstStock.updateCUMP(ligne.quantite, sourceCump);
      dstStock.lastMovementDate = new Date();
      await dstStock.save({ session });

      // --- MOVEMENT (single transfert record) ---
      await StockMovement.create(
        [{
          companyId,
          type: 'transfert',
          motif: 'transfert',
          product: ligne.product,
          warehouseSource: t.warehouseSource,
          warehouseDestination: t.warehouseDestination,
          quantite: ligne.quantite,
          coutUnitaire: sourceCump,
          stockAvant: stockAvantSrc,
          stockApres: srcStock.quantite,
          documentReference: t.reference,
          documentType: 'manuel',
          documentId: t._id,
          notes: t.motif,
          date: t.dateTransfert,
          createdBy: req.user._id,
        }],
        { session }
      );
    }

    t.statut = 'valide';
    t.validatedBy = req.user._id;
    t.validatedAt = new Date();
    await t.save({ session, validateBeforeSave: false });

    await session.commitTransaction();
    res.json({ success: true, data: t, message: `Transfert ${t.reference} validé — stocks ajustés` });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

const annulerTransfert = async (req, res, next) => {
  try {
    const t = await Transfert.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!t) return next(new AppError('Transfert introuvable', 404));
    if (t.statut !== 'brouillon') {
      return next(new AppError('Seul un transfert en brouillon peut être annulé', 400));
    }
    t.statut = 'annule';
    t.cancelledBy = req.user._id;
    t.cancelledAt = new Date();
    await t.save({ validateBeforeSave: false });
    res.json({ success: true, data: t, message: 'Transfert annulé' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTransferts,
  getTransfert,
  createTransfert,
  updateTransfert,
  deleteTransfert,
  validerTransfert,
  annulerTransfert,
};
