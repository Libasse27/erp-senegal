const Invoice        = require('../models/Invoice');
const Transaction    = require('../models/Transaction');
const PlatformSetting = require('../models/PlatformSetting');
const logger         = require('../config/logger');

const genererNumero = async () => {
  const ps = await PlatformSetting.findOneAndUpdate(
    { _singleton: 'PLATFORM' },
    { $inc: { 'compteurs.invoices': 1 } },
    { new: true, upsert: true }
  );
  const seq = ps?.compteurs?.invoices ?? 1;
  return `INV-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
};

/**
 * Crée la facture d'abonnement SaaS + la transaction financière.
 * À appeler DANS une session MongoDB active (atomique avec activerAbonnement).
 *
 * @param {Object} paiement   - Document PaiementSaaS (déjà sauvegardé avec statut REUSSI)
 * @param {Object} abonnement - Document Abonnement (déjà activé)
 * @param {ClientSession} session - Session Mongoose en cours
 * @returns {{ invoice: Invoice, transaction: Transaction }}
 */
const creerInvoiceEtTransaction = async (paiement, abonnement, session) => {
  const numero    = await genererNumero();
  const planNom   = abonnement.planSnapshot?.nom || 'Abonnement SaaS';
  const periode   = abonnement.periodicite === 'ANNUEL' ? 'annuel' : 'mensuel';

  const [invoice] = await Invoice.create(
    [{
      numero,
      entrepriseId: paiement.entrepriseId,
      abonnementId: abonnement._id,
      paiementId:   paiement._id,
      dateEmission: new Date(),
      lignes: [{
        description:  `${planNom} — abonnement ${periode}`,
        quantite:     1,
        prixUnitaire: paiement.montant,
        montantHT:    paiement.montant,
      }],
      totalHT:  paiement.montant,
      taxes:    0,
      totalTTC: paiement.montant,
      devise:   paiement.devise || 'XOF',
      statut:   'PAYEE',
    }],
    { session }
  );

  const [transaction] = await Transaction.create(
    [{
      entrepriseId: paiement.entrepriseId,
      abonnementId: abonnement._id,
      paiementId:   paiement._id,
      invoiceId:    invoice._id,
      type:         'PAIEMENT',
      montant:      paiement.montant,
      devise:       paiement.devise || 'XOF',
      methode:      paiement.methode,
      reference:    paiement.reference,
      transactionId: paiement.transactionId,
      statut:       'COMPLETE',
      description:  `Paiement ${planNom} — ${periode}`,
    }],
    { session }
  );

  logger.info(`[Invoice] ${numero} créée — company=${paiement.entrepriseId} | transaction=${transaction._id}`);
  return { invoice, transaction };
};

module.exports = { creerInvoiceEtTransaction };
