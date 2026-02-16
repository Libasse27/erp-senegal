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

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
};
