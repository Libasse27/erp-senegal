const Coupon     = require('../models/Coupon');
const Abonnement = require('../models/Abonnement');
const { AppError } = require('../middlewares/errorHandler');

// ── GET /super-admin/coupons ─────────────────────────────────────────────────
const listerCoupons = async (req, res, next) => {
  try {
    const { actif, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (actif !== undefined) filter.actif = actif === 'true';

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: coupons,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /super-admin/coupons ────────────────────────────────────────────────
const creerCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
};

// ── PUT /super-admin/coupons/:id ─────────────────────────────────────────────
const mettreAJourCoupon = async (req, res, next) => {
  try {
    const { code: _omitCode, ...updates } = req.body; // code immuable

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { ...updates, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!coupon) return next(new AppError('Coupon introuvable.', 404));
    res.json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /super-admin/coupons/:id ──────────────────────────────────────────
const supprimerCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { actif: false, modifiedBy: req.user._id },
      { new: true }
    );

    if (!coupon) return next(new AppError('Coupon introuvable.', 404));
    res.json({ success: true, message: 'Coupon désactivé.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /paiements-saas/valider-coupon ──────────────────────────────────────
// Route publique (company admin) — vérifie un coupon avant d'initier le paiement
const validerCoupon = async (req, res, next) => {
  try {
    const { code, planCode, periodicite, montant } = req.body;
    if (!code) return next(new AppError('code requis.', 400));

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

    if (!coupon || !coupon.estValide) {
      return res.json({ success: false, message: 'Code promo invalide ou expiré.', data: null });
    }

    // Éligibilité plan
    if (planCode && coupon.plansEligibles.length > 0 && !coupon.plansEligibles.includes(planCode)) {
      return res.json({ success: false, message: `Ce coupon n'est pas applicable à ce plan.`, data: null });
    }

    // Éligibilité périodicité
    if (periodicite && coupon.periodicitesEligibles.length > 0 && !coupon.periodicitesEligibles.includes(periodicite)) {
      return res.json({ success: false, message: `Ce coupon n'est pas applicable à cette périodicité.`, data: null });
    }

    const remise     = montant ? coupon.calculerRemise(Number(montant)) : null;
    const apresRemise = montant ? Number(montant) - remise : null;

    res.json({
      success: true,
      data: {
        code:         coupon.code,
        description:  coupon.description,
        type:         coupon.type,
        valeur:       coupon.valeur,
        remise,
        montantApresRemise: apresRemise,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listerCoupons, creerCoupon, mettreAJourCoupon, supprimerCoupon, validerCoupon };
