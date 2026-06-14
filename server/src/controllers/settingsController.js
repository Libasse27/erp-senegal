const Settings = require('../models/Settings');
const { tc } = require('../utils/tenantHelper');

/**
 * @desc    Obtenir les parametres systeme de l'entreprise
 * @route   GET /api/settings
 * @access  Private
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ companyId: tc(req) });

    if (!settings) {
      settings = await Settings.create({ companyId: tc(req), createdBy: req.user._id });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier les parametres systeme de l'entreprise
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ companyId: tc(req) });

    if (!settings) {
      settings = await Settings.create({
        ...req.body,
        companyId: tc(req),
        createdBy: req.user._id,
      });
    } else {
      req._previousData = settings.toObject();

      settings = await Settings.findOneAndUpdate(
        { companyId: tc(req) },
        { ...req.body, modifiedBy: req.user._id },
        { new: true, runValidators: true }
      );
    }

    res.json({
      success: true,
      message: 'Parametres mis a jour avec succes',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
