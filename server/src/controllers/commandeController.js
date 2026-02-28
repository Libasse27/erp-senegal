const Commande = require('../models/Commande');
const BonLivraison = require('../models/BonLivraison');
const Client = require('../models/Client');
const Company = require('../models/Company');
const { generateCommandePDF } = require('../services/pdfService');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all commandes with pagination, filters, and search
 * @route   GET /api/commandes
 * @access  Private
 */
const getCommandes = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = {};

    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.commercial) filter.commercial = req.query.commercial;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.dateCommande = {};
      if (req.query.dateFrom) filter.dateCommande.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.dateCommande.$lte = new Date(req.query.dateTo);
    }

    if (req.query.search) {
      filter.$or = [
        { numero: { $regex: req.query.search, $options: 'i' } },
        { 'clientSnapshot.displayName': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [commandes, total] = await Promise.all([
      Commande.find(filter)
        .populate('client', 'raisonSociale firstName lastName code')
        .populate('commercial', 'firstName lastName')
        .populate('devis', 'numero')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Commande.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: commandes,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single commande
 * @route   GET /api/commandes/:id
 * @access  Private
 */
const getCommande = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('client')
      .populate('commercial', 'firstName lastName email')
      .populate('devis', 'numero statut')
      .populate('bonsLivraison', 'numero statut dateLivraison')
      .populate('facture', 'numero statut')
      .populate('lignes.product', 'name code prixVente');

    if (!commande) {
      return next(new AppError('Commande non trouvee.', 404));
    }

    res.json({ success: true, data: commande });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new commande
 * @route   POST /api/commandes
 * @access  Private
 */
const createCommande = async (req, res, next) => {
  try {
    const client = await Client.findById(req.body.client);
    if (!client) {
      return next(new AppError('Client non trouve.', 404));
    }

    const clientSnapshot = {
      displayName: client.displayName,
      email: client.email,
      phone: client.phone,
      address: client.address ? client.address.toObject() : {},
      ninea: client.ninea,
      rccm: client.rccm,
    };

    const commande = await Commande.create({
      ...req.body,
      clientSnapshot,
      createdBy: req.user._id,
      commercial: req.body.commercial || req.user._id,
    });

    const populated = await Commande.findById(commande._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('commercial', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Commande creee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update commande (only brouillon)
 * @route   PUT /api/commandes/:id
 * @access  Private
 */
const updateCommande = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return next(new AppError('Commande non trouvee.', 404));
    }

    if (commande.statut !== 'brouillon') {
      return next(new AppError('Seules les commandes en brouillon peuvent etre modifiees.', 400));
    }

    req._previousData = commande.toObject();

    Object.assign(commande, req.body);
    commande.modifiedBy = req.user._id;
    await commande.save();

    const populated = await Commande.findById(commande._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('commercial', 'firstName lastName');

    res.json({
      success: true,
      message: 'Commande modifiee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete commande (only brouillon)
 * @route   DELETE /api/commandes/:id
 * @access  Private
 */
const deleteCommande = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return next(new AppError('Commande non trouvee.', 404));
    }

    await commande.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Commande supprimee avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change commande status
 * @route   PUT /api/commandes/:id/status
 * @access  Private
 */
const changeStatut = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return next(new AppError('Commande non trouvee.', 404));
    }

    await commande.changerStatut(req.body.statut);

    res.json({
      success: true,
      message: `Statut de la commande change en "${req.body.statut}"`,
      data: commande,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate bon de livraison from commande lines
 * @route   POST /api/commandes/:id/livraison
 * @access  Private
 */
const generateBL = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.params.id).populate('client');
    if (!commande) {
      return next(new AppError('Commande non trouvee.', 404));
    }

    if (!['confirmee', 'en_cours', 'partiellement_livree'].includes(commande.statut)) {
      return next(
        new AppError('La commande doit etre confirmee ou en cours pour generer un BL.', 400)
      );
    }

    // Build BL lines from request
    const blLignes = [];
    for (const reqLigne of req.body.lignes) {
      const cmdLigne = commande.lignes.id(reqLigne.ligneCommandeId);
      if (!cmdLigne) {
        return next(
          new AppError(`Ligne de commande ${reqLigne.ligneCommandeId} non trouvee.`, 404)
        );
      }

      const resteALivrer = cmdLigne.quantite - cmdLigne.quantiteLivree;
      if (reqLigne.quantite > resteALivrer) {
        return next(
          new AppError(
            `Quantite demandee (${reqLigne.quantite}) depasse le reste a livrer (${resteALivrer}) pour "${cmdLigne.designation}".`,
            400
          )
        );
      }

      blLignes.push({
        product: cmdLigne.product,
        designation: cmdLigne.designation,
        reference: cmdLigne.reference,
        quantite: reqLigne.quantite,
        unite: cmdLigne.unite,
        warehouse: reqLigne.warehouse,
        ligneCommandeId: cmdLigne._id,
      });
    }

    const bl = await BonLivraison.create({
      commande: commande._id,
      client: commande.client._id,
      clientSnapshot: commande.clientSnapshot,
      lignes: blLignes,
      dateLivraison: req.body.dateLivraison || new Date(),
      adresseLivraison: req.body.adresseLivraison || commande.clientSnapshot.address,
      notes: req.body.notes,
      createdBy: req.user._id,
    });

    // Add BL reference to commande
    commande.bonsLivraison.push(bl._id);

    // Update commande status
    if (commande.statut === 'confirmee') {
      commande.statut = 'en_cours';
    }
    await commande.save();

    const populated = await BonLivraison.findById(bl._id)
      .populate('commande', 'numero')
      .populate('client', 'raisonSociale firstName lastName code');

    res.status(201).json({
      success: true,
      message: 'Bon de livraison genere avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate commande PDF
 * @route   GET /api/commandes/:id/pdf
 * @access  Private
 */
const getCommandePDF = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('commercial', 'firstName lastName')
      .populate('devis', 'numero')
      .populate('lignes.product', 'name code');

    if (!commande) {
      return next(new AppError('Commande non trouvee.', 404));
    }

    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return next(new AppError('Informations entreprise non trouvees.', 404));
    }

    const pdfBuffer = await generateCommandePDF(commande, company);

    const filename = `BC-${commande.numero}`;
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommandes,
  getCommande,
  createCommande,
  updateCommande,
  deleteCommande,
  changeStatut,
  generateBL,
  getCommandePDF,
};
