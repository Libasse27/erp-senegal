const Company = require('../models/Company');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Obtenir les informations de l'entreprise
 * @route   GET /api/company
 * @access  Private
 */
const getCompany = async (req, res, next) => {
  try {
    let company = await Company.findOne();

    if (!company) {
      // Creer une entreprise par defaut si aucune n'existe
      company = await Company.create({
        name: 'Mon Entreprise',
        address: { city: 'Dakar', country: 'Senegal' },
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier les informations de l'entreprise
 * @route   PUT /api/company
 * @access  Private/Admin
 */
const updateCompany = async (req, res, next) => {
  try {
    let company = await Company.findOne();

    if (!company) {
      // Creer si n'existe pas
      company = await Company.create({
        ...req.body,
        createdBy: req.user._id,
      });
    } else {
      // Sauvegarder les anciennes donnees pour l'audit
      req._previousData = company.toObject();

      company = await Company.findByIdAndUpdate(
        company._id,
        { ...req.body, modifiedBy: req.user._id },
        { new: true, runValidators: true }
      );
    }

    res.json({
      success: true,
      message: 'Informations entreprise mises a jour avec succes',
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompany,
  updateCompany,
};
