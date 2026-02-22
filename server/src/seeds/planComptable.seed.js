/**
 * Plan Comptable SYSCOHADA - Comptes principaux pour PME Senegal
 * Classes 1 a 8 selon la norme OHADA
 */
const getPlanComptableData = (adminUserId) => {
  const comptes = [
    // =============================================
    // CLASSE 1 — RESSOURCES DURABLES
    // =============================================
    { numero: '1', libelle: 'Ressources durables', classe: 1, type: 'credit', isImputable: false, isSystem: true },
    { numero: '10', libelle: 'Capital', classe: 1, type: 'credit', isImputable: false, isSystem: true },
    { numero: '101000', libelle: 'Capital social', classe: 1, type: 'credit', isSystem: true },
    { numero: '11', libelle: 'Reserves', classe: 1, type: 'credit', isImputable: false, isSystem: true },
    { numero: '111000', libelle: 'Reserve legale', classe: 1, type: 'credit', isSystem: true },
    { numero: '118000', libelle: 'Autres reserves', classe: 1, type: 'credit', isSystem: true },
    { numero: '12', libelle: 'Report a nouveau', classe: 1, type: 'credit', isImputable: false, isSystem: true },
    { numero: '121000', libelle: 'Report a nouveau crediteur', classe: 1, type: 'credit', isSystem: true },
    { numero: '129000', libelle: 'Report a nouveau debiteur', classe: 1, type: 'debit', isSystem: true },
    { numero: '13', libelle: 'Resultat net de l\'exercice', classe: 1, type: 'credit', isImputable: false, isSystem: true },
    { numero: '131000', libelle: 'Resultat net: benefice', classe: 1, type: 'credit', isSystem: true },
    { numero: '139000', libelle: 'Resultat net: perte', classe: 1, type: 'debit', isSystem: true },
    { numero: '16', libelle: 'Emprunts et dettes assimilees', classe: 1, type: 'credit', isImputable: false, isSystem: true },
    { numero: '162000', libelle: 'Emprunts aupres des etablissements de credit', classe: 1, type: 'credit', isSystem: true },

    // =============================================
    // CLASSE 2 — ACTIF IMMOBILISE
    // =============================================
    { numero: '2', libelle: 'Actif immobilise', classe: 2, type: 'debit', isImputable: false, isSystem: true },
    { numero: '21', libelle: 'Immobilisations incorporelles', classe: 2, type: 'debit', isImputable: false, isSystem: true },
    { numero: '213000', libelle: 'Logiciels', classe: 2, type: 'debit', isSystem: true },
    { numero: '22', libelle: 'Terrains', classe: 2, type: 'debit', isImputable: false, isSystem: true },
    { numero: '221000', libelle: 'Terrains', classe: 2, type: 'debit', isSystem: true },
    { numero: '23', libelle: 'Batiments, installations', classe: 2, type: 'debit', isImputable: false, isSystem: true },
    { numero: '231000', libelle: 'Batiments', classe: 2, type: 'debit', isSystem: true },
    { numero: '24', libelle: 'Materiel', classe: 2, type: 'debit', isImputable: false, isSystem: true },
    { numero: '241000', libelle: 'Materiel et outillage industriel', classe: 2, type: 'debit', isSystem: true },
    { numero: '244000', libelle: 'Materiel et mobilier de bureau', classe: 2, type: 'debit', isSystem: true },
    { numero: '245000', libelle: 'Materiel de transport', classe: 2, type: 'debit', isSystem: true },
    { numero: '246000', libelle: 'Materiel informatique', classe: 2, type: 'debit', isSystem: true },
    { numero: '28', libelle: 'Amortissements', classe: 2, type: 'credit', isImputable: false, isSystem: true },
    { numero: '281000', libelle: 'Amortissements immobilisations incorporelles', classe: 2, type: 'credit', isSystem: true },
    { numero: '284000', libelle: 'Amortissements materiel et mobilier', classe: 2, type: 'credit', isSystem: true },

    // =============================================
    // CLASSE 3 — STOCKS
    // =============================================
    { numero: '3', libelle: 'Stocks', classe: 3, type: 'debit', isImputable: false, isSystem: true },
    { numero: '31', libelle: 'Marchandises', classe: 3, type: 'debit', isImputable: false, isSystem: true },
    { numero: '311000', libelle: 'Marchandises A', classe: 3, type: 'debit', isSystem: true },
    { numero: '32', libelle: 'Matieres premieres', classe: 3, type: 'debit', isImputable: false, isSystem: true },
    { numero: '321000', libelle: 'Matieres premieres', classe: 3, type: 'debit', isSystem: true },
    { numero: '36', libelle: 'Produits finis', classe: 3, type: 'debit', isImputable: false, isSystem: true },
    { numero: '361000', libelle: 'Produits finis', classe: 3, type: 'debit', isSystem: true },
    { numero: '39', libelle: 'Depreciations des stocks', classe: 3, type: 'credit', isImputable: false, isSystem: true },
    { numero: '391000', libelle: 'Depreciations des marchandises', classe: 3, type: 'credit', isSystem: true },

    // =============================================
    // CLASSE 4 — TIERS
    // =============================================
    { numero: '4', libelle: 'Tiers', classe: 4, type: 'debit', isImputable: false, isSystem: true },
    { numero: '40', libelle: 'Fournisseurs et comptes rattaches', classe: 4, type: 'credit', isImputable: false, isSystem: true },
    { numero: '401000', libelle: 'Fournisseurs', classe: 4, type: 'credit', isSystem: true, isCollectif: true },
    { numero: '401100', libelle: 'Fournisseurs - Effets a payer', classe: 4, type: 'credit', isSystem: true },
    { numero: '408000', libelle: 'Fournisseurs - Factures non parvenues', classe: 4, type: 'credit', isSystem: true },
    { numero: '409000', libelle: 'Fournisseurs debiteurs', classe: 4, type: 'debit', isSystem: true },
    { numero: '41', libelle: 'Clients et comptes rattaches', classe: 4, type: 'debit', isImputable: false, isSystem: true },
    { numero: '411000', libelle: 'Clients', classe: 4, type: 'debit', isSystem: true, isCollectif: true },
    { numero: '411100', libelle: 'Clients - Effets a recevoir', classe: 4, type: 'debit', isSystem: true },
    { numero: '416000', libelle: 'Clients douteux ou litigieux', classe: 4, type: 'debit', isSystem: true },
    { numero: '418000', libelle: 'Clients - Produits non encore factures', classe: 4, type: 'debit', isSystem: true },
    { numero: '419000', libelle: 'Clients crediteurs', classe: 4, type: 'credit', isSystem: true },
    { numero: '42', libelle: 'Personnel', classe: 4, type: 'credit', isImputable: false, isSystem: true },
    { numero: '421000', libelle: 'Personnel - Remunerations dues', classe: 4, type: 'credit', isSystem: true },
    { numero: '422000', libelle: 'Personnel - Avances et acomptes', classe: 4, type: 'debit', isSystem: true },
    { numero: '43', libelle: 'Organismes sociaux', classe: 4, type: 'credit', isImputable: false, isSystem: true },
    { numero: '431000', libelle: 'Securite sociale', classe: 4, type: 'credit', isSystem: true },
    { numero: '432000', libelle: 'Caisse de retraite (IPRES)', classe: 4, type: 'credit', isSystem: true },
    { numero: '44', libelle: 'Etat et collectivites publiques', classe: 4, type: 'debit', isImputable: false, isSystem: true },
    { numero: '441000', libelle: 'Etat - Impot sur les benefices', classe: 4, type: 'credit', isSystem: true },
    { numero: '443000', libelle: 'Etat - TVA facturee', classe: 4, type: 'credit', isImputable: false, isSystem: true },
    { numero: '443100', libelle: 'TVA facturee sur ventes', classe: 4, type: 'credit', isSystem: true },
    { numero: '445000', libelle: 'Etat - TVA recuperable', classe: 4, type: 'debit', isImputable: false, isSystem: true },
    { numero: '445100', libelle: 'TVA recuperable sur immobilisations', classe: 4, type: 'debit', isSystem: true },
    { numero: '445200', libelle: 'TVA recuperable sur achats', classe: 4, type: 'debit', isSystem: true },
    { numero: '445300', libelle: 'TVA recuperable sur transports', classe: 4, type: 'debit', isSystem: true },
    { numero: '447000', libelle: 'Etat - Impots retenus a la source', classe: 4, type: 'credit', isSystem: true },
    { numero: '449000', libelle: 'Etat - Creances et dettes fiscales', classe: 4, type: 'debit', isSystem: true },
    { numero: '47', libelle: 'Debiteurs et crediteurs divers', classe: 4, type: 'debit', isImputable: false, isSystem: true },
    { numero: '471000', libelle: 'Debiteurs divers', classe: 4, type: 'debit', isSystem: true },
    { numero: '472000', libelle: 'Crediteurs divers', classe: 4, type: 'credit', isSystem: true },

    // =============================================
    // CLASSE 5 — TRESORERIE
    // =============================================
    { numero: '5', libelle: 'Tresorerie', classe: 5, type: 'debit', isImputable: false, isSystem: true },
    { numero: '52', libelle: 'Banques', classe: 5, type: 'debit', isImputable: false, isSystem: true },
    { numero: '521000', libelle: 'Banque locale', classe: 5, type: 'debit', isSystem: true },
    { numero: '521100', libelle: 'Banque Mobile Money', classe: 5, type: 'debit', isSystem: true },
    { numero: '521200', libelle: 'Banque compte 2', classe: 5, type: 'debit', isSystem: true },
    { numero: '53', libelle: 'Etablissements financiers', classe: 5, type: 'debit', isImputable: false, isSystem: true },
    { numero: '531000', libelle: 'Cheques a encaisser', classe: 5, type: 'debit', isSystem: true },
    { numero: '57', libelle: 'Caisse', classe: 5, type: 'debit', isImputable: false, isSystem: true },
    { numero: '571000', libelle: 'Caisse siege social', classe: 5, type: 'debit', isSystem: true },
    { numero: '571100', libelle: 'Caisse point de vente', classe: 5, type: 'debit', isSystem: true },
    { numero: '58', libelle: 'Virements internes', classe: 5, type: 'debit', isImputable: false, isSystem: true },
    { numero: '581000', libelle: 'Virements de fonds', classe: 5, type: 'debit', isSystem: true },
    { numero: '59', libelle: 'Depreciations tresorerie', classe: 5, type: 'credit', isImputable: false, isSystem: true },
    { numero: '591000', libelle: 'Depreciation titres de placement', classe: 5, type: 'credit', isSystem: true },

    // =============================================
    // CLASSE 6 — CHARGES
    // =============================================
    { numero: '6', libelle: 'Charges', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '60', libelle: 'Achats et variations de stocks', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '601000', libelle: 'Achats de marchandises', classe: 6, type: 'debit', isSystem: true },
    { numero: '602000', libelle: 'Achats de matieres premieres', classe: 6, type: 'debit', isSystem: true },
    { numero: '604000', libelle: 'Achats de matieres et fournitures consommables', classe: 6, type: 'debit', isSystem: true },
    { numero: '605000', libelle: 'Autres achats', classe: 6, type: 'debit', isSystem: true },
    { numero: '608000', libelle: 'Frais accessoires achats', classe: 6, type: 'debit', isSystem: true },
    { numero: '61', libelle: 'Transports', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '611000', libelle: 'Transports sur achats', classe: 6, type: 'debit', isSystem: true },
    { numero: '612000', libelle: 'Transports sur ventes', classe: 6, type: 'debit', isSystem: true },
    { numero: '613000', libelle: 'Transports pour le compte de tiers', classe: 6, type: 'debit', isSystem: true },
    { numero: '62', libelle: 'Services exterieurs', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '621000', libelle: 'Sous-traitance generale', classe: 6, type: 'debit', isSystem: true },
    { numero: '622000', libelle: 'Locations et charges locatives', classe: 6, type: 'debit', isSystem: true },
    { numero: '624000', libelle: 'Entretien et reparations', classe: 6, type: 'debit', isSystem: true },
    { numero: '625000', libelle: 'Primes d\'assurance', classe: 6, type: 'debit', isSystem: true },
    { numero: '626000', libelle: 'Etudes et recherches', classe: 6, type: 'debit', isSystem: true },
    { numero: '627000', libelle: 'Publicite, publications', classe: 6, type: 'debit', isSystem: true },
    { numero: '628000', libelle: 'Frais de telecommunication', classe: 6, type: 'debit', isSystem: true },
    { numero: '63', libelle: 'Autres services exterieurs', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '631000', libelle: 'Frais bancaires', classe: 6, type: 'debit', isSystem: true },
    { numero: '632000', libelle: 'Remunerations d\'intermediaires et honoraires', classe: 6, type: 'debit', isSystem: true },
    { numero: '633000', libelle: 'Frais de formation du personnel', classe: 6, type: 'debit', isSystem: true },
    { numero: '638000', libelle: 'Autres charges externes', classe: 6, type: 'debit', isSystem: true },
    { numero: '64', libelle: 'Impots et taxes', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '641000', libelle: 'Impots et taxes directs', classe: 6, type: 'debit', isSystem: true },
    { numero: '646000', libelle: 'Droits d\'enregistrement', classe: 6, type: 'debit', isSystem: true },
    { numero: '648000', libelle: 'Autres impots et taxes', classe: 6, type: 'debit', isSystem: true },
    { numero: '66', libelle: 'Charges de personnel', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '661000', libelle: 'Remunerations directes versees au personnel', classe: 6, type: 'debit', isSystem: true },
    { numero: '662000', libelle: 'Primes et gratifications', classe: 6, type: 'debit', isSystem: true },
    { numero: '664000', libelle: 'Charges sociales', classe: 6, type: 'debit', isSystem: true },
    { numero: '67', libelle: 'Frais financiers et charges assimilees', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '671000', libelle: 'Interets des emprunts', classe: 6, type: 'debit', isSystem: true },
    { numero: '674000', libelle: 'Escomptes accordes', classe: 6, type: 'debit', isSystem: true },
    { numero: '68', libelle: 'Dotations aux amortissements', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '681000', libelle: 'Dotations aux amortissements d\'exploitation', classe: 6, type: 'debit', isSystem: true },
    { numero: '69', libelle: 'Impots sur le resultat', classe: 6, type: 'debit', isImputable: false, isSystem: true },
    { numero: '691000', libelle: 'Impots sur les benefices de l\'exercice', classe: 6, type: 'debit', isSystem: true },

    // =============================================
    // CLASSE 7 — PRODUITS
    // =============================================
    { numero: '7', libelle: 'Produits', classe: 7, type: 'credit', isImputable: false, isSystem: true },
    { numero: '70', libelle: 'Ventes', classe: 7, type: 'credit', isImputable: false, isSystem: true },
    { numero: '701000', libelle: 'Ventes de marchandises', classe: 7, type: 'credit', isSystem: true },
    { numero: '702000', libelle: 'Ventes de produits finis', classe: 7, type: 'credit', isSystem: true },
    { numero: '704000', libelle: 'Prestations de services', classe: 7, type: 'credit', isSystem: true },
    { numero: '705000', libelle: 'Travaux factures', classe: 7, type: 'credit', isSystem: true },
    { numero: '706000', libelle: 'Autres produits vendus', classe: 7, type: 'credit', isSystem: true },
    { numero: '71', libelle: 'Subventions d\'exploitation', classe: 7, type: 'credit', isImputable: false, isSystem: true },
    { numero: '711000', libelle: 'Subventions d\'exploitation recues', classe: 7, type: 'credit', isSystem: true },
    { numero: '73', libelle: 'Variations de stocks de produits', classe: 7, type: 'credit', isImputable: false, isSystem: true },
    { numero: '736000', libelle: 'Variation de stocks de produits finis', classe: 7, type: 'credit', isSystem: true },
    { numero: '75', libelle: 'Autres produits', classe: 7, type: 'credit', isImputable: false, isSystem: true },
    { numero: '754000', libelle: 'Revenus de valeurs mobilieres', classe: 7, type: 'credit', isSystem: true },
    { numero: '758000', libelle: 'Produits divers', classe: 7, type: 'credit', isSystem: true },
    { numero: '77', libelle: 'Revenus financiers et produits assimiles', classe: 7, type: 'credit', isImputable: false, isSystem: true },
    { numero: '771000', libelle: 'Interets de prets', classe: 7, type: 'credit', isSystem: true },
    { numero: '773000', libelle: 'Escomptes obtenus', classe: 7, type: 'credit', isSystem: true },
    { numero: '78', libelle: 'Transferts de charges', classe: 7, type: 'credit', isImputable: false, isSystem: true },
    { numero: '781000', libelle: 'Transferts de charges d\'exploitation', classe: 7, type: 'credit', isSystem: true },

    // =============================================
    // CLASSE 8 — AUTRES CHARGES ET PRODUITS
    // =============================================
    { numero: '8', libelle: 'Comptes des autres charges et produits', classe: 8, type: 'debit', isImputable: false, isSystem: true },
    { numero: '81', libelle: 'Valeurs comptables cessions immobilisations', classe: 8, type: 'debit', isImputable: false, isSystem: true },
    { numero: '811000', libelle: 'Valeurs comptables cessions immob. incorporelles', classe: 8, type: 'debit', isSystem: true },
    { numero: '82', libelle: 'Produits de cessions immobilisations', classe: 8, type: 'credit', isImputable: false, isSystem: true },
    { numero: '821000', libelle: 'Produits de cessions immob. incorporelles', classe: 8, type: 'credit', isSystem: true },
    { numero: '83', libelle: 'Charges HAO', classe: 8, type: 'debit', isImputable: false, isSystem: true },
    { numero: '831000', libelle: 'Charges HAO', classe: 8, type: 'debit', isSystem: true },
    { numero: '84', libelle: 'Produits HAO', classe: 8, type: 'credit', isImputable: false, isSystem: true },
    { numero: '841000', libelle: 'Produits HAO', classe: 8, type: 'credit', isSystem: true },
    { numero: '85', libelle: 'Dotations HAO', classe: 8, type: 'debit', isImputable: false, isSystem: true },
    { numero: '851000', libelle: 'Dotations aux provisions HAO', classe: 8, type: 'debit', isSystem: true },
    { numero: '86', libelle: 'Reprises HAO', classe: 8, type: 'credit', isImputable: false, isSystem: true },
    { numero: '861000', libelle: 'Reprises de provisions HAO', classe: 8, type: 'credit', isSystem: true },
  ];

  return comptes.map((c) => ({
    ...c,
    isImputable: c.isImputable !== false,
    createdBy: adminUserId,
  }));
};

module.exports = getPlanComptableData;
