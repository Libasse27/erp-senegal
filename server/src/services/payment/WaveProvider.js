/**
 * WaveProvider — Intégration Wave CI (mode simulation)
 *
 * En production, remplacer les méthodes par les vrais appels à l'API Wave :
 *   POST https://api.wave.com/v1/checkout/sessions
 *   Signature : HMAC-SHA256 sur le corps brut, clé = WAVE_SECRET_KEY
 *   En-tête : Wave-Signature: t=<timestamp>,v1=<hmac>
 */
const crypto        = require('crypto');
const PaymentProvider = require('./PaymentProvider');

const WAVE_SIMULATION = process.env.WAVE_SIMULATION !== 'false'; // true par défaut

class WaveProvider extends PaymentProvider {
  constructor() {
    super('WAVE', process.env.WAVE_SECRET_KEY || 'wave-dev-secret-key');
  }

  async initier({ reference, montant, description, clientEmail, clientPhone, callbackUrl, webhookUrl }) {
    if (WAVE_SIMULATION) {
      return this._simulerInitiation({ reference, montant, description, clientEmail, clientPhone });
    }

    // ── Production : appel HTTP réel ────────────────────────────────────────────
    // const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.WAVE_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     currency: 'XOF',
    //     amount: String(montant),
    //     client_reference: reference,
    //     success_url: callbackUrl + '?statut=reussi&ref=' + reference,
    //     error_url:   callbackUrl + '?statut=echec&ref='  + reference,
    //     webhook_url: webhookUrl,
    //   }),
    // });
    // const data = await response.json();
    // return { transactionId: data.id, checkoutUrl: data.wave_launch_url, expireAt: new Date(data.when_expires) };
    throw new Error('Wave production non configuré — définissez WAVE_SIMULATION=false et WAVE_API_KEY');
  }

  _simulerInitiation({ reference, montant, clientEmail }) {
    const transactionId = `wave_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expireAt      = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    const checkoutUrl   = `https://pay.wave.com/m/ERP_SENEGAL/c/${transactionId}?amount=${montant}&ref=${reference}&email=${encodeURIComponent(clientEmail || '')}`;

    return { transactionId, checkoutUrl, expireAt };
  }

  /**
   * Vérifie la signature Wave : HMAC-SHA256 du corps brut.
   * Format en-tête : "t=<timestamp>,v1=<hmac_hex>"
   */
  verifierWebhook(rawBody, signatureHeader) {
    if (WAVE_SIMULATION) {
      return this._simulerWebhook(rawBody);
    }

    if (!signatureHeader) throw new Error('En-tête Wave-Signature absent');

    const parts     = Object.fromEntries(signatureHeader.split(',').map((p) => p.split('=')));
    const timestamp = parts.t;
    const received  = parts.v1;

    if (!timestamp || !received) throw new Error('Format Wave-Signature invalide');

    // Protection replay (5 minutes)
    const age = Date.now() - Number(timestamp) * 1000;
    if (age > 5 * 60 * 1000) throw new Error('Webhook Wave expiré (replay détecté)');

    const payload  = `${timestamp}.${rawBody.toString()}`;
    const expected = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
      throw new Error('Signature Wave invalide');
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
    const mapping = { completed: 'REUSSI', failed: 'ECHOUE', refunded: 'REMBOURSE' };
    const statut  = mapping[body.payment_status] || 'EN_ATTENTE';

    return {
      transactionId: body.id || body.transaction_id,
      statut,
      metadata: body,
    };
  }

  async interrogerStatut(transactionId) {
    if (WAVE_SIMULATION) {
      // En simulation, on considère le paiement réussi si le transactionId existe
      return transactionId ? 'REUSSI' : 'EN_ATTENTE';
    }
    // Production : GET https://api.wave.com/v1/checkout/sessions/:id
    throw new Error('Wave production non configuré');
  }
}

module.exports = new WaveProvider();
