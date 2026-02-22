const EcritureComptable = require('../models/EcritureComptable');
const CompteComptable = require('../models/CompteComptable');
const ExerciceComptable = require('../models/ExerciceComptable');
const logger = require('../config/logger');

/**
 * Get the current open fiscal year or the one matching a specific date
 * @param {Date} date - Optional date to find matching exercise
 * @returns {Promise<Object>} ExerciceComptable document
 */
const getExerciceForDate = async (date = new Date()) => {
  let exercice = await ExerciceComptable.findByDate(date);
  if (!exercice) {
    exercice = await ExerciceComptable.getCurrent();
  }
  if (!exercice) {
    throw new Error("Aucun exercice comptable ouvert. Veuillez creer un exercice comptable.");
  }
  if (exercice.statut === 'cloture') {
    throw new Error("L'exercice comptable correspondant est cloture. Impossible de saisir des ecritures.");
  }
  return exercice;
};

/**
 * Resolve a CompteComptable ObjectId from its numero string
 * @param {string} numero - Account number
 * @returns {Promise<Object>} CompteComptable document
 */
const resolveCompte = async (numero) => {
  const compte = await CompteComptable.findByNumero(numero);
  if (!compte) {
    throw new Error(`Compte comptable ${numero} non trouve dans le plan comptable`);
  }
  if (!compte.isImputable) {
    throw new Error(`Le compte ${numero} n'est pas imputable (compte collectif)`);
  }
  return compte;
};

/**
 * Generate a SYSCOHADA accounting entry for a client invoice validation
 * Journal VE: Debit 411000 (Client) = TTC / Credit 701000 (Ventes) = HT / Credit 443100 (TVA) = TVA
 * For avoir: reverse entries
 * @param {Object} facture - Facture document
 * @param {string} userId - User creating the entry
 * @returns {Promise<Object>} Created EcritureComptable
 */
const generateEcritureFromFacture = async (facture, userId) => {
  const exercice = await getExerciceForDate(facture.dateFacture);
  const isAvoir = facture.typeDocument === 'avoir';
  const tiersName = facture.clientSnapshot?.displayName || 'Client';
  const docRef = facture.numero || facture.referenceInterne;

  const lignes = [];

  if (isAvoir) {
    // Avoir: reverse normal entries
    lignes.push({
      compteNumero: '411000',
      libelle: `${tiersName} - Avoir ${docRef}`,
      debit: 0,
      credit: facture.totalTTC,
    });
    lignes.push({
      compteNumero: '701000',
      libelle: 'Ventes de marchandises - Avoir',
      debit: facture.totalHT,
      credit: 0,
    });
    if (facture.totalTVA > 0) {
      lignes.push({
        compteNumero: '443100',
        libelle: 'TVA facturee - Avoir',
        debit: facture.totalTVA,
        credit: 0,
      });
    }
  } else {
    // Normal invoice
    lignes.push({
      compteNumero: '411000',
      libelle: `${tiersName} - Facture ${docRef}`,
      debit: facture.totalTTC,
      credit: 0,
    });
    lignes.push({
      compteNumero: '701000',
      libelle: 'Ventes de marchandises',
      debit: 0,
      credit: facture.totalHT,
    });
    if (facture.totalTVA > 0) {
      lignes.push({
        compteNumero: '443100',
        libelle: 'TVA facturee sur ventes',
        debit: 0,
        credit: facture.totalTVA,
      });
    }
  }

  // Resolve account ObjectIds and add compteLibelle
  for (const ligne of lignes) {
    const compte = await resolveCompte(ligne.compteNumero);
    ligne.compte = compte._id;
    ligne.compteLibelle = compte.libelle;
  }

  const ecriture = await EcritureComptable.create({
    journal: 'VE',
    dateEcriture: facture.dateFacture || new Date(),
    libelle: `${isAvoir ? 'Avoir' : 'Facture'} ${docRef} - ${tiersName}`,
    reference: docRef,
    exercice: exercice._id,
    lignes,
    statut: 'validee',
    sourceDocument: {
      type: isAvoir ? 'avoir' : 'facture',
      id: facture._id,
    },
    validatedBy: userId,
    validatedAt: new Date(),
    createdBy: userId,
  });

  // Update account balances
  await updateCompteBalances(lignes);

  return ecriture;
};

/**
 * Generate a SYSCOHADA accounting entry for a client payment
 * Journal BQ/CA: Debit 521/571 (Bank/Cash) / Credit 411000 (Client)
 * @param {Object} payment - Payment document
 * @param {string} userId - User creating the entry
 * @returns {Promise<Object>} Created EcritureComptable
 */
const generateEcritureFromPaymentClient = async (payment, userId) => {
  const exercice = await getExerciceForDate(payment.datePaiement);
  const tiersName = payment.tiersSnapshot?.displayName || 'Client';
  const docRef = payment.numero || payment.referenceInterne;

  // Determine journal and bank/cash account based on payment mode
  const { journal, compteDebit } = getPaymentAccounts(payment);

  const lignes = [
    {
      compteNumero: compteDebit,
      libelle: `Encaissement ${docRef} - ${tiersName}`,
      debit: payment.montant,
      credit: 0,
    },
    {
      compteNumero: '411000',
      libelle: `${tiersName} - Reglement ${docRef}`,
      debit: 0,
      credit: payment.montant,
    },
  ];

  // Resolve account ObjectIds
  for (const ligne of lignes) {
    const compte = await resolveCompte(ligne.compteNumero);
    ligne.compte = compte._id;
    ligne.compteLibelle = compte.libelle;
  }

  const ecriture = await EcritureComptable.create({
    journal,
    dateEcriture: payment.datePaiement,
    libelle: `Encaissement ${docRef} - ${tiersName}`,
    reference: docRef,
    exercice: exercice._id,
    lignes,
    statut: 'validee',
    sourceDocument: { type: 'paiement', id: payment._id },
    validatedBy: userId,
    validatedAt: new Date(),
    createdBy: userId,
  });

  await updateCompteBalances(lignes);

  return ecriture;
};

/**
 * Generate a SYSCOHADA accounting entry for a supplier payment
 * Journal BQ/CA: Debit 401000 (Fournisseur) / Credit 521/571 (Bank/Cash)
 * @param {Object} payment - Payment document
 * @param {string} userId - User creating the entry
 * @returns {Promise<Object>} Created EcritureComptable
 */
const generateEcritureFromPaymentFournisseur = async (payment, userId) => {
  const exercice = await getExerciceForDate(payment.datePaiement);
  const tiersName = payment.tiersSnapshot?.displayName || 'Fournisseur';
  const docRef = payment.numero || payment.referenceInterne;

  const { journal, compteDebit: compteCredit } = getPaymentAccounts(payment);

  const lignes = [
    {
      compteNumero: '401000',
      libelle: `${tiersName} - Reglement ${docRef}`,
      debit: payment.montant,
      credit: 0,
    },
    {
      compteNumero: compteCredit,
      libelle: `Decaissement ${docRef} - ${tiersName}`,
      debit: 0,
      credit: payment.montant,
    },
  ];

  for (const ligne of lignes) {
    const compte = await resolveCompte(ligne.compteNumero);
    ligne.compte = compte._id;
    ligne.compteLibelle = compte.libelle;
  }

  const ecriture = await EcritureComptable.create({
    journal,
    dateEcriture: payment.datePaiement,
    libelle: `Reglement fournisseur ${docRef} - ${tiersName}`,
    reference: docRef,
    exercice: exercice._id,
    lignes,
    statut: 'validee',
    sourceDocument: { type: 'paiement_fournisseur', id: payment._id },
    validatedBy: userId,
    validatedAt: new Date(),
    createdBy: userId,
  });

  await updateCompteBalances(lignes);

  return ecriture;
};

/**
 * Determine the accounting journal and account number based on payment mode
 * @param {Object} payment - Payment document
 * @returns {{journal: string, compteDebit: string}}
 */
const getPaymentAccounts = (payment) => {
  const modeMapping = {
    especes: { journal: 'CA', compteDebit: '571000' },     // Caisse
    cheque: { journal: 'BQ', compteDebit: '521000' },      // Banque
    virement: { journal: 'BQ', compteDebit: '521000' },    // Banque
    orange_money: { journal: 'BQ', compteDebit: '521100' }, // Banque Mobile Money
    wave: { journal: 'BQ', compteDebit: '521100' },         // Banque Mobile Money
    carte_bancaire: { journal: 'BQ', compteDebit: '521000' }, // Banque
  };

  return modeMapping[payment.modePaiement] || { journal: 'BQ', compteDebit: '521000' };
};

/**
 * Update account balances after an entry is created
 * @param {Array} lignes - Entry lines with compteNumero, debit, credit
 */
const updateCompteBalances = async (lignes) => {
  for (const ligne of lignes) {
    try {
      await CompteComptable.findOneAndUpdate(
        { numero: ligne.compteNumero, isActive: true },
        {
          $inc: {
            soldeDebit: ligne.debit || 0,
            soldeCredit: ligne.credit || 0,
          },
        }
      );
    } catch (err) {
      logger.error(`Erreur mise a jour solde compte ${ligne.compteNumero}: ${err.message}`);
    }
  }
};

/**
 * Reverse account balance updates (for cancellation)
 * @param {Array} lignes - Entry lines to reverse
 */
const reverseCompteBalances = async (lignes) => {
  for (const ligne of lignes) {
    try {
      await CompteComptable.findOneAndUpdate(
        { numero: ligne.compteNumero, isActive: true },
        {
          $inc: {
            soldeDebit: -(ligne.debit || 0),
            soldeCredit: -(ligne.credit || 0),
          },
        }
      );
    } catch (err) {
      logger.error(`Erreur reversion solde compte ${ligne.compteNumero}: ${err.message}`);
    }
  }
};

/**
 * Create a contrepassation (reversal entry) for a validated entry
 * @param {string} ecritureId - ID of the entry to reverse
 * @param {string} userId - User creating the reversal
 * @returns {Promise<Object>} Created contrepassation entry
 */
const contrepasser = async (ecritureId, userId) => {
  const ecriture = await EcritureComptable.findById(ecritureId);
  if (!ecriture) throw new Error('Ecriture comptable non trouvee');
  if (ecriture.statut !== 'validee') throw new Error("Seules les ecritures validees peuvent etre contrepassees");

  const exercice = await getExerciceForDate(new Date());

  // Reverse debit/credit on each line
  const lignesReversees = ecriture.lignes.map((l) => ({
    compte: l.compte,
    compteNumero: l.compteNumero,
    compteLibelle: l.compteLibelle,
    libelle: `Contrepassation - ${l.libelle}`,
    debit: l.credit,
    credit: l.debit,
  }));

  const contrepassation = await EcritureComptable.create({
    journal: ecriture.journal,
    dateEcriture: new Date(),
    libelle: `Contrepassation - ${ecriture.libelle}`,
    reference: `CP-${ecriture.reference || ecriture.numero}`,
    exercice: exercice._id,
    lignes: lignesReversees,
    statut: 'validee',
    isContrepassation: true,
    ecritureOrigine: ecriture._id,
    validatedBy: userId,
    validatedAt: new Date(),
    createdBy: userId,
  });

  await updateCompteBalances(lignesReversees);

  return contrepassation;
};

/**
 * Automatic lettrage: match debit and credit entries on a tiers account
 * @param {string} compteNumero - Account number (411xxx or 401xxx)
 * @param {Array<string>} ligneIds - IDs of entry lines to letter
 * @param {string} userId - User performing lettrage
 * @returns {Promise<string>} Lettrage code
 */
const lettrer = async (compteNumero, ligneIds, userId) => {
  // Find all ecritures containing these line IDs
  const ecritures = await EcritureComptable.find({
    'lignes._id': { $in: ligneIds },
    'lignes.compteNumero': compteNumero,
    isActive: true,
  });

  if (ecritures.length === 0) {
    throw new Error('Aucune ecriture trouvee pour les lignes selectionnees');
  }

  // Collect the matching lines
  let totalDebit = 0;
  let totalCredit = 0;
  const matchingLines = [];

  for (const ecriture of ecritures) {
    for (const ligne of ecriture.lignes) {
      if (
        ligneIds.includes(ligne._id.toString()) &&
        ligne.compteNumero === compteNumero
      ) {
        if (ligne.lettrage) {
          throw new Error(`La ligne ${ligne._id} est deja lettree (${ligne.lettrage})`);
        }
        totalDebit += ligne.debit || 0;
        totalCredit += ligne.credit || 0;
        matchingLines.push({ ecriture, ligne });
      }
    }
  }

  // Verify balance
  if (totalDebit !== totalCredit) {
    throw new Error(
      `Le lettrage n'est pas equilibre: Debit ${totalDebit} != Credit ${totalCredit}`
    );
  }

  // Generate lettrage code
  const lettrageCode = `LET-${Date.now().toString(36).toUpperCase()}`;
  const dateLettrage = new Date();

  // Update all matching lines
  for (const { ecriture, ligne } of matchingLines) {
    ligne.lettrage = lettrageCode;
    ligne.dateLettrage = dateLettrage;
    await ecriture.save();
  }

  return lettrageCode;
};

/**
 * Calculate Grand Livre for a specific account
 * @param {string} compteNumero - Account number
 * @param {Object} options - dateFrom, dateTo, exerciceId
 * @returns {Promise<Object>} Grand livre data
 */
const getGrandLivre = async (compteNumero, options = {}) => {
  const filter = {
    'lignes.compteNumero': compteNumero,
    statut: 'validee',
    isActive: true,
  };

  if (options.exercice) filter.exercice = options.exercice;
  if (options.dateFrom || options.dateTo) {
    filter.dateEcriture = {};
    if (options.dateFrom) filter.dateEcriture.$gte = new Date(options.dateFrom);
    if (options.dateTo) filter.dateEcriture.$lte = new Date(options.dateTo);
  }

  const ecritures = await EcritureComptable.find(filter)
    .sort('dateEcriture')
    .populate('lignes.compte', 'numero libelle');

  // Extract only the lines for this account
  const mouvements = [];
  let soldeProgressif = 0;

  for (const ecriture of ecritures) {
    for (const ligne of ecriture.lignes) {
      if (ligne.compteNumero === compteNumero) {
        soldeProgressif += (ligne.debit || 0) - (ligne.credit || 0);
        mouvements.push({
          date: ecriture.dateEcriture,
          journal: ecriture.journal,
          numero: ecriture.numero,
          libelle: ligne.libelle,
          reference: ecriture.reference,
          debit: ligne.debit || 0,
          credit: ligne.credit || 0,
          solde: soldeProgressif,
          lettrage: ligne.lettrage,
        });
      }
    }
  }

  const totalDebit = mouvements.reduce((s, m) => s + m.debit, 0);
  const totalCredit = mouvements.reduce((s, m) => s + m.credit, 0);

  return {
    compteNumero,
    mouvements,
    totalDebit,
    totalCredit,
    solde: totalDebit - totalCredit,
  };
};

/**
 * Calculate Balance Generale
 * @param {Object} options - exerciceId, dateFrom, dateTo
 * @returns {Promise<Array>} Balance data per account
 */
const getBalance = async (options = {}) => {
  const matchFilter = { statut: 'validee', isActive: true };
  if (options.exercice) matchFilter.exercice = new (require('mongoose').Types.ObjectId)(options.exercice);
  if (options.dateFrom || options.dateTo) {
    matchFilter.dateEcriture = {};
    if (options.dateFrom) matchFilter.dateEcriture.$gte = new Date(options.dateFrom);
    if (options.dateTo) matchFilter.dateEcriture.$lte = new Date(options.dateTo);
  }

  const result = await EcritureComptable.aggregate([
    { $match: matchFilter },
    { $unwind: '$lignes' },
    {
      $group: {
        _id: '$lignes.compteNumero',
        compteLibelle: { $first: '$lignes.compteLibelle' },
        totalDebit: { $sum: '$lignes.debit' },
        totalCredit: { $sum: '$lignes.credit' },
        nombreMouvements: { $sum: 1 },
      },
    },
    {
      $addFields: {
        soldeDebiteur: {
          $cond: [
            { $gt: [{ $subtract: ['$totalDebit', '$totalCredit'] }, 0] },
            { $subtract: ['$totalDebit', '$totalCredit'] },
            0,
          ],
        },
        soldeCrediteur: {
          $cond: [
            { $gt: [{ $subtract: ['$totalCredit', '$totalDebit'] }, 0] },
            { $subtract: ['$totalCredit', '$totalDebit'] },
            0,
          ],
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Calculate totals
  const totaux = result.reduce(
    (acc, row) => ({
      totalDebit: acc.totalDebit + row.totalDebit,
      totalCredit: acc.totalCredit + row.totalCredit,
      totalSoldeDebiteur: acc.totalSoldeDebiteur + row.soldeDebiteur,
      totalSoldeCrediteur: acc.totalSoldeCrediteur + row.soldeCrediteur,
    }),
    { totalDebit: 0, totalCredit: 0, totalSoldeDebiteur: 0, totalSoldeCrediteur: 0 }
  );

  return { comptes: result, totaux };
};

/**
 * Calculate Compte de Resultat (Income Statement)
 * Classes 6 (Charges) and 7 (Produits)
 * @param {Object} options - exerciceId, dateFrom, dateTo
 * @returns {Promise<Object>} Income statement data
 */
const getCompteResultat = async (options = {}) => {
  const matchFilter = { statut: 'validee', isActive: true };
  if (options.exercice) matchFilter.exercice = new (require('mongoose').Types.ObjectId)(options.exercice);
  if (options.dateFrom || options.dateTo) {
    matchFilter.dateEcriture = {};
    if (options.dateFrom) matchFilter.dateEcriture.$gte = new Date(options.dateFrom);
    if (options.dateTo) matchFilter.dateEcriture.$lte = new Date(options.dateTo);
  }

  const result = await EcritureComptable.aggregate([
    { $match: matchFilter },
    { $unwind: '$lignes' },
    {
      $match: {
        $or: [
          { 'lignes.compteNumero': { $regex: /^6/ } }, // Charges
          { 'lignes.compteNumero': { $regex: /^7/ } }, // Produits
        ],
      },
    },
    {
      $group: {
        _id: '$lignes.compteNumero',
        compteLibelle: { $first: '$lignes.compteLibelle' },
        totalDebit: { $sum: '$lignes.debit' },
        totalCredit: { $sum: '$lignes.credit' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const charges = [];
  const produits = [];
  let totalCharges = 0;
  let totalProduits = 0;

  for (const row of result) {
    if (row._id.startsWith('6')) {
      const montant = row.totalDebit - row.totalCredit;
      charges.push({ ...row, montant });
      totalCharges += montant;
    } else if (row._id.startsWith('7')) {
      const montant = row.totalCredit - row.totalDebit;
      produits.push({ ...row, montant });
      totalProduits += montant;
    }
  }

  return {
    charges,
    produits,
    totalCharges,
    totalProduits,
    resultatNet: totalProduits - totalCharges,
  };
};

/**
 * Calculate Bilan (Balance Sheet)
 * Actif: Classes 2,3,4(debit),5(debit) | Passif: Classes 1,4(credit),5(credit)
 * @param {Object} options - exerciceId, dateFrom, dateTo
 * @returns {Promise<Object>} Balance sheet data
 */
const getBilan = async (options = {}) => {
  const matchFilter = { statut: 'validee', isActive: true };
  if (options.exercice) matchFilter.exercice = new (require('mongoose').Types.ObjectId)(options.exercice);
  if (options.dateFrom || options.dateTo) {
    matchFilter.dateEcriture = {};
    if (options.dateFrom) matchFilter.dateEcriture.$gte = new Date(options.dateFrom);
    if (options.dateTo) matchFilter.dateEcriture.$lte = new Date(options.dateTo);
  }

  const result = await EcritureComptable.aggregate([
    { $match: matchFilter },
    { $unwind: '$lignes' },
    {
      $match: {
        'lignes.compteNumero': { $regex: /^[1-5]/ },
      },
    },
    {
      $group: {
        _id: '$lignes.compteNumero',
        compteLibelle: { $first: '$lignes.compteLibelle' },
        totalDebit: { $sum: '$lignes.debit' },
        totalCredit: { $sum: '$lignes.credit' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const actif = { immobilisations: [], stocks: [], creances: [], tresorerie: [] };
  const passif = { capitaux: [], dettes: [], tresorerie: [] };
  let totalActif = 0;
  let totalPassif = 0;

  for (const row of result) {
    const solde = row.totalDebit - row.totalCredit;
    const entry = { ...row, solde: Math.abs(solde) };
    const classe = parseInt(row._id.charAt(0), 10);

    if (classe === 2) {
      // Actif immobilise
      actif.immobilisations.push(entry);
      totalActif += solde;
    } else if (classe === 3) {
      // Stocks
      actif.stocks.push(entry);
      totalActif += solde;
    } else if (classe === 1) {
      // Capitaux propres et ressources durables
      passif.capitaux.push(entry);
      totalPassif += -solde; // Credit balance
    } else if (classe === 4) {
      // Tiers: debit = creances (actif), credit = dettes (passif)
      if (solde > 0) {
        actif.creances.push(entry);
        totalActif += solde;
      } else {
        passif.dettes.push(entry);
        totalPassif += -solde;
      }
    } else if (classe === 5) {
      // Tresorerie: debit = actif, credit = passif
      if (solde > 0) {
        actif.tresorerie.push(entry);
        totalActif += solde;
      } else {
        passif.tresorerie.push(entry);
        totalPassif += -solde;
      }
    }
  }

  // Add result (profit/loss) to passif
  const compteResultat = await getCompteResultat(options);
  if (compteResultat.resultatNet !== 0) {
    passif.capitaux.push({
      _id: 'resultat',
      compteLibelle: "Resultat de l'exercice",
      solde: Math.abs(compteResultat.resultatNet),
    });
    totalPassif += compteResultat.resultatNet;
  }

  return {
    actif,
    passif,
    totalActif: Math.round(totalActif),
    totalPassif: Math.round(totalPassif),
    isEquilibre: Math.round(totalActif) === Math.round(totalPassif),
  };
};

/**
 * Calculate TVA declaration
 * TVA collectee (443100) vs TVA deductible (445xxx)
 * @param {Object} options - dateFrom, dateTo
 * @returns {Promise<Object>} TVA declaration data
 */
const getDeclarationTVA = async (options = {}) => {
  const matchFilter = { statut: 'validee', isActive: true };
  if (options.dateFrom || options.dateTo) {
    matchFilter.dateEcriture = {};
    if (options.dateFrom) matchFilter.dateEcriture.$gte = new Date(options.dateFrom);
    if (options.dateTo) matchFilter.dateEcriture.$lte = new Date(options.dateTo);
  }

  const result = await EcritureComptable.aggregate([
    { $match: matchFilter },
    { $unwind: '$lignes' },
    {
      $match: {
        'lignes.compteNumero': { $regex: /^44[35]/ },
      },
    },
    {
      $group: {
        _id: '$lignes.compteNumero',
        compteLibelle: { $first: '$lignes.compteLibelle' },
        totalDebit: { $sum: '$lignes.debit' },
        totalCredit: { $sum: '$lignes.credit' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  let tvaCollectee = 0;
  let tvaDeductible = 0;

  for (const row of result) {
    if (row._id.startsWith('443')) {
      tvaCollectee += row.totalCredit - row.totalDebit;
    } else if (row._id.startsWith('445')) {
      tvaDeductible += row.totalDebit - row.totalCredit;
    }
  }

  return {
    details: result,
    tvaCollectee,
    tvaDeductible,
    tvaADeclarer: tvaCollectee - tvaDeductible,
    creditTVA: tvaDeductible > tvaCollectee ? tvaDeductible - tvaCollectee : 0,
  };
};

/**
 * Export FEC (Fichier des Ecritures Comptables) - French standard accounting export
 * Format: JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcrtureLet|DateLet|ValidDate|Montantdevise|Idevise
 * @param {Object} options - exerciceId
 * @returns {Promise<Array>} FEC lines
 */
const exportFEC = async (options = {}) => {
  const filter = { statut: 'validee', isActive: true };
  if (options.exercice) filter.exercice = options.exercice;

  const ecritures = await EcritureComptable.find(filter)
    .sort('journal dateEcriture')
    .populate('exercice', 'code');

  const journalNames = {
    VE: 'Journal des Ventes',
    AC: 'Journal des Achats',
    BQ: 'Journal de Banque',
    CA: 'Journal de Caisse',
    OD: 'Operations Diverses',
  };

  const fecLines = [];

  for (const ecriture of ecritures) {
    for (const ligne of ecriture.lignes) {
      fecLines.push({
        JournalCode: ecriture.journal,
        JournalLib: journalNames[ecriture.journal] || ecriture.journal,
        EcritureNum: ecriture.numero,
        EcritureDate: formatFECDate(ecriture.dateEcriture),
        CompteNum: ligne.compteNumero,
        CompteLib: ligne.compteLibelle || ligne.libelle,
        CompAuxNum: '',
        CompAuxLib: '',
        PieceRef: ecriture.reference || '',
        PieceDate: formatFECDate(ecriture.dateEcriture),
        EcritureLib: ligne.libelle,
        Debit: formatFECAmount(ligne.debit),
        Credit: formatFECAmount(ligne.credit),
        EcrtureLet: ligne.lettrage || '',
        DateLet: ligne.dateLettrage ? formatFECDate(ligne.dateLettrage) : '',
        ValidDate: ecriture.validatedAt ? formatFECDate(ecriture.validatedAt) : '',
        Montantdevise: '',
        Idevise: 'XOF',
      });
    }
  }

  return fecLines;
};

/**
 * Format date for FEC export (YYYYMMDD)
 */
const formatFECDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Format amount for FEC export (comma as decimal separator)
 */
const formatFECAmount = (amount) => {
  if (!amount || amount === 0) return '0,00';
  return amount.toFixed(2).replace('.', ',');
};

module.exports = {
  getExerciceForDate,
  resolveCompte,
  generateEcritureFromFacture,
  generateEcritureFromPaymentClient,
  generateEcritureFromPaymentFournisseur,
  getPaymentAccounts,
  updateCompteBalances,
  reverseCompteBalances,
  contrepasser,
  lettrer,
  getGrandLivre,
  getBalance,
  getCompteResultat,
  getBilan,
  getDeclarationTVA,
  exportFEC,
};
