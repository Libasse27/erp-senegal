const Notification = require('../models/Notification');
const logger = require('../config/logger');

let _io = null;

/**
 * Initialiser le service de notification avec l'instance Socket.io
 * @param {import('socket.io').Server} io - Instance Socket.io
 */
const initNotificationService = (io) => {
  _io = io;
  logger.info('Service de notification initialise');
};

/**
 * Obtenir l'instance Socket.io
 * @returns {import('socket.io').Server|null}
 */
const getIO = () => _io;

/**
 * Emettre un evenement a un utilisateur specifique via sa room
 * @param {string} userId - ID de l'utilisateur
 * @param {string} event - Nom de l'evenement
 * @param {Object} data - Donnees a emettre
 */
const notifyUser = (userId, event, data) => {
  if (!_io) {
    logger.warn('Socket.io non initialise, notification ignoree');
    return;
  }
  _io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emettre un evenement a tous les utilisateurs d'un role
 * @param {string} role - Nom du role
 * @param {string} event - Nom de l'evenement
 * @param {Object} data - Donnees a emettre
 */
const notifyRole = (role, event, data) => {
  if (!_io) {
    logger.warn('Socket.io non initialise, notification ignoree');
    return;
  }
  _io.to(`role:${role}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emettre un evenement a tous les utilisateurs connectes
 * @param {string} event - Nom de l'evenement
 * @param {Object} data - Donnees a emettre
 */
const notifyAll = (event, data) => {
  if (!_io) {
    logger.warn('Socket.io non initialise, notification ignoree');
    return;
  }
  _io.emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Creer une notification persistante en base et emettre en temps reel
 * @param {Object} options - Options de la notification
 * @param {string} options.userId - ID de l'utilisateur destinataire
 * @param {string} options.type - Type (info, success, warning, error)
 * @param {string} options.title - Titre
 * @param {string} options.message - Message
 * @param {string} [options.link] - Lien optionnel
 * @param {Object} [options.data] - Donnees supplementaires
 * @returns {Promise<Object>} Notification creee
 */
const createAndNotify = async ({ userId, type, title, message, link, data }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type: type || 'info',
      title,
      message,
      link,
      data,
    });

    // Emettre en temps reel
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
 * Creer des notifications pour tous les utilisateurs d'un role
 * @param {string} role - Nom du role
 * @param {Object} options - Options de la notification
 * @returns {Promise<void>}
 */
const createAndNotifyRole = async (role, { type, title, message, link, data }) => {
  try {
    const User = require('../models/User');
    const Role = require('../models/Role');

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) return;

    const users = await User.find({ role: roleDoc._id, isActive: true }).select('_id');

    // Creer les notifications en base pour chaque utilisateur du role
    const notifications = users.map((user) => ({
      user: user._id,
      type: type || 'info',
      title,
      message,
      link,
      data,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Emettre en temps reel vers la room du role
    notifyRole(role, 'notification', {
      type: type || 'info',
      title,
      message,
      link,
      data,
    });
  } catch (error) {
    logger.error(`Erreur notification role ${role}: ${error.message}`);
  }
};

// =====================================================
// Methodes specifiques metier
// =====================================================

/**
 * Notification d'alerte de stock bas
 * @param {Object} product - Produit concerne
 * @param {Object} warehouse - Depot concerne
 * @param {number} currentStock - Stock actuel
 * @param {number} minimum - Seuil minimum
 */
const notifyStockAlert = (product, warehouse, currentStock, minimum) => {
  const payload = {
    type: 'warning',
    title: 'Alerte stock bas',
    message: `Le produit "${product.name || product.designation}" est en dessous du seuil minimum dans le depot "${warehouse.name || warehouse.nom}" (${currentStock}/${minimum})`,
    data: {
      productId: product._id,
      warehouseId: warehouse._id,
      productName: product.name || product.designation,
      warehouseName: warehouse.name || warehouse.nom,
      currentStock,
      minimum,
    },
  };

  // Emettre vers les gestionnaires de stock et les managers
  notifyRole('gestionnaire_stock', 'stock:alert', payload);
  notifyRole('manager', 'stock:alert', payload);
  notifyRole('admin', 'stock:alert', payload);

  // Creer des notifications persistantes pour les roles concernes
  createAndNotifyRole('gestionnaire_stock', {
    ...payload,
    link: `/stocks`,
  });
  createAndNotifyRole('manager', {
    ...payload,
    link: `/stocks`,
  });
};

/**
 * Notification de nouvelle facture creee
 * @param {Object} facture - Facture creee
 */
const notifyNewInvoice = (facture) => {
  const payload = {
    type: 'info',
    title: 'Nouvelle facture',
    message: `La facture ${facture.numero || 'brouillon'} a ete creee pour un montant de ${facture.totalTTC} FCFA`,
    data: {
      factureId: facture._id,
      numero: facture.numero,
      montant: facture.totalTTC,
      client: facture.clientSnapshot?.displayName,
    },
  };

  // Emettre vers les comptables et managers
  notifyRole('comptable', 'facture:created', payload);
  notifyRole('manager', 'facture:created', payload);

  // Notifier le commercial createur si disponible
  if (facture.createdBy) {
    notifyUser(facture.createdBy.toString(), 'facture:created', payload);
  }
};

/**
 * Notification de facture validee
 * @param {Object} facture - Facture validee
 */
const notifyInvoiceValidated = (facture) => {
  const payload = {
    type: 'success',
    title: 'Facture validee',
    message: `La facture ${facture.numero} a ete validee (${facture.totalTTC} FCFA)`,
    data: {
      factureId: facture._id,
      numero: facture.numero,
      montant: facture.totalTTC,
    },
  };

  notifyRole('comptable', 'facture:validated', payload);
  notifyRole('manager', 'facture:validated', payload);

  if (facture.createdBy) {
    notifyUser(facture.createdBy.toString(), 'facture:validated', payload);
  }
};

/**
 * Notification de facture payee
 * @param {Object} facture - Facture payee
 */
const notifyInvoicePaid = (facture) => {
  const payload = {
    type: 'success',
    title: 'Facture payee',
    message: `La facture ${facture.numero} a ete integralement payee (${facture.totalTTC} FCFA)`,
    data: {
      factureId: facture._id,
      numero: facture.numero,
      montant: facture.totalTTC,
    },
  };

  notifyRole('comptable', 'facture:paid', payload);
  notifyRole('manager', 'facture:paid', payload);
  notifyRole('commercial', 'facture:paid', payload);
};

/**
 * Notification de paiement recu
 * @param {Object} payment - Paiement recu
 */
const notifyPaymentReceived = (payment) => {
  const tiersName = payment.tiersSnapshot?.displayName || 'N/A';
  const payload = {
    type: 'success',
    title: 'Paiement recu',
    message: `Paiement de ${payment.montant} FCFA recu de ${tiersName} (${payment.modePaiement})`,
    data: {
      paymentId: payment._id,
      numero: payment.numero,
      montant: payment.montant,
      modePaiement: payment.modePaiement,
      tiers: tiersName,
    },
  };

  notifyRole('comptable', 'payment:received', payload);
  notifyRole('caissier', 'payment:received', payload);
  notifyRole('manager', 'payment:received', payload);
};

/**
 * Notification de paiement valide
 * @param {Object} payment - Paiement valide
 */
const notifyPaymentValidated = (payment) => {
  const payload = {
    type: 'success',
    title: 'Paiement valide',
    message: `Le paiement ${payment.numero} de ${payment.montant} FCFA a ete valide`,
    data: {
      paymentId: payment._id,
      numero: payment.numero,
      montant: payment.montant,
    },
  };

  notifyRole('comptable', 'payment:validated', payload);
  notifyRole('manager', 'payment:validated', payload);
};

/**
 * Notification de mise a jour du dashboard
 * @param {Object} stats - Statistiques mises a jour
 */
const notifyDashboardUpdate = (stats) => {
  notifyAll('dashboard:update', {
    type: 'info',
    title: 'Tableau de bord mis a jour',
    message: 'Les indicateurs du tableau de bord ont ete actualises',
    data: stats,
  });
};

/**
 * Notification de conversion devis en commande
 * @param {Object} devis - Devis converti
 * @param {Object} commande - Commande creee
 */
const notifyDevisConverted = (devis, commande) => {
  const payload = {
    type: 'success',
    title: 'Devis converti',
    message: `Le devis ${devis.numero} a ete converti en commande ${commande.numero || ''}`,
    data: {
      devisId: devis._id,
      devisNumero: devis.numero,
      commandeId: commande._id,
      commandeNumero: commande.numero,
      montant: devis.totalTTC,
    },
  };

  notifyRole('commercial', 'devis:converted', payload);
  notifyRole('manager', 'devis:converted', payload);

  if (devis.createdBy) {
    createAndNotify({
      userId: devis.createdBy.toString(),
      ...payload,
      link: `/commandes/${commande._id}`,
    });
  }
};

module.exports = {
  initNotificationService,
  getIO,
  notifyUser,
  notifyRole,
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
