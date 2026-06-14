const cron = require('node-cron');
const logger = require('../config/logger');
const FactureRecurrente = require('../models/FactureRecurrente');
const Facture = require('../models/Facture');
const User = require('../models/User');
const { getNextSequence } = require('../utils/sequenceHelper');
const { createAndNotify } = require('../services/notificationService');

/**
 * Calcule la prochaine date de génération selon la fréquence.
 * Utilise la date de base fournie (pas "maintenant") pour éviter la dérive.
 */
const calculerProchaineDate = (frequence, dateBase) => {
  const d = new Date(dateBase);
  switch (frequence) {
    case 'hebdomadaire': d.setDate(d.getDate() + 7); break;
    case 'mensuel':      d.setMonth(d.getMonth() + 1); break;
    case 'trimestriel':  d.setMonth(d.getMonth() + 3); break;
    case 'semestriel':   d.setMonth(d.getMonth() + 6); break;
    case 'annuel':       d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d;
};

const handler = async () => {
  const now = new Date();
  const finDeJour = new Date(now);
  finDeJour.setHours(23, 59, 59, 999);

  const templates = await FactureRecurrente.find({
    isActive: true,
    deletedAt: null,
    prochainGeneration: { $lte: finDeJour },
    $or: [{ dateFin: null }, { dateFin: { $gte: now } }],
  });

  if (!templates.length) {
    logger.info('[Cron][FactureRecurrente] Aucune facture à générer');
    return;
  }

  logger.info(`[Cron][FactureRecurrente] ${templates.length} modèle(s) à traiter`);

  for (const template of templates) {
    try {
      const companyId = template.companyId;
      const { numero } = await getNextSequence('invoice', companyId);

      const dateEcheance = new Date();
      dateEcheance.setDate(dateEcheance.getDate() + 30);

      const notesFacture = template.notes
        ? `[Récurrent] ${template.notes}`
        : '[Facture récurrente automatique]';

      const facture = await Facture.create({
        companyId,
        client: template.client,
        clientSnapshot: template.clientSnapshot,
        numero,
        dateFacture: new Date(),
        dateEcheance,
        lignes: template.lignes,
        remiseGlobale: template.remiseGlobale,
        totalHT: template.totalHT,
        totalTVA: template.totalTVA,
        totalTTC: template.totalTTC,
        conditionsPaiement: template.conditionsPaiement,
        modePaiement: template.modePaiement,
        notes: notesFacture,
        statut: 'brouillon',
        createdBy: template.createdBy,
        referenceInterne: `REC-${template._id.toString().slice(-6).toUpperCase()}`,
      });

      const prochainGeneration = calculerProchaineDate(template.frequence, template.prochainGeneration);
      const expireApresGeneration = template.dateFin && prochainGeneration > template.dateFin;

      await FactureRecurrente.updateOne(
        { _id: template._id },
        {
          $set: {
            prochainGeneration,
            ...(expireApresGeneration && { isActive: false }),
          },
          $inc: { nbOccurrences: 1 },
          $push: {
            occurrences: {
              factureId: facture._id,
              numero: facture.numero,
              dateGeneration: new Date(),
              statut: 'generee',
            },
          },
        }
      );

      // Notifier les admins et managers de l'entreprise
      const admins = await User.find(
        { companyId, isActive: true },
        '_id'
      ).populate('role', 'name').lean();

      const cibles = admins.filter((u) => ['admin', 'manager'].includes(u.role?.name));

      for (const admin of cibles) {
        createAndNotify({
          userId: admin._id,
          companyId,
          type: 'success',
          title: 'Facture récurrente générée',
          message: `Facture ${numero} créée automatiquement pour ${template.clientSnapshot?.displayName || 'le client'}.`,
          link: `/ventes/factures/${facture._id}`,
          data: { factureId: facture._id, factureRecurrenteId: template._id },
        }).catch((err) => logger.warn(`[Cron][FactureRecurrente] Notification: ${err.message}`));
      }

      logger.info(`[Cron][FactureRecurrente] Facture ${numero} créée (template ${template._id})`);
    } catch (err) {
      logger.error(`[Cron][FactureRecurrente] Erreur template ${template._id}: ${err.message}`);

      await FactureRecurrente.updateOne(
        { _id: template._id },
        {
          $push: {
            occurrences: {
              dateGeneration: new Date(),
              statut: 'erreur',
              erreur: err.message,
            },
          },
        }
      ).catch(() => {});
    }
  }
};

const demarrer = () => {
  cron.schedule(
    '0 7 * * *',
    async () => {
      try {
        await handler();
      } catch (err) {
        logger.error(`[Cron][FactureRecurrente] Erreur critique: ${err.message}`);
      }
    },
    { timezone: 'Africa/Dakar' }
  );
  logger.info('[Cron][FactureRecurrente] Planificateur initialisé (07h00 Dakar)');
};

module.exports = { demarrer, handler };
