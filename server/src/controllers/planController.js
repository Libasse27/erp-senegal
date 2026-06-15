const Plan = require('../models/Plan');
const Abonnement = require('../models/Abonnement');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Liste publique des plans actifs et visibles
 * @route   GET /api/plans
 * @access  Public
 */
const listPlans = async (_req, res, next) => {
  try {
    const plans = await Plan.find({ actif: true, visible: true })
      .sort({ ordreAffichage: 1, 'tarifs.mensuel': 1 })
      .select('-createdBy -modifiedBy -__v');

    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Détail d'un plan par son code
 * @route   GET /api/plans/:code
 * @access  Public
 */
const getPlan = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({
      code: req.params.code.toUpperCase(),
      actif: true,
    });

    if (!plan) return next(new AppError('Plan introuvable.', 404));

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// ── Administration Super Admin ────────────────────────────────────────────────

/**
 * @desc    Lister tous les plans (actifs et inactifs) — Super Admin
 * @route   GET /api/super-admin/plans
 * @access  Private / super_admin
 */
const listAllPlans = async (_req, res, next) => {
  try {
    const plans = await Plan.find({})
      .sort({ ordreAffichage: 1 })
      .select('-__v');

    res.json({ success: true, data: plans, total: plans.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Créer un plan
 * @route   POST /api/super-admin/plans
 * @access  Private / super_admin
 */
const createPlan = async (req, res, next) => {
  try {
    const plan = await Plan.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier un plan
 * @route   PUT /api/super-admin/plans/:id
 * @access  Private / super_admin
 *
 * ⚠ Modifier un plan n'impacte PAS les abonnés existants (grandfathering via planSnapshot).
 *   La modification ne s'applique qu'aux nouveaux abonnements et renouvellements.
 */
const updatePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );

    if (!plan) return next(new AppError('Plan introuvable.', 404));

    res.json({
      success: true,
      data: plan,
      message: 'Plan mis à jour. Les abonnés existants conservent leurs conditions (grandfathering).',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Désactiver un plan (soft disable)
 * @route   DELETE /api/super-admin/plans/:id
 * @access  Private / super_admin
 */
const deletePlan = async (req, res, next) => {
  try {
    // Vérifier qu'aucun abonnement actif ne dépend de ce plan
    const abonnementsActifs = await Abonnement.countDocuments({
      planId: req.params.id,
      statut: { $in: ['ACTIF', 'ESSAI', 'EN_PERIODE_GRACE'] },
    });

    if (abonnementsActifs > 0) {
      return next(
        new AppError(
          `Impossible de désactiver ce plan : ${abonnementsActifs} abonnement(s) actif(s) en dépendent.`,
          409
        )
      );
    }

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { actif: false, visible: false, modifiedBy: req.user._id },
      { new: true }
    );

    if (!plan) return next(new AppError('Plan introuvable.', 404));

    res.json({ success: true, message: 'Plan désactivé avec succès.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Migrer les abonnés d'un plan vers sa dernière version
 * @route   POST /api/super-admin/plans/:id/migrate-subscribers
 * @access  Private / super_admin
 *
 * Action explicite Super Admin : met à jour le planSnapshot des abonnements
 * actifs pour refléter la version courante du plan.
 */
const migrateSubscribers = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return next(new AppError('Plan introuvable.', 404));

    const snapshot = {
      code:       plan.code,
      nom:        plan.nom,
      tarifs:     plan.tarifs,
      limites:    plan.limites,
      modules:    plan.modules,
      features:   plan.features,
      version:    plan.version,
      snapshotAt: new Date(),
    };

    const result = await Abonnement.updateMany(
      { planId: plan._id, statut: { $in: ['ACTIF', 'ESSAI', 'EN_PERIODE_GRACE'] } },
      { $set: { planSnapshot: snapshot }, $push: { historique: { action: 'migration_snapshot', note: `Migré vers version ${plan.version}` } } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} abonnement(s) migré(s) vers la version ${plan.version} du plan ${plan.nom}.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listPlans, getPlan, listAllPlans, createPlan, updatePlan, deletePlan, migrateSubscribers };
