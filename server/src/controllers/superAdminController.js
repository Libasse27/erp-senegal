const os = require('os');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const AuditLog = require('../models/AuditLog');
const Client = require('../models/Client');
const Fournisseur = require('../models/Fournisseur');
const Product = require('../models/Product');
const Facture = require('../models/Facture');
const Commande = require('../models/Commande');
const Stock = require('../models/Stock');
const Company = require('../models/Company');
const Payment = require('../models/Payment');
const { AppError } = require('../middlewares/errorHandler');
const { buildPaginationOptions, buildPaginationResponse } = require('../utils/helpers');
const logger = require('../config/logger');
const { getRedisClient, isRedisConnected } = require('../config/redis');
const { ROLES, PROTECTED_ROLES } = require('../config/constants');

// ─── STATISTIQUES GLOBALES ────────────────────────────────────────────────────

/**
 * @desc    Statistiques completes de la plateforme
 * @route   GET /api/super-admin/stats
 * @access  Super Admin only
 */
const getSystemStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalClients,
      totalFournisseurs,
      totalProducts,
      totalCommandes,
      totalFactures,
      caTotal,
      caMois,
      totalAuditLogs,
    ] = await Promise.all([
      User.countDocuments({ includeDeleted: true }),
      User.countDocuments({ isActive: true }),
      Role.countDocuments(),
      Client.countDocuments({ isActive: true }),
      Fournisseur.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Commande.countDocuments({ isActive: true }),
      Facture.countDocuments({ isActive: true }),
      Facture.aggregate([
        { $match: { isActive: true, statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] } } },
        { $group: { _id: null, total: { $sum: '$montantTTC' } } },
      ]),
      Facture.aggregate([
        {
          $match: {
            isActive: true,
            statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] },
            dateFacture: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$montantTTC' } } },
      ]),
      AuditLog.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        roles: totalRoles,
        clients: totalClients,
        fournisseurs: totalFournisseurs,
        produits: totalProducts,
        commandes: totalCommandes,
        factures: totalFactures,
        ca: {
          total: caTotal[0]?.total || 0,
          mois: caMois[0]?.total || 0,
        },
        auditLogs: totalAuditLogs,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SANTE DU SYSTEME ─────────────────────────────────────────────────────────

/**
 * @desc    Etat de sante du serveur, MongoDB et Redis
 * @route   GET /api/super-admin/health
 * @access  Super Admin only
 */
const getSystemHealth = async (req, res, next) => {
  try {
    // Sante MongoDB
    let mongoStatus = 'degraded';
    let mongoLatency = null;
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      mongoLatency = Date.now() - start;
      mongoStatus = 'healthy';
    } catch {
      mongoStatus = 'unhealthy';
    }

    // Sante Redis
    let redisStatus = 'disabled';
    let redisLatency = null;
    if (isRedisConnected()) {
      try {
        const client = getRedisClient();
        const start = Date.now();
        await client.ping();
        redisLatency = Date.now() - start;
        redisStatus = 'healthy';
      } catch {
        redisStatus = 'unhealthy';
      }
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const processMemory = process.memoryUsage();

    res.json({
      success: true,
      data: {
        server: {
          status: 'healthy',
          uptime: Math.floor(process.uptime()),
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
          hostname: os.hostname(),
        },
        memory: {
          totalBytes: totalMem,
          freeBytes: freeMem,
          usedBytes: usedMem,
          usagePercent: Math.round((usedMem / totalMem) * 100),
          process: {
            rss: processMemory.rss,
            heapTotal: processMemory.heapTotal,
            heapUsed: processMemory.heapUsed,
            external: processMemory.external,
          },
        },
        cpu: {
          count: cpus.length,
          model: cpus[0]?.model || 'Unknown',
          loadAvg: {
            '1min': Math.round(loadAvg[0] * 100) / 100,
            '5min': Math.round(loadAvg[1] * 100) / 100,
            '15min': Math.round(loadAvg[2] * 100) / 100,
          },
        },
        mongodb: {
          status: mongoStatus,
          latencyMs: mongoLatency,
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          dbName: mongoose.connection.name,
        },
        redis: {
          status: redisStatus,
          latencyMs: redisLatency,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GESTION AVANCEE DES UTILISATEURS ────────────────────────────────────────

/**
 * @desc    Lister tous les utilisateurs (y compris desactives)
 * @route   GET /api/super-admin/users
 * @access  Super Admin only
 */
const getAllUsersAdmin = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = { includeDeleted: true };
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) filter.$text = { $search: req.query.search };

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('role', 'name displayName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);
    res.json({ success: true, data: users, pagination });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forcer la deconnexion d'un utilisateur (invalider refresh token)
 * @route   POST /api/super-admin/users/:id/force-logout
 * @access  Super Admin only
 */
const forceLogoutUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+refreshToken');
    if (!user) return next(new AppError('Utilisateur non trouve.', 404));

    if (user.role?.name === ROLES.SUPER_ADMIN && user._id.toString() !== req.user._id.toString()) {
      return next(new AppError('Impossible de deconnecter un autre Super Administrateur.', 403));
    }

    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    logger.warn(`[SuperAdmin] Force logout user ${user.email} by ${req.user.email}`);

    res.json({ success: true, message: `Utilisateur ${user.email} deconnecte avec succes.` });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reactivier / deverrouiller un compte utilisateur
 * @route   POST /api/super-admin/users/:id/unlock
 * @access  Super Admin only
 */
const unlockUserAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('Utilisateur non trouve.', 404));

    await User.findByIdAndUpdate(req.params.id, {
      isActive: true,
      modifiedBy: req.user._id,
    });

    logger.info(`[SuperAdmin] Unlocked user ${user.email} by ${req.user.email}`);

    res.json({ success: true, message: `Compte de ${user.email} reactivé avec succes.` });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reinitialiser le mot de passe d'un utilisateur (sans connaitre l'ancien)
 * @route   POST /api/super-admin/users/:id/reset-password
 * @access  Super Admin only
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return next(new AppError('Utilisateur non trouve.', 404));

    if (user.role?.name === ROLES.SUPER_ADMIN && user._id.toString() !== req.user._id.toString()) {
      return next(new AppError('Impossible de reinitialiser le mot de passe d\'un autre Super Administrateur.', 403));
    }

    user.password = newPassword;
    user.refreshToken = null;
    user.modifiedBy = req.user._id;
    await user.save();

    logger.warn(`[SuperAdmin] Password reset for ${user.email} by ${req.user.email}`);

    res.json({ success: true, message: `Mot de passe de ${user.email} reinitialise avec succes.` });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Changer le role d'un utilisateur
 * @route   PUT /api/super-admin/users/:id/role
 * @access  Super Admin only
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { roleId } = req.body;
    if (!roleId) return next(new AppError('roleId est requis.', 400));

    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('Utilisateur non trouve.', 404));

    if (user.role?.name === ROLES.SUPER_ADMIN && user._id.toString() !== req.user._id.toString()) {
      return next(new AppError('Impossible de changer le role d\'un autre Super Administrateur.', 403));
    }

    const role = await Role.findById(roleId);
    if (!role) return next(new AppError('Role non trouve.', 404));

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role: roleId, modifiedBy: req.user._id },
      { new: true }
    ).populate('role', 'name displayName');

    res.json({ success: true, message: 'Role mis a jour avec succes.', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// ─── GESTION DES ROLES ET RBAC ────────────────────────────────────────────────

/**
 * @desc    Matrice RBAC complete (tous roles x toutes permissions)
 * @route   GET /api/super-admin/rbac-matrix
 * @access  Super Admin only
 */
const getRbacMatrix = async (req, res, next) => {
  try {
    const [roles, permissions] = await Promise.all([
      Role.find().populate('permissions').sort({ createdAt: 1 }),
      Permission.find({ isActive: true }).sort({ code: 1 }),
    ]);

    const matrix = roles.map((role) => ({
      role: {
        id: role._id,
        name: role.name,
        displayName: role.displayName,
        isSystem: role.isSystem,
        isProtected: PROTECTED_ROLES.includes(role.name),
      },
      permissions: role.permissions.map((p) => p.code),
      permissionCount: role.permissions.length,
    }));

    res.json({
      success: true,
      data: {
        matrix,
        allPermissions: permissions.map((p) => ({
          id: p._id,
          code: p.code,
          module: p.module,
          action: p.action,
        })),
        totalRoles: roles.length,
        totalPermissions: permissions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── JOURNAUX D'AUDIT ─────────────────────────────────────────────────────────

/**
 * @desc    Journaux d'audit avec filtres avances
 * @route   GET /api/super-admin/audit-logs
 * @access  Super Admin only
 */
const getAdvancedAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPaginationOptions(req.query);

    const filter = {};
    if (req.query.user) filter.user = req.query.user;
    if (req.query.module) filter.module = req.query.module;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const endDate = new Date(req.query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);
    res.json({ success: true, data: logs, pagination });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Purger les anciens journaux d'audit
 * @route   DELETE /api/super-admin/audit-logs/purge
 * @access  Super Admin only
 */
const purgeAuditLogs = async (req, res, next) => {
  try {
    const olderThanDays = parseInt(req.body.olderThanDays, 10) || 90;
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoffDate } });

    logger.warn(`[SuperAdmin] Purged ${result.deletedCount} audit logs older than ${olderThanDays} days by ${req.user.email}`);

    res.json({
      success: true,
      message: `${result.deletedCount} journaux purges avec succes.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─── JOURNAUX SYSTEME ─────────────────────────────────────────────────────────

/**
 * @desc    Lire les journaux systeme (fichiers Winston)
 * @route   GET /api/super-admin/system-logs
 * @access  Super Admin only
 */
const getSystemLogs = async (req, res, next) => {
  try {
    const logType = req.query.type || 'combined';
    const lines = Math.min(parseInt(req.query.lines, 10) || 200, 1000);

    const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const defaultLogDir = isLambda
      ? '/tmp/logs'
      : path.join(__dirname, '..', '..', '..', 'logs');
    const logDir = process.env.LOG_DIR || defaultLogDir;

    const logFileMap = {
      combined: 'combined.log',
      error: 'error.log',
      access: 'access.log',
    };

    const filename = logFileMap[logType] || 'combined.log';
    const logPath = path.join(logDir, filename);

    if (!fs.existsSync(logPath)) {
      return res.json({
        success: true,
        data: { lines: [], file: filename, message: 'Fichier de log non trouve ou vide.' },
      });
    }

    const content = fs.readFileSync(logPath, 'utf8');
    const allLines = content.split('\n').filter((l) => l.trim());
    const lastLines = allLines.slice(-lines);

    const parsedLines = lastLines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { message: line, level: 'info', timestamp: '' };
      }
    });

    res.json({
      success: true,
      data: {
        lines: parsedLines.reverse(),
        file: filename,
        total: allLines.length,
        returned: parsedLines.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lister les fichiers de logs disponibles
 * @route   GET /api/super-admin/system-logs/files
 * @access  Super Admin only
 */
const getLogFiles = async (req, res, next) => {
  try {
    const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const defaultLogDir = isLambda
      ? '/tmp/logs'
      : path.join(__dirname, '..', '..', '..', 'logs');
    const logDir = process.env.LOG_DIR || defaultLogDir;

    if (!fs.existsSync(logDir)) {
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(logDir)
      .filter((f) => f.endsWith('.log'))
      .map((f) => {
        const stats = fs.statSync(path.join(logDir, f));
        return {
          name: f,
          size: stats.size,
          lastModified: stats.mtime,
        };
      });

    res.json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
};

// ─── SAUVEGARDES ──────────────────────────────────────────────────────────────

const getBackupDir = () => {
  const defaultDir = path.join(__dirname, '..', '..', '..', 'backups');
  return process.env.BACKUP_PATH || defaultDir;
};

/**
 * @desc    Lister les sauvegardes disponibles
 * @route   GET /api/super-admin/backups
 * @access  Super Admin only
 */
const listBackups = async (req, res, next) => {
  try {
    const backupDir = getBackupDir();

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(backupDir)
      .filter((f) => f.endsWith('.json') || f.endsWith('.gz'))
      .map((f) => {
        const stats = fs.statSync(path.join(backupDir, f));
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime || stats.ctime,
          sizeHuman: formatBytes(stats.size),
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Creer une sauvegarde JSON des collections critiques
 * @route   POST /api/super-admin/backups
 * @access  Super Admin only
 */
const createBackup = async (req, res, next) => {
  try {
    const backupDir = getBackupDir();
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // Export des collections principales
    const [users, roles, permissions, clients, fournisseurs, products] = await Promise.all([
      User.find({ includeDeleted: true }).select('-password -refreshToken'),
      Role.find().populate('permissions'),
      Permission.find(),
      Client.find({ includeDeleted: true }),
      Fournisseur.find({ includeDeleted: true }),
      Product.find({ includeDeleted: true }),
    ]);

    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      createdBy: req.user.email,
      collections: {
        users: users.length,
        roles: roles.length,
        permissions: permissions.length,
        clients: clients.length,
        fournisseurs: fournisseurs.length,
        products: products.length,
      },
      data: { users, roles, permissions, clients, fournisseurs, products },
    };

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');

    logger.info(`[SuperAdmin] Backup created: ${filename} by ${req.user.email}`);

    const stats = fs.statSync(filepath);
    res.status(201).json({
      success: true,
      message: 'Sauvegarde creee avec succes.',
      data: { filename, size: stats.size, sizeHuman: formatBytes(stats.size), createdAt: new Date() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Telecharger une sauvegarde
 * @route   GET /api/super-admin/backups/:filename/download
 * @access  Super Admin only
 */
const downloadBackup = async (req, res, next) => {
  try {
    const backupDir = getBackupDir();
    const filename = path.basename(req.params.filename);
    const filepath = path.join(backupDir, filename);

    if (!fs.existsSync(filepath)) {
      return next(new AppError('Fichier de sauvegarde non trouve.', 404));
    }

    logger.info(`[SuperAdmin] Backup download: ${filename} by ${req.user.email}`);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(filepath);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer une sauvegarde
 * @route   DELETE /api/super-admin/backups/:filename
 * @access  Super Admin only
 */
const deleteBackup = async (req, res, next) => {
  try {
    const backupDir = getBackupDir();
    const filename = path.basename(req.params.filename);
    const filepath = path.join(backupDir, filename);

    if (!fs.existsSync(filepath)) {
      return next(new AppError('Fichier de sauvegarde non trouve.', 404));
    }

    fs.unlinkSync(filepath);

    logger.warn(`[SuperAdmin] Backup deleted: ${filename} by ${req.user.email}`);

    res.json({ success: true, message: 'Sauvegarde supprimee avec succes.' });
  } catch (error) {
    next(error);
  }
};

// ─── GESTION DES ENTREPRISES (SUPER ADMIN) ───────────────────────────────────

/**
 * @desc    Lister toutes les entreprises avec stats
 * @route   GET /api/super-admin/companies
 * @access  Super Admin only
 */
const listAllCompanies = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = buildPaginationOptions(req.query);

    const filter = { includeDeleted: true };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.plan) filter.plan = req.query.plan;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { ninea: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .populate('adminUser', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Company.countDocuments(filter),
    ]);

    const pagination = buildPaginationResponse(total, page, limit);
    res.json({ success: true, data: companies, pagination });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir une entreprise par ID avec ses statistiques completes
 * @route   GET /api/super-admin/companies/:id
 * @access  Super Admin only
 */
const getCompanyAdmin = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('adminUser', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName')
      .populate('suspendedBy', 'firstName lastName email');

    if (!company) return next(new AppError('Entreprise non trouvee.', 404));

    // Statistiques liees a cette entreprise
    const [totalUsers, totalClients, totalFactures, totalProduits, caTotal] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Client.countDocuments({ isActive: true }),
      Facture.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Facture.aggregate([
        { $match: { isActive: true, statut: { $in: ['validee', 'envoyee', 'partiellement_payee', 'payee'] } } },
        { $group: { _id: null, total: { $sum: '$montantTTC' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        company,
        stats: {
          totalUsers,
          totalClients,
          totalFactures,
          totalProduits,
          caTotal: caTotal[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Creer une nouvelle entreprise
 * @route   POST /api/super-admin/companies
 * @access  Super Admin only
 */
const createCompanyAdmin = async (req, res, next) => {
  try {
    // Verifier l'unicite du NINEA si fourni
    if (req.body.ninea) {
      const existing = await Company.findOne({ ninea: req.body.ninea.toUpperCase(), includeDeleted: true });
      if (existing) return next(new AppError('Une entreprise avec ce NINEA existe deja.', 400));
    }

    const company = await Company.create({
      ...req.body,
      createdBy: req.user._id,
    });

    logger.info(`[SuperAdmin] Company created: ${company.name} (${company._id}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Entreprise creee avec succes.',
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier une entreprise (acces complet Super Admin)
 * @route   PUT /api/super-admin/companies/:id
 * @access  Super Admin only
 */
const updateCompanyAdmin = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return next(new AppError('Entreprise non trouvee.', 404));

    // Verifier l'unicite du NINEA si modifie
    if (req.body.ninea && req.body.ninea.toUpperCase() !== company.ninea) {
      const existing = await Company.findOne({
        ninea: req.body.ninea.toUpperCase(),
        _id: { $ne: company._id },
        includeDeleted: true,
      });
      if (existing) return next(new AppError('Une autre entreprise avec ce NINEA existe deja.', 400));
    }

    const updated = await Company.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('adminUser', 'firstName lastName email');

    logger.info(`[SuperAdmin] Company updated: ${updated.name} (${updated._id}) by ${req.user.email}`);

    res.json({ success: true, message: 'Entreprise mise a jour avec succes.', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspendre une entreprise
 * @route   POST /api/super-admin/companies/:id/suspend
 * @access  Super Admin only
 */
const suspendCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return next(new AppError('Entreprise non trouvee.', 404));

    if (company.status === 'suspended') {
      return next(new AppError('Cette entreprise est deja suspendue.', 400));
    }

    const { reason } = req.body;
    const updated = await Company.findByIdAndUpdate(
      req.params.id,
      {
        status: 'suspended',
        suspendedAt: new Date(),
        suspendedBy: req.user._id,
        suspensionReason: reason,
        modifiedBy: req.user._id,
      },
      { new: true }
    );

    logger.warn(`[SuperAdmin] Company suspended: ${company.name} — reason: ${reason} by ${req.user.email}`);

    res.json({ success: true, message: `Entreprise "${company.name}" suspendue avec succes.`, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reactiver une entreprise suspendue
 * @route   POST /api/super-admin/companies/:id/activate
 * @access  Super Admin only
 */
const activateCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return next(new AppError('Entreprise non trouvee.', 404));

    const updated = await Company.findByIdAndUpdate(
      req.params.id,
      {
        status: 'active',
        isActive: true,
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null,
        modifiedBy: req.user._id,
      },
      { new: true }
    );

    logger.info(`[SuperAdmin] Company activated: ${company.name} by ${req.user.email}`);

    res.json({ success: true, message: `Entreprise "${company.name}" reactivee avec succes.`, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer une entreprise (soft delete)
 * @route   DELETE /api/super-admin/companies/:id
 * @access  Super Admin only
 */
const deleteCompanyAdmin = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return next(new AppError('Entreprise non trouvee.', 404));

    await company.softDelete(req.user._id);

    logger.warn(`[SuperAdmin] Company deleted: ${company.name} (${company._id}) by ${req.user.email}`);

    res.json({ success: true, message: `Entreprise "${company.name}" supprimee avec succes.` });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Statistiques globales des entreprises (tableau de bord)
 * @route   GET /api/super-admin/companies/overview
 * @access  Super Admin only
 */
const getCompaniesOverview = async (req, res, next) => {
  try {
    const [total, active, suspended, trial, expired, byPlan] = await Promise.all([
      Company.countDocuments({ includeDeleted: true }),
      Company.countDocuments({ status: 'active', isActive: true }),
      Company.countDocuments({ status: 'suspended', includeDeleted: true }),
      Company.countDocuments({ status: 'trial', isActive: true }),
      Company.countDocuments({ status: 'expired', includeDeleted: true }),
      Company.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: { active, suspended, trial, expired },
        byPlan: byPlan.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── UTILITAIRE ───────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  getSystemStats,
  getSystemHealth,
  getAllUsersAdmin,
  forceLogoutUser,
  unlockUserAccount,
  resetUserPassword,
  changeUserRole,
  getRbacMatrix,
  getAdvancedAuditLogs,
  purgeAuditLogs,
  getSystemLogs,
  getLogFiles,
  listBackups,
  createBackup,
  downloadBackup,
  deleteBackup,
  // Entreprises
  listAllCompanies,
  getCompanyAdmin,
  createCompanyAdmin,
  updateCompanyAdmin,
  suspendCompany,
  activateCompany,
  deleteCompanyAdmin,
  getCompaniesOverview,
};
