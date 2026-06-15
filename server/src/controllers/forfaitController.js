/**
 * ForfaitController — alias rétrocompatibilité vers le modèle Plan.
 * La route /api/forfaits pointe ici ; /api/plans est la nouvelle route principale.
 */
const Plan = require('../models/Plan');
const { AppError } = require('../middlewares/errorHandler');

const listForfaits = async (_req, res, next) => {
  try {
    const plans = await Plan.find({ actif: true, visible: true })
      .sort({ ordreAffichage: 1, 'tarifs.mensuel': 1 })
      .select('-createdBy -modifiedBy -__v');

    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

const getForfait = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({
      code: req.params.code.toUpperCase(),
      actif: true,
    });

    if (!plan) return next(new AppError('Forfait introuvable.', 404));

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// Gardés pour compatibilité routes admin — créations/modifications via Plan
const createForfait = async (req, res, next) => {
  try {
    const plan = await Plan.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const updateForfait = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );

    if (!plan) return next(new AppError('Forfait introuvable.', 404));

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const deleteForfait = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { actif: false, visible: false, modifiedBy: req.user._id },
      { new: true }
    );

    if (!plan) return next(new AppError('Forfait introuvable.', 404));

    res.json({ success: true, message: 'Forfait désactivé avec succès.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listForfaits, getForfait, createForfait, updateForfait, deleteForfait };
