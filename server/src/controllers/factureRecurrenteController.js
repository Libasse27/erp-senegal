const FactureRecurrente = require('../models/FactureRecurrente');
const Client = require('../models/Client');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const { tc } = require('../utils/tenantHelper');
const { handler: genererFacturesRecurrentes } = require('../jobs/factureRecurrente');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = { companyId: tc(req), deletedAt: null };

    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.client) filter.client = req.query.client;
    if (req.query.frequence) filter.frequence = req.query.frequence;

    if (req.query.search) {
      filter.$or = [
        { 'clientSnapshot.displayName': { $regex: req.query.search, $options: 'i' } },
        { notes: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [templates, total] = await Promise.all([
      FactureRecurrente.find(filter)
        .populate('client', 'raisonSociale firstName lastName code')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      FactureRecurrente.countDocuments(filter),
    ]);

    res.set('X-Total-Count', total);
    res.json({
      success: true,
      data: templates,
      meta: buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const template = await FactureRecurrente.findOne({
      _id: req.params.id,
      companyId: tc(req),
      deletedAt: null,
    })
      .populate('client', 'raisonSociale firstName lastName code email phone')
      .populate('createdBy', 'firstName lastName')
      .populate('occurrences.factureId', 'numero statut dateFacture totalTTC');

    if (!template) return next(new AppError('Modèle de facture récurrente non trouvé.', 404));

    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.body.client, companyId: tc(req), isActive: true });
    if (!client) return next(new AppError('Client non trouvé.', 404));

    const clientSnapshot = {
      displayName: client.displayName,
      email: client.email,
      phone: client.phone,
      address: client.address ? client.address.toObject() : {},
      ninea: client.ninea,
      rccm: client.rccm,
    };

    const dateDebut = new Date(req.body.dateDebut);

    const template = await FactureRecurrente.create({
      ...req.body,
      companyId: tc(req),
      clientSnapshot,
      dateDebut,
      prochainGeneration: dateDebut,
      createdBy: req.user._id,
    });

    const populated = await FactureRecurrente.findById(template._id)
      .populate('client', 'raisonSociale firstName lastName code');

    res.status(201).json({
      success: true,
      message: 'Modèle de facturation récurrente créé avec succès',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const template = await FactureRecurrente.findOne({
      _id: req.params.id,
      companyId: tc(req),
      deletedAt: null,
    });
    if (!template) return next(new AppError('Modèle de facture récurrente non trouvé.', 404));

    // Champs protégés — non modifiables par PUT
    ['companyId', 'occurrences', 'nbOccurrences', 'createdBy'].forEach((f) => delete req.body[f]);

    // Si le client change, rafraîchir le snapshot
    if (req.body.client && req.body.client.toString() !== template.client.toString()) {
      const client = await Client.findOne({ _id: req.body.client, companyId: tc(req) });
      if (!client) return next(new AppError('Client non trouvé.', 404));
      req.body.clientSnapshot = {
        displayName: client.displayName,
        email: client.email,
        phone: client.phone,
        address: client.address ? client.address.toObject() : {},
        ninea: client.ninea,
        rccm: client.rccm,
      };
    }

    // Si dateDebut change et aucune occurrence générée, réinitialiser prochainGeneration
    if (req.body.dateDebut && template.nbOccurrences === 0) {
      req.body.prochainGeneration = new Date(req.body.dateDebut);
    }

    Object.assign(template, req.body);
    template.modifiedBy = req.user._id;
    await template.save();

    const populated = await FactureRecurrente.findById(template._id)
      .populate('client', 'raisonSociale firstName lastName code');

    res.json({ success: true, message: 'Modèle mis à jour avec succès', data: populated });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const template = await FactureRecurrente.findOne({
      _id: req.params.id,
      companyId: tc(req),
      deletedAt: null,
    });
    if (!template) return next(new AppError('Modèle de facture récurrente non trouvé.', 404));

    template.deletedAt = new Date();
    template.deletedBy = req.user._id;
    template.isActive = false;
    await template.save();

    res.json({ success: true, message: 'Modèle supprimé avec succès' });
  } catch (error) {
    next(error);
  }
};

const toggleActive = async (req, res, next) => {
  try {
    const template = await FactureRecurrente.findOne({
      _id: req.params.id,
      companyId: tc(req),
      deletedAt: null,
    });
    if (!template) return next(new AppError('Modèle de facture récurrente non trouvé.', 404));

    template.isActive = !template.isActive;
    template.modifiedBy = req.user._id;
    await template.save();

    res.json({
      success: true,
      message: template.isActive ? 'Modèle activé' : 'Modèle suspendu',
      data: { isActive: template.isActive },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Force la génération immédiate d'une facture pour un modèle actif,
 * sans attendre le cron du lendemain.
 */
const genererMaintenant = async (req, res, next) => {
  try {
    const template = await FactureRecurrente.findOne({
      _id: req.params.id,
      companyId: tc(req),
      deletedAt: null,
    });
    if (!template) return next(new AppError('Modèle de facture récurrente non trouvé.', 404));
    if (!template.isActive) return next(new AppError('Ce modèle est suspendu. Activez-le avant de générer.', 400));

    // Pousser prochainGeneration à maintenant pour que le handler le ramasse
    const dateOriginale = template.prochainGeneration;
    template.prochainGeneration = new Date();
    await template.save();

    await genererFacturesRecurrentes();

    // Si le handler n'a pas avancé la date (erreur), restaurer
    const apres = await FactureRecurrente.findById(template._id);
    if (apres && apres.prochainGeneration.getTime() <= new Date().getTime()) {
      apres.prochainGeneration = dateOriginale;
      await apres.save();
    }

    const refreshed = await FactureRecurrente.findById(template._id)
      .populate('client', 'raisonSociale firstName lastName')
      .populate('occurrences.factureId', 'numero statut totalTTC');

    res.json({ success: true, message: 'Génération déclenchée avec succès', data: refreshed });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getOne, create, update, remove, toggleActive, genererMaintenant };
