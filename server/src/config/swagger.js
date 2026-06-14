const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ERP GesCom-Compta Sénégal — API REST',
      version: '1.0.0',
      description: [
        'API REST multi-tenant pour ERP commercial & comptable destiné aux PME/TPE au Sénégal.',
        '',
        '**Contexte** : SYSCOHADA · FCFA (XOF) · TVA 18% · DGI Sénégal',
        '',
        '**Authentification** : JWT Bearer — obtenez un token via `POST /auth/login` puis cliquez sur "Authorize" ci-dessus.',
        '',
        '**Isolation multi-tenant** : Chaque requête est cloisonnée par `companyId` (déduit du token JWT).',
        '**Contrôle d\'accès** : RBAC à 7 rôles + guard d\'abonnement (SaaS) par module.',
      ].join('\n'),
      contact: {
        name: 'Support ERP Sénégal',
        email: 'support@erp-senegal.sn',
      },
      license: { name: 'Propriétaire — Tous droits réservés' },
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Développement local' },
      {
        url: 'https://erp-commercial-comptable-senegal-production.up.railway.app/api',
        description: 'Production (Railway)',
      },
    ],
    tags: [
      { name: 'Authentification', description: 'Connexion, inscription SaaS, tokens' },
      { name: 'Forfaits SaaS', description: 'Forfaits disponibles (public)' },
      { name: 'Abonnements SaaS', description: 'Paiements, usage, statut abonnement' },
      { name: 'Clients', description: 'Gestion du portefeuille client' },
      { name: 'Fournisseurs', description: 'Gestion des fournisseurs' },
      { name: 'Produits', description: 'Catalogue produits' },
      { name: 'Stocks', description: 'Mouvements et inventaire multi-dépôt' },
      { name: 'Devis', description: 'Création et suivi des devis' },
      { name: 'Commandes', description: 'Commandes clients' },
      { name: 'Factures', description: 'Facturation, avoirs, PDF' },
      { name: 'Paiements', description: 'Encaissements, trésorerie, comptes bancaires' },
      { name: 'Comptabilité', description: 'Plan comptable SYSCOHADA, écritures, états financiers' },
      { name: 'Dashboard', description: 'KPIs temps réel' },
      { name: 'Administration', description: 'Utilisateurs, entreprise, paramètres' },
      { name: 'Super Admin', description: 'Gestion plateforme SaaS (scope PLATFORM uniquement)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT (7 jours) obtenu via POST /auth/login',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {},
            message: { type: 'string', example: 'Opération réussie' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Ressource non trouvée' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 150 },
                totalPages: { type: 'integer', example: 8 },
              },
            },
          },
        },
        Forfait: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f1b2c3d4e5f6a7b8c9d0e1' },
            code: { type: 'string', enum: ['STANDARD', 'PROFESSIONNEL', 'COMPLET'], example: 'PROFESSIONNEL' },
            nom: { type: 'string', example: 'Professionnel' },
            description: { type: 'string', example: 'Pour les PME en croissance — comptabilité SYSCOHADA incluse' },
            prixMensuel: { type: 'number', example: 35000, description: 'Montant en FCFA (XOF)' },
            prixAnnuel: { type: 'number', example: 350000, description: 'Montant annuel en FCFA (-17% vs mensuel)' },
            modulesInclus: {
              type: 'array',
              items: { type: 'string', enum: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING', 'PAIE', 'API'] },
              example: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING'],
            },
            limites: {
              type: 'object',
              properties: {
                maxUtilisateurs: { type: 'integer', example: 10, description: '-1 = illimité' },
                maxFacturesMois: { type: 'integer', example: 1000, description: '-1 = illimité' },
                stockageMo: { type: 'integer', example: 5120 },
                supportPrioritaire: { type: 'boolean', example: false },
              },
            },
            actif: { type: 'boolean', example: true },
            ordre: { type: 'integer', example: 2 },
          },
        },
        PaiementSaas: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            companyId: { type: 'string' },
            abonnementId: { type: 'string' },
            montant: { type: 'number', example: 35000 },
            methode: { type: 'string', enum: ['WAVE', 'ORANGE_MONEY'] },
            statut: { type: 'string', enum: ['EN_ATTENTE', 'REUSSI', 'ECHOUE', 'ANNULE'] },
            reference: { type: 'string', example: 'PAY-20260614-ABC123' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UsageSaas: {
          type: 'object',
          properties: {
            facturesDuMois: { type: 'integer', example: 23 },
            utilisateursActifs: { type: 'integer', example: 4 },
            companyStatus: { type: 'string', enum: ['active', 'trial', 'suspended', 'cancelled'] },
            subscriptionEndDate: { type: 'string', format: 'date-time' },
            abonnement: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                statut: { type: 'string', enum: ['ACTIF', 'EXPIRE', 'SUSPENDU', 'EN_ATTENTE'] },
                dateFin: { type: 'string', format: 'date-time' },
                forfaitId: { $ref: '#/components/schemas/Forfait' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.routes.js'],
};

module.exports = swaggerJsdoc(options);
