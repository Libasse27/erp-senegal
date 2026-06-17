const Abonnement   = require('../models/Abonnement');
const PaiementSaaS = require('../models/PaiementSaaS');

// ── Helpers ───────────────────────────────────────────────────────────────────

const mrrContribution = (abo) =>
  abo.periodicite === 'ANNUEL' ? Math.round(abo.montant / 12) : abo.montant;

const moisLabel = (annee, mois) => {
  const d = new Date(annee, mois - 1, 1);
  return d.toLocaleDateString('fr-SN', { month: 'short', year: '2-digit' });
};

// ── GET /super-admin/mrr/stats ────────────────────────────────────────────────
const getMrrStats = async (_req, res, next) => {
  try {
    const now            = new Date();
    const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMo  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMo    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // ── MRR courant ─────────────────────────────────────────────────────────
    const actifAbos = await Abonnement.find({
      statut: { $in: ['ACTIF', 'EN_PERIODE_GRACE'] },
    }).select('montant periodicite planSnapshot');

    let mrr = 0;
    const parPlanMap = {};
    for (const abo of actifAbos) {
      const contrib = mrrContribution(abo);
      mrr += contrib;
      const code = abo.planSnapshot?.code || 'AUTRE';
      const nom  = abo.planSnapshot?.nom  || code;
      if (!parPlanMap[code]) parPlanMap[code] = { code, nom, abonnes: 0, mrr: 0 };
      parPlanMap[code].abonnes++;
      parPlanMap[code].mrr += contrib;
    }
    const parPlan = Object.values(parPlanMap).sort((a, b) => b.mrr - a.mrr);

    // ── Comptages par statut ─────────────────────────────────────────────────
    const [actifCount, essaiCount, graceCount, enAttenteCount] = await Promise.all([
      Abonnement.countDocuments({ statut: 'ACTIF' }),
      Abonnement.countDocuments({ statut: 'ESSAI' }),
      Abonnement.countDocuments({ statut: 'EN_PERIODE_GRACE' }),
      Abonnement.countDocuments({ statut: 'EN_ATTENTE' }),
    ]);

    // ── Nouveau MRR ce mois-ci ───────────────────────────────────────────────
    const newThisMonth = await Abonnement.find({
      statut: { $in: ['ACTIF', 'EN_PERIODE_GRACE'] },
      dateDebut: { $gte: startOfMonth },
    }).select('montant periodicite');
    const nouveauMrr = newThisMonth.reduce((sum, a) => sum + mrrContribution(a), 0);

    // ── MRR perdu ce mois-ci (abonnements expirés) ───────────────────────────
    const churnedAbos = await Abonnement.find({
      statut: 'EXPIRE',
      dateFin: { $gte: startOfMonth, $lte: now },
    }).select('montant periodicite');
    const mrrPerdu = churnedAbos.reduce((sum, a) => sum + mrrContribution(a), 0);

    // ── MRR du mois dernier (pour le delta) ──────────────────────────────────
    const lastMonthAbos = await Abonnement.find({
      statut: { $in: ['ACTIF', 'EN_PERIODE_GRACE', 'EXPIRE'] },
      dateDebut: { $lte: endOfLastMo },
      dateFin:   { $gte: startOfLastMo },
    }).select('montant periodicite');
    const mrrLastMonth = lastMonthAbos.reduce((sum, a) => sum + mrrContribution(a), 0);

    const mrrCroissance = mrrLastMonth > 0
      ? Math.round(((mrr - mrrLastMonth) / mrrLastMonth) * 1000) / 10
      : null;

    const baseAbonnes = actifCount + graceCount;
    const tauxChurn   = baseAbonnes > 0
      ? Math.round((churnedAbos.length / baseAbonnes) * 1000) / 10
      : 0;

    res.json({
      success: true,
      data: {
        mrr,
        arr:            mrr * 12,
        mrrLastMonth,
        mrrCroissance,
        nouveauMrr,
        mrrPerdu,
        mrrNet:         nouveauMrr - mrrPerdu,
        abonnesActifs:  actifCount,
        abonnesEssai:   essaiCount,
        abonnesGrace:   graceCount,
        abonnesAttente: enAttenteCount,
        tauxChurn,
        parPlan,
        generatedAt: now,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /super-admin/mrr/historique ──────────────────────────────────────────
const getMrrHistorique = async (_req, res, next) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          statut:    'COMPLETE',
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id:         { annee: { $year: '$createdAt' }, mois: { $month: '$createdAt' } },
          revenus:     { $sum: '$montant' },
          nbPaiements: { $sum: 1 },
        },
      },
      { $sort: { '_id.annee': 1, '_id.mois': 1 } },
    ];

    const rawHistorique = await PaiementSaaS.aggregate(pipeline);

    // Remplir les mois vides (12 derniers mois garantis)
    const historique = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const annee = d.getFullYear();
      const mois  = d.getMonth() + 1;
      const found = rawHistorique.find(
        (r) => r._id.annee === annee && r._id.mois === mois
      );
      historique.push({
        annee,
        mois,
        label:       moisLabel(annee, mois),
        revenus:     found?.revenus     ?? 0,
        nbPaiements: found?.nbPaiements ?? 0,
      });
    }

    const totalAnnee = historique.reduce((s, m) => s + m.revenus, 0);
    const maxMois    = Math.max(...historique.map((m) => m.revenus), 1);

    res.json({
      success: true,
      data: { historique, totalAnnee, maxMois },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMrrStats, getMrrHistorique };
