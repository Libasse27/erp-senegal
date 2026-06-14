# ERP GesCom-Compta Sénégal

ERP web **SaaS multi-tenant** complet destiné aux PME/TPE au Sénégal et en Afrique de l'Ouest.  
Couvre la gestion commerciale, comptable, financière et opérationnelle — conforme **SYSCOHADA**, **FCFA**, **TVA 18 %**, **DGI Sénégal**.

---

## Fonctionnalités

### Gestion Commerciale (module GESCOM)
- Clients & Fournisseurs avec historique et scoring
- Catalogue produits, catégories hiérarchiques, codes-barres
- Stocks multi-dépôts, mouvements, inventaires, valorisation CUMP, alertes seuils
- Cycle complet : Devis → Commandes → Bons de livraison → Factures (PDF via Puppeteer)
- Achats fournisseurs avec suivi réception

### Comptabilité SYSCOHADA
- Plan comptable OHADA (130+ comptes)
- Écritures automatiques sur chaque transaction commerciale
- Grand Livre, Balance des comptes, Bilan, Compte de Résultat
- Export FEC (Fichier des Écritures Comptables)
- Gestion des exercices comptables

### Finance
- Paiements multi-modes (espèces, chèque, virement, Wave, Orange Money)
- Trésorerie avec rapprochement bancaire
- Comptes bancaires multiples
- Tableau de bord KPIs temps réel (Socket.io)

### Architecture SaaS Multi-Tenant
- **3 forfaits** : Standard · Professionnel · Complet (tarifs FCFA)
- Inscription libre avec sélection du forfait
- Paiement d'activation Wave / Orange Money
- Guard d'abonnement par module (`subscriptionGuard`)
- Isolation complète des données par `companyId`
- Jobs automatiques : expiration abonnement + rappels de renouvellement

### Sécurité & Compliance
- RBAC à 8 rôles avec permissions granulaires
- JWT access (7 j) + refresh (30 j), bcrypt 12 rounds
- Audit trail complet (toutes les opérations)
- Rate-limiting, CORS whitelist, helmet, HPP, mongo-sanitize
- Chiffrement sensible, NINEA Sénégal, mentions légales DGI

---

## Stack Technologique

| Backend | Frontend | Infrastructure |
|---------|----------|----------------|
| Node.js 20+ | React 18+ | Docker + Docker Compose |
| Express.js 4 | Redux Toolkit + RTK Query | Nginx (reverse proxy) |
| MongoDB 7 / Mongoose 8 | React Router v6 | Railway (backend) |
| JWT + bcrypt 12 | Bootstrap 5 + React-Bootstrap | Vercel (frontend) |
| Joi (validation) | Chart.js / Recharts | GitHub Actions CI/CD |
| Socket.io (temps réel) | React Hook Form | Redis (cache) |
| Puppeteer (PDF) | React-Toastify | Winston (logs) |
| Swagger/OpenAPI 3 | PWA (Service Worker) | PM2 (process manager) |

---

## Prérequis

- **Node.js** 20+ LTS
- **MongoDB** 7+ (local ou Docker)
- **npm** 10+
- **Docker** + **Docker Compose** (recommandé pour la production)
- **Redis** 7+ (optionnel — cache)

---

## Installation rapide

### 1. Cloner le projet

```bash
git clone https://github.com/libasse27/erp-commercial-comptable-senegal.git
cd erp-commercial-comptable-senegal
```

### 2. Variables d'environnement

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

Variables minimales requises :

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/erp-gescom
JWT_SECRET=votre-secret-jwt-tres-long-ici
JWT_REFRESH_SECRET=votre-refresh-secret-jwt
CLIENT_URL=http://localhost:3000

# Mobile Money (simulation en dev)
WAVE_SECRET_KEY=wave_test_xxx
ORANGE_MONEY_API_KEY=om_test_xxx
PAYMENT_MODE=simulation
```

### 3. Installer les dépendances

```bash
npm run install:all
```

### 4. Initialiser la base de données

```bash
# Données de base (rôles, permissions, plan comptable SYSCOHADA...)
npm run seed

# Forfaits SaaS + compte Super Admin
cd server && npm run seed:saas

# Entreprise de démonstration (Ndakaru SARL, abonnement PROFESSIONNEL actif)
npm run seed:demo
```

### 5. Démarrer en développement

```bash
npm run dev
```

- Backend : `http://localhost:5000/api`
- Frontend : `http://localhost:3000`
- **Swagger UI** : `http://localhost:5000/api-docs`

---

## Docker (recommandé en production)

```bash
# Démarrer tous les services (backend, frontend, MongoDB, Redis, Nginx)
docker compose up -d --build

# Initialiser la base
docker compose exec backend npm run seed
docker compose exec backend npm run seed:saas

# Arrêter
docker compose down
```

Application accessible sur `http://localhost` via Nginx.

---

## Scripts disponibles

### Racine du projet

| Script | Description |
|--------|-------------|
| `npm run dev` | Backend + Frontend en mode développement |
| `npm run install:all` | Installer les dépendances server + client |
| `npm run seed` | Seed complet (rôles, permissions, plan comptable, données démo) |
| `npm run docker:up` | Démarrer les conteneurs Docker |
| `npm run docker:down` | Arrêter les conteneurs |

### Server (`cd server`)

| Script | Description |
|--------|-------------|
| `npm start` | Démarrer en production |
| `npm run dev` | Démarrer avec nodemon |
| `npm test` | Tous les tests (Jest + coverage) |
| `npm run test:saas` | Tests isolation multi-tenant SaaS |
| `npm run test:unit` | Tests unitaires services |
| `npm run seed:saas` | Seed forfaits + super admin |
| `npm run seed:demo` | Seed entreprise de démo |
| `npm run lint` | ESLint |

---

## Comptes de démonstration

### Super Admin (scope plateforme)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| superadmin@erp-senegal.com | SuperAdmin@2026! | Super Admin (scope PLATFORM) |

### Entreprise Ndakaru SARL (après `npm run seed:demo`)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@ndakaru.sn | Admin@Demo2026! | Admin entreprise |

### Comptes ERP classiques (après `npm run seed`)

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@erp-senegal.com | Admin@2026 |
| Manager | manager@erp-senegal.com | Manager@2026 |
| Comptable | comptable@erp-senegal.com | Comptable@2026 |
| Commercial | commercial@erp-senegal.com | Commercial@2026 |
| Vendeur | vendeur@erp-senegal.com | Vendeur@2026 |
| Caissier | caissier@erp-senegal.com | Caissier@2026 |
| Gest. Stock | stock@erp-senegal.com | Stock@2026 |

---

## Documentation API (Swagger)

La documentation Swagger/OpenAPI 3.0 est disponible à l'exécution :

```
http://localhost:5000/api-docs
```

JSON brut : `http://localhost:5000/api-docs.json`

> En production, activez avec `SWAGGER_ENABLED=true` dans les variables d'environnement.

Les routes documentées :
- `POST /auth/login` — Authentification JWT
- `POST /auth/register-saas` — Inscription SaaS (entreprise + admin + forfait)
- `GET /forfaits` — Liste des forfaits (public)
- `GET /paiements-saas/usage` — Métriques d'usage et abonnement actif
- `POST /paiements-saas/initier` — Initier un paiement Wave/Orange Money
- Et 100+ autres endpoints documentés par module

---

## Architecture

```
erp-commercial-comptable-senegal/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Tests + Build sur chaque push/PR
│       └── deploy.yml      # Deploy Railway (backend) + Vercel (frontend)
│
├── server/                 # Backend API REST (Node.js/Express)
│   ├── src/
│   │   ├── config/         # DB, JWT, CORS, Logger, Redis, Swagger
│   │   ├── models/         # Schemas Mongoose (25+ modèles)
│   │   ├── controllers/    # Logique des endpoints
│   │   ├── routes/         # Routes API (21 modules) avec annotations Swagger
│   │   ├── middlewares/    # Auth, RBAC, Validation, Audit, SubscriptionGuard
│   │   ├── services/       # Comptabilité, Notifications, Usage SaaS, PSP
│   │   ├── jobs/           # Crons : expiration abonnements, rappels
│   │   ├── validations/    # Schemas Joi par module
│   │   └── seeds/          # Données de base (rôles, plan comptable, forfaits)
│   ├── scripts/            # Scripts opérationnels (seed-saas, seed-demo, migration)
│   └── tests/
│       ├── saas/           # Tests isolation multi-tenant, paiements SaaS
│       └── services/       # Tests unitaires services
│
├── client/                 # Frontend React (SPA + PWA)
│   └── src/
│       ├── pages/
│       │   ├── auth/       # Login, Register, ResetPassword
│       │   ├── abonnement/ # AbonnementPage, PricingPage, PaiementSaasPage
│       │   ├── super-admin/# 8 pages Super Admin (PLATFORM scope)
│       │   └── ...         # 40+ pages métier
│       ├── redux/api/      # RTK Query (apiSlice, saasApi, et 15+ slices)
│       ├── contexts/       # AuthContext, SocketContext, NotificationContext
│       └── guards/         # PrivateRoute, SuperAdminGuard
│
├── docs/
│   ├── API.md              # Référence API complète (21 modules)
│   ├── ARCHITECTURE.md     # Architecture technique détaillée
│   ├── INSTALLATION.md     # Guide d'installation (dev, Docker, prod, SSL)
│   └── USER_MANUAL.md      # Manuel utilisateur complet en français
│
├── nginx/                  # Configuration Nginx (prod + dev)
├── docker-compose.yml      # Orchestration Docker (5 services)
├── docker-compose.dev.yml  # Docker dev (hot reload)
└── .env.example            # Template variables d'environnement
```

### Architecture SaaS multi-tenant

```
┌─────────────────────────────────────────────────┐
│                 PLATEFORME SAAS                  │
│  Super Admin (scope PLATFORM) — /super-admin     │
│  Gestion forfaits · entreprises · monitoring     │
└─────────────────────────────────────────────────┘
           │                    │
    ┌──────▼──────┐      ┌──────▼──────┐
    │ Entreprise A│      │ Entreprise B│
    │ PROFESSIONNEL│     │   STANDARD  │
    │ companyId:xxx│     │ companyId:yyy│
    └──────┬──────┘      └─────────────┘
           │
    ┌──────▼──────────────────────────────┐
    │  subscriptionGuard(moduleCode)      │
    │  → vérifie forfait.modulesInclus    │
    │  → 403 si module non inclus         │
    └──────┬──────────────────────────────┘
           │
    ┌──────▼──────────────────────────────┐
    │  Controllers — cloisonnés par        │
    │  companyId (injecté depuis JWT)     │
    └─────────────────────────────────────┘
```

---

## CI/CD (GitHub Actions)

### Workflow CI (`ci.yml`)
Déclenché sur chaque push et PR :
- Tests backend (Jest — suites SaaS + unitaires)
- Build frontend (React — vérifie l'absence d'erreurs de compilation)
- Lint ESLint

### Workflow CD (`deploy.yml`)
Déclenché sur merge vers `main` :
1. Gate CI obligatoire (les tests doivent passer)
2. Build React de production
3. Deploy backend → **Railway**
4. Deploy frontend → **Vercel**
5. Health-check automatique après déploiement

Secrets GitHub nécessaires :

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Token Railway CLI |
| `VERCEL_TOKEN` | Token Vercel |
| `VERCEL_ORG_ID` | ID organisation Vercel |
| `VERCEL_PROJECT_ID` | ID projet Vercel |
| `REACT_APP_API_URL` | URL backend en production |

---

## Tests

```bash
cd server

# Tous les tests (avec coverage)
npm test

# Tests SaaS (isolation multi-tenant, paiements)
npm run test:saas

# Tests unitaires (services comptabilité, usage)
npm run test:unit
```

Résultats actuels : **81 tests** passent (SaaS + services).

---

## Normes et Conformité

| Norme | Détail |
|-------|--------|
| **SYSCOHADA / OHADA** | Plan comptable conforme, écritures automatiques |
| **DGI Sénégal** | Facturation conforme, mentions légales obligatoires |
| **TVA** | 18 % (taux normal) ou 0 % (exonéré) |
| **Devise** | FCFA (XOF) — valeurs entières uniquement |
| **FEC** | Export Fichier des Écritures Comptables |
| **RGPD** | Audit trail, pseudonymisation, accès par rôle |

---

## Production (Railway + Vercel)

| Service | URL |
|---------|-----|
| Backend API | `https://erp-commercial-comptable-senegal-production.up.railway.app/api` |
| Frontend | `https://erp-gescom-senegal.vercel.app` |
| Swagger | `https://erp-commercial-comptable-senegal-production.up.railway.app/api-docs` (si `SWAGGER_ENABLED=true`) |

---

## Licence

Projet privé — Fin d'études GoMyCode Sénégal · 2026  
Tous droits réservés.
