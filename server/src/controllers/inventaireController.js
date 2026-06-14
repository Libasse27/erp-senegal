const mongoose = require('mongoose');
const Inventaire = require('../models/Inventaire');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const { tc } = require('../utils/tenantHelper');

const getInventaires = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = { companyId: tc(req) };
    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.warehouse) filter.warehouse = req.query.warehouse;

    const [inventaires, total] = await Promise.all([
      Inventaire.find(filter)
        .populate('warehouse', 'name code')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Inventaire.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);
    res.set('X-Total-Count', total);
    res.json({ success: true, data: inventaires, meta: pagination });
  } catch (error) {
    next(error);
  }
};

const getInventaire = async (req, res, next) => {
  try {
    const inv = await Inventaire.findOne({ _id: req.params.id, companyId: tc(req) })
      .populate('warehouse', 'name code')
      .populate('validatedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    if (!inv) return next(new AppError('Inventaire introuvable', 404));
    res.json({ success: true, data: inv });
  } catch (error) {
    next(error);
  }
};

const createInventaire = async (req, res, next) => {
  try {
    const { warehouseId, dateInventaire, description } = req.body;
    const companyId = tc(req);

    // Snapshot all current stocks
    const stockFilter = { companyId, isActive: true };
    if (warehouseId) stockFilter.warehouse = warehouseId;

    const stocks = await Stock.find(stockFilter)
      .populate('product', 'name code unite prixAchat isStockable')
      .populate('warehouse', 'name');

    const lignes = stocks
      .filter((s) => s.product && s.product.isStockable !== false)
      .map((s) => ({
        product: s.product._id,
        productSnapshot: {
          name: s.product.name,
          code: s.product.code,
          unite: s.product.unite,
          prixAchat: s.product.prixAchat || 0,
        },
        warehouse: s.warehouse._id,
        warehouseName: s.warehouse.name,
        stockId: s._id,
        quantiteTheorique: s.quantite,
        quantiteComptee: null,
        cump: s.cump || s.product.prixAchat || 0,
      }));

    if (lignes.length === 0) {
      return next(new AppError('Aucun article en stock à inventorier pour ce dépôt', 400));
    }

    const inv = await Inventaire.create({
      companyId,
      warehouse: warehouseId || undefined,
      dateInventaire: dateInventaire || new Date(),
      description,
      lignes,
      nbLignes: lignes.length,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: inv, message: 'Inventaire créé' });
  } catch (error) {
    next(error);
  }
};

const updateInventaireLignes = async (req, res, next) => {
  try {
    const inv = await Inventaire.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!inv) return next(new AppError('Inventaire introuvable', 404));
    if (!['brouillon', 'en_cours'].includes(inv.statut)) {
      return next(new AppError('Seul un inventaire en brouillon ou en cours peut être modifié', 400));
    }

    const { lignes, description } = req.body;

    if (description !== undefined) inv.description = description;

    if (lignes && Array.isArray(lignes)) {
      lignes.forEach(({ ligneId, quantiteComptee, notes }) => {
        const ligne = inv.lignes.id(ligneId);
        if (ligne) {
          if (quantiteComptee !== undefined && quantiteComptee !== null) {
            ligne.quantiteComptee = Math.max(0, Number(quantiteComptee));
          }
          if (notes !== undefined) ligne.notes = notes;
        }
      });
    }

    inv.modifiedBy = req.user._id;
    await inv.save({ validateBeforeSave: false });
    res.json({ success: true, data: inv, message: 'Inventaire mis à jour' });
  } catch (error) {
    next(error);
  }
};

const demarrerInventaire = async (req, res, next) => {
  try {
    const inv = await Inventaire.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!inv) return next(new AppError('Inventaire introuvable', 404));
    if (inv.statut !== 'brouillon') {
      return next(new AppError("Seul un inventaire en brouillon peut être démarré", 400));
    }

    inv.statut = 'en_cours';
    inv.modifiedBy = req.user._id;
    await inv.save({ validateBeforeSave: false });

    res.json({ success: true, data: inv, message: 'Inventaire démarré — saisie des comptages activée' });
  } catch (error) {
    next(error);
  }
};

const validerInventaire = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const inv = await Inventaire.findOne({ _id: req.params.id, companyId: tc(req) }).session(session);
    if (!inv) { await session.abortTransaction(); return next(new AppError('Inventaire introuvable', 404)); }
    if (inv.statut !== 'en_cours') {
      await session.abortTransaction();
      return next(new AppError('Seul un inventaire en cours peut être validé', 400));
    }

    const companyId = tc(req);
    const movements = [];
    let nbComptees = 0;
    let nbAvecEcart = 0;
    let totalPos = 0;
    let totalNeg = 0;

    for (const ligne of inv.lignes) {
      if (ligne.quantiteComptee === null || ligne.quantiteComptee === undefined) continue;
      nbComptees++;

      const ecart = ligne.quantiteComptee - ligne.quantiteTheorique;
      if (ecart === 0) continue;

      nbAvecEcart++;
      const valEcart = Math.round(Math.abs(ecart) * (ligne.cump || 0));
      if (ecart > 0) totalPos += valEcart;
      else totalNeg += valEcart;

      // Update stock
      const stock = await Stock.findOne({
        companyId,
        product: ligne.product,
        warehouse: ligne.warehouse,
      }).session(session);

      if (stock) {
        stock.quantite = ligne.quantiteComptee;
        stock.valeurStock = Math.round(ligne.quantiteComptee * (ligne.cump || stock.cump));
        stock.lastMovementDate = new Date();
        stock.modifiedBy = req.user._id;
        await stock.save({ session, validateBeforeSave: false });
      }

      // Create stock movement
      movements.push({
        companyId,
        type: ecart > 0 ? 'entree' : 'sortie',
        motif: 'inventaire',
        reference: inv.reference,
        product: ligne.product,
        warehouseSource: ecart < 0 ? ligne.warehouse : undefined,
        warehouseDestination: ecart > 0 ? ligne.warehouse : undefined,
        quantite: Math.abs(ecart),
        coutUnitaire: ligne.cump || 0,
        coutTotal: valEcart,
        notes: `Inventaire physique ${inv.reference}${ligne.notes ? ' — ' + ligne.notes : ''}`,
        createdBy: req.user._id,
      });
    }

    if (movements.length > 0) {
      await StockMovement.insertMany(movements, { session });
    }

    inv.statut = 'valide';
    inv.validatedBy = req.user._id;
    inv.validatedAt = new Date();
    inv.nbLignesComptees = nbComptees;
    inv.nbLignesAvecEcart = nbAvecEcart;
    inv.totalEcartPositif = totalPos;
    inv.totalEcartNegatif = totalNeg;
    inv.modifiedBy = req.user._id;
    await inv.save({ session, validateBeforeSave: false });

    await session.commitTransaction();
    res.json({ success: true, data: inv, message: `Inventaire validé — ${nbAvecEcart} ajustement(s) de stock effectué(s)` });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

const annulerInventaire = async (req, res, next) => {
  try {
    const inv = await Inventaire.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!inv) return next(new AppError('Inventaire introuvable', 404));
    if (inv.statut === 'valide') {
      return next(new AppError('Un inventaire validé ne peut pas être annulé', 400));
    }

    inv.statut = 'annule';
    inv.modifiedBy = req.user._id;
    await inv.save({ validateBeforeSave: false });

    res.json({ success: true, data: inv, message: 'Inventaire annulé' });
  } catch (error) {
    next(error);
  }
};

const deleteInventaire = async (req, res, next) => {
  try {
    const inv = await Inventaire.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!inv) return next(new AppError('Inventaire introuvable', 404));
    if (inv.statut !== 'brouillon') {
      return next(new AppError('Seul un inventaire en brouillon peut être supprimé', 400));
    }

    inv.isActive = false;
    inv.deletedAt = new Date();
    inv.deletedBy = req.user._id;
    await inv.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Inventaire supprimé' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventaires,
  getInventaire,
  createInventaire,
  updateInventaireLignes,
  demarrerInventaire,
  validerInventaire,
  annulerInventaire,
  deleteInventaire,
};
