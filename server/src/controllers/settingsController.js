const Settings = require('../models/Settings');

/**
 * @desc    Obtenir les parametres systeme
 * @route   GET /api/settings
 * @access  Private
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      // Creer les parametres par defaut
      settings = await Settings.create({});
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
 * @desc    Modifier les parametres systeme
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        ...req.body,
        createdBy: req.user._id,
      });
    } else {
      req._previousData = settings.toObject();

      settings = await Settings.findByIdAndUpdate(
        settings._id,
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
