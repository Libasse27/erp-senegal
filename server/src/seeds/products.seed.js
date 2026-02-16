/**
 * Generate 5 categories + 100 products with realistic Senegalese data
 */

const getCategoriesData = (adminId) => {
  return [
    { name: 'Alimentation Generale', description: 'Produits alimentaires de base, conserves, boissons', order: 1, createdBy: adminId },
    { name: 'Hygiene et Entretien', description: 'Produits de nettoyage, hygiene corporelle, entretien maison', order: 2, createdBy: adminId },
    { name: 'Fournitures de Bureau', description: 'Papeterie, materiel de bureau, consommables informatiques', order: 3, createdBy: adminId },
    { name: 'Quincaillerie et BTP', description: 'Materiel de construction, outillage, electricite, plomberie', order: 4, createdBy: adminId },
    { name: 'Electronique et Informatique', description: 'Materiel informatique, telephonie, accessoires electroniques', order: 5, createdBy: adminId },
  ];
};

const getProductsData = (categoryMap, adminId) => {
  const alimentation = categoryMap.get('Alimentation Generale');
  const hygiene = categoryMap.get('Hygiene et Entretien');
  const bureau = categoryMap.get('Fournitures de Bureau');
  const btp = categoryMap.get('Quincaillerie et BTP');
  const electronique = categoryMap.get('Electronique et Informatique');

  return [
    // === ALIMENTATION (25 produits) ===
    { name: 'Riz brise parfume 25kg', category: alimentation, prixAchat: 9500, prixVente: 12500, prixVenteGros: 11000, unite: 'Sac', tauxTVA: 0, isExonere: true, stockMinimum: 20, stockAlerte: 50, marque: 'Uncle Ben\'s', createdBy: adminId },
    { name: 'Huile vegetale Niinal 20L', category: alimentation, prixAchat: 15000, prixVente: 19500, prixVenteGros: 17000, unite: 'Bidon', tauxTVA: 0, isExonere: true, stockMinimum: 10, stockAlerte: 25, marque: 'Niinal', createdBy: adminId },
    { name: 'Sucre en poudre 50kg', category: alimentation, prixAchat: 22000, prixVente: 28000, prixVenteGros: 25000, unite: 'Sac', tauxTVA: 0, isExonere: true, stockMinimum: 15, stockAlerte: 30, createdBy: adminId },
    { name: 'Lait en poudre Nido 2.5kg', category: alimentation, prixAchat: 8500, prixVente: 11000, unite: 'Boite', tauxTVA: 0, isExonere: true, stockMinimum: 20, stockAlerte: 40, marque: 'Nestle', createdBy: adminId },
    { name: 'Concentre de tomate 400g', category: alimentation, prixAchat: 350, prixVente: 500, prixVenteGros: 425, unite: 'Boite', tauxTVA: 0, isExonere: true, stockMinimum: 100, stockAlerte: 200, marque: 'Dieg Bou Diar', createdBy: adminId },
    { name: 'Cafe Touba 500g', category: alimentation, prixAchat: 1500, prixVente: 2500, unite: 'Paquet', tauxTVA: 18, stockMinimum: 30, stockAlerte: 60, createdBy: adminId },
    { name: 'The vert Gunpowder 500g', category: alimentation, prixAchat: 2000, prixVente: 3000, unite: 'Paquet', tauxTVA: 18, stockMinimum: 30, stockAlerte: 50, createdBy: adminId },
    { name: 'Bouillon Jumbo poulet x100', category: alimentation, prixAchat: 3500, prixVente: 5000, prixVenteGros: 4200, unite: 'Carton', tauxTVA: 0, isExonere: true, stockMinimum: 50, stockAlerte: 100, marque: 'Jumbo', createdBy: adminId },
    { name: 'Farine de ble 50kg', category: alimentation, prixAchat: 17000, prixVente: 22000, unite: 'Sac', tauxTVA: 0, isExonere: true, stockMinimum: 10, stockAlerte: 20, marque: 'GMD', createdBy: adminId },
    { name: 'Eau minerale Kirene 1.5L x6', category: alimentation, prixAchat: 1200, prixVente: 1800, unite: 'Pack', tauxTVA: 0, isExonere: true, stockMinimum: 50, stockAlerte: 100, marque: 'Kirene', createdBy: adminId },
    { name: 'Boisson gazeuse Flag 1L x12', category: alimentation, prixAchat: 4000, prixVente: 6000, unite: 'Casier', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, marque: 'SOBOA', createdBy: adminId },
    { name: 'Pates alimentaires 500g', category: alimentation, prixAchat: 250, prixVente: 400, unite: 'Paquet', tauxTVA: 0, isExonere: true, stockMinimum: 100, stockAlerte: 200, marque: 'Pasta Senegal', createdBy: adminId },
    { name: 'Sardine en boite 125g', category: alimentation, prixAchat: 300, prixVente: 500, unite: 'Boite', tauxTVA: 0, isExonere: true, stockMinimum: 100, stockAlerte: 200, createdBy: adminId },
    { name: 'Sel fin iode 1kg', category: alimentation, prixAchat: 150, prixVente: 250, unite: 'Paquet', tauxTVA: 0, isExonere: true, stockMinimum: 50, stockAlerte: 100, createdBy: adminId },
    { name: 'Biscuits Tiger 30g x50', category: alimentation, prixAchat: 5000, prixVente: 7500, unite: 'Carton', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, marque: 'Britannia', createdBy: adminId },
    { name: 'Margarine Excel 500g', category: alimentation, prixAchat: 800, prixVente: 1200, unite: 'Pot', tauxTVA: 0, isExonere: true, stockMinimum: 30, stockAlerte: 60, marque: 'Patisen', createdBy: adminId },
    { name: 'Mayonnaise Bama 500ml', category: alimentation, prixAchat: 700, prixVente: 1100, unite: 'Bouteille', tauxTVA: 18, stockMinimum: 25, stockAlerte: 50, marque: 'Bama', createdBy: adminId },
    { name: 'Oignon local 25kg', category: alimentation, prixAchat: 5000, prixVente: 7500, unite: 'Sac', tauxTVA: 0, isExonere: true, stockMinimum: 10, stockAlerte: 20, hasExpiry: true, defaultExpiryDays: 14, createdBy: adminId },
    { name: 'Pomme de terre 25kg', category: alimentation, prixAchat: 6000, prixVente: 8500, unite: 'Sac', tauxTVA: 0, isExonere: true, stockMinimum: 10, stockAlerte: 20, hasExpiry: true, defaultExpiryDays: 21, createdBy: adminId },
    { name: 'Lait caille Jaam 500ml x12', category: alimentation, prixAchat: 3000, prixVente: 4500, unite: 'Pack', tauxTVA: 0, isExonere: true, stockMinimum: 20, stockAlerte: 40, hasExpiry: true, defaultExpiryDays: 7, createdBy: adminId },
    { name: 'Chocolat en poudre Kaba 500g', category: alimentation, prixAchat: 2500, prixVente: 3800, unite: 'Boite', tauxTVA: 18, stockMinimum: 15, stockAlerte: 30, createdBy: adminId },
    { name: 'Vinaigre alimentaire 1L', category: alimentation, prixAchat: 400, prixVente: 700, unite: 'Bouteille', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, createdBy: adminId },
    { name: 'Poivre noir moulu 100g', category: alimentation, prixAchat: 500, prixVente: 800, unite: 'Sachet', tauxTVA: 18, stockMinimum: 30, stockAlerte: 60, createdBy: adminId },
    { name: 'Gomme arabique 1kg', category: alimentation, prixAchat: 3000, prixVente: 4500, unite: 'Paquet', tauxTVA: 0, isExonere: true, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Jus de fruit Pressea 1L x6', category: alimentation, prixAchat: 3500, prixVente: 5400, unite: 'Pack', tauxTVA: 18, stockMinimum: 15, stockAlerte: 30, marque: 'Kirene', createdBy: adminId },

    // === HYGIENE ET ENTRETIEN (20 produits) ===
    { name: 'Savon de Marseille 400g', category: hygiene, prixAchat: 300, prixVente: 500, unite: 'Piece', tauxTVA: 18, stockMinimum: 50, stockAlerte: 100, createdBy: adminId },
    { name: 'Eau de Javel 1L', category: hygiene, prixAchat: 350, prixVente: 600, unite: 'Bouteille', tauxTVA: 18, stockMinimum: 40, stockAlerte: 80, createdBy: adminId },
    { name: 'Detergent en poudre Omo 3kg', category: hygiene, prixAchat: 3500, prixVente: 5000, unite: 'Paquet', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, marque: 'Omo', createdBy: adminId },
    { name: 'Papier hygienique x12 rouleaux', category: hygiene, prixAchat: 2000, prixVente: 3200, unite: 'Pack', tauxTVA: 18, stockMinimum: 25, stockAlerte: 50, createdBy: adminId },
    { name: 'Dentifrice Signal 100ml', category: hygiene, prixAchat: 600, prixVente: 1000, unite: 'Tube', tauxTVA: 18, stockMinimum: 30, stockAlerte: 60, marque: 'Signal', createdBy: adminId },
    { name: 'Shampooing Head & Shoulders 400ml', category: hygiene, prixAchat: 2500, prixVente: 3800, unite: 'Bouteille', tauxTVA: 18, stockMinimum: 15, stockAlerte: 30, marque: 'P&G', createdBy: adminId },
    { name: 'Creme corporelle Nivea 400ml', category: hygiene, prixAchat: 2000, prixVente: 3200, unite: 'Pot', tauxTVA: 18, stockMinimum: 15, stockAlerte: 30, marque: 'Nivea', createdBy: adminId },
    { name: 'Desodorisant Brise 300ml', category: hygiene, prixAchat: 1200, prixVente: 2000, unite: 'Spray', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, createdBy: adminId },
    { name: 'Serpillere professionnelle', category: hygiene, prixAchat: 800, prixVente: 1500, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Seau + essoreur 15L', category: hygiene, prixAchat: 3000, prixVente: 5000, unite: 'Kit', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, createdBy: adminId },
    { name: 'Gants en latex x100', category: hygiene, prixAchat: 5000, prixVente: 7500, unite: 'Boite', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Savon liquide pour mains 500ml', category: hygiene, prixAchat: 1000, prixVente: 1800, unite: 'Bouteille', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, createdBy: adminId },
    { name: 'Insecticide Baygon 400ml', category: hygiene, prixAchat: 1500, prixVente: 2500, unite: 'Spray', tauxTVA: 18, stockMinimum: 15, stockAlerte: 30, marque: 'Baygon', createdBy: adminId },
    { name: 'Lessive liquide 3L', category: hygiene, prixAchat: 4000, prixVente: 6000, unite: 'Bidon', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Couches bebe Pampers T3 x60', category: hygiene, prixAchat: 8000, prixVente: 12000, unite: 'Paquet', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, marque: 'Pampers', createdBy: adminId },
    { name: 'Mouchoirs en papier x10 paquets', category: hygiene, prixAchat: 1500, prixVente: 2500, unite: 'Pack', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, createdBy: adminId },
    { name: 'Gel hydroalcoolique 500ml', category: hygiene, prixAchat: 1200, prixVente: 2000, unite: 'Bouteille', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, createdBy: adminId },
    { name: 'Deodorant Rexona 200ml', category: hygiene, prixAchat: 1800, prixVente: 2800, unite: 'Spray', tauxTVA: 18, stockMinimum: 15, stockAlerte: 30, marque: 'Rexona', createdBy: adminId },
    { name: 'Eponge a recurer x6', category: hygiene, prixAchat: 500, prixVente: 900, unite: 'Pack', tauxTVA: 18, stockMinimum: 25, stockAlerte: 50, createdBy: adminId },
    { name: 'Brosse WC avec support', category: hygiene, prixAchat: 1500, prixVente: 2500, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },

    // === FOURNITURES DE BUREAU (20 produits) ===
    { name: 'Ramette papier A4 80g x500', category: bureau, prixAchat: 2200, prixVente: 3500, prixVenteGros: 3000, unite: 'Ramette', tauxTVA: 18, stockMinimum: 50, stockAlerte: 100, createdBy: adminId },
    { name: 'Stylo BIC bleu x50', category: bureau, prixAchat: 5000, prixVente: 7500, unite: 'Boite', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, marque: 'BIC', createdBy: adminId },
    { name: 'Classeur A4 levier dos 8cm', category: bureau, prixAchat: 1000, prixVente: 1800, unite: 'Piece', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, createdBy: adminId },
    { name: 'Chemise cartonnee A4 x25', category: bureau, prixAchat: 2500, prixVente: 4000, unite: 'Paquet', tauxTVA: 18, stockMinimum: 15, stockAlerte: 30, createdBy: adminId },
    { name: 'Agrafeuse de bureau metal', category: bureau, prixAchat: 2000, prixVente: 3500, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Agrafes 24/6 x5000', category: bureau, prixAchat: 500, prixVente: 900, unite: 'Boite', tauxTVA: 18, stockMinimum: 30, stockAlerte: 60, createdBy: adminId },
    { name: 'Scotch transparent 19mm x33m', category: bureau, prixAchat: 300, prixVente: 600, unite: 'Rouleau', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, createdBy: adminId },
    { name: 'Calculatrice de bureau 12 chiffres', category: bureau, prixAchat: 4000, prixVente: 7000, unite: 'Piece', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, marque: 'Casio', createdBy: adminId },
    { name: 'Toner HP LaserJet 85A', category: bureau, prixAchat: 25000, prixVente: 38000, unite: 'Piece', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, marque: 'HP', createdBy: adminId },
    { name: 'Cartouche HP 302 Noire', category: bureau, prixAchat: 12000, prixVente: 18000, unite: 'Piece', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, marque: 'HP', createdBy: adminId },
    { name: 'Cahier grand format 200 pages', category: bureau, prixAchat: 500, prixVente: 900, unite: 'Piece', tauxTVA: 18, stockMinimum: 30, stockAlerte: 60, createdBy: adminId },
    { name: 'Marqueur permanent noir x12', category: bureau, prixAchat: 3000, prixVente: 4800, unite: 'Boite', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Post-it 76x76mm x12 blocs', category: bureau, prixAchat: 3500, prixVente: 5500, unite: 'Pack', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, marque: '3M', createdBy: adminId },
    { name: 'Enveloppe blanche C5 x500', category: bureau, prixAchat: 4000, prixVente: 6500, unite: 'Boite', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Correcteur liquide Tipp-Ex', category: bureau, prixAchat: 500, prixVente: 900, unite: 'Piece', tauxTVA: 18, stockMinimum: 15, stockAlerte: 30, marque: 'Tipp-Ex', createdBy: adminId },
    { name: 'Ciseaux de bureau 21cm', category: bureau, prixAchat: 800, prixVente: 1500, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Perforatrice 2 trous', category: bureau, prixAchat: 1500, prixVente: 2800, unite: 'Piece', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, createdBy: adminId },
    { name: 'Corbeille a courrier 3 etages', category: bureau, prixAchat: 3500, prixVente: 6000, unite: 'Piece', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, createdBy: adminId },
    { name: 'Tableau blanc 90x120cm', category: bureau, prixAchat: 15000, prixVente: 25000, unite: 'Piece', tauxTVA: 18, stockMinimum: 2, stockAlerte: 5, createdBy: adminId },
    { name: 'Reliure spirale plastique x100', category: bureau, prixAchat: 3000, prixVente: 5000, unite: 'Boite', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, createdBy: adminId },

    // === QUINCAILLERIE ET BTP (20 produits) ===
    { name: 'Ciment CEM II 42.5 50kg', category: btp, prixAchat: 4500, prixVente: 5800, prixVenteGros: 5200, unite: 'Sac', tauxTVA: 18, stockMinimum: 50, stockAlerte: 100, marque: 'SOCOCIM', createdBy: adminId },
    { name: 'Fer a beton 10mm barre 12m', category: btp, prixAchat: 3500, prixVente: 4800, unite: 'Barre', tauxTVA: 18, stockMinimum: 30, stockAlerte: 50, createdBy: adminId },
    { name: 'Peinture acrylique blanche 25L', category: btp, prixAchat: 18000, prixVente: 27000, unite: 'Seau', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, marque: 'Seigneurie', createdBy: adminId },
    { name: 'Cable electrique 2.5mm 100m', category: btp, prixAchat: 12000, prixVente: 18000, unite: 'Rouleau', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, createdBy: adminId },
    { name: 'Tube PVC 110mm 4m', category: btp, prixAchat: 4000, prixVente: 6500, unite: 'Tube', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Serrure de porte 3 points', category: btp, prixAchat: 15000, prixVente: 22000, unite: 'Piece', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, createdBy: adminId },
    { name: 'Robinet mitigeur cuisine', category: btp, prixAchat: 8000, prixVente: 14000, unite: 'Piece', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, createdBy: adminId },
    { name: 'Disjoncteur 20A', category: btp, prixAchat: 3500, prixVente: 5500, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, marque: 'Schneider', createdBy: adminId },
    { name: 'Marteau 500g manche bois', category: btp, prixAchat: 2000, prixVente: 3500, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Tournevis cruciforme PH2', category: btp, prixAchat: 800, prixVente: 1500, unite: 'Piece', tauxTVA: 18, stockMinimum: 15, stockAlerte: 30, createdBy: adminId },
    { name: 'Perceuse visseuse sans fil 18V', category: btp, prixAchat: 25000, prixVente: 40000, unite: 'Piece', tauxTVA: 18, stockMinimum: 3, stockAlerte: 5, marque: 'Bosch', createdBy: adminId },
    { name: 'Vis autoperceuse 4x40mm x500', category: btp, prixAchat: 3000, prixVente: 5000, unite: 'Boite', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Carreau sol 40x40cm', category: btp, prixAchat: 3500, prixVente: 5500, unite: 'M2', tauxTVA: 18, stockMinimum: 20, stockAlerte: 50, createdBy: adminId },
    { name: 'Colle carrelage 25kg', category: btp, prixAchat: 3000, prixVente: 4500, unite: 'Sac', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Niveau a bulle 60cm', category: btp, prixAchat: 2500, prixVente: 4000, unite: 'Piece', tauxTVA: 18, stockMinimum: 5, stockAlerte: 10, createdBy: adminId },
    { name: 'Metre ruban 5m', category: btp, prixAchat: 800, prixVente: 1500, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Brouette de chantier 80L', category: btp, prixAchat: 18000, prixVente: 28000, unite: 'Piece', tauxTVA: 18, stockMinimum: 3, stockAlerte: 5, createdBy: adminId },
    { name: 'Grillage simple torsion 25m', category: btp, prixAchat: 15000, prixVente: 22000, unite: 'Rouleau', tauxTVA: 18, stockMinimum: 3, stockAlerte: 5, createdBy: adminId },
    { name: 'Prise electrique double', category: btp, prixAchat: 1500, prixVente: 2500, unite: 'Piece', tauxTVA: 18, stockMinimum: 20, stockAlerte: 40, marque: 'Legrand', createdBy: adminId },
    { name: 'Ampoule LED E27 12W', category: btp, prixAchat: 800, prixVente: 1500, unite: 'Piece', tauxTVA: 18, stockMinimum: 30, stockAlerte: 60, createdBy: adminId },

    // === ELECTRONIQUE ET INFORMATIQUE (15 produits) ===
    { name: 'Ordinateur portable HP 15 i5 8Go', category: electronique, prixAchat: 350000, prixVente: 450000, unite: 'Piece', tauxTVA: 18, stockMinimum: 2, stockAlerte: 5, marque: 'HP', createdBy: adminId },
    { name: 'Imprimante HP LaserJet Pro', category: electronique, prixAchat: 120000, prixVente: 175000, unite: 'Piece', tauxTVA: 18, stockMinimum: 2, stockAlerte: 3, marque: 'HP', createdBy: adminId },
    { name: 'Ecran moniteur 24 pouces LED', category: electronique, prixAchat: 85000, prixVente: 125000, unite: 'Piece', tauxTVA: 18, stockMinimum: 2, stockAlerte: 5, marque: 'Samsung', createdBy: adminId },
    { name: 'Cle USB 32Go', category: electronique, prixAchat: 3000, prixVente: 5000, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, marque: 'SanDisk', createdBy: adminId },
    { name: 'Disque dur externe 1To', category: electronique, prixAchat: 30000, prixVente: 45000, unite: 'Piece', tauxTVA: 18, stockMinimum: 3, stockAlerte: 5, marque: 'Seagate', createdBy: adminId },
    { name: 'Routeur WiFi TP-Link', category: electronique, prixAchat: 15000, prixVente: 25000, unite: 'Piece', tauxTVA: 18, stockMinimum: 3, stockAlerte: 5, marque: 'TP-Link', createdBy: adminId },
    { name: 'Onduleur UPS 650VA', category: electronique, prixAchat: 35000, prixVente: 52000, unite: 'Piece', tauxTVA: 18, stockMinimum: 3, stockAlerte: 5, marque: 'APC', createdBy: adminId },
    { name: 'Souris sans fil', category: electronique, prixAchat: 3000, prixVente: 5500, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, marque: 'Logitech', createdBy: adminId },
    { name: 'Clavier USB', category: electronique, prixAchat: 3500, prixVente: 6000, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, marque: 'Logitech', createdBy: adminId },
    { name: 'Cable HDMI 3m', category: electronique, prixAchat: 1500, prixVente: 3000, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Multiprise parafoudre 6 prises', category: electronique, prixAchat: 3000, prixVente: 5000, unite: 'Piece', tauxTVA: 18, stockMinimum: 10, stockAlerte: 20, createdBy: adminId },
    { name: 'Webcam HD 1080p', category: electronique, prixAchat: 12000, prixVente: 20000, unite: 'Piece', tauxTVA: 18, stockMinimum: 3, stockAlerte: 5, marque: 'Logitech', createdBy: adminId },
    { name: 'Cable reseau RJ45 Cat6 305m', category: electronique, prixAchat: 45000, prixVente: 65000, unite: 'Boite', tauxTVA: 18, stockMinimum: 2, stockAlerte: 3, createdBy: adminId },
    { name: 'Telephone IP Yealink', category: electronique, prixAchat: 35000, prixVente: 55000, unite: 'Piece', tauxTVA: 18, stockMinimum: 2, stockAlerte: 3, marque: 'Yealink', createdBy: adminId },
    { name: 'Switch reseau 8 ports Gigabit', category: electronique, prixAchat: 18000, prixVente: 28000, unite: 'Piece', tauxTVA: 18, stockMinimum: 3, stockAlerte: 5, marque: 'TP-Link', createdBy: adminId },
  ];
};

module.exports = { getCategoriesData, getProductsData };
