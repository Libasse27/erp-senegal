/**
 * Donnees de l'entreprise demo
 */
const getCompanyData = () => {
  return {
    name: 'SENEGAL DISTRIBUTION SARL',
    legalForm: 'SARL',
    ninea: '005234567 2G3',
    rccm: 'SN-DKR-2020-B-12345',
    address: {
      street: '25, Avenue Cheikh Anta Diop',
      city: 'Dakar',
      region: 'Dakar',
      postalCode: 'BP 12345',
      country: 'Senegal',
    },
    phone: '+221 33 820 00 00',
    fax: '+221 33 820 00 01',
    email: 'contact@senegal-distribution.sn',
    website: 'www.senegal-distribution.sn',
    bankInfo: {
      bankName: 'CBAO Groupe Attijariwafa Bank',
      accountNumber: '01234567890123',
      iban: 'SN08 SN 0001 0123 4567 8901 23',
      swift: 'CBAOSNDA',
    },
    fiscalInfo: {
      tvaRate: 18,
      isSubjectToTVA: true,
      fiscalRegime: 'reel_normal',
    },
    currency: 'XOF',
  };
};

module.exports = getCompanyData;
