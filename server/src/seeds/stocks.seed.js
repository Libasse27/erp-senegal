/**
 * Generate warehouses and initial stock data
 */

const getWarehousesData = (adminId) => {
  return [
    {
      name: 'Depot Principal Dakar',
      description: 'Depot central pour la region de Dakar',
      type: 'principal',
      isDefault: true,
      address: { street: '25, Zone Industrielle Hann', city: 'Dakar', region: 'Dakar', country: 'Senegal' },
      phone: '+221 33 832 10 00',
      capacity: 5000,
      createdBy: adminId,
    },
    {
      name: 'Depot Secondaire Thies',
      description: 'Point de stockage regional pour Thies et environs',
      type: 'secondaire',
      address: { street: 'Route Nationale 2', city: 'Thies', region: 'Thies', country: 'Senegal' },
      phone: '+221 33 951 30 00',
      capacity: 2000,
      createdBy: adminId,
    },
    {
      name: 'Magasin Boutique Centre-Ville',
      description: 'Stock du point de vente principal',
      type: 'secondaire',
      address: { street: 'Avenue Lamine Gueye', city: 'Dakar', region: 'Dakar', country: 'Senegal' },
      phone: '+221 33 822 50 00',
      capacity: 500,
      createdBy: adminId,
    },
  ];
};

/**
 * Generate initial stock for all products in the main warehouse
 * @param {Array} products - Array of product documents
 * @param {Object} mainWarehouse - Main warehouse document
 * @param {string} adminId - Admin user ObjectId
 */
const getStocksData = (products, mainWarehouse, adminId) => {
  return products.map((product) => {
    // Randomize initial stock between stockAlerte and stockMaximum
    const minStock = product.stockAlerte || 10;
    const maxStock = product.stockMaximum || 200;
    const quantite = Math.floor(Math.random() * (maxStock - minStock)) + minStock;

    return {
      product: product._id,
      warehouse: mainWarehouse._id,
      quantite,
      cump: product.prixAchat,
      valeurStock: quantite * product.prixAchat,
      lastMovementDate: new Date(),
      createdBy: adminId,
    };
  });
};

module.exports = { getWarehousesData, getStocksData };
