/**
 * Job : expiration de la période de grâce
 *
 * Exécuté tous les jours à 00h10 (Dakar) — après subscriptionExpiry (00h05).
 *
 * Transition gérée :
 *   EN_PERIODE_GRACE + graceEndsAt <= now → EXPIRE  (Company: EXPIREE)
 *
 * Si le paiement arrive PENDANT la période de grâce, le webhook PSP
 * appelle activerAbonnement() → statut repassera à ACTIF avant ce job.
 */
const cron       = require('node-cron');
const Abonnement = require('../models/Abonnement');
const Company    = require('../models/Company');
const User       = require('../models/User');
const logger     = require('../config/logger');
const { createAndNotify }          = require('../services/notificationService');
const { sendSubscriptionExpiredEmail } = require('../services/emailService');

const traiterGracePeriod = async () => {
  const maintenant = new Date();
  logger.info('[Cron] gracePeriodJob — vérification des fins de période de grâce...');

  const expiresGrace = await Abonnement.find({
    statut:      'EN_PERIODE_GRACE',
    graceEndsAt: { $lte: maintenant },
  }).lean();

  if (expiresGrace.length === 0) {
    logger.info('[Cron] gracePeriodJob — aucune période de grâce à clôturer.');
    return { total: 0 };
  }

  let total = 0;

  for (const abo of expiresGrace) {
    try {
      await Abonnement.findByIdAndUpdate(abo._id, {
        statut: 'EXPIRE',
        $push: { historique: { action: 'grace_period_expired', note: 'Période de grâce terminée sans paiement — abonnement expiré' } },
      });

      const company = await Company.findByIdAndUpdate(
        abo.entrepriseId,
        { status: 'EXPIREE', abonnementActifId: null },
        { new: true }
      );
      if (!company) continue;

      if (company.adminUser) {
        const dateFin = new Date(abo.graceEndsAt || abo.dateFin).toLocaleDateString('fr-SN', {
          day: '2-digit', month: 'long', year: 'numeric',
        });

        await createAndNotify({
          userId:  company.adminUser,
          type:    'error',
          title:   'Accès suspendu — abonnement expiré',
          message: `Votre période de grâce pour ${company.name} est terminée. L'accès à la plateforme est suspendu. Renouvelez votre abonnement pour retrouver l'accès.`,
          link:    '/abonnement/paiement',
          data:    { abonnementId: abo._id },
        });

        const admin = await User.findById(company.adminUser).select('email firstName');
        if (admin?.email) {
          sendSubscriptionExpiredEmail(admin.email, {
            firstName:   admin.firstName || 'Admin',
            companyName: company.name,
            forfaitNom:  abo.planSnapshot?.nom || '',
            dateFin,
            renewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/abonnement/paiement`,
          }).catch((err) => logger.warn(`[Email] Grace expired non envoyé : ${err.message}`));
        }
      }

      total++;
      logger.info(`[Cron] Accès suspendu après grâce — company=${company?.name}`);
    } catch (err) {
      logger.error(`[Cron] Erreur grace_period_expired abonnement ${abo._id}: ${err.message}`);
    }
  }

  logger.info(`[Cron] gracePeriodJob terminé — ${total} abonnement(s) expiré(s).`);
  return { total };
};

const demarrer = () => {
  // 00h10 — 5 minutes après subscriptionExpiry pour éviter les conflits
  cron.schedule('10 0 * * *', async () => {
    try {
      await traiterGracePeriod();
    } catch (err) {
      logger.error(`[Cron] Erreur critique gracePeriodJob: ${err.message}`);
    }
  }, { timezone: 'Africa/Dakar' });

  logger.info('[Cron] gracePeriodJob initialisé (tous les jours à 00h10 Dakar)');
};

module.exports = { demarrer, traiterGracePeriod };
