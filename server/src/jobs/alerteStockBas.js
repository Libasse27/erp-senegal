/**
 * Job : alertes stock bas
 *
 * Exécuté tous les jours à 06h30 (Dakar, UTC+0).
 * - Cherche tous les stocks où quantite <= product.stockAlerte
 * - Groupe par companyId
 * - Notifie admin + gestionnaire_stock en in-app
 * - Envoie un email récapitulatif si emailNotifications.onLowStock actif
 */
const cron = require('node-cron');
const Stock = require('../models/Stock');
const Company = require('../models/Company');
const User = require('../models/User');
const Settings = require('../models/Settings');
const logger = require('../config/logger');
const { createAndNotify, createAndNotifyRole } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

const buildEmailHtml = (items, companyName) => {
  const rows = items
    .map(
      (s) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${s.product?.name || 'N/A'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#dc2626;font-weight:600;">${s.quantite}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${s.product?.stockAlerte ?? 0}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${s.warehouse?.name || 'N/A'}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;line-height:1.6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#f59e0b;color:white;padding:16px 20px;border-radius:6px 6px 0 0;">
      <h2 style="margin:0;">Alerte Stock Bas</h2>
      <p style="margin:4px 0 0;">${companyName}</p>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 6px 6px;">
      <p>${items.length} produit(s) ont atteint ou dépassé le seuil d'alerte et nécessitent un réapprovisionnement.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 8px;text-align:left;font-size:13px;">Produit</th>
            <th style="padding:10px 8px;text-align:center;font-size:13px;">Stock actuel</th>
            <th style="padding:10px 8px;text-align:center;font-size:13px;">Seuil alerte</th>
            <th style="padding:10px 8px;text-align:left;font-size:13px;">Dépôt</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:20px;font-size:13px;color:#6b7280;">
        Connectez-vous à votre ERP pour passer une commande de réapprovisionnement.
      </p>
    </div>
    <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px;">
      ERP GesCom-Compta Sénégal — Ne pas répondre à cet email
    </p>
  </div>
</body></html>`;
};

const handler = async () => {
  logger.info('[Cron] Vérification des stocks bas...');

  const stocks = await Stock.find({ isActive: true })
    .populate('product', 'name stockAlerte isStockable')
    .populate('warehouse', 'name')
    .lean();

  const alertes = stocks.filter(
    (s) => s.product?.isStockable && s.quantite <= (s.product.stockAlerte ?? 0)
  );

  if (alertes.length === 0) {
    logger.info('[Cron] Aucun stock bas détecté.');
    return;
  }

  // Grouper par companyId
  const parCompany = {};
  for (const s of alertes) {
    const cid = String(s.companyId);
    if (!parCompany[cid]) parCompany[cid] = [];
    parCompany[cid].push(s);
  }

  let totalAlertes = 0;

  for (const [companyId, items] of Object.entries(parCompany)) {
    const [company, settings] = await Promise.all([
      Company.findById(companyId).select('name adminUser').lean(),
      Settings.findOne({ companyId }).lean(),
    ]);
    if (!company) continue;

    const sendEmailAlerte =
      settings?.alertes?.stockBas?.email !== false &&
      settings?.emailNotifications?.onLowStock !== false;

    const title = 'Alerte stock bas';
    const message = `${items.length} produit(s) sous le seuil d'alerte`;

    // Notification in-app pour l'admin
    if (company.adminUser) {
      createAndNotify({
        userId: company.adminUser,
        companyId,
        type: 'warning',
        title,
        message,
        link: '/stocks',
        data: { count: items.length },
      }).catch((err) => logger.warn(`[Stock] Notif admin non créée: ${err.message}`));
    }

    // Notification in-app pour le gestionnaire_stock
    createAndNotifyRole(companyId, 'gestionnaire_stock', {
      type: 'warning',
      title,
      message,
      link: '/stocks',
      data: { count: items.length },
    }).catch((err) => logger.warn(`[Stock] Notif gestionnaire non créée: ${err.message}`));

    // Email récapitulatif à l'admin si activé
    if (sendEmailAlerte && company.adminUser) {
      const adminUser = await User.findById(company.adminUser).select('email').lean();
      if (adminUser?.email) {
        sendEmail({
          to: adminUser.email,
          subject: `${items.length} produit(s) en stock bas — ${company.name || 'ERP Sénégal'}`,
          html: buildEmailHtml(items, company.name || 'ERP Sénégal'),
        }).catch((err) =>
          logger.warn(`[Email] Alerte stock non envoyée à ${adminUser.email}: ${err.message}`)
        );
      }
    }

    totalAlertes += items.length;
    logger.info(`[Cron] Stock bas — ${company.name}: ${items.length} produit(s)`);
  }

  logger.info(`[Cron] Alertes stock terminées — ${totalAlertes} produit(s) signalé(s).`);
};

const demarrer = () => {
  cron.schedule(
    '30 6 * * *',
    async () => {
      try {
        await handler();
      } catch (err) {
        logger.error(`[Cron] Erreur critique alerteStockBas: ${err.message}`);
      }
    },
    { timezone: 'Africa/Dakar' }
  );

  logger.info('[Cron] alerteStockBas initialisé (tous les jours à 06h30 Dakar)');
};

module.exports = { demarrer, handler };
