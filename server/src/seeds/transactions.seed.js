const Devis = require('../models/Devis');
const Commande = require('../models/Commande');
const BonLivraison = require('../models/BonLivraison');
const Facture = require('../models/Facture');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const EcritureComptable = require('../models/EcritureComptable');

// Helper functions
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate random date in January-February 2026
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const seedTransactions = async (
  adminUser,
  users,
  clients,
  products,
  warehouses,
  exercice,
  comptes,
  bankAccounts
) => {
  console.log('Generation des donnees transactionnelles...');

  const devisCreated = [];
  const commandesCreated = [];
  const blCreated = [];
  const facturesCreated = [];
  const paymentsCreated = [];
  const ecrituresCreated = [];

  const dateStart = new Date('2026-01-01');
  const dateEnd = new Date('2026-02-28');

  // Helper to get compte by numero
  const getCompte = (numero) => comptes.find((c) => c.numero === numero);

  // ========================================
  // 1. CREATE 30 DEVIS (QUOTES)
  // ========================================
  console.log('  Creation de 30 devis...');

  const devisStatuts = [
    ...Array(8).fill('brouillon'),
    ...Array(8).fill('envoye'),
    ...Array(6).fill('accepte'),
    ...Array(4).fill('refuse'),
    ...Array(2).fill('expire'),
    ...Array(2).fill('converti'),
  ];

  for (let i = 0; i < 30; i++) {
    const client = randomItem(clients);
    const dateDevis = randomDate(dateStart, dateEnd);
    const dateValidite = new Date(dateDevis);
    dateValidite.setDate(dateValidite.getDate() + 30);

    // Generate 1-4 random product lines
    const nbLignes = randomInt(1, 4);
    const lignes = [];
    for (let j = 0; j < nbLignes; j++) {
      const product = randomItem(products);
      lignes.push({
        product: product._id,
        designation: product.name,
        reference: product.reference,
        quantite: randomInt(1, 20),
        prixUnitaire: product.prixVente,
        remise: randomInt(0, 10),
        tauxTVA: product.tauxTVA || 18,
        unite: 'Unite',
      });
    }

    const devis = await Devis.create({
      client: client._id,
      clientSnapshot: {
        displayName: client.displayName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        ninea: client.ninea,
        rccm: client.rccm,
      },
      dateDevis,
      dateValidite,
      statut: devisStatuts[i],
      lignes,
      remiseGlobale: randomInt(0, 5),
      conditionsPaiement: 'Paiement a 30 jours',
      commercial: randomItem(users)._id,
      createdBy: adminUser._id,
    });

    devisCreated.push(devis);
  }

  console.log(`    ${devisCreated.length} devis crees`);

  // ========================================
  // 2. CREATE 20 COMMANDES (ORDERS)
  // ========================================
  console.log('  Creation de 20 commandes...');

  const commandeStatuts = [
    ...Array(4).fill('brouillon'),
    ...Array(5).fill('confirmee'),
    ...Array(4).fill('en_cours'),
    ...Array(3).fill('partiellement_livree'),
    ...Array(4).fill('livree'),
  ];

  for (let i = 0; i < 20; i++) {
    const client = randomItem(clients);
    const dateCommande = randomDate(dateStart, dateEnd);
    const dateLivraisonPrevue = new Date(dateCommande);
    dateLivraisonPrevue.setDate(dateLivraisonPrevue.getDate() + 7);

    // Generate 1-4 random product lines
    const nbLignes = randomInt(1, 4);
    const lignes = [];
    for (let j = 0; j < nbLignes; j++) {
      const product = randomItem(products);
      lignes.push({
        product: product._id,
        designation: product.name,
        reference: product.reference,
        quantite: randomInt(1, 20),
        prixUnitaire: product.prixVente,
        remise: randomInt(0, 10),
        tauxTVA: product.tauxTVA || 18,
        unite: 'Unite',
        quantiteLivree: 0,
      });
    }

    const commande = await Commande.create({
      client: client._id,
      clientSnapshot: {
        displayName: client.displayName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        ninea: client.ninea,
        rccm: client.rccm,
      },
      dateCommande,
      dateLivraisonPrevue,
      statut: commandeStatuts[i],
      lignes,
      remiseGlobale: randomInt(0, 5),
      conditionsPaiement: 'Paiement a 30 jours',
      commercial: randomItem(users)._id,
      createdBy: adminUser._id,
    });

    commandesCreated.push(commande);
  }

  console.log(`    ${commandesCreated.length} commandes creees`);

  // ========================================
  // 3. CREATE 15 BONS DE LIVRAISON + STOCK MOVEMENTS
  // ========================================
  console.log('  Creation de 15 bons de livraison + mouvements de stock...');

  // Filter commandes with status >= en_cours
  const commandesEligibles = commandesCreated.filter((c) =>
    ['en_cours', 'partiellement_livree', 'livree'].includes(c.statut)
  );

  const mainWarehouse = warehouses[0];

  for (let i = 0; i < Math.min(15, commandesEligibles.length); i++) {
    const commande = commandesEligibles[i];
    const dateLivraison = new Date(commande.dateCommande);
    dateLivraison.setDate(dateLivraison.getDate() + randomInt(3, 10));

    // Create BL lines from commande lines
    const lignes = commande.lignes.map((ligne) => ({
      product: ligne.product,
      designation: ligne.designation,
      reference: ligne.reference,
      quantite: ligne.quantite,
      unite: ligne.unite,
      warehouse: mainWarehouse._id,
      ligneCommandeId: ligne._id,
    }));

    const bonLivraison = await BonLivraison.create({
      commande: commande._id,
      client: commande.client,
      clientSnapshot: commande.clientSnapshot,
      dateLivraison,
      statut: 'valide',
      lignes,
      adresseLivraison: commande.clientSnapshot.address,
      createdBy: adminUser._id,
      validatedBy: adminUser._id,
      validatedAt: dateLivraison,
    });

    blCreated.push(bonLivraison);

    // Create stock movements for each line
    for (const ligne of lignes) {
      await StockMovement.create({
        type: 'sortie',
        motif: 'vente',
        product: ligne.product,
        warehouseSource: mainWarehouse._id,
        quantite: ligne.quantite,
        coutUnitaire: 0,
        date: dateLivraison,
        documentReference: bonLivraison.numero,
        documentType: 'bon_livraison',
        documentId: bonLivraison._id,
        notes: `Livraison BL ${bonLivraison.numero}`,
        createdBy: adminUser._id,
      });

      // Update stock quantity
      const stock = await Stock.findOne({
        product: ligne.product,
        warehouse: mainWarehouse._id,
      });
      if (stock) {
        stock.quantite = Math.max(0, stock.quantite - ligne.quantite);
        // valeurStock is recalculated automatically in pre-save (quantite * cump)
        await stock.save();
      }
    }

    // Update commande with BL reference and update quantiteLivree
    commande.bonsLivraison.push(bonLivraison._id);
    commande.lignes.forEach((ligne, idx) => {
      ligne.quantiteLivree = lignes[idx].quantite;
    });
    await commande.save();
  }

  console.log(`    ${blCreated.length} bons de livraison crees`);

  // ========================================
  // 4. CREATE 30 FACTURES (INVOICES)
  // ========================================
  console.log('  Creation de 30 factures...');

  const factureStatuts = [
    ...Array(5).fill('brouillon'),
    ...Array(5).fill('validee'),
    ...Array(5).fill('envoyee'),
    ...Array(5).fill('partiellement_payee'),
    ...Array(8).fill('payee'),
    ...Array(2).fill('annulee'),
  ];

  let factureCounter = 1;

  for (let i = 0; i < 30; i++) {
    const client = randomItem(clients);
    const dateFacture = randomDate(dateStart, dateEnd);
    const dateEcheance = new Date(dateFacture);
    dateEcheance.setDate(dateEcheance.getDate() + 30);

    // Generate 1-4 random product lines
    const nbLignes = randomInt(1, 4);
    const lignes = [];
    for (let j = 0; j < nbLignes; j++) {
      const product = randomItem(products);
      lignes.push({
        product: product._id,
        designation: product.name,
        reference: product.reference,
        quantite: randomInt(1, 20),
        prixUnitaire: product.prixVente,
        remise: randomInt(0, 10),
        tauxTVA: product.tauxTVA || 18,
        unite: 'Unite',
      });
    }

    const statut = factureStatuts[i];
    const factureData = {
      client: client._id,
      clientSnapshot: {
        displayName: client.displayName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        ninea: client.ninea,
        rccm: client.rccm,
      },
      dateFacture,
      dateEcheance,
      statut,
      lignes,
      remiseGlobale: randomInt(0, 5),
      conditionsPaiement: 'Paiement a 30 jours',
      commercial: randomItem(users)._id,
      createdBy: adminUser._id,
      montantPaye: 0,
    };

    // Assign numero for validated invoices
    if (!['brouillon', 'annulee'].includes(statut)) {
      factureData.numero = `FA-2026-${String(factureCounter).padStart(5, '0')}`;
      factureData.validatedBy = adminUser._id;
      factureData.validatedAt = dateFacture;
      factureCounter++;
    }

    const facture = await Facture.create(factureData);
    facturesCreated.push(facture);
  }

  console.log(`    ${facturesCreated.length} factures creees`);

  // ========================================
  // 5. CREATE 25 PAIEMENTS
  // ========================================
  console.log('  Creation de 25 paiements...');

  // Filter factures that are partiellement_payee or payee
  const facturesAPayer = facturesCreated.filter((f) =>
    ['partiellement_payee', 'payee'].includes(f.statut)
  );

  const modesPaiement = [
    ...Array(5).fill('especes'),
    ...Array(5).fill('cheque'),
    ...Array(5).fill('virement'),
    ...Array(5).fill('orange_money'),
    ...Array(5).fill('wave'),
  ];

  let paymentCounter = 1;

  for (let i = 0; i < Math.min(25, facturesAPayer.length); i++) {
    const facture = facturesAPayer[i];
    const modePaiement = modesPaiement[i];
    const datePaiement = new Date(facture.dateFacture);
    datePaiement.setDate(datePaiement.getDate() + randomInt(5, 25));

    // Determine payment amount
    let montant;
    if (facture.statut === 'payee') {
      montant = facture.totalTTC;
    } else {
      // partiellement_payee: 50% of totalTTC
      montant = Math.round(facture.totalTTC * 0.5);
    }

    // Select bank account for bank-based payments
    let compteBancaire = null;
    if (['cheque', 'virement'].includes(modePaiement)) {
      compteBancaire = randomItem(bankAccounts)._id;
    }

    const payment = await Payment.create({
      numero: `PA-2026-${String(paymentCounter).padStart(5, '0')}`,
      typePaiement: 'client',
      modePaiement,
      datePaiement,
      montant,
      client: facture.client,
      tiersSnapshot: {
        displayName: facture.clientSnapshot.displayName,
        email: facture.clientSnapshot.email,
        phone: facture.clientSnapshot.phone,
      },
      facture: facture._id,
      compteBancaire,
      statut: 'valide',
      createdBy: adminUser._id,
      validatedBy: adminUser._id,
      validatedAt: datePaiement,
    });

    paymentsCreated.push(payment);
    paymentCounter++;

    // Update facture.montantPaye
    facture.montantPaye += montant;
    await facture.save();
  }

  console.log(`    ${paymentsCreated.length} paiements crees`);

  // ========================================
  // 6. CREATE ECRITURES COMPTABLES
  // ========================================
  console.log('  Creation des ecritures comptables...');

  // 6.1 Ecritures for validated factures
  const facturesValidees = facturesCreated.filter(
    (f) => !['brouillon', 'annulee'].includes(f.statut)
  );

  for (const facture of facturesValidees) {
    const compte411 = getCompte('411000');
    const compte701 = getCompte('701000');
    const compte443 = getCompte('443100');

    if (!compte411 || !compte701 || !compte443) {
      console.warn('    Comptes comptables introuvables, ecriture ignoree');
      continue;
    }

    const lignes = [
      {
        compte: compte411._id,
        compteNumero: compte411.numero,
        compteLibelle: compte411.libelle,
        libelle: `Facture ${facture.numero || facture.referenceInterne} - ${facture.clientSnapshot.displayName}`,
        debit: facture.totalTTC,
        credit: 0,
      },
      {
        compte: compte701._id,
        compteNumero: compte701.numero,
        compteLibelle: compte701.libelle,
        libelle: `Vente - ${facture.clientSnapshot.displayName}`,
        debit: 0,
        credit: facture.totalHT,
      },
      {
        compte: compte443._id,
        compteNumero: compte443.numero,
        compteLibelle: compte443.libelle,
        libelle: `TVA facturee - ${facture.clientSnapshot.displayName}`,
        debit: 0,
        credit: facture.totalTVA,
      },
    ];

    const ecriture = await EcritureComptable.create({
      journal: 'VE',
      dateEcriture: facture.dateFacture,
      libelle: `Facture ${facture.numero || facture.referenceInterne}`,
      reference: facture.numero || facture.referenceInterne,
      exercice: exercice._id,
      lignes,
      statut: 'validee',
      sourceDocument: {
        type: 'Facture',
        id: facture._id,
      },
      createdBy: adminUser._id,
      validatedBy: adminUser._id,
      validatedAt: facture.dateFacture,
    });

    ecrituresCreated.push(ecriture);
  }

  // 6.2 Ecritures for validated payments
  for (const payment of paymentsCreated) {
    const compte411 = getCompte('411000');
    let compteDebit;

    if (payment.modePaiement === 'especes') {
      compteDebit = getCompte('571000'); // Caisse
    } else if (['cheque', 'virement', 'carte_bancaire'].includes(payment.modePaiement)) {
      compteDebit = getCompte('521000'); // Banque
    } else if (['orange_money', 'wave'].includes(payment.modePaiement)) {
      compteDebit = getCompte('571000'); // Caisse (or dedicated e-money account)
    }

    if (!compteDebit || !compte411) {
      console.warn('    Comptes comptables introuvables pour paiement, ecriture ignoree');
      continue;
    }

    const lignes = [
      {
        compte: compteDebit._id,
        compteNumero: compteDebit.numero,
        compteLibelle: compteDebit.libelle,
        libelle: `Reglement ${payment.tiersSnapshot.displayName} - ${payment.modePaiement}`,
        debit: payment.montant,
        credit: 0,
      },
      {
        compte: compte411._id,
        compteNumero: compte411.numero,
        compteLibelle: compte411.libelle,
        libelle: `Reglement client ${payment.tiersSnapshot.displayName}`,
        debit: 0,
        credit: payment.montant,
      },
    ];

    const journal = payment.modePaiement === 'especes' ? 'CA' : 'BQ';

    const ecriture = await EcritureComptable.create({
      journal,
      dateEcriture: payment.datePaiement,
      libelle: `Reglement ${payment.numero}`,
      reference: payment.numero,
      exercice: exercice._id,
      lignes,
      statut: 'validee',
      sourceDocument: {
        type: 'Payment',
        id: payment._id,
      },
      createdBy: adminUser._id,
      validatedBy: adminUser._id,
      validatedAt: payment.datePaiement,
    });

    ecrituresCreated.push(ecriture);

    // Link payment to ecriture
    payment.ecritureComptable = ecriture._id;
    await payment.save();
  }

  console.log(`    ${ecrituresCreated.length} ecritures comptables creees`);

  // ========================================
  // RETURN SUMMARY
  // ========================================
  return {
    devis: devisCreated.length,
    commandes: commandesCreated.length,
    bonsLivraison: blCreated.length,
    factures: facturesCreated.length,
    payments: paymentsCreated.length,
    ecritures: ecrituresCreated.length,
  };
};

module.exports = { seedTransactions };
