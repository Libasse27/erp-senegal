const Conge = require('../models/Conge');
const Employe = require('../models/Employe');
const { tc } = require('../utils/tenantHelper');
const { asyncHandler } = require('../middlewares/errorHandler');

// Calcul du nombre de jours ouvrables entre deux dates
const calcNbJours = (debut, fin) => {
  let count = 0;
  const d = new Date(debut);
  const f = new Date(fin);
  while (d <= f) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++; // exclut sam/dim
    d.setDate(d.getDate() + 1);
  }
  return count;
};

// GET /rh/conges
exports.getConges = asyncHandler(async (req, res) => {
  const { employe, statut, type, mois, annee, page = 1, limit = 50 } = req.query;
  const filter = { companyId: tc(req) };

  if (employe) filter.employe = employe;
  if (statut && statut !== 'tous') filter.statut = statut;
  if (type) filter.type = type;
  if (annee) {
    const a = Number(annee);
    const m = mois ? Number(mois) : null;
    if (m) {
      filter.dateDebut = { $lte: new Date(a, m - 1, 31) };
      filter.dateFin   = { $gte: new Date(a, m - 1, 1) };
    } else {
      filter.dateDebut = { $lte: new Date(a, 11, 31) };
      filter.dateFin   = { $gte: new Date(a, 0, 1) };
    }
  }

  const total = await Conge.countDocuments(filter);
  const conges = await Conge.find(filter)
    .populate('employe', 'nom prenom matricule poste departement')
    .populate('approuvePar', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: conges, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// GET /rh/conges/:id
exports.getConge = asyncHandler(async (req, res) => {
  const conge = await Conge.findOne({ _id: req.params.id, companyId: tc(req) })
    .populate('employe', 'nom prenom matricule poste departement statut')
    .populate('approuvePar', 'firstName lastName')
    .lean();
  if (!conge) return res.status(404).json({ success: false, message: 'Congé non trouvé' });
  res.json({ success: true, data: conge });
});

// POST /rh/conges
exports.createConge = asyncHandler(async (req, res) => {
  const { employe, type, dateDebut, dateFin, motif } = req.body;
  if (!employe || !type || !dateDebut || !dateFin) {
    return res.status(400).json({ success: false, message: 'employé, type, dateDebut et dateFin sont requis' });
  }

  const emp = await Employe.findOne({ _id: employe, companyId: tc(req) });
  if (!emp) return res.status(404).json({ success: false, message: 'Employé non trouvé' });

  const nbJours = calcNbJours(dateDebut, dateFin);
  if (nbJours <= 0) return res.status(400).json({ success: false, message: 'La période doit contenir au moins un jour ouvrable' });

  const conge = await Conge.create({
    companyId: tc(req),
    employe,
    type,
    dateDebut: new Date(dateDebut),
    dateFin:   new Date(dateFin),
    nbJours,
    motif: motif || '',
    createdBy: req.user._id,
  });

  await conge.populate('employe', 'nom prenom matricule');

  res.status(201).json({ success: true, data: conge, message: 'Demande de congé créée' });
});

// PUT /rh/conges/:id
exports.updateConge = asyncHandler(async (req, res) => {
  const conge = await Conge.findOne({ _id: req.params.id, companyId: tc(req) });
  if (!conge) return res.status(404).json({ success: false, message: 'Congé non trouvé' });

  if (conge.statut === 'annule') {
    return res.status(400).json({ success: false, message: 'Impossible de modifier un congé annulé' });
  }

  const { statut, commentaireRH, motif, dateDebut, dateFin } = req.body;

  if (statut) {
    conge.statut = statut;
    if (statut === 'approuve' || statut === 'refuse') {
      conge.approuvePar     = req.user._id;
      conge.dateApprobation = new Date();
    }
  }
  if (commentaireRH !== undefined) conge.commentaireRH = commentaireRH;
  if (motif !== undefined) conge.motif = motif;
  if (dateDebut && dateFin) {
    conge.dateDebut = new Date(dateDebut);
    conge.dateFin   = new Date(dateFin);
    conge.nbJours   = calcNbJours(dateDebut, dateFin);
  }

  await conge.save();
  await conge.populate('employe', 'nom prenom matricule poste');

  // Mise à jour statut employé si congé approuvé
  if (statut === 'approuve') {
    await Employe.findByIdAndUpdate(conge.employe._id, { statut: 'conge' });
  }

  res.json({ success: true, data: conge, message: 'Congé mis à jour' });
});

// DELETE /rh/conges/:id
exports.deleteConge = asyncHandler(async (req, res) => {
  const conge = await Conge.findOne({ _id: req.params.id, companyId: tc(req) });
  if (!conge) return res.status(404).json({ success: false, message: 'Congé non trouvé' });
  if (conge.statut === 'approuve') {
    return res.status(400).json({ success: false, message: 'Impossible de supprimer un congé déjà approuvé. Refusez-le d\'abord.' });
  }
  conge.statut = 'annule';
  await conge.save();
  res.json({ success: true, message: 'Congé annulé' });
});

// GET /rh/conges/stats  — résumé pour le dashboard
exports.getCongesStats = asyncHandler(async (req, res) => {
  const cid = tc(req);
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMois   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [enAttente, approuvesMois, parType] = await Promise.all([
    Conge.countDocuments({ companyId: cid, statut: 'en_attente' }),
    Conge.countDocuments({
      companyId: cid, statut: 'approuve',
      dateDebut: { $lte: finMois }, dateFin: { $gte: debutMois },
    }),
    Conge.aggregate([
      { $match: { companyId: cid, statut: 'approuve' } },
      { $group: { _id: '$type', total: { $sum: '$nbJours' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  res.json({ success: true, data: { enAttente, approuvesMois, parType } });
});
