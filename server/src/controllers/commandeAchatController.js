const CommandeAchat = require('../models/CommandeAchat');
const Fournisseur = require('../models/Fournisseur');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all commandes achat with pagination and filters
 * @route   GET /api/commandes-achat
 * @access  Private
 */
const getCommandesAchat = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = {};

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
    const commande = await CommandeAchat.findById(req.params.id)
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
    const fournisseur = await Fournisseur.findById(req.body.fournisseur);
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
    const commande = await CommandeAchat.findById(req.params.id);
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
    const commande = await CommandeAchat.findById(req.params.id);
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
    const commande = await CommandeAchat.findById(req.params.id);
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

module.exports = {
  getCommandesAchat,
  getCommandeAchat,
  createCommandeAchat,
  updateCommandeAchat,
  deleteCommandeAchat,
  changeStatut,
};
