/**
 * OrangeMoneyProvider — Intégration Orange Money Sénégal (mode simulation)
 *
 * En production, remplacer par les vrais appels à l'API Orange Money :
 *   POST https://api.orange.com/orange-money-webpay/dev/v1/webpayment
 *   Signature : HMAC-SHA256 sur le corps brut, clé = ORANGE_MONEY_SECRET_KEY
 *   En-tête : X-Orange-Signature: sha256=<hmac_hex>
 */
const crypto          = require('crypto');
const PaymentProvider = require('./PaymentProvider');

const OM_SIMULATION = process.env.ORANGE_MONEY_SIMULATION !== 'false'; // true par défaut

class OrangeMoneyProvider extends PaymentProvider {
  constructor() {
    super('ORANGE_MONEY', process.env.ORANGE_MONEY_SECRET_KEY || 'om-dev-secret-key');
  }

  async initier({ reference, montant, description, clientPhone, callbackUrl }) {
    if (OM_SIMULATION) {
      return this._simulerInitiation({ reference, montant, description, clientPhone });
    }

    // ── Production : appel HTTP réel ────────────────────────────────────────────
    // const accessToken = await this._getAccessToken();
    // const response = await fetch('https://api.orange.com/orange-money-webpay/sn/v1/webpayment', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     merchant_key: process.env.ORANGE_MONEY_MERCHANT_KEY,
    //     currency: 'OUV',
    //     order_id: reference,
    //     amount: montant,
    //     return_url: callbackUrl,
    //     cancel_url: callbackUrl + '?statut=annule',
    //     notif_url: process.env.APP_URL + '/api/paiements-saas/webhook/orange_money',
    //     lang: 'fr',
    //   }),
    // });
    // const data = await response.json();
    // return { transactionId: data.pay_token, checkoutUrl: data.payment_url, expireAt: new Date(Date.now() + 30 * 60 * 1000) };
    throw new Error('Orange Money production non configuré — définissez ORANGE_MONEY_SIMULATION=false');
  }

  _simulerInitiation({ reference, montant, clientPhone }) {
    const transactionId = `om_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expireAt      = new Date(Date.now() + 30 * 60 * 1000);
    const phone         = clientPhone ? clientPhone.replace(/\s/g, '') : '';
    const checkoutUrl   = `https://webpayment.orange.sn/pay?token=${transactionId}&amount=${montant}&ref=${reference}&msisdn=${phone}`;

    return { transactionId, checkoutUrl, expireAt };
  }

  /**
   * Vérifie la signature Orange Money.
   * Format en-tête : "sha256=<hmac_hex>"
   */
  verifierWebhook(rawBody, signatureHeader) {
    if (OM_SIMULATION) {
      return this._simulerWebhook(rawBody);
    }

    if (!signatureHeader) throw new Error('En-tête X-Orange-Signature absent');

    const received = signatureHeader.replace(/^sha256=/, '');
    const expected = crypto.createHmac('sha256', this.secret)
      .update(rawBody.toString())
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
      throw new Error('Signature Orange Money invalide');
    }

    return this._parseWebhookPayload(JSON.parse(rawBody.toString()));
  }

  _simulerWebhook(rawBody) {
    let body;
    if (typeof rawBody === 'string') {
      body = JSON.parse(rawBody);
    } else if (Buffer.isBuffer(rawBody)) {
      body = JSON.parse(rawBody.toString());
    } else {
      body = rawBody;
    }
    return this._parseWebhookPayload(body);
  }

  _parseWebhookPayload(body) {
    // Orange Money Sénégal : status codes SUCCESS / FAILED / CANCELLED
    const mapping = { SUCCESS: 'REUSSI', FAILED: 'ECHOUE', CANCELLED: 'ECHOUE', REFUNDED: 'REMBOURSE' };
    const rawStatus = (body.status || body.payment_status || '').toUpperCase();
    const statut    = mapping[rawStatus] || 'EN_ATTENTE';

    return {
      transactionId: body.pay_token || body.transaction_id || body.id,
      statut,
      metadata: body,
    };
  }

  async interrogerStatut(transactionId) {
    if (OM_SIMULATION) {
      return transactionId ? 'REUSSI' : 'EN_ATTENTE';
    }
    throw new Error('Orange Money production non configuré');
  }
}

module.exports = new OrangeMoneyProvider();
