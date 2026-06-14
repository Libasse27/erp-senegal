/**
 * Job : expiration des abonnements
 *
 * Exécuté tous les jours à 00h05 (Dakar, UTC+0 en période standard).
 * - Cherche tous les Abonnements ACTIF dont dateFin <= maintenant
 * - Les passe à EXPIRE
 * - Passe l'entreprise à status='expired'
 * - Crée une notification in-app pour l'admin de l'entreprise
 */
const cron = require('node-cron');
const Abonnement = require('../models/Abonnement');
const Company    = require('../models/Company');
const logger     = require('../config/logger');
const { createAndNotify } = require('../services/notificationService');

const traiterExpirations = async () => {
  const maintenant = new Date();
  logger.info('[Cron] Vérification des expirations d\'abonnements...');

  const expirés = await Abonnement.find({
    statut:  'ACTIF',
    dateFin: { $lte: maintenant },
  }).lean();

  if (expirés.length === 0) {
    logger.info('[Cron] Aucun abonnement expiré à traiter.');
    return;
  }

  logger.info(`[Cron] ${expirés.length} abonnement(s) à expirer.`);

  for (const abo of expirés) {
    try {
      // Passer l'abonnement à EXPIRE
      await Abonnement.findByIdAndUpdate(abo._id, { statut: 'EXPIRE' });

      // Passer l'entreprise à expired
      const company = await Company.findByIdAndUpdate(
        abo.entrepriseId,
        { status: 'expired' },
        { new: true }
      );

      if (!company) continue;

      // Notifier l'admin de l'entreprise
      if (company.adminUser) {
        await createAndNotify({
          userId:  company.adminUser,
          type:    'error',
          title:   'Abonnement expiré',
          message: `Votre abonnement pour ${company.name} a expiré le ${new Date(abo.dateFin).toLocaleDateString('fr-SN')}. Renouvelez-le pour continuer à utiliser la plateforme.`,
          link:    '/abonnement',
          data:    { abonnementId: abo._id, companyId: company._id },
        });
      }

      logger.info(`[Cron] Abonnement expiré — company=${company.name} (${company._id})`);
    } catch (err) {
      logger.error(`[Cron] Erreur expiration abonnement ${abo._id}: ${err.message}`);
    }
  }

  logger.info(`[Cron] Expiration terminée — ${expirés.length} abonnement(s) traité(s).`);
};

const demarrer = () => {
  // Tous les jours à 00h05 (Africa/Dakar = UTC+0)
  cron.schedule('5 0 * * *', async () => {
    try {
      await traiterExpirations();
    } catch (err) {
      logger.error(`[Cron] Erreur critique subscriptionExpiry: ${err.message}`);
    }
  }, { timezone: 'Africa/Dakar' });

  logger.info('[Cron] subscriptionExpiry initialisé (tous les jours à 00h05 Dakar)');
};

module.exports = { demarrer, traiterExpirations };
