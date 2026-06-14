const Forfait = require('../models/Forfait');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Liste publique des forfaits actifs (pour la page d'inscription)
 * @route   GET /api/forfaits
 * @access  Public
 */
const listForfaits = async (_req, res, next) => {
  try {
    const forfaits = await Forfait.find({ actif: true })
      .sort({ ordre: 1, prixMensuel: 1 })
      .select('-createdBy -modifiedBy -__v');

    res.json({
      success: true,
      data: forfaits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Detail d'un forfait
 * @route   GET /api/forfaits/:code
 * @access  Public
 */
const getForfait = async (req, res, next) => {
  try {
    const forfait = await Forfait.findOne({
      code: req.params.code.toUpperCase(),
      actif: true,
    });

    if (!forfait) {
      return next(new AppError('Forfait introuvable.', 404));
    }

    res.json({ success: true, data: forfait });
  } catch (error) {
    next(error);
  }
};

// ── Administration Super-Admin ────────────────────────────────────────────────

/**
 * @desc    Creer un forfait (super_admin)
 * @route   POST /api/admin/forfaits
 * @access  Private / super_admin
 */
const createForfait = async (req, res, next) => {
  try {
    const forfait = await Forfait.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: forfait });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier un forfait (super_admin)
 * @route   PUT /api/admin/forfaits/:id
 * @access  Private / super_admin
 */
const updateForfait = async (req, res, next) => {
  try {
    const forfait = await Forfait.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!forfait) return next(new AppError('Forfait introuvable.', 404));

    res.json({ success: true, data: forfait });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Desactiver un forfait (super_admin — soft disable)
 * @route   DELETE /api/admin/forfaits/:id
 * @access  Private / super_admin
 */
const deleteForfait = async (req, res, next) => {
  try {
    const forfait = await Forfait.findByIdAndUpdate(
      req.params.id,
      { actif: false, modifiedBy: req.user._id },
      { new: true }
    );

    if (!forfait) return next(new AppError('Forfait introuvable.', 404));

    res.json({ success: true, message: 'Forfait desactive avec succes.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listForfaits, getForfait, createForfait, updateForfait, deleteForfait };
