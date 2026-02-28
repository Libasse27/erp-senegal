const Devis = require('../models/Devis');
const Client = require('../models/Client');
const Commande = require('../models/Commande');
const Company = require('../models/Company');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const { generateDevisPDF } = require('../services/pdfService');
const { sendDevisEmail } = require('../services/emailService');
const { notifyDevisConverted } = require('../services/notificationService');

/**
 * @desc    Get all devis with pagination, filters, and search
 * @route   GET /api/devis
 * @access  Private
 */
const getDevisList = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = {};

    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.commercial) filter.commercial = req.query.commercial;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.dateDevis = {};
      if (req.query.dateFrom) filter.dateDevis.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.dateDevis.$lte = new Date(req.query.dateTo);
    }

    if (req.query.search) {
      filter.$or = [
        { numero: { $regex: req.query.search, $options: 'i' } },
        { 'clientSnapshot.displayName': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [devis, total] = await Promise.all([
      Devis.find(filter)
        .populate('client', 'raisonSociale firstName lastName code')
        .populate('commercial', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Devis.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: devis,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single devis
 * @route   GET /api/devis/:id
 * @access  Private
 */
const getDevis = async (req, res, next) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('client')
      .populate('commercial', 'firstName lastName email')
      .populate('commandeGeneree', 'numero statut')
      .populate('lignes.product', 'name code prixVente');

    if (!devis) {
      return next(new AppError('Devis non trouve.', 404));
    }

    res.json({ success: true, data: devis });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new devis
 * @route   POST /api/devis
 * @access  Private
 */
const createDevis = async (req, res, next) => {
  try {
    const client = await Client.findById(req.body.client);
    if (!client) {
      return next(new AppError('Client non trouve.', 404));
    }

    // Build client snapshot
    const clientSnapshot = {
      displayName: client.displayName,
      email: client.email,
      phone: client.phone,
      address: client.address ? client.address.toObject() : {},
      ninea: client.ninea,
      rccm: client.rccm,
    };

    const devis = await Devis.create({
      ...req.body,
      clientSnapshot,
      createdBy: req.user._id,
      commercial: req.body.commercial || req.user._id,
    });

    const populated = await Devis.findById(devis._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('commercial', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Devis cree avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update devis (only brouillon)
 * @route   PUT /api/devis/:id
 * @access  Private
 */
const updateDevis = async (req, res, next) => {
  try {
    const devis = await Devis.findById(req.params.id);
    if (!devis) {
      return next(new AppError('Devis non trouve.', 404));
    }

    if (devis.statut !== 'brouillon') {
      return next(new AppError('Seuls les devis en brouillon peuvent etre modifies.', 400));
    }

    req._previousData = devis.toObject();

    Object.assign(devis, req.body);
    devis.modifiedBy = req.user._id;
    await devis.save();

    const populated = await Devis.findById(devis._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('commercial', 'firstName lastName');

    res.json({
      success: true,
      message: 'Devis modifie avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete devis (only brouillon)
 * @route   DELETE /api/devis/:id
 * @access  Private
 */
const deleteDevis = async (req, res, next) => {
  try {
    const devis = await Devis.findById(req.params.id);
    if (!devis) {
      return next(new AppError('Devis non trouve.', 404));
    }

    await devis.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Devis supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change devis status
 * @route   PUT /api/devis/:id/status
 * @access  Private
 */
const changeStatut = async (req, res, next) => {
  try {
    const devis = await Devis.findById(req.params.id);
    if (!devis) {
      return next(new AppError('Devis non trouve.', 404));
    }

    await devis.changerStatut(req.body.statut);

    res.json({
      success: true,
      message: `Statut du devis change en "${req.body.statut}"`,
      data: devis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send devis by email (PDF attachment)
 * @route   POST /api/devis/:id/send
 * @access  Private
 */
const sendDevis = async (req, res, next) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('client')
      .populate('commercial', 'firstName lastName email')
      .populate('lignes.product', 'name code');

    if (!devis) {
      return next(new AppError('Devis non trouve.', 404));
    }

    if (!devis.clientSnapshot.email && (!devis.client || !devis.client.email)) {
      return next(new AppError('Le client n\'a pas d\'adresse email.', 400));
    }

    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return next(new AppError('Parametres entreprise non trouves.', 500));
    }

    // Generate PDF
    const pdfBuffer = await generateDevisPDF(devis, company);

    // Send email
    const email = devis.client?.email || devis.clientSnapshot.email;
    await sendDevisEmail(email, devis, pdfBuffer);

    // Update status to 'envoye' if brouillon
    if (devis.statut === 'brouillon') {
      devis.statut = 'envoye';
      await devis.save();
    }

    res.json({
      success: true,
      message: `Devis envoye a ${email}`,
      data: devis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Convert devis to commande
 * @route   POST /api/devis/:id/convert
 * @access  Private
 */
const convertDevis = async (req, res, next) => {
  try {
    const devis = await Devis.findById(req.params.id).populate('client');
    if (!devis) {
      return next(new AppError('Devis non trouve.', 404));
    }

    if (devis.statut !== 'accepte') {
      return next(new AppError('Seuls les devis acceptes peuvent etre convertis en commande.', 400));
    }

    // Create commande from devis
    const commandeData = {
      devis: devis._id,
      client: devis.client._id,
      clientSnapshot: devis.clientSnapshot,
      lignes: devis.lignes.map((l) => ({
        product: l.product,
        designation: l.designation,
        reference: l.reference,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        remise: l.remise,
        tauxTVA: l.tauxTVA,
        unite: l.unite,
      })),
      remiseGlobale: devis.remiseGlobale,
      conditionsPaiement: devis.conditionsPaiement,
      notes: devis.notes,
      commercial: devis.commercial,
      createdBy: req.user._id,
    };

    const commande = await Commande.create(commandeData);

    // Update devis status and link
    devis.statut = 'converti';
    devis.commandeGeneree = commande._id;
    await devis.save();

    notifyDevisConverted(devis, commande);

    const populated = await Commande.findById(commande._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('devis', 'numero');

    res.status(201).json({
      success: true,
      message: 'Devis converti en commande avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get devis PDF
 * @route   GET /api/devis/:id/pdf
 * @access  Private
 */
const getDevisPDF = async (req, res, next) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('client')
      .populate('commercial', 'firstName lastName email')
      .populate('lignes.product', 'name code');

    if (!devis) {
      return next(new AppError('Devis non trouve.', 404));
    }

    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return next(new AppError('Parametres entreprise non trouves.', 500));
    }

    const pdfBuffer = await generateDevisPDF(devis, company);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${devis.numero}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDevisList,
  getDevis,
  createDevis,
  updateDevis,
  deleteDevis,
  changeStatut,
  sendDevis,
  convertDevis,
  getDevisPDF,
};
