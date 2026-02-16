# Guide d'Installation - ERP Commercial & Comptable Senegal

## Prerequis

### Logiciels requis

| Logiciel | Version minimale | Verification |
|----------|------------------|--------------|
| Node.js | 20.x LTS | `node --version` |
| npm | 10.x | `npm --version` |
| MongoDB | 7.x | `mongod --version` |
| Git | 2.x | `git --version` |

### Optionnel (recommande pour la production)

| Logiciel | Version minimale | Verification |
|----------|------------------|--------------|
| Docker | 24.x | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |

## Installation en Developpement

### Etape 1 : Cloner le depot

```bash
git clone <url-du-repo>
cd erp-commercial-comptable-senegal
```

### Etape 2 : Configurer l'environnement

```bash
# Copier le template de variables d'environnement
cp .env.example .env

# Editer le fichier .env avec vos valeurs
# Notamment : MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET
```

### Etape 3 : Installer les dependances

```bash
# Installer les dependances racine + server + client
npm run install:all
```

### Etape 4 : Demarrer MongoDB

**Option A - MongoDB local :**
```bash
mongod --dbpath /chemin/vers/data/db
```

**Option B - Docker :**
```bash
docker run -d --name erp-mongo -p 27017:27017 mongo:7
```

### Etape 5 : Alimenter la base de donnees

```bash
npm run seed
```

Ce script cree :
- Roles et permissions par defaut
- Utilisateurs de demonstration (1 par role)
- Informations entreprise de demonstration

### Etape 6 : Demarrer l'application

```bash
# Backend + Frontend simultanement
npm run dev

# Ou separement :
npm run server   # Backend sur http://localhost:5000
npm run client   # Frontend sur http://localhost:3000
```

### Comptes de demonstration

| Role | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@erp-senegal.com | Admin@2026 |
| Comptable | comptable@erp-senegal.com | Comptable@2026 |
| Commercial | commercial@erp-senegal.com | Commercial@2026 |
| Vendeur | vendeur@erp-senegal.com | Vendeur@2026 |
| Manager | manager@erp-senegal.com | Manager@2026 |
| Caissier | caissier@erp-senegal.com | Caissier@2026 |

## Installation avec Docker Compose

### Etape 1 : Configurer l'environnement

```bash
cp .env.example .env
# Editer .env - utiliser la MONGO_URI Docker :
# MONGO_URI=mongodb://admin:admin123@mongodb:27017/erp_senegal?authSource=admin
```

### Etape 2 : Construire et demarrer

```bash
# Construire les images et demarrer les conteneurs
docker compose up -d --build

# Verifier l'etat des conteneurs
docker compose ps

# Voir les logs
docker compose logs -f backend
```

### Etape 3 : Alimenter la base

```bash
docker compose exec backend node src/seeds/index.js
```

L'application sera accessible sur `http://localhost` (via Nginx).

## Verification de l'installation

### Health check backend
```bash
curl http://localhost:5000/api/health
```

Reponse attendue :
```json
{
  "success": true,
  "message": "API ERP Senegal operationnelle"
}
```

### Connexion frontend

1. Ouvrir `http://localhost:3000` dans un navigateur
2. Se connecter avec un compte de demonstration
3. Verifier l'acces au dashboard

## Depannage

### MongoDB ne se connecte pas

- Verifier que MongoDB est demarre : `mongosh` ou `docker ps`
- Verifier la variable `MONGO_URI` dans `.env`
- En Docker, attendre que le healthcheck passe

### Erreur de dependances

```bash
# Nettoyer et reinstaller
rm -rf node_modules server/node_modules client/node_modules
npm run install:all
```

### Port deja utilise

```bash
# Trouver le processus qui utilise le port 5000
lsof -i :5000   # macOS/Linux
netstat -ano | findstr :5000   # Windows
```
