const multer = require('multer');
const { AppError } = require('../middlewares/errorHandler');
const { generateTemplate, importClients, importFournisseurs, importProduits } = require('../services/importService');
const { tc } = require('../utils/tenantHelper');

// Multer memory storage — fichier en RAM, pas de disque
const memUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ok = /\.(xlsx|xls|csv)$/.test(file.originalname.toLowerCase()) ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv';
    if (ok) cb(null, true);
    else cb(new AppError('Seuls les fichiers Excel (.xlsx) et CSV sont acceptés.', 400), false);
  },
}).single('file');

const IMPORTERS = {
  clients:      importClients,
  fournisseurs: importFournisseurs,
  produits:     importProduits,
};

/**
 * @desc    Télécharger un template Excel vide
 * @route   GET /api/imports/template/:type
 */
const downloadTemplate = (req, res, next) => {
  try {
    const { type } = req.params;
    if (!IMPORTERS[type]) {
      return next(new AppError(`Type d'import inconnu: ${type}. Types valides: clients, fournisseurs, produits`, 400));
    }

    const buffer = generateTemplate(type);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template-import-${type}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Importer des données depuis un fichier Excel / CSV
 * @route   POST /api/imports/:type
 */
const importData = (req, res, next) => {
  memUpload(req, res, async (err) => {
    if (err) return next(new AppError(err.message || 'Erreur upload.', 400));

    try {
      const { type } = req.params;
      const importer = IMPORTERS[type];
      if (!importer) {
        return next(new AppError(`Type d'import inconnu: ${type}`, 400));
      }

      if (!req.file || !req.file.buffer) {
        return next(new AppError('Aucun fichier fourni.', 400));
      }

      const result = await importer(req.file.buffer, tc(req), req.user._id);

      res.json({
        success: true,
        message: `Import ${type} terminé — ${result.imported} ajouté(s), ${result.updated} mis à jour, ${result.errors.length} erreur(s).`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });
};

/**
 * @desc    Exporter liste clients en Excel
 * @route   GET /api/clients/export
 */
const exportClientsHandler = async (req, res, next) => {
  try {
    const { exportClientsExcel } = require('../services/exportService');
    const buffer = await exportClientsExcel(tc(req), req.query);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="clients-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  } catch (err) { next(err); }
};

/**
 * @desc    Exporter liste fournisseurs en Excel
 * @route   GET /api/fournisseurs/export
 */
const exportFournisseursHandler = async (req, res, next) => {
  try {
    const { exportFournisseursExcel } = require('../services/exportService');
    const buffer = await exportFournisseursExcel(tc(req), req.query);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="fournisseurs-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  } catch (err) { next(err); }
};

/**
 * @desc    Exporter catalogue produits en Excel
 * @route   GET /api/products/export
 */
const exportProduitsHandler = async (req, res, next) => {
  try {
    const { exportProduitsExcel } = require('../services/exportService');
    const buffer = await exportProduitsExcel(tc(req), req.query);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="produits-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  } catch (err) { next(err); }
};

/**
 * @desc    Exporter état des stocks en Excel
 * @route   GET /api/stocks/export
 */
const exportStocksHandler = async (req, res, next) => {
  try {
    const { exportStocksExcel } = require('../services/exportService');
    const buffer = await exportStocksExcel(tc(req), req.query);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="stocks-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  } catch (err) { next(err); }
};

/**
 * @desc    Exporter liste paiements en Excel
 * @route   GET /api/payments/export
 */
const exportPaiementsHandler = async (req, res, next) => {
  try {
    const { exportPaiementsExcel } = require('../services/exportService');
    const buffer = await exportPaiementsExcel(tc(req), req.query);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="paiements-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  } catch (err) { next(err); }
};

module.exports = {
  downloadTemplate,
  importData,
  exportClientsHandler,
  exportFournisseursHandler,
  exportProduitsHandler,
  exportStocksHandler,
  exportPaiementsHandler,
};
