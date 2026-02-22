const CompteComptable = require('../models/CompteComptable');
const EcritureComptable = require('../models/EcritureComptable');
const ExerciceComptable = require('../models/ExerciceComptable');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const comptabiliteService = require('../services/comptabiliteService');
const logger = require('../config/logger');

// =====================================================
// PLAN COMPTABLE (CompteComptable)
// =====================================================

/**
 * @desc    Get plan comptable SYSCOHADA (full or by class)
 * @route   GET /api/comptabilite/plan
 * @access  Private
 */
const getPlanComptable = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.classe) filter.classe = parseInt(req.query.classe, 10);
    if (req.query.isImputable !== undefined) filter.isImputable = req.query.isImputable === 'true';

    if (req.query.search) {
      filter.$or = [
        { numero: { $regex: req.query.search, $options: 'i' } },
        { libelle: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const comptes = await CompteComptable.find(filter)
      .populate('parent', 'numero libelle')
      .sort('numero');

    res.json({
      success: true,
      data: comptes,
      meta: { total: comptes.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single compte comptable
 * @route   GET /api/comptabilite/plan/:id
 * @access  Private
 */
const getCompteComptable = async (req, res, next) => {
  try {
    const compte = await CompteComptable.findById(req.params.id)
      .populate('parent', 'numero libelle')
      .populate('children');

    if (!compte) {
      return next(new AppError('Compte comptable non trouve.', 404));
    }

    res.json({ success: true, data: compte });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new sub-account
 * @route   POST /api/comptabilite/plan
 * @access  Private
 */
const createCompteComptable = async (req, res, next) => {
  try {
    // Find parent account if numero implies hierarchy
    const parentNumero = req.body.numero.slice(0, -1);
    let parent = null;
    if (parentNumero.length > 0) {
      parent = await CompteComptable.findByNumero(parentNumero);
      // Walk up until we find a valid parent
      if (!parent && parentNumero.length > 1) {
        for (let len = parentNumero.length - 1; len >= 1; len--) {
          parent = await CompteComptable.findByNumero(req.body.numero.slice(0, len));
          if (parent) break;
        }
      }
    }

    const compte = await CompteComptable.create({
      ...req.body,
      parent: parent?._id || req.body.parent || null,
      createdBy: req.user._id,
    });

    const populated = await CompteComptable.findById(compte._id)
      .populate('parent', 'numero libelle');

    res.status(201).json({
      success: true,
      message: 'Compte comptable cree avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a compte comptable
 * @route   PUT /api/comptabilite/plan/:id
 * @access  Private
 */
const updateCompteComptable = async (req, res, next) => {
  try {
    const compte = await CompteComptable.findById(req.params.id);
    if (!compte) {
      return next(new AppError('Compte comptable non trouve.', 404));
    }

    if (compte.isSystem && req.body.numero) {
      return next(new AppError('Le numero d\'un compte systeme SYSCOHADA ne peut pas etre modifie.', 400));
    }

    req._previousData = compte.toObject();

    Object.assign(compte, req.body);
    compte.modifiedBy = req.user._id;
    await compte.save();

    res.json({
      success: true,
      message: 'Compte comptable modifie avec succes',
      data: compte,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete a compte comptable
 * @route   DELETE /api/comptabilite/plan/:id
 * @access  Private
 */
const deleteCompteComptable = async (req, res, next) => {
  try {
    const compte = await CompteComptable.findById(req.params.id);
    if (!compte) {
      return next(new AppError('Compte comptable non trouve.', 404));
    }

    await compte.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Compte comptable supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ECRITURES COMPTABLES
// =====================================================

/**
 * @desc    Get ecritures with filters
 * @route   GET /api/comptabilite/ecritures
 * @access  Private
 */
const getEcritures = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = {};

    if (req.query.journal) filter.journal = req.query.journal;
    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.exercice) filter.exercice = req.query.exercice;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.dateEcriture = {};
      if (req.query.dateFrom) filter.dateEcriture.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.dateEcriture.$lte = new Date(req.query.dateTo);
    }

    if (req.query.compteNumero) {
      filter['lignes.compteNumero'] = req.query.compteNumero;
    }

    if (req.query.search) {
      filter.$or = [
        { numero: { $regex: req.query.search, $options: 'i' } },
        { libelle: { $regex: req.query.search, $options: 'i' } },
        { reference: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [ecritures, total] = await Promise.all([
      EcritureComptable.find(filter)
        .populate('exercice', 'code libelle')
        .populate('lignes.compte', 'numero libelle')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      EcritureComptable.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: ecritures,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single ecriture
 * @route   GET /api/comptabilite/ecritures/:id
 * @access  Private
 */
const getEcriture = async (req, res, next) => {
  try {
    const ecriture = await EcritureComptable.findById(req.params.id)
      .populate('exercice', 'code libelle')
      .populate('lignes.compte', 'numero libelle')
      .populate('createdBy', 'firstName lastName')
      .populate('validatedBy', 'firstName lastName')
      .populate('ecritureOrigine', 'numero libelle');

    if (!ecriture) {
      return next(new AppError('Ecriture comptable non trouvee.', 404));
    }

    res.json({ success: true, data: ecriture });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create manual accounting entry (OD - Operations Diverses)
 * @route   POST /api/comptabilite/ecritures
 * @access  Private
 */
const createEcriture = async (req, res, next) => {
  try {
    // Get current exercise
    const exercice = await comptabiliteService.getExerciceForDate(
      new Date(req.body.dateEcriture)
    );

    // Resolve account ObjectIds for each line
    const lignes = [];
    for (const ligne of req.body.lignes) {
      const compte = await comptabiliteService.resolveCompte(ligne.compteNumero);
      lignes.push({
        compte: compte._id,
        compteNumero: ligne.compteNumero,
        compteLibelle: compte.libelle,
        libelle: ligne.libelle,
        debit: ligne.debit || 0,
        credit: ligne.credit || 0,
      });
    }

    // Validate equilibrium
    const totalDebit = lignes.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lignes.reduce((s, l) => s + l.credit, 0);
    if (totalDebit !== totalCredit) {
      return next(
        new AppError(
          `L'ecriture n'est pas equilibree: Debit ${totalDebit} != Credit ${totalCredit}`,
          400
        )
      );
    }

    const ecriture = await EcritureComptable.create({
      journal: req.body.journal,
      dateEcriture: req.body.dateEcriture,
      libelle: req.body.libelle,
      reference: req.body.reference,
      exercice: exercice._id,
      lignes,
      sourceDocument: { type: 'manuel' },
      pieceJustificative: req.body.pieceJustificative,
      createdBy: req.user._id,
    });

    const populated = await EcritureComptable.findById(ecriture._id)
      .populate('exercice', 'code libelle')
      .populate('lignes.compte', 'numero libelle');

    res.status(201).json({
      success: true,
      message: 'Ecriture comptable creee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update ecriture (only brouillon)
 * @route   PUT /api/comptabilite/ecritures/:id
 * @access  Private
 */
const updateEcriture = async (req, res, next) => {
  try {
    const ecriture = await EcritureComptable.findById(req.params.id);
    if (!ecriture) {
      return next(new AppError('Ecriture comptable non trouvee.', 404));
    }

    if (ecriture.statut !== 'brouillon') {
      return next(new AppError('Seules les ecritures en brouillon peuvent etre modifiees.', 400));
    }

    req._previousData = ecriture.toObject();

    // If lignes are being updated, resolve accounts
    if (req.body.lignes) {
      const lignes = [];
      for (const ligne of req.body.lignes) {
        const compte = await comptabiliteService.resolveCompte(ligne.compteNumero);
        lignes.push({
          compte: compte._id,
          compteNumero: ligne.compteNumero,
          compteLibelle: compte.libelle,
          libelle: ligne.libelle,
          debit: ligne.debit || 0,
          credit: ligne.credit || 0,
        });
      }
      ecriture.lignes = lignes;
    }

    if (req.body.dateEcriture) ecriture.dateEcriture = req.body.dateEcriture;
    if (req.body.libelle) ecriture.libelle = req.body.libelle;
    if (req.body.reference !== undefined) ecriture.reference = req.body.reference;
    if (req.body.pieceJustificative !== undefined) ecriture.pieceJustificative = req.body.pieceJustificative;

    ecriture.modifiedBy = req.user._id;
    await ecriture.save();

    const populated = await EcritureComptable.findById(ecriture._id)
      .populate('exercice', 'code libelle')
      .populate('lignes.compte', 'numero libelle');

    res.json({
      success: true,
      message: 'Ecriture comptable modifiee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate ecriture and update account balances
 * @route   POST /api/comptabilite/ecritures/:id/validate
 * @access  Private
 */
const validateEcriture = async (req, res, next) => {
  try {
    const ecriture = await EcritureComptable.findById(req.params.id);
    if (!ecriture) {
      return next(new AppError('Ecriture comptable non trouvee.', 404));
    }

    await ecriture.valider(req.user._id);

    // Update account balances
    await comptabiliteService.updateCompteBalances(ecriture.lignes);

    const populated = await EcritureComptable.findById(ecriture._id)
      .populate('exercice', 'code libelle')
      .populate('lignes.compte', 'numero libelle');

    res.json({
      success: true,
      message: 'Ecriture comptable validee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete ecriture (only brouillon)
 * @route   DELETE /api/comptabilite/ecritures/:id
 * @access  Private
 */
const deleteEcriture = async (req, res, next) => {
  try {
    const ecriture = await EcritureComptable.findById(req.params.id);
    if (!ecriture) {
      return next(new AppError('Ecriture comptable non trouvee.', 404));
    }

    await ecriture.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Ecriture comptable supprimee avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create contrepassation for a validated entry
 * @route   POST /api/comptabilite/ecritures/:id/contrepasser
 * @access  Private
 */
const contrepasserEcriture = async (req, res, next) => {
  try {
    const contrepassation = await comptabiliteService.contrepasser(
      req.params.id,
      req.user._id
    );

    const populated = await EcritureComptable.findById(contrepassation._id)
      .populate('exercice', 'code libelle')
      .populate('lignes.compte', 'numero libelle');

    res.status(201).json({
      success: true,
      message: 'Contrepassation creee avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lettrage of tiers account entries
 * @route   POST /api/comptabilite/lettrage
 * @access  Private
 */
const lettrerEcritures = async (req, res, next) => {
  try {
    const lettrageCode = await comptabiliteService.lettrer(
      req.body.compteNumero,
      req.body.ligneIds,
      req.user._id
    );

    res.json({
      success: true,
      message: `Lettrage effectue avec succes (${lettrageCode})`,
      data: { lettrageCode },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// EXERCICES COMPTABLES
// =====================================================

/**
 * @desc    Get all exercices comptables
 * @route   GET /api/comptabilite/exercices
 * @access  Private
 */
const getExercices = async (req, res, next) => {
  try {
    const exercices = await ExerciceComptable.find()
      .populate('createdBy', 'firstName lastName')
      .populate('cloturePar', 'firstName lastName')
      .sort('-dateDebut');

    res.json({
      success: true,
      data: exercices,
      meta: { total: exercices.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new exercice comptable
 * @route   POST /api/comptabilite/exercices
 * @access  Private
 */
const createExercice = async (req, res, next) => {
  try {
    // Check for overlapping exercices
    const overlap = await ExerciceComptable.findOne({
      $or: [
        {
          dateDebut: { $lte: new Date(req.body.dateFin) },
          dateFin: { $gte: new Date(req.body.dateDebut) },
        },
      ],
      isActive: true,
    });

    if (overlap) {
      return next(
        new AppError(
          `L'exercice chevauche avec l'exercice existant "${overlap.libelle}" (${overlap.code}).`,
          400
        )
      );
    }

    // Unset previous isCurrent
    await ExerciceComptable.updateMany({ isCurrent: true }, { isCurrent: false });

    const exercice = await ExerciceComptable.create({
      ...req.body,
      isCurrent: true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Exercice comptable cree avec succes',
      data: exercice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Close an exercice comptable
 * @route   POST /api/comptabilite/exercices/:id/cloture
 * @access  Private
 */
const cloturerExercice = async (req, res, next) => {
  try {
    const exercice = await ExerciceComptable.findById(req.params.id);
    if (!exercice) {
      return next(new AppError('Exercice comptable non trouve.', 404));
    }

    // Check for draft entries in this exercise
    const brouillons = await EcritureComptable.countDocuments({
      exercice: exercice._id,
      statut: 'brouillon',
      isActive: true,
    });

    if (brouillons > 0) {
      return next(
        new AppError(
          `Impossible de cloturer: ${brouillons} ecriture(s) en brouillon dans cet exercice.`,
          400
        )
      );
    }

    await exercice.cloturer(req.user._id);

    res.json({
      success: true,
      message: `Exercice ${exercice.code} cloture avec succes`,
      data: exercice,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ETATS FINANCIERS
// =====================================================

/**
 * @desc    Get Grand Livre for a specific account
 * @route   GET /api/comptabilite/grand-livre
 * @access  Private
 */
const getGrandLivre = async (req, res, next) => {
  try {
    if (!req.query.compteNumero) {
      // Return list of all accounts with movements
      const comptes = await CompteComptable.find({
        isActive: true,
        $or: [{ soldeDebit: { $gt: 0 } }, { soldeCredit: { $gt: 0 } }],
      }).sort('numero');

      return res.json({
        success: true,
        data: comptes,
        meta: { total: comptes.length },
      });
    }

    const result = await comptabiliteService.getGrandLivre(req.query.compteNumero, {
      exercice: req.query.exercice,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    // Get account info
    const compte = await CompteComptable.findByNumero(req.query.compteNumero);

    res.json({
      success: true,
      data: {
        compte: compte ? { numero: compte.numero, libelle: compte.libelle, type: compte.type } : null,
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Balance Generale
 * @route   GET /api/comptabilite/balance
 * @access  Private
 */
const getBalance = async (req, res, next) => {
  try {
    const result = await comptabiliteService.getBalance({
      exercice: req.query.exercice,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Compte de Resultat (Income Statement)
 * @route   GET /api/comptabilite/compte-resultat
 * @access  Private
 */
const getCompteResultat = async (req, res, next) => {
  try {
    const result = await comptabiliteService.getCompteResultat({
      exercice: req.query.exercice,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Bilan (Balance Sheet)
 * @route   GET /api/comptabilite/bilan
 * @access  Private
 */
const getBilan = async (req, res, next) => {
  try {
    const result = await comptabiliteService.getBilan({
      exercice: req.query.exercice,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get TVA declaration
 * @route   GET /api/comptabilite/tva
 * @access  Private
 */
const getDeclarationTVA = async (req, res, next) => {
  try {
    const result = await comptabiliteService.getDeclarationTVA({
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export FEC (Fichier des Ecritures Comptables)
 * @route   GET /api/comptabilite/fec
 * @access  Private
 */
const exportFEC = async (req, res, next) => {
  try {
    if (!req.query.exercice) {
      return next(new AppError("L'exercice comptable est requis pour l'export FEC.", 400));
    }

    const fecLines = await comptabiliteService.exportFEC({
      exercice: req.query.exercice,
    });

    if (req.query.format === 'json') {
      return res.json({
        success: true,
        data: fecLines,
        meta: { total: fecLines.length },
      });
    }

    // Default: CSV/TSV format (tab-separated as per FEC standard)
    const headers = [
      'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
      'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
      'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
      'EcrtureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise',
    ];

    let content = headers.join('\t') + '\n';
    for (const line of fecLines) {
      content += headers.map((h) => line[h] || '').join('\t') + '\n';
    }

    res.set({
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Content-Disposition': `attachment; filename="FEC_${req.query.exercice}.txt"`,
    });

    res.send(content);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Plan comptable
  getPlanComptable,
  getCompteComptable,
  createCompteComptable,
  updateCompteComptable,
  deleteCompteComptable,
  // Ecritures
  getEcritures,
  getEcriture,
  createEcriture,
  updateEcriture,
  validateEcriture,
  deleteEcriture,
  contrepasserEcriture,
  lettrerEcritures,
  // Exercices
  getExercices,
  createExercice,
  cloturerExercice,
  // Etats financiers
  getGrandLivre,
  getBalance,
  getCompteResultat,
  getBilan,
  getDeclarationTVA,
  exportFEC,
};
