const Opportunite = require('../models/Opportunite');
const Activite    = require('../models/Activite');
const Devis       = require('../models/Devis');
const { tc }      = require('../utils/tenantHelper');
const { asyncHandler } = require('../middlewares/errorHandler');

const ETAPES = ['prospect', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu'];

const PROBA_DEFAUT = { prospect: 10, qualification: 25, proposition: 50, negociation: 75, gagne: 100, perdu: 0 };

// Génère une référence séquentielle OPP-YYYY-NNNN
const genererReference = async (companyId) => {
  const year   = new Date().getFullYear();
  const prefix = `OPP-${year}-`;
  const last   = await Opportunite.findOne({ companyId, reference: { $regex: `^${prefix}` } })
    .sort({ reference: -1 }).select('reference').lean();
  const next = last ? parseInt(last.reference.split('-')[2], 10) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
};

// GET /crm/opportunites
exports.getOpportunites = asyncHandler(async (req, res) => {
  const { etape, responsable, clientId, search, isActive = 'true', page = 1, limit = 100 } = req.query;
  const filter = { companyId: tc(req) };

  if (isActive !== 'tous') { filter.isActive = isActive === 'true'; }
  if (etape) { filter.etape = etape; }
  if (responsable) { filter.responsable = responsable; }
  if (clientId) { filter.client = clientId; }
  if (search) {
    filter.$or = [
      { titre: new RegExp(search, 'i') },
      { reference: new RegExp(search, 'i') },
    ];
  }

  const total = await Opportunite.countDocuments(filter);
  const opportunites = await Opportunite.find(filter)
    .populate('client', 'nom email telephone')
    .populate('responsable', 'firstName lastName')
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: opportunites, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// GET /crm/opportunites/:id
exports.getOpportunite = asyncHandler(async (req, res) => {
  const opp = await Opportunite.findOne({ _id: req.params.id, companyId: tc(req) })
    .populate('client', 'nom email telephone ville')
    .populate('responsable', 'firstName lastName email')
    .populate('devisId', 'numero montantTTC statut')
    .lean();
  if (!opp) return res.status(404).json({ success: false, message: 'Opportunité non trouvée' });

  const activites = await Activite.find({ opportunite: req.params.id, companyId: tc(req) })
    .populate('responsable', 'firstName lastName')
    .sort({ dateActivite: -1 })
    .lean();

  res.json({ success: true, data: { ...opp, activites } });
});

// POST /crm/opportunites
exports.createOpportunite = asyncHandler(async (req, res) => {
  const { titre, etape } = req.body;
  if (!titre) return res.status(400).json({ success: false, message: 'Le titre est requis' });

  const reference = await genererReference(tc(req));
  const etapeVal  = ETAPES.includes(etape) ? etape : 'prospect';

  const opp = await Opportunite.create({
    ...req.body,
    companyId:   tc(req),
    reference,
    etape:       etapeVal,
    probabilite: req.body.probabilite ?? PROBA_DEFAUT[etapeVal],
    createdBy:   req.user._id,
    responsable: req.body.responsable || req.user._id,
  });

  await opp.populate('client', 'nom email');
  await opp.populate('responsable', 'firstName lastName');

  res.status(201).json({ success: true, data: opp, message: 'Opportunité créée' });
});

// PUT /crm/opportunites/:id
exports.updateOpportunite = asyncHandler(async (req, res) => {
  const opp = await Opportunite.findOne({ _id: req.params.id, companyId: tc(req) });
  if (!opp) return res.status(404).json({ success: false, message: 'Opportunité non trouvée' });

  const forbidden = ['companyId', 'reference', 'createdBy'];
  forbidden.forEach((f) => delete req.body[f]);

  // Ajuste la probabilité par défaut si l'étape change et que la proba n'est pas fournie
  if (req.body.etape && req.body.etape !== opp.etape && req.body.probabilite === undefined) {
    req.body.probabilite = PROBA_DEFAUT[req.body.etape];
  }

  Object.assign(opp, req.body);
  await opp.save();
  await opp.populate('client', 'nom email');
  await opp.populate('responsable', 'firstName lastName');

  res.json({ success: true, data: opp, message: 'Opportunité mise à jour' });
});

// DELETE /crm/opportunites/:id
exports.deleteOpportunite = asyncHandler(async (req, res) => {
  const opp = await Opportunite.findOne({ _id: req.params.id, companyId: tc(req) });
  if (!opp) return res.status(404).json({ success: false, message: 'Opportunité non trouvée' });
  opp.isActive = false;
  await opp.save();
  res.json({ success: true, message: 'Opportunité archivée' });
});

// GET /crm/pipeline  — stats par étape pour le tableau de bord
exports.getPipelineStats = asyncHandler(async (req, res) => {
  const cid = tc(req);

  const [parEtape, totalMois, activitesPlanifiees] = await Promise.all([
    Opportunite.aggregate([
      { $match: { companyId: cid, isActive: true } },
      {
        $group: {
          _id:            '$etape',
          count:          { $sum: 1 },
          montantTotal:   { $sum: '$montantEstime' },
          montantPondere: { $sum: { $multiply: ['$montantEstime', { $divide: ['$probabilite', 100] }] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Opportunite.aggregate([
      {
        $match: {
          companyId: cid,
          isActive:  true,
          etape:     'gagne',
          updatedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      },
      { $group: { _id: null, total: { $sum: '$montantEstime' }, count: { $sum: 1 } } },
    ]),

    Activite.countDocuments({
      companyId: cid,
      statut:    'planifie',
      dateActivite: { $gte: new Date() },
    }),
  ]);

  // Assure que chaque étape est présente même si vide
  const pipeline = ETAPES.map((etape) => {
    const found = parEtape.find((e) => e._id === etape) || {};
    return {
      etape,
      count:          found.count          || 0,
      montantTotal:   found.montantTotal   || 0,
      montantPondere: found.montantPondere || 0,
    };
  });

  const tm = totalMois[0] || { total: 0, count: 0 };

  res.json({
    success: true,
    data: {
      pipeline,
      gagnesMois:           tm.count,
      montantGagneMois:     tm.total,
      activitesPlanifiees,
      totalActives:         pipeline.filter((e) => !['gagne','perdu'].includes(e.etape)).reduce((s, e) => s + e.count, 0),
      montantPipelineTotal: pipeline.filter((e) => !['gagne','perdu'].includes(e.etape)).reduce((s, e) => s + e.montantPondere, 0),
    },
  });
});

// POST /crm/opportunites/:id/convertir-devis
exports.convertirEnDevis = asyncHandler(async (req, res) => {
  const opp = await Opportunite.findOne({ _id: req.params.id, companyId: tc(req) })
    .populate('client').lean();
  if (!opp) return res.status(404).json({ success: false, message: 'Opportunité non trouvée' });
  if (opp.devisId) return res.status(400).json({ success: false, message: 'Un devis existe déjà pour cette opportunité' });

  const client = opp.client;
  if (!client) return res.status(400).json({ success: false, message: 'Aucun client associé à cette opportunité' });

  // Numéro devis
  const year = new Date().getFullYear();
  const lastDevis = await Devis.findOne({ companyId: tc(req) }).sort({ createdAt: -1 }).select('numero').lean();
  const nextNum = lastDevis ? parseInt((lastDevis.numero || '0').replace(/\D/g,''), 10) + 1 : 1;
  const numero  = `DE${year}-${String(nextNum).padStart(5, '0')}`;

  const devis = await Devis.create({
    companyId:  tc(req),
    numero,
    client:     client._id,
    statut:     'brouillon',
    objet:      opp.titre,
    lignes:     [],
    notes:      `Converti depuis l'opportunité ${opp.reference}`,
    createdBy:  req.user._id,
  });

  await Opportunite.findByIdAndUpdate(opp._id, { devisId: devis._id });

  res.status(201).json({ success: true, data: devis, message: 'Devis créé depuis l\'opportunité' });
});
