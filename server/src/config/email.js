module.exports = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: {
    email: process.env.FROM_EMAIL || 'noreply@erp-senegal.com',
    name: process.env.FROM_NAME || 'ERP Senegal',
  },
};
