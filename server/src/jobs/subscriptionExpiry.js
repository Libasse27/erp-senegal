/**
 * Job : expiration des abonnements (cycle de vie complet)
 *
 * Exécuté tous les jours à 00h05 (Dakar, UTC+0).
 *
 * Transitions gérées :
 *   ACTIF  + dateFin <= now → EN_PERIODE_GRACE  (Company: EN_ATTENTE_PAIEMENT)
 *   ESSAI  + dateFin <= now → EN_ATTENTE         (Company: EN_ATTENTE_PAIEMENT)
 *
 * La transition EN_PERIODE_GRACE → EXPIRE est gérée par gracePeriodJob.js
 */
const cron           = require('node-cron');
const Abonnement     = require('../models/Abonnement');
const Company        = require('../models/Company');
const User           = require('../models/User');
const PlatformSetting = require('../models/PlatformSetting');
const logger         = require('../config/logger');
const { createAndNotify }         = require('../services/notificationService');
const {
  sendSubscriptionExpiredEmail,
  sendGracePeriodStartEmail,
  sendTrialExpiredEmail,
} = require('../services/emailService');

// ── ACTIF → EN_PERIODE_GRACE ─────────────────────────────────────────────────

const traiterExpirations = async () => {
  const maintenant = new Date();
  logger.info('[Cron] subscriptionExpiry — vérification des expirations...');

  const platformSettings = await PlatformSetting.getInstance();
  const joursGrace = platformSettings?.abonnement?.joursGrace ?? 7;

  let totalActif = 0;
  let totalEssai = 0;

  // ── 1. Abonnements ACTIF expirés → EN_PERIODE_GRACE ─────────────────────
  const expiresActifs = await Abonnement.find({
    statut:  'ACTIF',
    dateFin: { $lte: maintenant },
  }).lean();

  for (const abo of expiresActifs) {
    try {
      const graceEndsAt = new Date(abo.dateFin.getTime() + joursGrace * 24 * 60 * 60 * 1000);
      const dateGraceFR = graceEndsAt.toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' });

      await Abonnement.findByIdAndUpdate(abo._id, {
        statut:      'EN_PERIODE_GRACE',
        graceEndsAt,
        $push: { historique: { action: 'grace_period_start', note: `Période de grâce accordée jusqu'au ${dateGraceFR}` } },
      });

      const company = await Company.findByIdAndUpdate(
        abo.entrepriseId,
        { status: 'EN_ATTENTE_PAIEMENT' },
        { new: true }
      );
      if (!company) continue;

      if (company.adminUser) {
        await createAndNotify({
          userId:  company.adminUser,
          type:    'warning',
          title:   `Période de grâce de ${joursGrace} jours`,
          message: `Votre abonnement pour ${company.name} a expiré. Vous bénéficiez d'une période de grâce de ${joursGrace} jours (jusqu'au ${dateGraceFR}) pour renouveler.`,
          link:    '/abonnement/paiement',
          data:    { abonnementId: abo._id, graceEndsAt },
        });

        const admin = await User.findById(company.adminUser).select('email firstName');
        if (admin?.email) {
          sendGracePeriodStartEmail(admin.email, {
            firstName:   admin.firstName || 'Admin',
            companyName: company.name,
            planNom:     abo.planSnapshot?.nom || '',
            joursGrace,
            graceEndsAt: dateGraceFR,
            renewUrl:    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/abonnement/paiement`,
          }).catch((err) => logger.warn(`[Email] Grace start non envoyé : ${err.message}`));
        }
      }

      totalActif++;
      logger.info(`[Cron] Période de grâce ouverte — company=${company.name}`);
    } catch (err) {
      logger.error(`[Cron] Erreur grace_start abonnement ${abo._id}: ${err.message}`);
    }
  }

  // ── 2. Abonnements ESSAI expirés → EN_ATTENTE ────────────────────────────
  const expiresEssai = await Abonnement.find({
    statut:  'ESSAI',
    dateFin: { $lte: maintenant },
  }).lean();

  for (const abo of expiresEssai) {
    try {
      await Abonnement.findByIdAndUpdate(abo._id, {
        statut: 'EN_ATTENTE',
        $push: { historique: { action: 'trial_expired', note: 'Essai gratuit terminé' } },
      });

      const company = await Company.findByIdAndUpdate(
        abo.entrepriseId,
        { status: 'EN_ATTENTE_PAIEMENT' },
        { new: true }
      );
      if (!company) continue;

      if (company.adminUser) {
        await createAndNotify({
          userId:  company.adminUser,
          type:    'warning',
          title:   'Essai gratuit terminé',
          message: `Votre essai gratuit pour ${company.name} est terminé. Choisissez un plan pour continuer à utiliser la plateforme.`,
          link:    '/plans',
          data:    { abonnementId: abo._id },
        });

        const admin = await User.findById(company.adminUser).select('email firstName');
        if (admin?.email) {
          sendTrialExpiredEmail(admin.email, {
            firstName:   admin.firstName || 'Admin',
            companyName: company.name,
            planUrl:     `${process.env.FRONTEND_URL || 'http://localhost:3000'}/plans`,
          }).catch((err) => logger.warn(`[Email] Trial expired non envoyé : ${err.message}`));
        }
      }

      totalEssai++;
      logger.info(`[Cron] Essai expiré — company=${company?.name}`);
    } catch (err) {
      logger.error(`[Cron] Erreur trial_expired abonnement ${abo._id}: ${err.message}`);
    }
  }

  logger.info(`[Cron] subscriptionExpiry terminé — grâce: ${totalActif}, essais: ${totalEssai}`);
  return { totalActif, totalEssai };
};

const demarrer = () => {
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
