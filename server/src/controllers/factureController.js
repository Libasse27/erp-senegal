const Facture = require('../models/Facture');
const Client = require('../models/Client');
const Company = require('../models/Company');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const { getNextSequence } = require('../utils/sequenceHelper');
const { generateFacturePDF } = require('../services/pdfService');
const { sendFactureEmail } = require('../services/emailService');

/**
 * @desc    Get all factures with pagination, filters, and search
 * @route   GET /api/factures
 * @access  Private
 */
const getFactures = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = {};

    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.typeDocument) filter.typeDocument = req.query.typeDocument;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.commercial) filter.commercial = req.query.commercial;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.dateFacture = {};
      if (req.query.dateFrom) filter.dateFacture.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.dateFacture.$lte = new Date(req.query.dateTo);
    }

    if (req.query.search) {
      filter.$or = [
        { numero: { $regex: req.query.search, $options: 'i' } },
        { referenceInterne: { $regex: req.query.search, $options: 'i' } },
        { 'clientSnapshot.displayName': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [factures, total] = await Promise.all([
      Facture.find(filter)
        .populate('client', 'raisonSociale firstName lastName code')
        .populate('commercial', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Facture.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: factures,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single facture
 * @route   GET /api/factures/:id
 * @access  Private
 */
const getFacture = async (req, res, next) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate('client')
      .populate('commercial', 'firstName lastName email')
      .populate('commande', 'numero statut')
      .populate('bonLivraison', 'numero statut')
      .populate('factureOrigine', 'numero')
      .populate('lignes.product', 'name code');

    if (!facture) {
      return next(new AppError('Facture non trouvee.', 404));
    }

    res.json({ success: true, data: facture });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new facture
 * @route   POST /api/factures
 * @access  Private
 */
const createFacture = async (req, res, next) => {
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

    // Default echeance: 30 days
    const dateEcheance =
      req.body.dateEcheance ||
      new Date(Date.now() + (client.delaiPaiement || 30) * 24 * 60 * 60 * 1000);

    const facture = await Facture.create({
      ...req.body,
      clientSnapshot,
      dateEcheance,
      createdBy: req.user._id,
      commercial: req.body.commercial || req.user._id,
    });

    const populated = await Facture.findById(facture._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('commercial', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Facture creee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update facture (only brouillon)
 * @route   PUT /api/factures/:id
 * @access  Private
 */
const updateFacture = async (req, res, next) => {
  try {
    const facture = await Facture.findById(req.params.id);
    if (!facture) {
      return next(new AppError('Facture non trouvee.', 404));
    }

    if (facture.statut !== 'brouillon') {
      return next(new AppError('Seules les factures en brouillon peuvent etre modifiees.', 400));
    }

    req._previousData = facture.toObject();

    Object.assign(facture, req.body);
    facture.modifiedBy = req.user._id;
    await facture.save();

    const populated = await Facture.findById(facture._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('commercial', 'firstName lastName');

    res.json({
      success: true,
      message: 'Facture modifiee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete facture (only brouillon)
 * @route   DELETE /api/factures/:id
 * @access  Private
 */
const deleteFacture = async (req, res, next) => {
  try {
    const facture = await Facture.findById(req.params.id);
    if (!facture) {
      return next(new AppError('Facture non trouvee.', 404));
    }

    await facture.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Facture supprimee avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate facture (assign DGI-compliant sequential number + create SYSCOHADA accounting entry)
 * @route   POST /api/factures/:id/validate
 * @access  Private
 */
const validateFacture = async (req, res, next) => {
  try {
    const facture = await Facture.findById(req.params.id).populate('client');
    if (!facture) {
      return next(new AppError('Facture non trouvee.', 404));
    }

    if (facture.statut !== 'brouillon') {
      return next(new AppError('Seules les factures en brouillon peuvent etre validees.', 400));
    }

    // 1. Assign sequential numero (DGI: no gaps allowed)
    const type = facture.typeDocument === 'avoir' ? 'creditNote' : 'invoice';
    const { numero } = await getNextSequence(type);
    facture.numero = numero;

    // 2. Create SYSCOHADA accounting entry
    const ecritureComptable = buildEcritureComptable(facture);
    facture.ecritureComptable = ecritureComptable;

    // 3. Update status
    facture.statut = 'validee';
    facture.validatedBy = req.user._id;
    facture.validatedAt = new Date();
    await facture.save();

    // 4. Update client financials
    if (facture.typeDocument === 'facture') {
      await Client.findByIdAndUpdate(facture.client._id || facture.client, {
        $inc: {
          totalCA: facture.totalTTC,
          totalCreances: facture.totalTTC,
          nombreFactures: 1,
        },
      });
    } else if (facture.typeDocument === 'avoir') {
      await Client.findByIdAndUpdate(facture.client._id || facture.client, {
        $inc: {
          totalCA: -facture.totalTTC,
          totalCreances: -facture.totalTTC,
        },
      });
    }

    const populated = await Facture.findById(facture._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('commercial', 'firstName lastName');

    res.json({
      success: true,
      message: `Facture validee avec le numero ${numero}`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Build SYSCOHADA accounting entry for a facture
 * Journal VE (Ventes):
 *   411xxx Client (Debit) = TTC
 *   701xxx Ventes de marchandises (Credit) = HT
 *   4431xx TVA facturee (Credit) = TVA
 * For avoir: reverse the entries
 */
const buildEcritureComptable = (facture) => {
  const isAvoir = facture.typeDocument === 'avoir';
  const clientName =
    facture.clientSnapshot?.displayName || 'Client';

  const lignes = [];

  if (isAvoir) {
    // Avoir: reverse entries
    lignes.push({
      compte: '411000',
      libelle: `${clientName} - Avoir ${facture.referenceInterne}`,
      debit: 0,
      credit: facture.totalTTC,
    });
    lignes.push({
      compte: '701000',
      libelle: `Ventes marchandises - Avoir`,
      debit: facture.totalHT,
      credit: 0,
    });
    if (facture.totalTVA > 0) {
      lignes.push({
        compte: '443100',
        libelle: `TVA facturee - Avoir`,
        debit: facture.totalTVA,
        credit: 0,
      });
    }
  } else {
    // Facture normale
    lignes.push({
      compte: '411000',
      libelle: `${clientName} - Facture ${facture.numero || facture.referenceInterne}`,
      debit: facture.totalTTC,
      credit: 0,
    });
    lignes.push({
      compte: '701000',
      libelle: 'Ventes de marchandises',
      debit: 0,
      credit: facture.totalHT,
    });
    if (facture.totalTVA > 0) {
      lignes.push({
        compte: '443100',
        libelle: 'TVA facturee sur ventes',
        debit: 0,
        credit: facture.totalTVA,
      });
    }
  }

  return {
    journal: 'VE',
    dateEcriture: facture.dateFacture || new Date(),
    libelle: `${isAvoir ? 'Avoir' : 'Facture'} ${facture.numero || facture.referenceInterne} - ${clientName}`,
    lignes,
  };
};

/**
 * @desc    Send facture by email (PDF attachment)
 * @route   POST /api/factures/:id/send
 * @access  Private
 */
const sendFacture = async (req, res, next) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate('client')
      .populate('commercial', 'firstName lastName email')
      .populate('lignes.product', 'name code');

    if (!facture) {
      return next(new AppError('Facture non trouvee.', 404));
    }

    if (facture.statut === 'brouillon') {
      return next(new AppError('La facture doit etre validee avant envoi.', 400));
    }

    if (!facture.clientSnapshot.email && (!facture.client || !facture.client.email)) {
      return next(new AppError('Le client n\'a pas d\'adresse email.', 400));
    }

    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return next(new AppError('Parametres entreprise non trouves.', 500));
    }

    const pdfBuffer = await generateFacturePDF(facture, company);

    const email = facture.client?.email || facture.clientSnapshot.email;
    await sendFactureEmail(email, facture, pdfBuffer);

    // Update status to envoyee if validee
    if (facture.statut === 'validee') {
      facture.statut = 'envoyee';
      await facture.save();
    }

    res.json({
      success: true,
      message: `Facture envoyee a ${email}`,
      data: facture,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get facture PDF
 * @route   GET /api/factures/:id/pdf
 * @access  Private
 */
const getFacturePDF = async (req, res, next) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate('client')
      .populate('commercial', 'firstName lastName email')
      .populate('lignes.product', 'name code');

    if (!facture) {
      return next(new AppError('Facture non trouvee.', 404));
    }

    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return next(new AppError('Parametres entreprise non trouves.', 500));
    }

    const pdfBuffer = await generateFacturePDF(facture, company);

    const filename = facture.numero || facture.referenceInterne;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create avoir (credit note) from a validated facture
 * @route   POST /api/factures/:id/avoir
 * @access  Private
 */
const createAvoir = async (req, res, next) => {
  try {
    const factureOrigine = await Facture.findById(req.params.id);
    if (!factureOrigine) {
      return next(new AppError('Facture non trouvee.', 404));
    }

    if (!['validee', 'envoyee', 'partiellement_payee', 'payee'].includes(factureOrigine.statut)) {
      return next(new AppError('Impossible de creer un avoir pour cette facture.', 400));
    }

    // Determine avoir lines
    let avoirLignes;
    if (req.body.lignes && req.body.lignes.length > 0) {
      // Partial avoir: specific lines/quantities
      avoirLignes = req.body.lignes.map((reqLigne) => {
        const origineLigne = factureOrigine.lignes.id(reqLigne.ligneFactureId);
        if (!origineLigne) {
          throw new AppError(`Ligne de facture ${reqLigne.ligneFactureId} non trouvee.`, 404);
        }
        if (reqLigne.quantite > origineLigne.quantite) {
          throw new AppError(
            `Quantite avoir (${reqLigne.quantite}) depasse la quantite facturee (${origineLigne.quantite}).`,
            400
          );
        }
        return {
          product: origineLigne.product,
          designation: origineLigne.designation,
          reference: origineLigne.reference,
          quantite: reqLigne.quantite,
          prixUnitaire: origineLigne.prixUnitaire,
          remise: origineLigne.remise,
          tauxTVA: origineLigne.tauxTVA,
          unite: origineLigne.unite,
        };
      });
    } else {
      // Full avoir: copy all lines
      avoirLignes = factureOrigine.lignes.map((l) => ({
        product: l.product,
        designation: l.designation,
        reference: l.reference,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        remise: l.remise,
        tauxTVA: l.tauxTVA,
        unite: l.unite,
      }));
    }

    const avoir = await Facture.create({
      typeDocument: 'avoir',
      factureOrigine: factureOrigine._id,
      client: factureOrigine.client,
      clientSnapshot: factureOrigine.clientSnapshot,
      commande: factureOrigine.commande,
      lignes: avoirLignes,
      remiseGlobale: req.body.lignes ? 0 : factureOrigine.remiseGlobale,
      conditionsPaiement: factureOrigine.conditionsPaiement,
      notes: req.body.motif || req.body.notes,
      createdBy: req.user._id,
    });

    const populated = await Facture.findById(avoir._id)
      .populate('client', 'raisonSociale firstName lastName code')
      .populate('factureOrigine', 'numero');

    res.status(201).json({
      success: true,
      message: 'Avoir cree avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFactures,
  getFacture,
  createFacture,
  updateFacture,
  deleteFacture,
  validateFacture,
  sendFacture,
  getFacturePDF,
  createAvoir,
};
