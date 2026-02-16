# ERP Commercial & Comptable - Senegal

ERP web complet destine aux PME/TPE au Senegal et en Afrique de l'Ouest, couvrant la gestion commerciale, comptable, financiere et operationnelle.

## Fonctionnalites Principales

- **Gestion Commerciale** : Clients, Fournisseurs, Produits, Devis, Commandes, Factures, Bons de livraison
- **Gestion des Stocks** : Multi-depots, Mouvements, Inventaires, Alertes seuils, Valorisation CUMP
- **Comptabilite SYSCOHADA** : Plan comptable OHADA, Ecritures automatiques, Grand Livre, Balance, Bilan, Compte de Resultat
- **Gestion Financiere** : Paiements multi-modes, Tresorerie, Echeanciers, Rapprochement bancaire
- **Mobile Money** : Integration Orange Money et Wave
- **Conformite DGI Senegal** : Facturation conforme, TVA 18%, NINEA, numeration sequentielle
- **Tableaux de bord** : KPIs commerciaux, financiers et stocks en temps reel
- **RBAC** : Gestion des roles et permissions granulaires (Admin, Comptable, Commercial, Vendeur, Caissier, Stock)

## Stack Technologique

| Backend | Frontend |
|---------|----------|
| Node.js 20+ LTS | React 18+ |
| Express.js 4.x | Redux Toolkit + RTK Query |
| MongoDB 7+ / Mongoose 8+ | React Router v6 |
| JWT + bcrypt | Bootstrap 5 + React-Bootstrap |
| Joi (validation) | Chart.js / Recharts |
| Socket.io (temps reel) | Formik + Yup |
| Puppeteer / jsPDF (PDF) | React-Toastify |
| Winston (logging) | date-fns |

## Prerequis

- **Node.js** 20+ LTS
- **MongoDB** 7+ (local ou Docker)
- **npm** 10+
- **Docker** et **Docker Compose** (optionnel, recommande)

## Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd erp-commercial-comptable-senegal
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Editer .env avec vos valeurs
```

### 3. Installer les dependances

```bash
npm run install:all
```

### 4. Demarrer en developpement

```bash
# Demarrer MongoDB, backend et frontend simultanement
npm run dev
```

Le backend sera accessible sur `http://localhost:5000/api`
Le frontend sera accessible sur `http://localhost:3000`

### Alternative : Docker Compose

```bash
# Demarrer tous les services
npm run docker:up

# Arreter les services
npm run docker:down

# Reset complet (supprime les donnees)
npm run docker:reset
```

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

## Structure du Projet

```
erp-commercial-comptable-senegal/
├── server/                  # Backend API REST (Express.js)
│   ├── src/
│   │   ├── config/          # Configuration (DB, JWT, CORS, Logger, Constants)
│   │   ├── models/          # Schemas Mongoose (30+)
│   │   ├── controllers/     # Logique des endpoints
│   │   ├── routes/          # Definition des routes API
│   │   ├── middlewares/     # Auth, RBAC, Validation, Audit, Upload
│   │   ├── services/        # Logique metier (PDF, Email, Comptabilite)
│   │   ├── utils/           # Formatters, Helpers, Calculs
│   │   ├── validations/     # Schemas Joi par module
│   │   ├── seeds/           # Donnees initiales
│   │   └── templates/       # Templates PDF et emails
│   ├── uploads/             # Fichiers uploades
│   ├── logs/                # Logs applicatifs
│   └── backups/             # Sauvegardes MongoDB
│
├── client/                  # Frontend React SPA
│   ├── src/
│   │   ├── components/      # Composants reutilisables (UI, Forms, Tables...)
│   │   ├── pages/           # Pages par module
│   │   ├── redux/           # Store, Slices, API (RTK Query)
│   │   ├── hooks/           # Hooks personnalises
│   │   ├── contexts/        # Contextes React (Auth, Socket, Notification)
│   │   ├── guards/          # Protection de routes (PrivateRoute, RoleGuard)
│   │   ├── config/          # Configuration application
│   │   ├── utils/           # Utilitaires frontend
│   │   └── services/        # Client API
│   └── public/
│
├── docs/                    # Documentation technique
├── nginx/                   # Configuration Nginx (reverse proxy)
├── docker-compose.yml       # Orchestration Docker
└── .env.example             # Template variables d'environnement
```

## Normes et Conformite

- **SYSCOHADA / OHADA** : Plan comptable conforme, ecritures automatiques
- **DGI Senegal** : Facturation conforme, mentions legales obligatoires
- **TVA** : 18% (taux normal) ou 0% (exonere)
- **Devise** : FCFA (XOF) - valeurs entieres uniquement

## Licence

Projet prive - Tous droits reserves.
