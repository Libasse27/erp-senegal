/**
 * Interface abstraite pour les fournisseurs de paiement.
 * Chaque PSP (Wave, Orange Money…) doit étendre cette classe.
 */
class PaymentProvider {
  /**
   * @param {string} name  - Identifiant du provider ('WAVE' | 'ORANGE_MONEY')
   * @param {string} secret - Clé secrète pour la vérification des webhooks
   */
  constructor(name, secret) {
    if (new.target === PaymentProvider) {
      throw new Error('PaymentProvider est abstraite — instanciez un provider concret.');
    }
    this.name   = name;
    this.secret = secret;
  }

  /**
   * Crée une session de paiement et retourne l'URL de checkout.
   *
   * @param {Object} params
   * @param {string} params.reference     - Référence interne unique
   * @param {number} params.montant       - Montant en XOF
   * @param {string} params.description   - Description de la transaction
   * @param {string} params.clientEmail   - Email du payeur
   * @param {string} [params.clientPhone] - Téléphone du payeur
   * @param {string} params.callbackUrl   - URL de redirection après paiement
   * @param {string} params.webhookUrl    - URL de notification du PSP
   *
   * @returns {Promise<{ transactionId: string, checkoutUrl: string, expireAt: Date }>}
   */
  // eslint-disable-next-line no-unused-vars
  async initier(params) {
    throw new Error(`${this.name}.initier() doit être implémenté.`);
  }

  /**
   * Vérifie l'authenticité d'un webhook reçu et retourne le payload parsé.
   *
   * @param {Buffer|string} rawBody  - Corps brut de la requête HTTP
   * @param {string}        signature - Valeur de l'en-tête de signature
   *
   * @returns {{ transactionId: string, statut: 'REUSSI'|'ECHOUE', metadata: Object }}
   * @throws {Error} Si la signature est invalide
   */
  // eslint-disable-next-line no-unused-vars
  verifierWebhook(rawBody, signature) {
    throw new Error(`${this.name}.verifierWebhook() doit être implémenté.`);
  }

  /**
   * Interroge le PSP pour le statut courant d'une transaction (polling).
   *
   * @param {string} transactionId
   * @returns {Promise<'EN_ATTENTE'|'REUSSI'|'ECHOUE'|'REMBOURSE'>}
   */
  // eslint-disable-next-line no-unused-vars
  async interrogerStatut(transactionId) {
    throw new Error(`${this.name}.interrogerStatut() doit être implémenté.`);
  }
}

module.exports = PaymentProvider;
