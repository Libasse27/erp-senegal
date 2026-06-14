const Notification = require('../models/Notification');
const logger = require('../config/logger');

let _io = null;

const initNotificationService = (io) => {
  _io = io;
  logger.info('Service de notification initialise');
};

const getIO = () => _io;

// ─── Primitives ──────────────────────────────────────────────────────────────

/** Unicast vers un utilisateur spécifique */
const notifyUser = (userId, event, data) => {
  if (!_io) { logger.warn('Socket.io non initialise'); return; }
  _io.to(`user:${userId}`).emit(event, { ...data, timestamp: new Date().toISOString() });
};

/** Multicast vers un rôle dans une entreprise donnée (isolation tenant) */
const notifyRoleInCompany = (companyId, role, event, data) => {
  if (!_io) { logger.warn('Socket.io non initialise'); return; }
  _io
    .to(`company:${companyId}:role:${role}`)
    .emit(event, { ...data, companyId: companyId.toString(), timestamp: new Date().toISOString() });
};

/** Broadcast global (toutes entreprises — réservé aux événements système) */
const notifyAll = (event, data) => {
  if (!_io) { logger.warn('Socket.io non initialise'); return; }
  _io.emit(event, { ...data, timestamp: new Date().toISOString() });
};

// ─── Persistance + émission ──────────────────────────────────────────────────

/**
 * Crée une notification en base ET émet en temps réel vers l'utilisateur.
 * @param {Object} opts
 * @param {string}  opts.userId
 * @param {string}  [opts.companyId]
 * @param {string}  opts.type      info|success|warning|error
 * @param {string}  opts.title
 * @param {string}  opts.message
 * @param {string}  [opts.link]
 * @param {Object}  [opts.data]
 */
const createAndNotify = async ({ userId, companyId, type, title, message, link, data }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      ...(companyId && { companyId }),
      type: type || 'info',
      title,
      message,
      link,
      data,
    });

    notifyUser(userId, 'notification', {
      type: type || 'info',
      title,
      message,
      link,
      data,
      notificationId: notification._id,
    });

    return notification;
  } catch (error) {
    logger.error(`Erreur creation notification: ${error.message}`);
    return null;
  }
};

/**
 * Persiste une notification pour tous les utilisateurs d'un rôle dans une entreprise
 * ET émet en temps réel vers la room company:companyId:role.
 * @param {string} companyId
 * @param {string} role
 * @param {Object} opts
 */
const createAndNotifyRole = async (companyId, role, { type, title, message, link, data }) => {
  try {
    const User = require('../models/User');
    const Role = require('../models/Role');

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) return;

    // Scope to the company to maintain tenant isolation
    const filter = { role: roleDoc._id, isActive: true };
    if (companyId) filter.companyId = companyId;

    const users = await User.find(filter).select('_id');

    if (users.length > 0) {
      await Notification.insertMany(
        users.map((u) => ({
          user: u._id,
          ...(companyId && { companyId }),
          type: type || 'info',
          title,
          message,
          link,
          data,
        }))
      );
    }

    // Real-time emit to company-scoped role room
    if (companyId) {
      notifyRoleInCompany(companyId, role, 'notification', { type: type || 'info', title, message, link, data });
    }
  } catch (error) {
    logger.error(`Erreur notification role ${role}: ${error.message}`);
  }
};

// ─── Méthodes métier ─────────────────────────────────────────────────────────

/**
 * Alerte stock bas — notifie gestionnaire_stock, manager, admin de la même entreprise.
 * @param {Object} product
 * @param {Object} warehouse
 * @param {number} currentStock
 * @param {number} minimum
 * @param {string} [companyId]
 */
const notifyStockAlert = (product, warehouse, currentStock, minimum, companyId) => {
  const payload = {
    type: 'warning',
    title: 'Alerte stock bas',
    message: `Le produit "${product.name || product.designation}" est sous le seuil dans "${warehouse.name || warehouse.nom}" (${currentStock}/${minimum})`,
    data: {
      productId: product._id,
      warehouseId: warehouse._id,
      productName: product.name || product.designation,
      warehouseName: warehouse.name || warehouse.nom,
      currentStock,
      minimum,
    },
  };

  const roles = ['gestionnaire_stock', 'manager', 'admin'];

  if (companyId) {
    roles.forEach((role) => {
      notifyRoleInCompany(companyId, role, 'stock:alert', payload);
      createAndNotifyRole(companyId, role, { ...payload, link: '/stocks' });
    });
  } else {
    // Fallback (sans isolation tenant — interne/tests)
    roles.forEach((role) => {
      const { notifyRole } = module.exports;
      if (notifyRole) notifyRole(role, 'stock:alert', payload);
    });
  }
};

/**
 * Nouvelle facture créée.
 * @param {Object} facture
 * @param {string} [companyId]
 */
const notifyNewInvoice = (facture, companyId) => {
  const payload = {
    type: 'info',
    title: 'Nouvelle facture',
    message: `Facture ${facture.numero || 'brouillon'} créée — ${facture.totalTTC} FCFA`,
    data: {
      factureId: facture._id,
      numero: facture.numero,
      montant: facture.totalTTC,
      client: facture.clientSnapshot?.displayName,
    },
  };

  const cid = companyId || facture.companyId;

  if (cid) {
    notifyRoleInCompany(cid, 'comptable', 'facture:created', payload);
    notifyRoleInCompany(cid, 'manager', 'facture:created', payload);
  }

  if (facture.createdBy) {
    notifyUser(facture.createdBy.toString(), 'facture:created', payload);
  }
};

/**
 * Facture validée (numéro DGI attribué).
 * @param {Object} facture
 * @param {string} [companyId]
 */
const notifyInvoiceValidated = (facture, companyId) => {
  const payload = {
    type: 'success',
    title: 'Facture validée',
    message: `Facture ${facture.numero} validée — ${facture.totalTTC} FCFA`,
    data: { factureId: facture._id, numero: facture.numero, montant: facture.totalTTC },
  };

  const cid = companyId || facture.companyId;

  if (cid) {
    notifyRoleInCompany(cid, 'comptable', 'facture:validated', payload);
    notifyRoleInCompany(cid, 'manager', 'facture:validated', payload);
  }

  if (facture.createdBy) {
    notifyUser(facture.createdBy.toString(), 'facture:validated', payload);
  }
};

/**
 * Facture intégralement payée.
 * @param {Object} facture
 * @param {string} [companyId]
 */
const notifyInvoicePaid = (facture, companyId) => {
  const payload = {
    type: 'success',
    title: 'Facture payée',
    message: `Facture ${facture.numero} intégralement payée — ${facture.totalTTC} FCFA`,
    data: { factureId: facture._id, numero: facture.numero, montant: facture.totalTTC },
  };

  const cid = companyId || facture.companyId;

  if (cid) {
    notifyRoleInCompany(cid, 'comptable', 'facture:paid', payload);
    notifyRoleInCompany(cid, 'manager', 'facture:paid', payload);
    notifyRoleInCompany(cid, 'commercial', 'facture:paid', payload);
  }
};

/**
 * Paiement client reçu.
 * @param {Object} payment
 * @param {string} [companyId]
 */
const notifyPaymentReceived = (payment, companyId) => {
  const tiersName = payment.tiersSnapshot?.displayName || 'N/A';
  const payload = {
    type: 'success',
    title: 'Paiement reçu',
    message: `Paiement de ${payment.montant} FCFA reçu de ${tiersName} (${payment.modePaiement})`,
    data: {
      paymentId: payment._id,
      numero: payment.numero,
      montant: payment.montant,
      modePaiement: payment.modePaiement,
      tiers: tiersName,
    },
  };

  const cid = companyId || payment.companyId;

  if (cid) {
    notifyRoleInCompany(cid, 'comptable', 'payment:received', payload);
    notifyRoleInCompany(cid, 'caissier', 'payment:received', payload);
    notifyRoleInCompany(cid, 'manager', 'payment:received', payload);
  }
};

/**
 * Paiement validé (numéro attribué).
 * @param {Object} payment
 * @param {string} [companyId]
 */
const notifyPaymentValidated = (payment, companyId) => {
  const payload = {
    type: 'success',
    title: 'Paiement validé',
    message: `Paiement ${payment.numero} de ${payment.montant} FCFA validé`,
    data: { paymentId: payment._id, numero: payment.numero, montant: payment.montant },
  };

  const cid = companyId || payment.companyId;

  if (cid) {
    notifyRoleInCompany(cid, 'comptable', 'payment:validated', payload);
    notifyRoleInCompany(cid, 'manager', 'payment:validated', payload);
  }
};

/**
 * Devis converti en commande.
 * @param {Object} devis
 * @param {Object} commande
 * @param {string} [companyId]
 */
const notifyDevisConverted = (devis, commande, companyId) => {
  const payload = {
    type: 'success',
    title: 'Devis converti',
    message: `Devis ${devis.numero} converti en commande ${commande.numero || ''}`,
    data: {
      devisId: devis._id,
      devisNumero: devis.numero,
      commandeId: commande._id,
      commandeNumero: commande.numero,
      montant: devis.totalTTC,
    },
  };

  const cid = companyId || devis.companyId;

  if (cid) {
    notifyRoleInCompany(cid, 'commercial', 'devis:converted', payload);
    notifyRoleInCompany(cid, 'manager', 'devis:converted', payload);
  }

  if (devis.createdBy) {
    createAndNotify({
      userId: devis.createdBy.toString(),
      companyId: cid,
      ...payload,
      link: `/ventes/commandes/${commande._id}`,
    });
  }
};

/** Broadcast mise à jour dashboard (interne, toutes entreprises connectées). */
const notifyDashboardUpdate = (stats) => {
  notifyAll('dashboard:update', {
    type: 'info',
    title: 'Tableau de bord mis à jour',
    data: stats,
  });
};

// ─── Export ──────────────────────────────────────────────────────────────────

module.exports = {
  initNotificationService,
  getIO,
  notifyUser,
  notifyRoleInCompany,
  notifyAll,
  createAndNotify,
  createAndNotifyRole,
  notifyStockAlert,
  notifyNewInvoice,
  notifyInvoiceValidated,
  notifyInvoicePaid,
  notifyPaymentReceived,
  notifyPaymentValidated,
  notifyDashboardUpdate,
  notifyDevisConverted,
};
