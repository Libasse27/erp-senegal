const Employe = require('../models/Employe');
const Conge = require('../models/Conge');
const EcritureComptable = require('../models/EcritureComptable');
const ExerciceComptable = require('../models/ExerciceComptable');
const { tc } = require('../utils/tenantHelper');
const { asyncHandler } = require('../middlewares/errorHandler');

// Génère un matricule séquentiel : EMP-2025-0001
const genererMatricule = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;
  const last = await Employe.findOne({ companyId, matricule: { $regex: `^${prefix}` } })
    .sort({ matricule: -1 })
    .select('matricule')
    .lean();
  const next = last ? parseInt(last.matricule.split('-')[2], 10) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
};

// GET /rh/employes
exports.getEmployes = asyncHandler(async (req, res) => {
  const { statut, departement, typeContrat, search, page = 1, limit = 50 } = req.query;
  const filter = { companyId: tc(req) };

  if (statut && statut !== 'tous') filter.statut = statut;
  if (departement) filter.departement = departement;
  if (typeContrat) filter.typeContrat = typeContrat;
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [{ nom: re }, { prenom: re }, { matricule: re }, { poste: re }];
  }

  const total = await Employe.countDocuments(filter);
  const employes = await Employe.find(filter)
    .sort({ nom: 1, prenom: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: employes, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// GET /rh/employes/:id
exports.getEmploye = asyncHandler(async (req, res) => {
  const employe = await Employe.findOne({ _id: req.params.id, companyId: tc(req) }).lean();
  if (!employe) return res.status(404).json({ success: false, message: 'Employé non trouvé' });
  res.json({ success: true, data: employe });
});

// POST /rh/employes
exports.createEmploye = asyncHandler(async (req, res) => {
  const { nom, prenom, poste, departement, dateEmbauche, typeContrat, salaireBrut } = req.body;
  if (!nom || !prenom || !poste || !departement || !dateEmbauche || !typeContrat || salaireBrut === undefined) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
  }

  const matricule = await genererMatricule(tc(req));
  const employe = await Employe.create({
    ...req.body,
    companyId: tc(req),
    matricule,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: employe, message: 'Employé créé' });
});

// PUT /rh/employes/:id
exports.updateEmploye = asyncHandler(async (req, res) => {
  const employe = await Employe.findOne({ _id: req.params.id, companyId: tc(req) });
  if (!employe) return res.status(404).json({ success: false, message: 'Employé non trouvé' });

  const forbidden = ['companyId', 'matricule', 'createdBy'];
  forbidden.forEach((f) => delete req.body[f]);

  Object.assign(employe, req.body);
  await employe.save();

  res.json({ success: true, data: employe, message: 'Employé mis à jour' });
});

// DELETE /rh/employes/:id  (soft delete)
exports.deleteEmploye = asyncHandler(async (req, res) => {
  const employe = await Employe.findOne({ _id: req.params.id, companyId: tc(req) });
  if (!employe) return res.status(404).json({ success: false, message: 'Employé non trouvé' });

  employe.statut = 'inactif';
  await employe.save();

  res.json({ success: true, message: 'Employé désactivé' });
});

// GET /rh/stats
exports.getStatsRH = asyncHandler(async (req, res) => {
  const cid = tc(req);

  const [totalActifs, totalInactifs, parDepartement, parContrat, masseSalariale] = await Promise.all([
    Employe.countDocuments({ companyId: cid, statut: 'actif' }),
    Employe.countDocuments({ companyId: cid, statut: { $in: ['inactif', 'suspendu'] } }),

    Employe.aggregate([
      { $match: { companyId: cid, statut: 'actif' } },
      { $group: { _id: '$departement', count: { $sum: 1 }, masseSalariale: { $sum: '$salaireBrut' } } },
      { $sort: { count: -1 } },
    ]),

    Employe.aggregate([
      { $match: { companyId: cid, statut: 'actif' } },
      { $group: { _id: '$typeContrat', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Employe.aggregate([
      { $match: { companyId: cid, statut: 'actif' } },
      {
        $group: {
          _id: null,
          totalBrut: { $sum: '$salaireBrut' },
          totalNet:  { $sum: '$salaireNet' },
          salaireMoyen: { $avg: '$salaireBrut' },
          nombreEmployes: { $sum: 1 },
        },
      },
    ]),

  ]);

  // Congés du mois courant
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMois   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const congesMois = await Conge.countDocuments({
    companyId: cid,
    statut: 'approuve',
    dateDebut: { $lte: finMois },
    dateFin:   { $gte: debutMois },
  });

  const ms = masseSalariale[0] || { totalBrut: 0, totalNet: 0, salaireMoyen: 0, nombreEmployes: 0 };

  res.json({
    success: true,
    data: {
      totalActifs,
      totalInactifs,
      totalEmployes: totalActifs + totalInactifs,
      congesMois,
      masseSalarialeBreute: ms.totalBrut,
      masseSalarialeNette:  ms.totalNet,
      salaireMoyen: Math.round(ms.salaireMoyen || 0),
      parDepartement,
      parContrat,
    },
  });
});

// POST /rh/employes/:id/bulletin
// Renvoie les données de la fiche de paie (sans créer d'écriture)
exports.getBulletin = asyncHandler(async (req, res) => {
  const employe = await Employe.findOne({ _id: req.params.id, companyId: tc(req) }).lean();
  if (!employe) return res.status(404).json({ success: false, message: 'Employé non trouvé' });

  const { mois, annee } = req.query;
  const m = mois ? Number(mois) : new Date().getMonth() + 1;
  const a = annee ? Number(annee) : new Date().getFullYear();

  const cotisationsIPRES   = Math.round(employe.salaireBrut * (employe.tauxIPRES / 100));
  const irRetenu           = Math.round(employe.salaireBrut * (employe.tauxIR / 100));
  const totalRetenues      = cotisationsIPRES + irRetenu;
  const salaireNet         = employe.salaireBrut - totalRetenues;
  // Part patronale IPRES (8.4%) + CSS (7%) — charges employeur
  const cotisationsPatronales = Math.round(employe.salaireBrut * 0.154);

  res.json({
    success: true,
    data: {
      employe,
      periode: { mois: m, annee: a },
      salaireBrut:           employe.salaireBrut,
      cotisationsIPRES,
      irRetenu,
      totalRetenues,
      salaireNet,
      cotisationsPatronales,
      coutTotalEmployeur: employe.salaireBrut + cotisationsPatronales,
    },
  });
});

// POST /rh/employes/:id/ecritures-paie
// Génère les écritures SYSCOHADA pour la paie d'un employé
exports.genererEcrituresPayroll = asyncHandler(async (req, res) => {
  const employe = await Employe.findOne({ _id: req.params.id, companyId: tc(req) }).lean();
  if (!employe) return res.status(404).json({ success: false, message: 'Employé non trouvé' });

  const { mois, annee } = req.body;
  if (!mois || !annee) return res.status(400).json({ success: false, message: 'mois et annee requis' });

  const exercice = await ExerciceComptable.findOne({ companyId: tc(req), statut: 'ouvert' }).lean();
  if (!exercice) return res.status(400).json({ success: false, message: 'Aucun exercice comptable ouvert' });

  const cotisationsIPRES = Math.round(employe.salaireBrut * (employe.tauxIPRES / 100));
  const irRetenu         = Math.round(employe.salaireBrut * (employe.tauxIR / 100));
  const salaireNet       = employe.salaireBrut - cotisationsIPRES - irRetenu;
  const libelle          = `Paie ${employe.prenom} ${employe.nom} — ${String(mois).padStart(2,'0')}/${annee}`;
  const dateOp           = new Date(annee, mois - 1, 28);

  // Écritures journal OD (Opérations Diverses)
  const lignes = [
    // D 661 — Rémunérations du personnel
    { compteNumero: '6611', libelle, debit: employe.salaireBrut, credit: 0 },
    // C 421 — Personnel - Rémunérations dues (salaire net)
    { compteNumero: '4211', libelle, debit: 0, credit: salaireNet },
    // C 431 — IPRES (cotisations salariales)
    ...(cotisationsIPRES > 0 ? [{ compteNumero: '4311', libelle: `IPRES ${employe.matricule}`, debit: 0, credit: cotisationsIPRES }] : []),
    // C 447 — Etat - IR retenu à la source
    ...(irRetenu > 0 ? [{ compteNumero: '4471', libelle: `IR ${employe.matricule}`, debit: 0, credit: irRetenu }] : []),
  ];

  const ecriture = await EcritureComptable.create({
    companyId: tc(req),
    exercice: exercice._id,
    journal: 'OD',
    reference: `PAIE-${employe.matricule}-${String(mois).padStart(2,'0')}${annee}`,
    libelle,
    dateEcriture: dateOp,
    lignes,
    statut: 'brouillon',
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: ecriture, message: 'Écritures de paie générées' });
});
