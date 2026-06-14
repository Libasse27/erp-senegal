/**
 * Job : alertes factures en retard de paiement
 *
 * Exécuté tous les jours à 09h30 (Dakar, UTC+0).
 * - Cherche les factures impayées dont l'échéance dépasse le seuil (défaut 30 jours)
 * - Groupe par companyId puis par client
 * - Notifie l'admin en in-app
 * - Envoie un email de relance au client si activé dans les paramètres
 */
const cron = require('node-cron');
const Facture = require('../models/Facture');
const Company = require('../models/Company');
const Settings = require('../models/Settings');
const logger = require('../config/logger');
const { createAndNotify } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

const SEUIL_RETARD_DEFAUT = 30; // jours

const buildRelanceHtml = (clientName, factures, companyName, totalDu) => {
  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

  const rows = factures
    .map(
      (f) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${f.numero}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${fmt(f.montantRestant)} FCFA</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${new Date(f.dateEcheance).toLocaleDateString('fr-FR')}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#dc2626;font-weight:600;">${f.joursRetard} j</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;line-height:1.6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#dc2626;color:white;padding:16px 20px;border-radius:6px 6px 0 0;">
      <h2 style="margin:0;">Relance — Factures impayées</h2>
      <p style="margin:4px 0 0;">${companyName}</p>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 6px 6px;">
      <p>Bonjour ${clientName},</p>
      <p>Sauf erreur de notre part, les factures suivantes demeurent impayées :</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 8px;text-align:left;font-size:13px;">N° Facture</th>
            <th style="padding:10px 8px;text-align:right;font-size:13px;">Montant dû</th>
            <th style="padding:10px 8px;text-align:center;font-size:13px;">Échéance</th>
            <th style="padding:10px 8px;text-align:center;font-size:13px;">Retard</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#fef2f2;">
            <td colspan="3" style="padding:10px 8px;font-weight:600;">Total à régler</td>
            <td style="padding:10px 8px;text-align:right;font-weight:700;color:#dc2626;font-size:15px;">${fmt(totalDu)} FCFA</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top:20px;">Nous vous remercions de bien vouloir régulariser votre situation dans les meilleurs délais.</p>
      <p style="margin-top:12px;font-size:13px;color:#6b7280;">
        Pour toute question, veuillez contacter notre service comptabilité.
      </p>
    </div>
    <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px;">
      ${companyName} — Message automatique, ne pas répondre directement.
    </p>
  </div>
</body></html>`;
};

const handler = async () => {
  logger.info('[Cron] Vérification des factures en retard...');

  const maintenant = new Date();

  const factures = await Facture.find({
    statut: { $in: ['envoyee', 'partiellement_payee', 'validee'] },
    dateEcheance: { $lt: maintenant },
    isActive: true,
  })
    .populate('client', 'raisonSociale firstName lastName email')
    .lean();

  if (factures.length === 0) {
    logger.info('[Cron] Aucune facture en retard.');
    return;
  }

  // Grouper par companyId puis par client
  const parCompany = {};
  for (const f of factures) {
    const cid = String(f.companyId);
    if (!parCompany[cid]) parCompany[cid] = {};

    const joursRetard = Math.floor(
      (maintenant - new Date(f.dateEcheance)) / (1000 * 60 * 60 * 24)
    );

    const clientId = String(f.client?._id || f.clientSnapshot?.clientId || 'unknown');
    const clientEmail = f.client?.email || f.clientSnapshot?.email;
    const clientName =
      f.client?.raisonSociale ||
      `${f.client?.firstName || ''} ${f.client?.lastName || ''}`.trim() ||
      f.clientSnapshot?.displayName ||
      'Client';

    if (!parCompany[cid][clientId]) {
      parCompany[cid][clientId] = { clientName, clientEmail, factures: [] };
    }
    parCompany[cid][clientId].factures.push({
      numero: f.numero,
      montantRestant: f.montantRestant || 0,
      dateEcheance: f.dateEcheance,
      joursRetard,
    });
  }

  let totalRelances = 0;

  for (const [companyId, clients] of Object.entries(parCompany)) {
    const [company, settings] = await Promise.all([
      Company.findById(companyId).select('name adminUser').lean(),
      Settings.findOne({ companyId }).lean(),
    ]);
    if (!company) continue;

    const seuilJours = settings?.alertes?.facturesEnRetard?.seuilJours ?? SEUIL_RETARD_DEFAUT;
    const sendEmailRelance = settings?.alertes?.facturesEnRetard?.email !== false;

    // Filtrer selon le seuil de retard configuré
    const clientsFiltres = Object.entries(clients).filter(([, data]) =>
      data.factures.some((f) => f.joursRetard >= seuilJours)
    );

    if (clientsFiltres.length === 0) continue;

    const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
    const nbFacturesRetard = clientsFiltres.reduce((sum, [, d]) => sum + d.factures.length, 0);
    const totalDu = clientsFiltres.reduce(
      (sum, [, d]) => sum + d.factures.reduce((s, f) => s + f.montantRestant, 0),
      0
    );

    // Notification in-app à l'admin
    if (company.adminUser) {
      createAndNotify({
        userId: company.adminUser,
        companyId,
        type: 'error',
        title: 'Factures en retard de paiement',
        message: `${nbFacturesRetard} facture(s) en retard chez ${clientsFiltres.length} client(s) — ${fmt(totalDu)} FCFA`,
        link: '/ventes/factures',
        data: { nbFactures: nbFacturesRetard, nbClients: clientsFiltres.length, totalDu },
      }).catch((err) => logger.warn(`[Facture] Notif retard non créée: ${err.message}`));
    }

    // Email de relance par client
    for (const [, clientData] of clientsFiltres) {
      const { clientName, clientEmail, factures: facturesClient } = clientData;

      // Seulement les factures qui dépassent le seuil
      const facturesRetard = facturesClient.filter((f) => f.joursRetard >= seuilJours);
      if (facturesRetard.length === 0) continue;

      const totalClientDu = facturesRetard.reduce((s, f) => s + f.montantRestant, 0);

      if (sendEmailRelance && clientEmail) {
        sendEmail({
          to: clientEmail,
          subject: `Relance — Factures impayées (${facturesRetard.length} facture(s)) — ${company.name}`,
          html: buildRelanceHtml(clientName, facturesRetard, company.name, totalClientDu),
        }).catch((err) =>
          logger.warn(`[Email] Relance non envoyée à ${clientEmail}: ${err.message}`)
        );
      }

      totalRelances++;
      logger.info(
        `[Cron] Retard — ${clientName}: ${facturesRetard.length} facture(s), ${fmt(totalClientDu)} FCFA`
      );
    }
  }

  logger.info(`[Cron] Alertes retard terminées — ${totalRelances} client(s) relancé(s).`);
};

const demarrer = () => {
  cron.schedule(
    '30 9 * * *',
    async () => {
      try {
        await handler();
      } catch (err) {
        logger.error(`[Cron] Erreur critique alerteFacturesEnRetard: ${err.message}`);
      }
    },
    { timezone: 'Africa/Dakar' }
  );

  logger.info('[Cron] alerteFacturesEnRetard initialisé (tous les jours à 09h30 Dakar)');
};

module.exports = { demarrer, handler };
