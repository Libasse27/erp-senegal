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
| Redis | 7.x | `redis-cli --version` |

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

**Variables critiques a modifier :**

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | URI de connexion MongoDB |
| `JWT_SECRET` | Secret pour les tokens d'acces (min 32 caracteres) |
| `JWT_REFRESH_SECRET` | Secret pour les refresh tokens (min 32 caracteres) |
| `CLIENT_URL` | URL du frontend (http://localhost:3000 par defaut) |

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

### Etape 5 : Demarrer Redis (optionnel)

```bash
# Docker (recommande)
docker run -d --name erp-redis -p 6379:6379 redis:7-alpine

# Puis decommenter dans .env :
# REDIS_URL=redis://localhost:6379
```

Redis active le cache des requetes frequentes (plan comptable, parametres, categories).

### Etape 6 : Alimenter la base de donnees

```bash
npm run seed
```

Ce script cree :
- Roles et permissions par defaut (7 roles, 80+ permissions)
- Utilisateurs de demonstration (1 par role)
- Informations entreprise de demonstration
- 50 clients, 15 fournisseurs
- Categories et produits (30+)
- 3 depots avec stocks initiaux
- Plan comptable SYSCOHADA (130+ comptes)
- Exercice comptable 2026
- Comptes bancaires de demonstration
- Donnees transactionnelles (devis, commandes, factures, paiements, ecritures)

### Etape 7 : Demarrer l'application

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
| Manager | manager@erp-senegal.com | Manager@2026 |
| Comptable | comptable@erp-senegal.com | Comptable@2026 |
| Commercial | commercial@erp-senegal.com | Commercial@2026 |
| Vendeur | vendeur@erp-senegal.com | Vendeur@2026 |
| Caissier | caissier@erp-senegal.com | Caissier@2026 |
| Gest. Stock | stock@erp-senegal.com | Stock@2026 |

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

### Services Docker

| Service | Port | Description |
|---------|------|-------------|
| frontend (Nginx) | 80 | Application React + reverse proxy |
| backend | 5000 | API Express.js |
| mongodb | 27017 | Base de donnees |
| redis | 6379 | Cache (optionnel) |

## Deploiement en Production

### Prerequis

- Serveur Linux (Ubuntu 22.04+ recommande) avec minimum 2 Go RAM
- Docker et Docker Compose installes
- Nom de domaine avec certificat SSL
- Acces SSH au serveur

### Etape 1 : Preparer le serveur

```bash
# Mettre a jour le systeme
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo apt install docker-compose-plugin -y
```

### Etape 2 : Configurer les variables de production

```bash
cp .env.example .env
```

**Modifications obligatoires pour la production :**

```env
NODE_ENV=production
PORT=5000

# MongoDB avec mot de passe fort
MONGO_URI=mongodb://admin:<mot_de_passe_fort>@mongodb:27017/erp_senegal?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<mot_de_passe_fort>

# JWT secrets uniques (generer avec: openssl rand -hex 64)
JWT_SECRET=<secret_64_chars_unique>
JWT_REFRESH_SECRET=<autre_secret_64_chars_unique>

# URL du client
CLIENT_URL=https://votre-domaine.com

# SMTP production
SMTP_HOST=smtp.votre-provider.com
SMTP_PORT=587
SMTP_USER=<votre_user>
SMTP_PASS=<votre_pass>

# Redis
REDIS_URL=redis://redis:6379
```

### Etape 3 : Configurer SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot -y

# Obtenir le certificat
sudo certbot certonly --standalone -d votre-domaine.com

# Les certificats seront dans :
# /etc/letsencrypt/live/votre-domaine.com/fullchain.pem
# /etc/letsencrypt/live/votre-domaine.com/privkey.pem
```

Mettez a jour `nginx/nginx.conf` pour activer HTTPS :

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # ... reste de la config
}

server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}
```

Montez les certificats dans `docker-compose.yml` :
```yaml
frontend:
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

### Etape 4 : Demarrer en production

```bash
docker compose up -d --build

# Alimenter la base (premiere fois uniquement)
docker compose exec backend node src/seeds/index.js

# Verifier
docker compose ps
docker compose logs -f
```

### Etape 5 : Renouvellement automatique SSL

```bash
# Ajouter un cron pour le renouvellement automatique
sudo crontab -e

# Ajouter la ligne :
0 3 1 * * certbot renew --quiet && docker compose restart frontend
```

## Sauvegardes

### Sauvegarde automatique MongoDB

Le fichier `docker-compose.yml` inclut une configuration de backup automatique. Pour une sauvegarde manuelle :

```bash
# Sauvegarde
docker compose exec mongodb mongodump \
  --username admin \
  --password <votre_mot_de_passe> \
  --authenticationDatabase admin \
  --db erp_senegal \
  --out /backup/$(date +%Y%m%d_%H%M%S)

# Restauration
docker compose exec mongodb mongorestore \
  --username admin \
  --password <votre_mot_de_passe> \
  --authenticationDatabase admin \
  --db erp_senegal \
  /backup/<dossier_de_sauvegarde>/erp_senegal
```

### Script de sauvegarde automatique

Creez `/opt/erp-backup.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/erp"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Dump MongoDB
docker compose -f /chemin/vers/docker-compose.yml exec -T mongodb \
  mongodump --username admin --password <pwd> \
  --authenticationDatabase admin --db erp_senegal \
  --archive > "$BACKUP_DIR/erp_$DATE.archive"

# Supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "erp_*.archive" -mtime +$RETENTION_DAYS -delete

echo "Sauvegarde terminee : erp_$DATE.archive"
```

```bash
# Rendre executable
chmod +x /opt/erp-backup.sh

# Ajouter au cron (tous les jours a 2h du matin)
echo "0 2 * * * /opt/erp-backup.sh >> /var/log/erp-backup.log 2>&1" | sudo crontab -
```

## Monitoring

### Logs applicatifs

```bash
# Logs backend en temps reel
docker compose logs -f backend

# Logs Nginx
docker compose logs -f frontend

# Logs MongoDB
docker compose logs -f mongodb
```

Les logs du backend sont egalement ecrits dans `server/logs/` avec rotation automatique (Winston).

### Health Check

```bash
# Verifier l'API
curl https://votre-domaine.com/api/health

# Verifier MongoDB
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Verifier Redis
docker compose exec redis redis-cli ping
```

### Metriques de base

Surveillez :
- **CPU/RAM** : `docker stats`
- **Espace disque** : `df -h` (surtout les volumes Docker)
- **Connexions MongoDB** : `docker compose exec mongodb mongosh --eval "db.serverStatus().connections"`
- **Redis** : `docker compose exec redis redis-cli info stats`

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

1. Ouvrir `http://localhost:3000` (dev) ou `https://votre-domaine.com` (prod)
2. Se connecter avec un compte de demonstration
3. Verifier l'acces au dashboard

## Depannage

### MongoDB ne se connecte pas

- Verifier que MongoDB est demarre : `mongosh` ou `docker ps`
- Verifier la variable `MONGO_URI` dans `.env`
- En Docker, attendre que le healthcheck passe : `docker compose ps`

### Redis ne se connecte pas

- Verifier que Redis est demarre : `docker ps` ou `redis-cli ping`
- Verifier `REDIS_URL` dans `.env`
- L'application fonctionne sans Redis (pas de cache, mais pas d'erreur)

### Erreur de dependances

```bash
# Nettoyer et reinstaller
rm -rf node_modules server/node_modules client/node_modules
npm run install:all
```

### Port deja utilise

```bash
# Linux/macOS
lsof -i :5000
lsof -i :3000

# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```

### Erreur de permissions Docker

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Base de donnees corrompue

```bash
# Reinitialiser completement la base
docker compose exec backend node src/seeds/index.js
```

Attention : cette commande **supprime toutes les donnees** et recharge les donnees de demonstration.
