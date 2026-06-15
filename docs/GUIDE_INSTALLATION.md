# Guide d'Installation — ERP GesCom-Compta Sénégal

## Table des matières

1. [Prérequis](#prérequis)
2. [Installation en développement](#installation-en-développement)
3. [Variables d'environnement](#variables-denvironnement)
4. [Initialisation des données](#initialisation-des-données)
5. [Installation avec Docker](#installation-avec-docker)
6. [Déploiement en production](#déploiement-en-production)
7. [Résolution des problèmes courants](#résolution-des-problèmes-courants)

---

## Prérequis

| Logiciel         | Version minimum | Vérification              |
|------------------|-----------------|---------------------------|
| Node.js          | 18.x            | `node --version`          |
| npm              | 9.x             | `npm --version`           |
| MongoDB          | 6.x             | `mongod --version`        |
| Git              | 2.x             | `git --version`           |
| Docker (optionnel)| 24.x           | `docker --version`        |

---

## Installation en développement

### Étape 1 — Cloner le projet

```bash
git clone https://github.com/libasse27/erp-commercial-comptable-senegal.git
cd erp-commercial-comptable-senegal
```

### Étape 2 — Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer `.env` avec un éditeur de texte et remplir au minimum :

```env
# Base de données
MONGO_URI=mongodb://localhost:27017/erp_gescom

# Sécurité JWT
JWT_SECRET=changez-ce-secret-en-production-minimum-32-caracteres
JWT_REFRESH_SECRET=autre-secret-pour-refresh-token-minimum-32-car

# URLs
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Étape 3 — Installer et démarrer le backend

```bash
cd server
npm install
npm run dev
```

Le serveur démarre sur **http://localhost:5000**  
Documentation API : **http://localhost:5000/api-docs**

### Étape 4 — Installer et démarrer le frontend

Ouvrir un nouveau terminal :

```bash
cd client
npm install
npm start
```

L'application s'ouvre sur **http://localhost:3000**

---

## Variables d'environnement

Fichier `.env` à la racine du projet (copié depuis `.env.example`) :

### Obligatoires

| Variable               | Description                              | Exemple                                          |
|------------------------|------------------------------------------|--------------------------------------------------|
| `MONGO_URI`            | URI de connexion MongoDB                 | `mongodb://localhost:27017/erp_gescom`           |
| `JWT_SECRET`           | Clé secrète token d'accès (≥32 chars)    | `super-secret-jwt-key-minimum-32-characters`     |
| `JWT_REFRESH_SECRET`   | Clé secrète refresh token (≥32 chars)    | `super-secret-refresh-key-minimum-32-chars`      |
| `PORT`                 | Port du serveur Express                  | `5000`                                           |
| `NODE_ENV`             | Environnement                            | `development` ou `production`                    |
| `CLIENT_URL`           | URL du frontend (whitelist CORS)         | `http://localhost:3000`                          |

### Optionnelles

| Variable               | Description                              | Défaut                   |
|------------------------|------------------------------------------|--------------------------|
| `REDIS_URL`            | URI Redis (cache)                        | —                        |
| `SMTP_HOST`            | Serveur SMTP (emails)                    | —                        |
| `SMTP_PORT`            | Port SMTP                                | `587`                    |
| `SMTP_USER`            | Identifiant SMTP                         | —                        |
| `SMTP_PASS`            | Mot de passe SMTP                        | —                        |
| `EMAIL_FROM`           | Adresse expéditeur                       | `noreply@erp-senegal.sn` |
| `SWAGGER_ENABLED`      | Activer Swagger en production            | `false`                  |
| `WAVE_API_KEY`         | Clé API Wave (paiements Mobile Money)    | —                        |
| `ORANGE_MONEY_API_KEY` | Clé API Orange Money                     | —                        |
| `APP_NAME`             | Nom de l'application                     | `ERP Senegal`            |

---

## Initialisation des données

### Plan comptable, rôles et permissions (obligatoire)

```bash
cd server
npm run seed
```

Ce script crée :
- Le plan comptable SYSCOHADA complet (classes 1 à 8)
- Les rôles par défaut (admin, manager, comptable, commercial, vendeur, caissier, gestionnaire_stock)
- Les permissions associées

### Données de démonstration (optionnel)

```bash
npm run seed:demo
```

Ce script crée une entreprise de démonstration avec :
- 1 compte admin (`admin@demo.sn` / `Admin1234!`)
- Clients, fournisseurs, produits
- Factures, paiements, stocks
- Écritures comptables

---

## Installation avec Docker

### Démarrage complet (recommandé)

```bash
cp .env.example .env
# Éditer .env

docker-compose up -d
```

Services démarrés :
- **Frontend** → http://localhost:3000
- **Backend** → http://localhost:5000
- **MongoDB** → localhost:27017
- **Redis** → localhost:6379

### Commandes Docker utiles

```bash
# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Arrêter
docker-compose down

# Arrêter et supprimer les volumes (données perdues)
docker-compose down -v

# Rebuild après modification du code
docker-compose up -d --build
```

---

## Déploiement en production

### Backend — Railway

1. Créer un compte sur [railway.app](https://railway.app)
2. Créer un nouveau projet → "Deploy from GitHub repo"
3. Sélectionner le dépôt → Root directory : `server`
4. Définir les variables d'environnement dans Dashboard → Variables :

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/erp_gescom
JWT_SECRET=<votre-secret-32-chars>
JWT_REFRESH_SECRET=<votre-refresh-secret>
CLIENT_URL=https://votre-app.vercel.app
NODE_ENV=production
PORT=5000
```

5. Le déploiement se fait automatiquement sur chaque push `main`.

### Frontend — Vercel

1. Créer un compte sur [vercel.com](https://vercel.com)
2. "New Project" → Importer le dépôt GitHub
3. Framework preset : **Create React App**
4. Root directory : `client`
5. Environment variables :

```
REACT_APP_API_URL=https://votre-backend.railway.app/api
```

6. Deploy → votre app est disponible sur `https://votre-app.vercel.app`

### Base de données — MongoDB Atlas

1. Créer un cluster sur [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Network Access → Ajouter `0.0.0.0/0` (ou l'IP Railway)
3. Database Access → Créer un utilisateur avec rôle `readWriteAnyDatabase`
4. Connect → "Connect your application" → copier l'URI dans `MONGO_URI`

---

## Résolution des problèmes courants

### Erreur `MongoServerError: Authentication failed`

Vérifier que `MONGO_URI` contient le bon utilisateur/mot de passe Atlas, et que l'IP est whitelistée dans Network Access.

### Erreur `CORS policy`

Vérifier que `CLIENT_URL` dans les variables du backend correspond exactement à l'URL du frontend (sans slash final).

### Port 5000 déjà utilisé

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### `npm install` échoue sur Windows (Puppeteer)

```bash
# Installer les dépendances Chromium manuellement
cd server
npx puppeteer browsers install chrome
```

### Swagger UI inaccessible en production

Définir la variable `SWAGGER_ENABLED=true` dans les variables d'environnement du backend.
