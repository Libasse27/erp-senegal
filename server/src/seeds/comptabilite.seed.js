/**
 * Seed data for exercice comptable, bank accounts
 */

const getExerciceData = (adminUserId) => ({
  code: 'EX2026',
  libelle: 'Exercice comptable 2026',
  dateDebut: new Date('2026-01-01'),
  dateFin: new Date('2026-12-31'),
  statut: 'ouvert',
  isCurrent: true,
  createdBy: adminUserId,
});

const getBankAccountsData = (adminUserId) => [
  {
    nom: 'Compte Courant CBAO',
    banque: 'CBAO Groupe Attijariwafa Bank',
    numeroCompte: 'SN0080101234567890',
    iban: 'SN08SN0080101234567890123456',
    swift: 'CBAOSNDA',
    type: 'courant',
    devise: 'XOF',
    soldeInitial: 5000000,
    soldeActuel: 5000000,
    compteComptableNumero: '521000',
    agence: 'Agence Dakar Plateau',
    contactBanque: 'M. Diallo',
    telephoneBanque: '+221 33 849 00 00',
    isDefault: true,
    createdBy: adminUserId,
  },
  {
    nom: 'Compte Epargne BOA',
    banque: 'Bank Of Africa Senegal',
    numeroCompte: 'SN0120109876543210',
    iban: 'SN12SN0120109876543210987654',
    swift: 'AFRISNDA',
    type: 'epargne',
    devise: 'XOF',
    soldeInitial: 10000000,
    soldeActuel: 10000000,
    compteComptableNumero: '521200',
    agence: 'Agence Dakar Almadies',
    isDefault: false,
    createdBy: adminUserId,
  },
  {
    nom: 'Orange Money Pro',
    banque: 'Orange Money',
    numeroCompte: 'OM-PRO-221770001234',
    type: 'mobile_money',
    devise: 'XOF',
    soldeInitial: 500000,
    soldeActuel: 500000,
    compteComptableNumero: '521100',
    isDefault: false,
    createdBy: adminUserId,
  },
  {
    nom: 'Wave Business',
    banque: 'Wave',
    numeroCompte: 'WV-BIZ-221780005678',
    type: 'mobile_money',
    devise: 'XOF',
    soldeInitial: 300000,
    soldeActuel: 300000,
    compteComptableNumero: '521100',
    isDefault: false,
    createdBy: adminUserId,
  },
];

module.exports = {
  getExerciceData,
  getBankAccountsData,
};
