const Fournisseur = require('../models/Fournisseur');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all fournisseurs with pagination, filters, and search
 * @route   GET /api/fournisseurs
 * @access  Private
 */
const getFournisseurs = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = {};

    if (req.query.category) filter.category = req.query.category;

    if (req.query.search) {
      filter.$or = [
        { raisonSociale: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [fournisseurs, total] = await Promise.all([
      Fournisseur.find(filter).sort(sort).skip(skip).limit(limit),
      Fournisseur.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: fournisseurs,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single fournisseur with full details
 * @route   GET /api/fournisseurs/:id
 * @access  Private
 */
const getFournisseur = async (req, res, next) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id);

    if (!fournisseur) {
      return next(new AppError('Fournisseur non trouve.', 404));
    }

    res.json({
      success: true,
      data: fournisseur,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new fournisseur
 * @route   POST /api/fournisseurs
 * @access  Private
 */
const createFournisseur = async (req, res, next) => {
  try {
    const fournisseur = await Fournisseur.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Fournisseur cree avec succes',
      data: fournisseur,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update fournisseur
 * @route   PUT /api/fournisseurs/:id
 * @access  Private
 */
const updateFournisseur = async (req, res, next) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) {
      return next(new AppError('Fournisseur non trouve.', 404));
    }

    req._previousData = fournisseur.toObject();

    const updatedFournisseur = await Fournisseur.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Fournisseur modifie avec succes',
      data: updatedFournisseur,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete fournisseur
 * @route   DELETE /api/fournisseurs/:id
 * @access  Private
 */
const deleteFournisseur = async (req, res, next) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) {
      return next(new AppError('Fournisseur non trouve.', 404));
    }

    if (fournisseur.totalDettes > 0) {
      return next(
        new AppError(
          `Ce fournisseur a un solde de dettes de ${fournisseur.totalDettes} FCFA. Regularisez avant de supprimer.`,
          400
        )
      );
    }

    await fournisseur.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Fournisseur supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFournisseurs,
  getFournisseur,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
};
