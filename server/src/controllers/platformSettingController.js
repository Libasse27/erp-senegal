const PlatformSetting = require('../models/PlatformSetting');

/**
 * @desc  Lire les paramètres globaux de la plateforme (singleton)
 * @route GET /api/super-admin/platform-settings
 * @access Super Admin (scope PLATFORM)
 */
const getPlatformSettings = async (_req, res, next) => {
  try {
    const settings = await PlatformSetting.getInstance();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Modifier les paramètres globaux de la plateforme
 * @route PUT /api/super-admin/platform-settings
 * @access Super Admin (scope PLATFORM)
 *
 * Seuls les champs envoyés sont écrasés (merge partiel via $set implicite de
 * findOneAndUpdate). Les champs non envoyés conservent leur valeur actuelle.
 */
const updatePlatformSettings = async (req, res, next) => {
  try {
    // Flatten nested update keys to use MongoDB dot-notation
    // so findOneAndUpdate ne remplace pas les sous-documents entiers
    const flatBody = flattenObject(req.body);

    const settings = await PlatformSetting.findOneAndUpdate(
      { _singleton: 'PLATFORM' },
      { $set: { ...flatBody, modifiedBy: req.user._id } },
      { new: true, upsert: true, runValidators: false }
    );

    res.json({
      success: true,
      message: 'Paramètres de la plateforme mis à jour avec succès.',
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

// ── Utilitaire : aplatir un objet nested en dot-notation ─────────────────────
// { abonnement: { joursGrace: 5 } } → { 'abonnement.joursGrace': 5 }
function flattenObject(obj, prefix = '', result = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v, key, result);
    } else {
      result[key] = v;
    }
  }
  return result;
}

module.exports = { getPlatformSettings, updatePlatformSettings };
