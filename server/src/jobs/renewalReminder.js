/**
 * Job : rappels de renouvellement d'abonnement
 *
 * Exécuté tous les jours à 09h00 (Dakar).
 * Envoie des alertes in-app à J-7, J-3, et J-1 avant expiration.
 */
const cron   = require('node-cron');
const Abonnement = require('../models/Abonnement');
const Company    = require('../models/Company');
const logger     = require('../config/logger');
const { createAndNotify } = require('../services/notificationService');

const SEUILS_JOURS = [7, 3, 1]; // J-X avant expiration

const genererMessage = (company, joursRestants, periodicite) => {
  const date = company.subscriptionEndDate
    ? new Date(company.subscriptionEndDate).toLocaleDateString('fr-SN')
    : '';

  if (joursRestants === 1) {
    return {
      title:   'Abonnement expire demain !',
      message: `Votre abonnement pour ${company.name} expire demain (${date}). Renouvelez maintenant pour éviter toute interruption de service.`,
      type:    'error',
    };
  }
  if (joursRestants <= 3) {
    return {
      title:   `Abonnement expire dans ${joursRestants} jours`,
      message: `Votre abonnement pour ${company.name} expire le ${date}. Pensez à le renouveler rapidement.`,
      type:    'warning',
    };
  }
  return {
    title:   `Rappel : renouvellement dans ${joursRestants} jours`,
    message: `Votre abonnement ${periodicite === 'ANNUEL' ? 'annuel' : 'mensuel'} pour ${company.name} expire le ${date}. Anticipez le renouvellement pour assurer la continuité de vos activités.`,
    type:    'warning',
  };
};

const envoyerRappels = async () => {
  logger.info('[Cron] Envoi des rappels de renouvellement...');

  const maintenant = new Date();
  let total = 0;

  for (const jours of SEUILS_JOURS) {
    const dateDebut = new Date(maintenant);
    const dateFin   = new Date(maintenant);

    // Fenêtre : entre maintenant+X jours-12h et maintenant+X jours+12h
    dateDebut.setDate(dateDebut.getDate() + jours);
    dateDebut.setHours(0, 0, 0, 0);
    dateFin.setDate(dateFin.getDate() + jours);
    dateFin.setHours(23, 59, 59, 999);

    const abonnements = await Abonnement.find({
      statut:  'ACTIF',
      dateFin: { $gte: dateDebut, $lte: dateFin },
    }).lean();

    for (const abo of abonnements) {
      try {
        const company = await Company.findById(abo.entrepriseId);
        if (!company || !company.adminUser) continue;

        const { title, message, type } = genererMessage(company, jours, abo.periodicite);

        await createAndNotify({
          userId:  company.adminUser,
          type,
          title,
          message,
          link:    '/abonnement',
          data:    { abonnementId: abo._id, joursRestants: jours },
        });

        logger.info(`[Cron] Rappel J-${jours} envoyé — company=${company.name}`);
        total++;
      } catch (err) {
        logger.error(`[Cron] Erreur rappel abonnement ${abo._id}: ${err.message}`);
      }
    }
  }

  logger.info(`[Cron] Rappels terminés — ${total} notification(s) envoyée(s).`);
};

const demarrer = () => {
  // Tous les jours à 09h00 (Africa/Dakar)
  cron.schedule('0 9 * * *', async () => {
    try {
      await envoyerRappels();
    } catch (err) {
      logger.error(`[Cron] Erreur critique renewalReminder: ${err.message}`);
    }
  }, { timezone: 'Africa/Dakar' });

  logger.info('[Cron] renewalReminder initialisé (tous les jours à 09h00 Dakar)');
};

module.exports = { demarrer, envoyerRappels };
