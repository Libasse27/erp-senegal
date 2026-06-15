const Budget = require('../models/Budget');
const Facture = require('../models/Facture');
const FactureFournisseur = require('../models/FactureFournisseur');
const Payment = require('../models/Payment');
const { AppError } = require('../middlewares/errorHandler');
const { tc } = require('../utils/tenantHelper');

// ─── Liste ──────────────────────────────────────────────────────────────────

const getBudgets = async (req, res, next) => {
  try {
    const { annee, mois, type } = req.query;
    const filter = { companyId: tc(req), isActive: true };
    if (annee)  filter.annee = Number(annee);
    if (mois)   filter.mois  = mois === 'annuel' ? null : Number(mois);
    if (type)   filter.type  = type;

    const budgets = await Budget.find(filter)
      .sort({ type: 1, categorie: 1, mois: 1 })
      .lean();

    res.json({ success: true, data: budgets });
  } catch (error) { next(error); }
};

// ─── Détail ──────────────────────────────────────────────────────────────────

const getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, companyId: tc(req), isActive: true });
    if (!budget) return next(new AppError('Budget introuvable', 404));
    res.json({ success: true, data: budget });
  } catch (error) { next(error); }
};

// ─── Création ────────────────────────────────────────────────────────────────

const createBudget = async (req, res, next) => {
  try {
    const { annee, mois, type, categorie, libelle, montantPrevu, notes } = req.body;
    if (!annee || !type || !categorie || !libelle || montantPrevu === undefined) {
      return next(new AppError('Champs requis : annee, type, categorie, libelle, montantPrevu', 400));
    }
    const budget = await Budget.create({
      companyId: tc(req),
      annee,
      mois: mois || null,
      type,
      categorie,
      libelle,
      montantPrevu,
      notes: notes || '',
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: budget, message: 'Budget créé' });
  } catch (error) { next(error); }
};

// ─── Mise à jour ─────────────────────────────────────────────────────────────

const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, companyId: tc(req), isActive: true });
    if (!budget) return next(new AppError('Budget introuvable', 404));
    const { annee, mois, type, categorie, libelle, montantPrevu, notes } = req.body;
    if (annee !== undefined)        budget.annee        = annee;
    if (mois  !== undefined)        budget.mois         = mois || null;
    if (type)                       budget.type         = type;
    if (categorie)                  budget.categorie    = categorie;
    if (libelle)                    budget.libelle      = libelle;
    if (montantPrevu !== undefined)  budget.montantPrevu = montantPrevu;
    if (notes !== undefined)         budget.notes        = notes;
    budget.modifiedBy = req.user._id;
    await budget.save();
    res.json({ success: true, data: budget, message: 'Budget mis à jour' });
  } catch (error) { next(error); }
};

// ─── Suppression (soft) ───────────────────────────────────────────────────────

const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, companyId: tc(req), isActive: true });
    if (!budget) return next(new AppError('Budget introuvable', 404));
    budget.isActive   = false;
    budget.modifiedBy = req.user._id;
    await budget.save();
    res.json({ success: true, message: 'Budget supprimé' });
  } catch (error) { next(error); }
};

// ─── Comparaison Budget vs Réalisé ───────────────────────────────────────────

const getBudgetComparaison = async (req, res, next) => {
  try {
    const cId  = tc(req);
    const annee = Number(req.query.annee) || new Date().getFullYear();
    const mois  = req.query.mois ? Number(req.query.mois) : null;

    // Plage de dates pour les données réalisées
    const dateFrom = mois
      ? new Date(annee, mois - 1, 1)
      : new Date(annee, 0, 1);
    const dateTo = mois
      ? new Date(annee, mois, 0, 23, 59, 59)
      : new Date(annee, 11, 31, 23, 59, 59);

    // Budgets de la période
    const budgetFilter = { companyId: cId, isActive: true, annee };
    if (mois !== null) {
      budgetFilter.$or = [{ mois }, { mois: null }];
    }
    const budgets = await Budget.find(budgetFilter).sort({ type: 1, categorie: 1 }).lean();

    // Réalisé PRODUITS — CA factures validées
    const realiseProduits = await Facture.aggregate([
      {
        $match: {
          companyId: cId,
          dateFacture: { $gte: dateFrom, $lte: dateTo },
          statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalTTC' } } },
    ]);

    // Réalisé CHARGES — Factures fournisseurs
    const realiseCharges = await FactureFournisseur.aggregate([
      {
        $match: {
          companyId: cId,
          dateFacture: { $gte: dateFrom, $lte: dateTo },
        },
      },
      { $group: { _id: null, total: { $sum: '$montantTTC' } } },
    ]);

    // Réalisé paiements clients (encaissé)
    const realiseEncaisse = await Payment.aggregate([
      {
        $match: {
          companyId: cId,
          datePaiement: { $gte: dateFrom, $lte: dateTo },
          statut: 'valide',
          typePaiement: 'client',
        },
      },
      { $group: { _id: null, total: { $sum: '$montant' } } },
    ]);

    const totalPrevu = (type) =>
      budgets.filter((b) => b.type === type).reduce((s, b) => s + b.montantPrevu, 0);

    const totalPrevuProduits = totalPrevu('produits');
    const totalPrevuCharges  = totalPrevu('charges');
    const totalRealiseProduits = realiseProduits[0]?.total || 0;
    const totalRealiseCharges  = realiseCharges[0]?.total  || 0;
    const totalEncaisse        = realiseEncaisse[0]?.total  || 0;

    // Résumé par catégorie
    const parCategorie = [];
    const categories = [...new Set(budgets.map((b) => `${b.type}::${b.categorie}`))];
    for (const key of categories) {
      const [type, categorie] = key.split('::');
      const lignes = budgets.filter((b) => b.type === type && b.categorie === categorie);
      const prevu  = lignes.reduce((s, b) => s + b.montantPrevu, 0);
      const realise = type === 'produits' ? totalRealiseProduits : totalRealiseCharges;
      parCategorie.push({
        type,
        categorie,
        prevu,
        realise: categories.filter((k) => k.startsWith(`${type}::`)).length === 1 ? realise : null,
        ecart: prevu - realise,
        tauxRealisation: prevu > 0 ? Math.round((realise / prevu) * 100) : null,
        lignes,
      });
    }

    res.json({
      success: true,
      data: {
        annee,
        mois,
        kpis: {
          totalPrevuProduits,
          totalPrevuCharges,
          totalRealiseProduits,
          totalRealiseCharges,
          totalEncaisse,
          resultatPrevu:   totalPrevuProduits   - totalPrevuCharges,
          resultatRealise: totalRealiseProduits - totalRealiseCharges,
          tauxRealisationProduits: totalPrevuProduits  > 0 ? Math.round((totalRealiseProduits / totalPrevuProduits) * 100) : null,
          tauxRealisationCharges:  totalPrevuCharges   > 0 ? Math.round((totalRealiseCharges  / totalPrevuCharges)  * 100) : null,
        },
        budgets,
        parCategorie,
        dateFrom,
        dateTo,
      },
    });
  } catch (error) { next(error); }
};

module.exports = {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetComparaison,
};
