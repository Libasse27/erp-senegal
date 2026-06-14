const CommandeAchat = require('../models/CommandeAchat');
const Fournisseur = require('../models/Fournisseur');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const { tc, findByTenant } = require('../utils/tenantHelper');
const { generateEcritureFromReceptionAchat } = require('../services/comptabiliteService');
const logger = require('../config/logger');

/**
 * @desc    Get all commandes achat with pagination and filters
 * @route   GET /api/commandes-achat
 * @access  Private
 */
const getCommandesAchat = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = {};
    filter.companyId = tc(req);

    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.fournisseur) filter.fournisseur = req.query.fournisseur;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.dateCommande = {};
      if (req.query.dateFrom) filter.dateCommande.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.dateCommande.$lte = new Date(req.query.dateTo);
    }

    if (req.query.search) {
      filter.$or = [
        { numero: { $regex: req.query.search, $options: 'i' } },
        { 'fournisseurSnapshot.raisonSociale': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [commandes, total] = await Promise.all([
      CommandeAchat.find(filter)
        .populate('fournisseur', 'raisonSociale code email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      CommandeAchat.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({ success: true, data: commandes, meta: pagination });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single commande achat
 * @route   GET /api/commandes-achat/:id
 * @access  Private
 */
const getCommandeAchat = async (req, res, next) => {
  try {
    const commande = await CommandeAchat.findOne({ _id: req.params.id, companyId: tc(req) })
      .populate('fournisseur')
      .populate('lignes.product', 'nom reference prixAchat')
      .populate('createdBy', 'firstName lastName')
      .populate('modifiedBy', 'firstName lastName');

    if (!commande) {
      return next(new AppError('Commande achat non trouvee.', 404));
    }

    res.json({ success: true, data: commande });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new commande achat
 * @route   POST /api/commandes-achat
 * @access  Private
 */
const createCommandeAchat = async (req, res, next) => {
  try {
    const fournisseur = await findByTenant(Fournisseur, req.body.fournisseur, req);
    if (!fournisseur) {
      return next(new AppError('Fournisseur non trouve.', 404));
    }

    const fournisseurSnapshot = {
      raisonSociale: fournisseur.raisonSociale,
      email: fournisseur.email,
      phone: fournisseur.phone,
      address: fournisseur.address ? fournisseur.address.toObject() : {},
      ninea: fournisseur.ninea,
      rccm: fournisseur.rccm,
    };

    const commande = await CommandeAchat.create({
      ...req.body,
      companyId: tc(req),
      fournisseurSnapshot,
      createdBy: req.user._id,
    });

    const populated = await CommandeAchat.findById(commande._id)
      .populate('fournisseur', 'raisonSociale code email');

    res.status(201).json({
      success: true,
      message: 'Commande achat creee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update commande achat (only brouillon)
 * @route   PUT /api/commandes-achat/:id
 * @access  Private
 */
const updateCommandeAchat = async (req, res, next) => {
  try {
    const commande = await findByTenant(CommandeAchat, req.params.id, req);
    if (!commande) {
      return next(new AppError('Commande achat non trouvee.', 404));
    }

    if (commande.statut !== 'brouillon') {
      return next(
        new AppError('Seules les commandes achat en brouillon peuvent etre modifiees.', 400)
      );
    }

    req._previousData = commande.toObject();

    Object.assign(commande, req.body);
    commande.modifiedBy = req.user._id;
    await commande.save();

    const populated = await CommandeAchat.findById(commande._id)
      .populate('fournisseur', 'raisonSociale code email');

    res.json({
      success: true,
      message: 'Commande achat modifiee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete commande achat (only brouillon)
 * @route   DELETE /api/commandes-achat/:id
 * @access  Private
 */
const deleteCommandeAchat = async (req, res, next) => {
  try {
    const commande = await findByTenant(CommandeAchat, req.params.id, req);
    if (!commande) {
      return next(new AppError('Commande achat non trouvee.', 404));
    }

    await commande.softDelete(req.user._id);

    res.json({ success: true, message: 'Commande achat supprimee avec succes' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change commande achat status
 * @route   PUT /api/commandes-achat/:id/statut
 * @access  Private
 */
const changeStatut = async (req, res, next) => {
  try {
    const commande = await findByTenant(CommandeAchat, req.params.id, req);
    if (!commande) {
      return next(new AppError('Commande achat non trouvee.', 404));
    }

    await commande.changerStatut(req.body.statut);

    res.json({
      success: true,
      message: `Statut change en "${req.body.statut}"`,
      data: commande,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get commandes achat statistics (KPIs + top fournisseurs)
 * @route   GET /api/commandes-achat/stats
 * @access  Private
 */
const getCommandesAchatStats = async (req, res, next) => {
  try {
    const companyId = tc(req);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [totalMois, enAttente, topFournisseurs] = await Promise.all([
      CommandeAchat.aggregate([
        {
          $match: {
            companyId,
            statut: { $in: ['confirmee', 'partiellement_recue', 'recue'] },
            dateCommande: { $gte: startOfMonth, $lte: endOfMonth },
            isActive: true,
          },
        },
        { $group: { _id: null, total: { $sum: '$totalTTC' }, count: { $sum: 1 } } },
      ]),
      CommandeAchat.countDocuments({
        companyId,
        statut: { $in: ['brouillon', 'envoyee', 'confirmee'] },
        isActive: true,
      }),
      CommandeAchat.aggregate([
        {
          $match: {
            companyId,
            statut: { $in: ['confirmee', 'partiellement_recue', 'recue'] },
            isActive: true,
          },
        },
        {
          $group: {
            _id: '$fournisseur',
            raisonSociale: { $first: '$fournisseurSnapshot.raisonSociale' },
            total: { $sum: '$totalTTC' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalAchatsMois: totalMois[0]?.total || 0,
        nbCommandesMois: totalMois[0]?.count || 0,
        commandesEnAttente: enAttente,
        topFournisseurs: topFournisseurs.map((f) => ({
          fournisseurId: f._id,
          raisonSociale: f.raisonSociale || 'N/A',
          total: f.total,
          count: f.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Receive goods from a commande achat (update stock + SYSCOHADA écriture)
 * @route   POST /api/commandes-achat/:id/reception
 * @access  Private
 */
const recevoirMarchandise = async (req, res, next) => {
  try {
    const commande = await CommandeAchat.findOne({ _id: req.params.id, companyId: tc(req) });
    if (!commande) return next(new AppError('Commande achat non trouvee.', 404));

    if (!['confirmee', 'partiellement_recue'].includes(commande.statut)) {
      return next(
        new AppError(
          `Impossible de receptionner une commande avec le statut "${commande.statut}". Statut requis : confirmee ou partiellement_recue.`,
          400
        )
      );
    }

    const { lignes: receptions, dateReception, notes } = req.body;
    let totalHTRecu = 0;
    let totalTVARecu = 0;
    let totalTTCRecu = 0;

    for (const reception of receptions) {
      const ligne = commande.lignes.id(reception.ligneId);
      if (!ligne) {
        return next(new AppError(`Ligne "${reception.ligneId}" non trouvee dans la commande.`, 404));
      }

      const restant = ligne.quantite - (ligne.quantiteRecue || 0);
      if (reception.quantiteRecue > restant) {
        return next(
          new AppError(
            `Quantite recue (${reception.quantiteRecue}) superieure au restant a recevoir (${restant}) pour "${ligne.designation}".`,
            400
          )
        );
      }

      // Upsert stock
      let stock = await Stock.findOne({
        product: ligne.product,
        warehouse: reception.warehouseId,
        companyId: tc(req),
      });

      const stockAvant = stock ? stock.quantite : 0;

      if (!stock) {
        stock = new Stock({
          companyId: tc(req),
          product: ligne.product,
          warehouse: reception.warehouseId,
          quantite: 0,
          cump: ligne.prixUnitaire,
          isActive: true,
        });
      }

      // Recalculate CUMP (Cout Unitaire Moyen Pondere)
      const ancienneValeur = stock.quantite * (stock.cump || 0);
      const nouvelleValeur = reception.quantiteRecue * ligne.prixUnitaire;
      const nouvQuantite = stock.quantite + reception.quantiteRecue;
      stock.cump = nouvQuantite > 0 ? Math.round((ancienneValeur + nouvelleValeur) / nouvQuantite) : ligne.prixUnitaire;
      stock.quantite = nouvQuantite;
      stock.valeurStock = stock.quantite * stock.cump;
      stock.lastMovementDate = new Date();
      stock.modifiedBy = req.user._id;
      await stock.save();

      // StockMovement trace
      await StockMovement.create({
        type: 'entree',
        motif: 'achat',
        product: ligne.product,
        warehouseDestination: reception.warehouseId,
        companyId: tc(req),
        quantite: reception.quantiteRecue,
        coutUnitaire: ligne.prixUnitaire,
        coutTotal: Math.round(reception.quantiteRecue * ligne.prixUnitaire),
        stockAvant,
        stockApres: stock.quantite,
        documentReference: commande.numero,
        documentType: 'commande_achat',
        documentId: commande._id,
        createdBy: req.user._id,
      });

      // Accumulate reception totals (pro-rata)
      const ratio = ligne.quantite > 0 ? reception.quantiteRecue / ligne.quantite : 0;
      totalHTRecu += Math.round((ligne.montantHT || 0) * ratio);
      totalTVARecu += Math.round((ligne.montantTVA || 0) * ratio);
      totalTTCRecu += Math.round((ligne.montantTTC || 0) * ratio);

      // Update received quantity on line
      ligne.quantiteRecue = (ligne.quantiteRecue || 0) + reception.quantiteRecue;
    }

    // Update commande status
    const allReceived = commande.lignes.every((l) => (l.quantiteRecue || 0) >= l.quantite);
    const someReceived = commande.lignes.some((l) => (l.quantiteRecue || 0) > 0);
    commande.statut = allReceived ? 'recue' : someReceived ? 'partiellement_recue' : commande.statut;
    if (notes) commande.notes = notes;
    commande.modifiedBy = req.user._id;

    await commande.save({ validateBeforeSave: false });

    // Generate SYSCOHADA accounting entry
    let ecritureId = null;
    try {
      const ecriture = await generateEcritureFromReceptionAchat(
        commande,
        {
          totalHT: totalHTRecu,
          totalTVA: totalTVARecu,
          totalTTC: totalTTCRecu,
          dateReception: dateReception ? new Date(dateReception) : new Date(),
        },
        req.user._id
      );
      ecritureId = ecriture._id;
    } catch (ecritureError) {
      logger.warn(`Ecriture comptable non generee pour reception ${commande.numero}: ${ecritureError.message}`);
    }

    res.json({
      success: true,
      message: `Marchandises receptionnees avec succes. Commande ${commande.statut === 'recue' ? 'entierement recue' : 'partiellement recue'}.`,
      data: commande,
      ecritureId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommandesAchat,
  getCommandeAchat,
  createCommandeAchat,
  updateCommandeAchat,
  deleteCommandeAchat,
  changeStatut,
  getCommandesAchatStats,
  recevoirMarchandise,
};
