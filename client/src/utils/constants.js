// Document status labels and colors (Bootstrap variants)
export const DOCUMENT_STATUS = {
  brouillon: { label: 'Brouillon', variant: 'secondary' },
  valide: { label: 'Valide', variant: 'primary' },
  validee: { label: 'Validee', variant: 'primary' },
  envoye: { label: 'Envoye', variant: 'info' },
  envoyee: { label: 'Envoyee', variant: 'info' },
  paye: { label: 'Paye', variant: 'success' },
  payee: { label: 'Payee', variant: 'success' },
  partiel: { label: 'Partiel', variant: 'warning' },
  partiellement_payee: { label: 'Partiellement payee', variant: 'warning' },
  annule: { label: 'Annule', variant: 'danger' },
  annulee: { label: 'Annulee', variant: 'danger' },
  en_retard: { label: 'En retard', variant: 'danger' },
  accepte: { label: 'Accepte', variant: 'success' },
  refuse: { label: 'Refuse', variant: 'danger' },
  en_attente: { label: 'En attente', variant: 'warning' },
  livre: { label: 'Livre', variant: 'success' },
  en_cours: { label: 'En cours', variant: 'info' },
};

// Payment methods
export const PAYMENT_METHODS = {
  especes: { label: 'Especes', icon: 'cash' },
  cheque: { label: 'Cheque', icon: 'file-text' },
  virement: { label: 'Virement bancaire', icon: 'bank' },
  orange_money: { label: 'Orange Money', icon: 'phone' },
  wave: { label: 'Wave', icon: 'phone' },
  carte_bancaire: { label: 'Carte bancaire', icon: 'credit-card' },
};

// Roles
export const ROLES = {
  admin: 'Administrateur',
  manager: 'Directeur / Manager',
  comptable: 'Comptable',
  commercial: 'Commercial',
  vendeur: 'Vendeur',
  caissier: 'Caissier',
  gestionnaire_stock: 'Gestionnaire de Stock',
};

// TVA rates Senegal
export const TVA_RATES = [
  { value: 18, label: '18% (Taux normal)' },
  { value: 0, label: '0% (Exonere)' },
];

// Legal forms
export const LEGAL_FORMS = [
  { value: 'SARL', label: 'SARL' },
  { value: 'SA', label: 'SA' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SASU', label: 'SASU' },
  { value: 'SNC', label: 'SNC' },
  { value: 'EI', label: 'Entreprise Individuelle' },
  { value: 'GIE', label: 'GIE' },
  { value: 'Autre', label: 'Autre' },
];

// Quote status
export const QUOTE_STATUS = {
  brouillon: { label: 'Brouillon', variant: 'secondary' },
  envoye: { label: 'Envoye', variant: 'info' },
  accepte: { label: 'Accepte', variant: 'success' },
  refuse: { label: 'Refuse', variant: 'danger' },
  expire: { label: 'Expire', variant: 'dark' },
  converti: { label: 'Converti en commande', variant: 'primary' },
};

// Order status
export const ORDER_STATUS = {
  brouillon: { label: 'Brouillon', variant: 'secondary' },
  confirmee: { label: 'Confirmee', variant: 'primary' },
  en_cours: { label: 'En cours', variant: 'info' },
  partiellement_livree: { label: 'Partiellement livree', variant: 'warning' },
  livree: { label: 'Livree', variant: 'success' },
  annulee: { label: 'Annulee', variant: 'danger' },
};

// Stock movement types
export const STOCK_MOVEMENT_TYPES = {
  entree: { label: 'Entree', variant: 'success' },
  sortie: { label: 'Sortie', variant: 'danger' },
  transfert: { label: 'Transfert', variant: 'info' },
  ajustement: { label: 'Ajustement', variant: 'warning' },
  retour: { label: 'Retour', variant: 'secondary' },
};

// Client segments ABC
export const CLIENT_SEGMENTS = {
  A: { label: 'Segment A', variant: 'success', description: 'Clients VIP (Top 20% CA)' },
  B: { label: 'Segment B', variant: 'warning', description: 'Clients reguliers (30% suivants)' },
  C: { label: 'Segment C', variant: 'secondary', description: 'Clients occasionnels (50% restants)' },
};

// Accounting journals
export const ACCOUNTING_JOURNALS = {
  VE: { label: 'Journal des Ventes', code: 'VE' },
  AC: { label: 'Journal des Achats', code: 'AC' },
  BQ: { label: 'Journal de Banque', code: 'BQ' },
  CA: { label: 'Journal de Caisse', code: 'CA' },
  OD: { label: 'Operations Diverses', code: 'OD' },
};

// SYSCOHADA account classes
export const ACCOUNT_CLASSES = [
  { value: 1, label: 'Classe 1 - Ressources durables' },
  { value: 2, label: 'Classe 2 - Actif immobilise' },
  { value: 3, label: 'Classe 3 - Stocks' },
  { value: 4, label: 'Classe 4 - Tiers' },
  { value: 5, label: 'Classe 5 - Tresorerie' },
  { value: 6, label: 'Classe 6 - Charges' },
  { value: 7, label: 'Classe 7 - Produits' },
  { value: 8, label: 'Classe 8 - Autres charges et produits' },
];
