/**
 * Job : rappels d'échéance de factures
 *
 * Exécuté tous les jours à 08h00 (Dakar, UTC+0).
 * - Cherche les factures impayées dont l'échéance est dans 7 jours ou 3 jours
 * - Groupe par client
 * - Envoie un email de rappel au client si email disponible
 * - Crée une notification in-app pour le gestionnaire de la société
 */
const cron = require('node-cron');
const Facture = require('../models/Facture');
const Company = require('../models/Company');
const User = require('../models/User');
const logger = require('../config/logger');
const { createAndNotify } = require('../services/notificationService');
const { sendEcheanceRappelEmail } = require('../services/emailService');

const JOURS_RAPPEL = [7, 3]; // J-7 et J-3

const envoyerRappels = async () => {
  logger.info('[Cron] Vérification des échéances de factures...');

  const maintenant = new Date();
  const maxDate = new Date(maintenant);
  maxDate.setDate(maxDate.getDate() + Math.max(...JOURS_RAPPEL) + 1);

  // Factures impayées ou partiellement payées avec échéance dans les 7 prochains jours
  const factures = await Facture.find({
    statut: { $in: ['envoyee', 'partiellement_payee', 'en_retard'] },
    dateEcheance: { $gte: maintenant, $lte: maxDate },
    isActive: true,
  })
    .populate('client', 'raisonSociale firstName lastName email')
    .lean();

  if (factures.length === 0) {
    logger.info('[Cron] Aucune échéance à rappeler.');
    return;
  }

  // Grouper par companyId puis par client
  const parCompany = {};
  for (const f of factures) {
    const cid = String(f.companyId);
    if (!parCompany[cid]) parCompany[cid] = {};

    const joursRestants = Math.ceil((new Date(f.dateEcheance) - maintenant) / (1000 * 60 * 60 * 24));

    // Filtrer : on n'envoie que pour J-7 ou J-3 (±1 jour de tolérance)
    if (!JOURS_RAPPEL.some((j) => joursRestants >= j - 1 && joursRestants <= j + 1)) continue;

    const clientId = String(f.client?._id || f.clientSnapshot?.clientId || 'unknown');
    const clientEmail = f.client?.email || f.clientSnapshot?.email;
    const clientName =
      f.client?.raisonSociale ||
      `${f.client?.firstName || ''} ${f.client?.lastName || ''}`.trim() ||
      f.clientSnapshot?.raisonSociale ||
      'Client';

    if (!parCompany[cid][clientId]) {
      parCompany[cid][clientId] = { clientName, clientEmail, factures: [] };
    }
    parCompany[cid][clientId].factures.push({
      numero: f.numero,
      montantRestant: f.montantRestant || 0,
      dateEcheance: f.dateEcheance,
      joursRestants,
    });
  }

  let totalRappels = 0;

  for (const [companyId, clients] of Object.entries(parCompany)) {
    const company = await Company.findById(companyId).select('name adminUser').lean();
    if (!company) continue;

    const companyName = company.name || 'ERP Sénégal';

    for (const [, clientData] of Object.entries(clients)) {
      const { clientName, clientEmail, factures: facturesClient } = clientData;
      if (facturesClient.length === 0) continue;

      const totalDu = facturesClient.reduce((s, f) => s + f.montantRestant, 0);
      const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

      // Email au client
      if (clientEmail) {
        sendEcheanceRappelEmail(clientEmail, {
          clientName,
          factures: facturesClient,
          companyName,
        }).catch((err) => logger.warn(`[Email] Rappel échéance non envoyé à ${clientEmail}: ${err.message}`));
      }

      // Notification in-app pour l'admin de la société
      if (company.adminUser) {
        const factureList = facturesClient.map((f) => f.numero).join(', ');
        createAndNotify({
          userId: company.adminUser,
          type: 'warning',
          title: 'Rappel échéance client',
          message: `${clientName} — ${facturesClient.length} facture(s) à régler (${fmt(totalDu)} FCFA) : ${factureList}`,
          link: '/ventes/factures',
          data: { companyId, clientName, totalDu },
        }).catch((err) => logger.warn(`[Notif] Rappel échéance non créée: ${err.message}`));
      }

      totalRappels++;
      logger.info(`[Cron] Rappel échéance — ${clientName} (${facturesClient.length} facture(s), ${fmt(totalDu)} FCFA)`);
    }
  }

  logger.info(`[Cron] Rappels d'échéance terminés — ${totalRappels} client(s) notifié(s).`);
};

const demarrer = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      await envoyerRappels();
    } catch (err) {
      logger.error(`[Cron] Erreur critique echeanceRappel: ${err.message}`);
    }
  }, { timezone: 'Africa/Dakar' });

  logger.info('[Cron] echeanceRappel initialisé (tous les jours à 08h00 Dakar)');
};

module.exports = { demarrer, envoyerRappels };
