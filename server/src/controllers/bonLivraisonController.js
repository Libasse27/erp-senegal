const BonLivraison = require('../models/BonLivraison');
const Commande = require('../models/Commande');
const Facture = require('../models/Facture');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const Company = require('../models/Company');
const { generateBonLivraisonPDF } = require('../services/pdfService');
const { notifyNewInvoice, createAndNotifyRole } = require('../services/notificationService');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all bons de livraison with pagination
 * @route   GET /api/bons-livraison
 * @access  Private
 */
const getBonsLivraison = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = {};

    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.commande) filter.commande = req.query.commande;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.dateLivraison = {};
      if (req.query.dateFrom) filter.dateLivraison.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.dateLivraison.$lte = new Date(req.query.dateTo);
    }

    if (req.query.search) {
      filter.$or = [
        { numero: { $regex: req.query.search, $options: 'i' } },
        { 'clientSnapshot.displayName': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [bls, total] = await Promise.all([
      BonLivraison.find(filter)
        .populate('commande', 'numero statut')
        .populate('client', 'raisonSociale firstName lastName code')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      BonLivraison.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: bls,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single bon de livraison
 * @route   GET /api/bons-livraison/:id
 * @access  Private
 */
const getBonLivraison = async (req, res, next) => {
  try {
    const bl = await BonLivraison.findById(req.params.id)
      .populate('commande', 'numero statut dateCommande')
      .populate('client')
      .populate('lignes.product', 'name code')
      .populate('lignes.warehouse', 'name')
      .populate('facture', 'numero statut');

    if (!bl) {
      return next(new AppError('Bon de livraison non trouve.', 404));
    }

    res.json({ success: true, data: bl });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create bon de livraison manually
 * @route   POST /api/bons-livraison
 * @access  Private
 */
const createBonLivraison = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.body.commande);
    if (!commande) {
      return next(new AppError('Commande non trouvee.', 404));
    }

    const bl = await BonLivraison.create({
      ...req.body,
      clientSnapshot: commande.clientSnapshot,
      createdBy: req.user._id,
    });

    // Add BL reference to commande
    commande.bonsLivraison.push(bl._id);
    await commande.save();

    const populated = await BonLivraison.findById(bl._id)
      .populate('commande', 'numero')
      .populate('client', 'raisonSociale firstName lastName code');

    res.status(201).json({
      success: true,
      message: 'Bon de livraison cree avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate bon de livraison (decrement stock + create StockMovements + optionally create Facture)
 * @route   POST /api/bons-livraison/:id/validate
 * @access  Private
 */
const validateBL = async (req, res, next) => {
  try {
    const bl = await BonLivraison.findById(req.params.id)
      .populate('commande')
      .populate('client');

    if (!bl) {
      return next(new AppError('Bon de livraison non trouve.', 404));
    }

    if (bl.statut !== 'brouillon') {
      return next(new AppError('Ce bon de livraison a deja ete valide ou annule.', 400));
    }

    // 1. Decrement stock for each line
    for (const ligne of bl.lignes) {
      const stock = await Stock.findOne({
        product: ligne.product,
        warehouse: ligne.warehouse,
        isActive: true,
      });

      if (!stock) {
        return next(
          new AppError(
            `Stock non trouve pour le produit "${ligne.designation}" dans le depot selectionne.`,
            400
          )
        );
      }

      if (stock.quantite < ligne.quantite) {
        return next(
          new AppError(
            `Stock insuffisant pour "${ligne.designation}". Disponible: ${stock.quantite}, Demande: ${ligne.quantite}.`,
            400
          )
        );
      }

      const stockAvant = stock.quantite;
      stock.quantite -= ligne.quantite;
      stock.lastMovementDate = new Date();
      stock.modifiedBy = req.user._id;
      await stock.save();

      // Create stock movement
      await StockMovement.create({
        type: 'sortie',
        motif: 'vente',
        product: ligne.product,
        warehouseSource: ligne.warehouse,
        quantite: ligne.quantite,
        coutUnitaire: stock.cump,
        stockAvant,
        stockApres: stock.quantite,
        documentReference: bl.numero,
        documentType: 'bon_livraison',
        documentId: bl._id,
        createdBy: req.user._id,
      });
    }

    // 2. Update commande delivery quantities
    if (bl.commande) {
      const commande = await Commande.findById(bl.commande._id || bl.commande);
      if (commande) {
        for (const blLigne of bl.lignes) {
          if (blLigne.ligneCommandeId) {
            const cmdLigne = commande.lignes.id(blLigne.ligneCommandeId);
            if (cmdLigne) {
              cmdLigne.quantiteLivree += blLigne.quantite;
            }
          }
        }

        // Update commande status based on delivery progress
        const allDelivered = commande.lignes.every((l) => l.quantiteLivree >= l.quantite);
        const someDelivered = commande.lignes.some((l) => l.quantiteLivree > 0);

        if (allDelivered) {
          commande.statut = 'livree';
        } else if (someDelivered) {
          commande.statut = 'partiellement_livree';
        }

        await commande.save();
      }
    }

    // 3. Update BL status
    bl.statut = 'valide';
    bl.validatedBy = req.user._id;
    bl.validatedAt = new Date();
    if (req.body.signatureClient) {
      bl.signatureClient = req.body.signatureClient;
    }
    await bl.save();

    createAndNotifyRole('gestionnaire_stock', {
      type: 'success',
      title: 'Bon de livraison valide',
      message: `Le BL ${bl.numero} a ete valide. Le stock a ete decremente.`,
      link: `/ventes/bons-livraison/${bl._id}`,
    });

    // 4. Optionally create facture
    let facture = null;
    if (req.body.createFacture) {
      const commande = await Commande.findById(bl.commande._id || bl.commande);
      if (commande) {
        facture = await Facture.create({
          commande: commande._id,
          bonLivraison: bl._id,
          client: bl.client._id || bl.client,
          clientSnapshot: bl.clientSnapshot,
          lignes: commande.lignes.map((l) => ({
            product: l.product,
            designation: l.designation,
            reference: l.reference,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            remise: l.remise,
            tauxTVA: l.tauxTVA,
            unite: l.unite,
          })),
          remiseGlobale: commande.remiseGlobale,
          conditionsPaiement: commande.conditionsPaiement,
          dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdBy: req.user._id,
        });

        notifyNewInvoice({ ...facture.toObject(), numero: facture.numero || facture.referenceInterne });

        bl.facture = facture._id;
        await bl.save();

        commande.facture = facture._id;
        await commande.save();
      }
    }

    const populated = await BonLivraison.findById(bl._id)
      .populate('commande', 'numero statut')
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('facture', 'numero referenceInterne');

    res.json({
      success: true,
      message: 'Bon de livraison valide avec succes' + (facture ? '. Facture creee.' : ''),
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate bon de livraison PDF
 * @route   GET /api/bons-livraison/:id/pdf
 * @access  Private
 */
const getBonLivraisonPDF = async (req, res, next) => {
  try {
    const bl = await BonLivraison.findById(req.params.id)
      .populate('commande', 'numero statut')
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('lignes.product', 'name code');

    if (!bl) {
      return next(new AppError('Bon de livraison non trouve.', 404));
    }

    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return next(new AppError('Informations entreprise non trouvees.', 404));
    }

    const pdfBuffer = await generateBonLivraisonPDF(bl, company);

    const filename = `BL-${bl.numero}`;
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBonsLivraison,
  getBonLivraison,
  createBonLivraison,
  validateBL,
  getBonLivraisonPDF,
};
