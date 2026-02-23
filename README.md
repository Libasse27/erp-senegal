# ERP Commercial & Comptable - Senegal

ERP web complet destine aux PME/TPE au Senegal et en Afrique de l'Ouest, couvrant la gestion commerciale, comptable, financiere et operationnelle.

## Fonctionnalites Principales

- **Gestion Commerciale** : Clients, Fournisseurs, Produits, Categories hierarchiques
- **Cycle de Vente** : Devis → Commandes → Bons de livraison → Factures (avec PDF)
- **Gestion des Stocks** : Multi-depots, Mouvements, Transferts, Inventaires, Alertes seuils, Valorisation CUMP
- **Comptabilite SYSCOHADA** : Plan comptable OHADA (130+ comptes), Ecritures automatiques, Grand Livre, Balance, Bilan, Compte de Resultat, Export FEC
- **Gestion Financiere** : Paiements multi-modes, Tresorerie, Echeanciers, Rapprochement bancaire
- **Mobile Money** : Integration Orange Money et Wave
- **Conformite DGI Senegal** : Facturation conforme, TVA 18%, NINEA, numeration sequentielle
- **Tableaux de bord** : KPIs commerciaux, financiers et stocks en temps reel
- **Notifications temps reel** : Alertes via Socket.io (factures, paiements, stocks, echeances)
- **RBAC** : 7 roles avec permissions granulaires (Admin, Manager, Comptable, Commercial, Vendeur, Caissier, Gestionnaire Stock)
- **PWA** : Application installable avec mode hors ligne
- **Cache Redis** : Optimisation des performances avec cache configurable
- **Audit Trail** : Tracabilite complete de toutes les operations

## Stack Technologique

| Backend | Frontend |
|---------|----------|
| Node.js 20+ LTS | React 18+ |
| Express.js 4.x | Redux Toolkit + RTK Query |
| MongoDB 7+ / Mongoose 8+ | React Router v6 |
| JWT + bcrypt | Bootstrap 5 + React-Bootstrap |
| Joi (validation) | Chart.js / Recharts |
| Socket.io (temps reel) | Formik + Yup |
| Redis (cache) | React-Toastify |
| Puppeteer (PDF) | date-fns |
| Winston (logging) | PWA (Service Worker) |

## Prerequis

- **Node.js** 20+ LTS
- **MongoDB** 7+ (local ou Docker)
- **npm** 10+
- **Docker** et **Docker Compose** (optionnel, recommande)
- **Redis** 7+ (optionnel, pour le cache)

## Installation Rapide

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd erp-commercial-comptable-senegal
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Editer .env avec vos valeurs (MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET)
```

### 3. Installer les dependances

```bash
npm run install:all
```

### 4. Alimenter la base de donnees

```bash
npm run seed
```

### 5. Demarrer en developpement

```bash
# Demarrer MongoDB, backend et frontend simultanement
npm run dev
```

Le backend sera accessible sur `http://localhost:5000/api`
Le frontend sera accessible sur `http://localhost:3000`

### Alternative : Docker Compose

```bash
# Demarrer tous les services (backend, frontend, MongoDB, Redis, Nginx)
docker compose up -d --build

# Alimenter la base
docker compose exec backend node src/seeds/index.js
```

L'application sera accessible sur `http://localhost` (via Nginx).

## Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Demarrer backend + frontend en mode developpement |
| `npm run server` | Demarrer uniquement le backend |
| `npm run client` | Demarrer uniquement le frontend |
| `npm run install:all` | Installer toutes les dependances (server + client) |
| `npm run seed` | Alimenter la base avec des donnees de demonstration |
| `npm run docker:up` | Demarrer les conteneurs Docker |
| `npm run docker:down` | Arreter les conteneurs Docker |
| `npm run docker:reset` | Reset complet (supprime les donnees) |
| `cd server && npm test` | Executer les tests backend |
| `cd client && npm test` | Executer les tests frontend |

## Comptes de Demonstration

| Role | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@erp-senegal.com | Admin@2026 |
| Manager | manager@erp-senegal.com | Manager@2026 |
| Comptable | comptable@erp-senegal.com | Comptable@2026 |
| Commercial | commercial@erp-senegal.com | Commercial@2026 |
| Vendeur | vendeur@erp-senegal.com | Vendeur@2026 |
| Caissier | caissier@erp-senegal.com | Caissier@2026 |
| Gest. Stock | stock@erp-senegal.com | Stock@2026 |

## Structure du Projet

```
erp-commercial-comptable-senegal/
├── server/                  # Backend API REST (Express.js)
│   ├── src/
│   │   ├── config/          # Configuration (DB, JWT, CORS, Logger, Redis)
│   │   ├── models/          # Schemas Mongoose (20+ modeles)
│   │   ├── controllers/     # Logique des endpoints
│   │   ├── routes/          # Definition des routes API (19 modules)
│   │   ├── middlewares/     # Auth, RBAC, Validation, Audit, Cache, Upload
│   │   ├── services/        # Logique metier (Comptabilite, Notifications)
│   │   ├── utils/           # Formatters, Helpers, Calculs
│   │   ├── validations/     # Schemas Joi par module
│   │   ├── seeds/           # Donnees de demonstration
│   │   └── templates/       # Templates PDF et emails
│   ├── tests/               # Tests Jest + Supertest
│   ├── uploads/             # Fichiers uploades
│   └── logs/                # Logs applicatifs (Winston)
│
├── client/                  # Frontend React SPA
│   ├── src/
│   │   ├── components/      # Composants reutilisables (UI, Forms, Tables)
│   │   ├── pages/           # Pages par module
│   │   ├── redux/           # Store, Slices, API (RTK Query)
│   │   ├── hooks/           # Hooks personnalises
│   │   ├── contexts/        # Contextes React (Auth, Socket, Notification)
│   │   ├── guards/          # Protection de routes (PrivateRoute, RoleGuard)
│   │   ├── config/          # Configuration application
│   │   ├── utils/           # Utilitaires frontend
│   │   └── services/        # Client API
│   └── public/
│       ├── manifest.json    # PWA manifest
│       ├── icons/           # Icones PWA
│       └── offline.html     # Page hors ligne
│
├── docs/                    # Documentation
│   ├── API.md               # Reference API complete (19 modules)
│   ├── INSTALLATION.md      # Guide d'installation + production
│   └── USER_MANUAL.md       # Manuel utilisateur en francais
│
├── nginx/                   # Configuration Nginx (reverse proxy)
├── docker-compose.yml       # Orchestration Docker (5 services)
└── .env.example             # Template variables d'environnement
```

## Documentation

| Document | Description |
|----------|-------------|
| [API.md](docs/API.md) | Reference complete de l'API REST (19 modules, 100+ endpoints) |
| [INSTALLATION.md](docs/INSTALLATION.md) | Guide d'installation (dev, Docker, production, SSL, sauvegardes) |
| [USER_MANUAL.md](docs/USER_MANUAL.md) | Manuel utilisateur complet en francais |

## Normes et Conformite

- **SYSCOHADA / OHADA** : Plan comptable conforme, ecritures automatiques
- **DGI Senegal** : Facturation conforme, mentions legales obligatoires
- **TVA** : 18% (taux normal) ou 0% (exonere)
- **Devise** : FCFA (XOF) - valeurs entieres uniquement
- **FEC** : Export Fichier des Ecritures Comptables conforme

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Nginx     │────▶│   Backend   │
│   React SPA │     │   Reverse   │     │   Express   │
│   (PWA)     │◀────│   Proxy     │◀────│   API REST  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                    ┌─────▼─────┐      ┌──────▼──────┐    ┌──────▼──────┐
                    │  MongoDB  │      │   Redis     │    │  Socket.io  │
                    │  (donnees)│      │   (cache)   │    │  (temps reel)│
                    └───────────┘      └─────────────┘    └─────────────┘
```

## Licence

Projet prive - Tous droits reserves.
