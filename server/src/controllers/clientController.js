const Client = require('../models/Client');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');

/**
 * @desc    Get all clients with pagination, filters, and search
 * @route   GET /api/clients
 * @access  Private
 */
const getClients = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = {};

    if (req.query.type) filter.type = req.query.type;
    if (req.query.segment) filter.segment = req.query.segment;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.modePaiement) filter.modePaiement = req.query.modePaiement;

    if (req.query.search) {
      filter.$or = [
        { raisonSociale: { $regex: req.query.search, $options: 'i' } },
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(limit),
      Client.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);

    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', pagination.totalPages);

    res.json({
      success: true,
      data: clients,
      meta: pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single client with full details
 * @route   GET /api/clients/:id
 * @access  Private
 */
const getClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return next(new AppError('Client non trouve.', 404));
    }

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new client
 * @route   POST /api/clients
 * @access  Private
 */
const createClient = async (req, res, next) => {
  try {
    const client = await Client.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Client cree avec succes',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Private
 */
const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return next(new AppError('Client non trouve.', 404));
    }

    req._previousData = client.toObject();

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Client modifie avec succes',
      data: updatedClient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete client
 * @route   DELETE /api/clients/:id
 * @access  Private
 */
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return next(new AppError('Client non trouve.', 404));
    }

    // Check for outstanding balance
    if (client.totalCreances > 0) {
      return next(
        new AppError(
          `Ce client a un solde de creances de ${client.totalCreances} FCFA. Regularisez avant de supprimer.`,
          400
        )
      );
    }

    await client.softDelete(req.user._id);

    res.json({
      success: true,
      message: 'Client supprime avec succes',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get client statistics (CA, factures, segmentation)
 * @route   GET /api/clients/:id/stats
 * @access  Private
 */
const getClientStats = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return next(new AppError('Client non trouve.', 404));
    }

    res.json({
      success: true,
      data: {
        totalCA: client.totalCA,
        totalCreances: client.totalCreances,
        nombreFactures: client.nombreFactures,
        segment: client.segment,
        delaiPaiement: client.delaiPaiement,
        plafondCredit: client.plafondCredit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update ABC segmentation for all clients
 * @route   POST /api/clients/segmentation
 * @access  Private/Admin
 */
const updateSegmentation = async (req, res, next) => {
  try {
    await Client.updateSegmentation();

    res.json({
      success: true,
      message: 'Segmentation ABC mise a jour avec succes',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  updateSegmentation,
};
