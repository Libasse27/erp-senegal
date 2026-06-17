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
      { name: 'Plans SaaS', description: 'Plans disponibles (public)' },
      { name: 'Abonnements SaaS', description: 'Paiements, usage, statut abonnement' },
      { name: 'Coupons SaaS', description: 'Codes de réduction et coupons promotionnels' },
      { name: 'MRR / ARR', description: 'Métriques de revenus récurrents (Super Admin)' },
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
      { name: 'Budget & Prévisions', description: 'Planification budgétaire, lignes budgétaires, comparaison budget vs réalisé' },
      { name: 'CRM — Opportunités', description: 'Pipeline commercial, opportunités de vente, conversion en devis' },
      { name: 'CRM — Activités', description: 'Activités commerciales (appels, réunions, emails) liées aux opportunités' },
      { name: 'RH — Employés', description: 'Gestion des employés, bulletins de paie, écritures SYSCOHADA payroll' },
      { name: 'RH — Congés', description: 'Demandes de congé, approbation, calcul jours ouvrables' },
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
        Plan: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f1b2c3d4e5f6a7b8c9d0e1' },
            code: { type: 'string', enum: ['STANDARD', 'PROFESSIONNEL', 'COMPLET'], example: 'PROFESSIONNEL' },
            nom: { type: 'string', example: 'Professionnel' },
            description: { type: 'string', example: 'Pour les PME en croissance — comptabilité SYSCOHADA incluse' },
            tarifs: {
              type: 'object',
              properties: {
                mensuel: { type: 'number', example: 35000, description: 'Montant mensuel en FCFA (XOF)' },
                annuel: { type: 'number', example: 350000, description: 'Montant annuel en FCFA (~17% économie)' },
                devise: { type: 'string', example: 'XOF' },
              },
            },
            modules: {
              type: 'array',
              items: { type: 'string', enum: ['GESCOM', 'FACTURATION', 'STOCK', 'VENTES', 'COMPTABILITE', 'REPORTING', 'MULTIDEVISE', 'PAIE', 'API'] },
              example: ['GESCOM', 'FACTURATION', 'STOCK', 'COMPTABILITE', 'REPORTING'],
            },
            limites: {
              type: 'object',
              properties: {
                maxUtilisateurs: { type: 'integer', example: 10, description: '-1 = illimité' },
                maxFacturesMois: { type: 'integer', example: 1000, description: '-1 = illimité' },
                maxStockageMo: { type: 'integer', example: 5120, description: 'Stockage en Mo (-1 = illimité)' },
              },
            },
            features: {
              type: 'object',
              description: 'Fonctionnalités booléennes additionnelles (ex: supportPrioritaire, multiDevise)',
              additionalProperties: { type: 'boolean' },
            },
            actif: { type: 'boolean', example: true },
            ordre: { type: 'integer', example: 2 },
            version: { type: 'integer', example: 1, description: 'Version du plan (incrémentée à chaque modification tarifaire)' },
          },
        },
        Coupon: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f1b2c3d4e5f6a7b8c9d0e1' },
            code: { type: 'string', example: 'PROMO2026', description: 'Code unique (majuscules)' },
            typeReduction: { type: 'string', enum: ['POURCENTAGE', 'MONTANT_FIXE'], example: 'POURCENTAGE' },
            valeur: { type: 'number', example: 20, description: '% ou montant FCFA selon typeReduction' },
            maxUtilisations: { type: 'integer', example: 100, description: '0 = illimité' },
            utilisationsActuelles: { type: 'integer', example: 12 },
            dateExpiration: { type: 'string', format: 'date-time', description: 'null = pas d\'expiration' },
            plansEligibles: {
              type: 'array',
              items: { type: 'string', enum: ['STANDARD', 'PROFESSIONNEL', 'COMPLET'] },
              description: 'Vide = applicable à tous les plans',
            },
            actif: { type: 'boolean', example: true },
          },
        },
        MrrStats: {
          type: 'object',
          description: 'Métriques MRR/ARR calculées en temps réel depuis les abonnements actifs',
          properties: {
            mrr: { type: 'number', example: 245000, description: 'Monthly Recurring Revenue en FCFA' },
            arr: { type: 'number', example: 2940000, description: 'Annual Recurring Revenue = MRR × 12' },
            mrrCroissance: { type: 'number', example: 8.5, description: '% d\'évolution vs mois précédent' },
            nouveauMrr: { type: 'number', example: 35000, description: 'MRR provenant des nouveaux abonnés ce mois' },
            mrrPerdu: { type: 'number', example: 10000, description: 'MRR perdu (expiration/résiliation ce mois)' },
            mrrNet: { type: 'number', example: 25000, description: 'nouveauMrr - mrrPerdu' },
            abonnesActifs: { type: 'integer', example: 7 },
            abonnesEssai: { type: 'integer', example: 3 },
            abonnesGrace: { type: 'integer', example: 1 },
            abonnesAttente: { type: 'integer', example: 0 },
            tauxChurn: { type: 'number', example: 4.1, description: '% mensuel d\'abonnements perdus' },
            parPlan: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'PROFESSIONNEL' },
                  nom: { type: 'string', example: 'Professionnel' },
                  mrr: { type: 'number', example: 140000 },
                  abonnes: { type: 'integer', example: 4 },
                },
              },
            },
            generatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MrrHistorique: {
          type: 'object',
          description: 'Revenus mensuels des 12 derniers mois (PaiementSaaS confirmés)',
          properties: {
            historique: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  annee: { type: 'integer', example: 2026 },
                  mois: { type: 'integer', example: 6, description: '1-12' },
                  label: { type: 'string', example: 'Juin 26' },
                  revenus: { type: 'number', example: 245000 },
                  nbPaiements: { type: 'integer', example: 7 },
                },
              },
            },
            totalAnnee: { type: 'number', example: 1960000, description: 'Cumul 12 mois en FCFA' },
            maxMois: { type: 'number', example: 280000, description: 'Meilleur mois (pour normaliser le graphique)' },
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
                statut: { type: 'string', enum: ['ESSAI', 'ACTIF', 'EN_PERIODE_GRACE', 'EXPIRE', 'SUSPENDU', 'ANNULE', 'EN_ATTENTE'] },
                dateFin: { type: 'string', format: 'date-time' },
                planId: { $ref: '#/components/schemas/Plan' },
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
