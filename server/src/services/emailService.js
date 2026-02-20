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

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendFactureEmail,
  sendDevisEmail,
};
