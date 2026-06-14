const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Creer le transporteur
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Envoyer un email
 * @param {Object} options - Options de l'email
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet
 * @param {string} options.html - Contenu HTML
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email envoye: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Erreur envoi email: ${error.message}`);
    throw error;
  }
};

/**
 * Envoyer un email de reset password
 * @param {string} email - Email du destinataire
 * @param {string} resetUrl - URL de reinitialisation
 * @param {string} userName - Nom de l'utilisateur
 */
const sendResetPasswordEmail = async (email, resetUrl, userName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a56db; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ERP Senegal</h1>
        </div>
        <div class="content">
          <h2>Reinitialisation du mot de passe</h2>
          <p>Bonjour ${userName},</p>
          <p>Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour definir un nouveau mot de passe :</p>
          <a href="${resetUrl}" class="button">Reinitialiser mon mot de passe</a>
          <p>Si vous n'avez pas fait cette demande, ignorez simplement cet email.</p>
          <p>Ce lien expirera dans 30 minutes.</p>
        </div>
        <div class="footer">
          <p>ERP Commercial & Comptable - Senegal</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reinitialisation de votre mot de passe - ERP Senegal',
    html,
  });
};

/**
 * Send facture by email with PDF attachment
 * @param {string} email - Recipient email
 * @param {Object} facture - Facture document
 * @param {Buffer} pdfBuffer - PDF buffer to attach
 */
const sendFactureEmail = async (email, facture, pdfBuffer) => {
  const isAvoir = facture.typeDocument === 'avoir';
  const docType = isAvoir ? 'Avoir' : 'Facture';
  const numero = facture.numero || facture.referenceInterne;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a56db; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details table { width: 100%; }
        .details td { padding: 5px 0; }
        .details .label { color: #666; }
        .details .value { text-align: right; font-weight: bold; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ERP Senegal</h1>
        </div>
        <div class="content">
          <h2>${docType} N° ${numero}</h2>
          <p>Bonjour,</p>
          <p>Veuillez trouver ci-joint votre ${docType.toLowerCase()} N° ${numero}.</p>
          <div class="details">
            <table>
              <tr>
                <td class="label">Date d'emission:</td>
                <td class="value">${new Date(facture.dateFacture).toLocaleDateString('fr-FR')}</td>
              </tr>
              ${facture.dateEcheance ? `
              <tr>
                <td class="label">Date d'echeance:</td>
                <td class="value">${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</td>
              </tr>
              ` : ''}
              <tr>
                <td class="label">Montant TTC:</td>
                <td class="value">${new Intl.NumberFormat('fr-FR').format(facture.totalTTC)} FCFA</td>
              </tr>
            </table>
          </div>
          <p>Pour toute question, n'hesitez pas a nous contacter.</p>
          <p>Cordialement,</p>
        </div>
        <div class="footer">
          <p>ERP Commercial & Comptable - Senegal</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: `${docType} N° ${numero} - ERP Senegal`,
    html,
    attachments: [
      {
        filename: `${numero}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  logger.info(`${docType} ${numero} envoyee par email a ${email}`);
};

/**
 * Send devis by email with PDF attachment
 * @param {string} email - Recipient email
 * @param {Object} devis - Devis document
 * @param {Buffer} pdfBuffer - PDF buffer to attach
 */
const sendDevisEmail = async (email, devis, pdfBuffer) => {
  const numero = devis.numero;
  const dateValidite = new Date(devis.dateValidite).toLocaleDateString('fr-FR');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .details table { width: 100%; }
        .details td { padding: 5px 0; }
        .details .label { color: #666; }
        .details .value { text-align: right; font-weight: bold; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ERP Senegal</h1>
        </div>
        <div class="content">
          <h2>Devis N° ${numero}</h2>
          <p>Bonjour,</p>
          <p>Veuillez trouver ci-joint notre devis N° ${numero}.</p>
          <div class="details">
            <table>
              <tr>
                <td class="label">Date:</td>
                <td class="value">${new Date(devis.dateDevis).toLocaleDateString('fr-FR')}</td>
              </tr>
              <tr>
                <td class="label">Valable jusqu'au:</td>
                <td class="value">${dateValidite}</td>
              </tr>
              <tr>
                <td class="label">Montant TTC:</td>
                <td class="value">${new Intl.NumberFormat('fr-FR').format(devis.totalTTC)} FCFA</td>
              </tr>
            </table>
          </div>
          <p>Ce devis est valable jusqu'au ${dateValidite}. N'hesitez pas a nous contacter pour toute question.</p>
          <p>Cordialement,</p>
        </div>
        <div class="footer">
          <p>ERP Commercial & Comptable - Senegal</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: `Devis N° ${numero} - ERP Senegal`,
    html,
    attachments: [
      {
        filename: `${numero}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  logger.info(`Devis ${numero} envoye par email a ${email}`);
};

// ─── Emails SaaS ─────────────────────────────────────────────────────────────

const BRAND_COLOR = '#1a56db';
const LOGO_TEXT   = 'ERP Sénégal';

const baseLayout = (title, content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 0; color: #374151; }
  .wrapper { max-width: 580px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
  .header  { background: ${BRAND_COLOR}; padding: 28px 32px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: .5px; }
  .body    { padding: 32px; }
  .body h2 { font-size: 20px; color: #111827; margin: 0 0 16px; }
  .body p  { line-height: 1.7; margin: 0 0 14px; font-size: 15px; }
  .btn     { display: inline-block; margin: 20px 0; padding: 13px 28px; background: ${BRAND_COLOR}; color: #fff !important; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; }
  .card    { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px 22px; margin: 20px 0; }
  .card table { width: 100%; border-collapse: collapse; }
  .card td { padding: 6px 0; font-size: 14px; }
  .card td:last-child { text-align: right; font-weight: 600; color: #111827; }
  .badge   { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-red   { background: #fee2e2; color: #991b1b; }
  .badge-orange{ background: #fef3c7; color: #92400e; }
  .footer  { padding: 20px 32px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header"><h1>${LOGO_TEXT}</h1></div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>ERP Commercial &amp; Comptable Sénégal · Plateforme SaaS multi-tenant</p>
    <p>Cet email a été envoyé automatiquement. Ne répondez pas à ce message.</p>
  </div>
</div>
</body>
</html>`;

/**
 * Email de bienvenue SaaS envoyé après inscription réussie
 */
const sendWelcomeSaasEmail = async (email, { firstName, companyName, forfaitNom, loginUrl }) => {
  const html = baseLayout('Bienvenue sur ERP Sénégal', `
    <h2>Bienvenue, ${firstName} !</h2>
    <p>Votre compte <strong>${companyName}</strong> a été créé avec succès sur la plateforme ERP Sénégal.</p>
    <div class="card">
      <table>
        <tr><td>Entreprise</td><td>${companyName}</td></tr>
        <tr><td>Forfait</td><td>${forfaitNom}</td></tr>
        <tr><td>Statut</td><td><span class="badge badge-orange">En attente de paiement</span></td></tr>
      </table>
    </div>
    <p>Pour activer votre abonnement, connectez-vous et finalisez le paiement via Wave ou Orange Money.</p>
    <a href="${loginUrl}" class="btn">Accéder à mon compte</a>
    <p style="font-size:13px;color:#6b7280;">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
  `);

  await sendEmail({ to: email, subject: `Bienvenue sur ERP Sénégal — ${companyName}`, html });
};

/**
 * Email de rappel de renouvellement (J-7, J-3, J-1)
 */
const sendRenewalReminderEmail = async (email, { firstName, companyName, forfaitNom, dateFin, joursRestants, renewUrl }) => {
  const urgence = joursRestants === 1 ? 'badge-red' : joursRestants <= 3 ? 'badge-orange' : 'badge-orange';
  const message = joursRestants === 1
    ? 'Votre abonnement <strong>expire demain</strong>. Renouvelez maintenant pour éviter toute interruption.'
    : `Votre abonnement expire dans <strong>${joursRestants} jours</strong>. Anticipez le renouvellement pour assurer la continuité de vos activités.`;

  const html = baseLayout(`Rappel renouvellement — ${joursRestants}j`, `
    <h2>Rappel de renouvellement</h2>
    <p>Bonjour ${firstName},</p>
    <p>${message}</p>
    <div class="card">
      <table>
        <tr><td>Entreprise</td><td>${companyName}</td></tr>
        <tr><td>Forfait</td><td>${forfaitNom}</td></tr>
        <tr><td>Date d'expiration</td><td><strong>${dateFin}</strong></td></tr>
        <tr><td>Jours restants</td><td><span class="badge ${urgence}">J-${joursRestants}</span></td></tr>
      </table>
    </div>
    <a href="${renewUrl}" class="btn">Renouveler mon abonnement</a>
  `);

  await sendEmail({
    to: email,
    subject: `[ERP Sénégal] Abonnement ${companyName} — expire dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`,
    html,
  });
};

/**
 * Email d'expiration d'abonnement
 */
const sendSubscriptionExpiredEmail = async (email, { firstName, companyName, forfaitNom, dateFin, renewUrl }) => {
  const html = baseLayout('Abonnement expiré', `
    <h2>Votre abonnement a expiré</h2>
    <p>Bonjour ${firstName},</p>
    <p>L'abonnement de <strong>${companyName}</strong> a expiré le <strong>${dateFin}</strong>. L'accès aux fonctionnalités est temporairement restreint.</p>
    <div class="card">
      <table>
        <tr><td>Entreprise</td><td>${companyName}</td></tr>
        <tr><td>Forfait</td><td>${forfaitNom}</td></tr>
        <tr><td>Statut</td><td><span class="badge badge-red">Expiré</span></td></tr>
      </table>
    </div>
    <p>Renouvelez dès maintenant pour retrouver un accès complet.</p>
    <a href="${renewUrl}" class="btn">Renouveler maintenant</a>
    <p style="font-size:13px;color:#6b7280;">Besoin d'aide ? Contactez <a href="mailto:support@erp-senegal.sn">support@erp-senegal.sn</a></p>
  `);

  await sendEmail({
    to: email,
    subject: `[ERP Sénégal] Abonnement ${companyName} expiré — action requise`,
    html,
  });
};

/**
 * Email de confirmation d'activation d'abonnement
 */
const sendSubscriptionActivatedEmail = async (email, { firstName, companyName, forfaitNom, montant, dateFin, dashboardUrl }) => {
  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
  const html = baseLayout('Abonnement activé !', `
    <h2>Abonnement activé avec succès !</h2>
    <p>Bonjour ${firstName},</p>
    <p>Votre paiement a été confirmé. L'abonnement de <strong>${companyName}</strong> est maintenant actif.</p>
    <div class="card">
      <table>
        <tr><td>Entreprise</td><td>${companyName}</td></tr>
        <tr><td>Forfait</td><td>${forfaitNom}</td></tr>
        <tr><td>Montant payé</td><td><strong>${fmt(montant)} FCFA</strong></td></tr>
        <tr><td>Valable jusqu'au</td><td><strong>${dateFin}</strong></td></tr>
        <tr><td>Statut</td><td><span class="badge badge-green">Actif</span></td></tr>
      </table>
    </div>
    <a href="${dashboardUrl}" class="btn">Accéder à mon tableau de bord</a>
    <p style="font-size:13px;color:#6b7280;">Merci de faire confiance à ERP Sénégal pour la gestion de votre activité.</p>
  `);

  await sendEmail({
    to: email,
    subject: `[ERP Sénégal] Abonnement ${companyName} activé — bienvenue !`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendFactureEmail,
  sendDevisEmail,
  sendWelcomeSaasEmail,
  sendRenewalReminderEmail,
  sendSubscriptionExpiredEmail,
  sendSubscriptionActivatedEmail,
};
