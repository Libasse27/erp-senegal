const Activite = require('../models/Activite');
const { tc }   = require('../utils/tenantHelper');
const { asyncHandler } = require('../middlewares/errorHandler');

// GET /crm/activites
exports.getActivites = asyncHandler(async (req, res) => {
  const { opportunite, clientId, statut, type, page = 1, limit = 50 } = req.query;
  const filter = { companyId: tc(req) };

  if (opportunite) filter.opportunite = opportunite;
  if (clientId)    filter.client      = clientId;
  if (statut)      filter.statut      = statut;
  if (type)        filter.type        = type;

  const total = await Activite.countDocuments(filter);
  const activites = await Activite.find(filter)
    .populate('opportunite', 'reference titre etape')
    .populate('client',      'nom email')
    .populate('responsable', 'firstName lastName')
    .sort({ dateActivite: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: activites, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// GET /crm/activites/:id
exports.getActivite = asyncHandler(async (req, res) => {
  const act = await Activite.findOne({ _id: req.params.id, companyId: tc(req) })
    .populate('opportunite', 'reference titre etape')
    .populate('client', 'nom email telephone')
    .populate('responsable', 'firstName lastName')
    .lean();
  if (!act) return res.status(404).json({ success: false, message: 'Activité non trouvée' });
  res.json({ success: true, data: act });
});

// POST /crm/activites
exports.createActivite = asyncHandler(async (req, res) => {
  const { titre, type, dateActivite } = req.body;
  if (!titre || !type || !dateActivite) {
    return res.status(400).json({ success: false, message: 'titre, type et dateActivite sont requis' });
  }

  const act = await Activite.create({
    ...req.body,
    companyId:   tc(req),
    responsable: req.body.responsable || req.user._id,
    createdBy:   req.user._id,
  });

  await act.populate('responsable', 'firstName lastName');
  res.status(201).json({ success: true, data: act, message: 'Activité créée' });
});

// PUT /crm/activites/:id
exports.updateActivite = asyncHandler(async (req, res) => {
  const act = await Activite.findOne({ _id: req.params.id, companyId: tc(req) });
  if (!act) return res.status(404).json({ success: false, message: 'Activité non trouvée' });

  const forbidden = ['companyId', 'createdBy'];
  forbidden.forEach((f) => delete req.body[f]);

  Object.assign(act, req.body);
  await act.save();
  await act.populate('responsable', 'firstName lastName');

  res.json({ success: true, data: act, message: 'Activité mise à jour' });
});

// DELETE /crm/activites/:id
exports.deleteActivite = asyncHandler(async (req, res) => {
  const act = await Activite.findOne({ _id: req.params.id, companyId: tc(req) });
  if (!act) return res.status(404).json({ success: false, message: 'Activité non trouvée' });
  await act.deleteOne();
  res.json({ success: true, message: 'Activité supprimée' });
});
