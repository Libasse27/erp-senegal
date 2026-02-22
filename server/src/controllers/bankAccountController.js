const BankAccount = require('../models/BankAccount');
const Payment = require('../models/Payment');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all bank accounts
 * @route   GET /api/bank-accounts
 * @access  Private
 */
const getBankAccounts = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);
    const filter = {};

    if (req.query.type) filter.type = req.query.type;
    if (req.query.search) {
      filter.$or = [
        { nom: { $regex: req.query.search, $options: 'i' } },
        { banque: { $regex: req.query.search, $options: 'i' } },
        { numeroCompte: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [accounts, total] = await Promise.all([
      BankAccount.find(filter)
        .populate('compteComptable', 'numero libelle')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      BankAccount.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: accounts,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single bank account with recent movements
 * @route   GET /api/bank-accounts/:id
 * @access  Private
 */
const getBankAccount = async (req, res, next) => {
  try {
    const account = await BankAccount.findById(req.params.id)
      .populate('compteComptable', 'numero libelle');

    if (!account) {
      return next(new AppError('Compte bancaire non trouve.', 404));
    }

    // Get recent payments for this account
    const recentPayments = await Payment.find({
      compteBancaire: account._id,
      statut: 'valide',
      isActive: true,
    })
      .sort('-datePaiement')
      .limit(20)
      .populate('client', 'raisonSociale firstName lastName')
      .populate('fournisseur', 'raisonSociale')
      .select('numero typePaiement modePaiement montant datePaiement tiersSnapshot');

    res.json({
      success: true,
      data: {
        ...account.toObject(),
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create bank account
 * @route   POST /api/bank-accounts
 * @access  Private
 */
const createBankAccount = async (req, res, next) => {
  try {
    // If setting as default, unset previous default
    if (req.body.isDefault) {
      await BankAccount.updateMany({ isDefault: true }, { isDefault: false });
    }

    const account = await BankAccount.create({
      ...req.body,
      soldeActuel: req.body.soldeInitial || 0,
      createdBy: req.user._id,
    });

    const populated = await BankAccount.findById(account._id)
      .populate('compteComptable', 'numero libelle');

    res.status(201).json({
      success: true,
      message: 'Compte bancaire cree avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update bank account
 * @route   PUT /api/bank-accounts/:id
 * @access  Private
 */
const updateBankAccount = async (req, res, next) => {
  try {
    const account = await BankAccount.findById(req.params.id);
    if (!account) {
      return next(new AppError('Compte bancaire non trouve.', 404));
    }

    req._previousData = account.toObject();

    // If setting as default, unset previous default
    if (req.body.isDefault) {
      await BankAccount.updateMany(
        { _id: { $ne: account._id }, isDefault: true },
        { isDefault: false }
      );
    }

    Object.assign(account, req.body);
    account.modifiedBy = req.user._id;
    await account.save();

    const populated = await BankAccount.findById(account._id)
      .populate('compteComptable', 'numero libelle');

    res.json({
      success: true,
      message: 'Compte bancaire modifie avec succes',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete bank account
 * @route   DELETE /api/bank-accounts/:id
 * @access  Private
 */
const deleteBankAccount = async (req, res, next) => {
  try {
    const account = await BankAccount.findById(req.params.id);
    if (!account) {
      return next(new AppError('Compte bancaire non trouve.', 404));
    }

    // Check if account has linked payments
    const linkedPayments = await Payment.countDocuments({
      compteBancaire: account._id,
      statut: 'valide',
      isActive: true,
    });

    if (linkedPayments > 0) {
      return next(
        new AppError(
          `Ce compte bancaire est lie a ${linkedPayments} paiement(s) valide(s). Impossible de le supprimer.`,
          400
        )
      );
    }

    await account.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Compte bancaire supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bank reconciliation data
 * @route   GET /api/bank-accounts/:id/reconciliation
 * @access  Private
 */
const getReconciliation = async (req, res, next) => {
  try {
    const account = await BankAccount.findById(req.params.id);
    if (!account) {
      return next(new AppError('Compte bancaire non trouve.', 404));
    }

    const filter = {
      compteBancaire: account._id,
      statut: 'valide',
      isActive: true,
    };

    if (req.query.dateFrom || req.query.dateTo) {
      filter.datePaiement = {};
      if (req.query.dateFrom) filter.datePaiement.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.datePaiement.$lte = new Date(req.query.dateTo);
    }

    const payments = await Payment.find(filter)
      .sort('datePaiement')
      .populate('client', 'raisonSociale firstName lastName')
      .populate('fournisseur', 'raisonSociale')
      .select('numero typePaiement modePaiement montant datePaiement tiersSnapshot');

    // Calculate running balance
    let solde = account.soldeInitial;
    const mouvements = payments.map((p) => {
      const isCredit = p.typePaiement === 'client';
      if (isCredit) {
        solde += p.montant;
      } else {
        solde -= p.montant;
      }
      return {
        ...p.toObject(),
        credit: isCredit ? p.montant : 0,
        debit: isCredit ? 0 : p.montant,
        solde,
      };
    });

    const totalCredits = mouvements.reduce((s, m) => s + m.credit, 0);
    const totalDebits = mouvements.reduce((s, m) => s + m.debit, 0);

    res.json({
      success: true,
      data: {
        compte: account,
        mouvements,
        totaux: {
          totalCredits,
          totalDebits,
          soldeCalcule: account.soldeInitial + totalCredits - totalDebits,
          soldeActuel: account.soldeActuel,
          ecart: account.soldeActuel - (account.soldeInitial + totalCredits - totalDebits),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBankAccounts,
  getBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getReconciliation,
};
