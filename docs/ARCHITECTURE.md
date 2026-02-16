# Architecture Technique - ERP Commercial & Comptable Senegal

## Vue d'ensemble

L'application suit une architecture **MERN** (MongoDB, Express.js, React, Node.js) organisee en monorepo avec deux sous-projets :

- `server/` : API REST backend (Express.js + MongoDB)
- `client/` : SPA frontend (React + Redux Toolkit)

## Architecture Backend

### Pattern MVC + Services

```
Requete HTTP → Route → Middleware Pipeline → Controller → Service → Model → MongoDB
```

**Pipeline Middleware (ordre d'execution) :**
1. `helmet` - Headers de securite
2. `cors` - Cross-Origin Resource Sharing
3. `express.json` - Parsing du body JSON
4. `cookie-parser` - Parsing des cookies
5. `mongo-sanitize` - Protection injection NoSQL
6. `hpp` - Protection pollution parametres HTTP
7. `compression` - Compression gzip
8. `morgan` - Logging HTTP
9. `rate-limiter` - Limitation de requetes
10. Routes API
11. `errorHandler` - Gestion centralisee des erreurs

### Authentification

- **JWT** avec Access Token (15min) + Refresh Token (7 jours)
- Refresh Token stocke dans un cookie httpOnly secure
- Middleware `protect` pour les routes authentifiees
- Middleware `authorize` pour le controle d'acces par permission

### RBAC (Role-Based Access Control)

6 roles predefinissables avec permissions granulaires :
- `admin` : Acces total
- `manager` : Gestion complete sauf admin
- `comptable` : Comptabilite, paiements, rapports financiers
- `commercial` : Clients, devis, commandes, factures
- `vendeur` : Vente, clients, produits (lecture)
- `caissier` : Encaissements uniquement

### Audit

Toutes les operations CRUD sont tracees automatiquement via le middleware `audit`.

## Architecture Frontend

### State Management

- **Redux Toolkit** pour le state global (auth, UI)
- **RTK Query** pour le cache et la synchronisation API
- **React Context** pour le theme, notifications, Socket.io

### Routing

- **React Router v6** avec routes protegees
- `PrivateRoute` : Authentification requise
- `RoleGuard` : Verification du role utilisateur
- `PermissionGuard` : Verification de permissions granulaires

### Communication Temps Reel

- **Socket.io** pour les notifications et alertes en temps reel
- Rooms par utilisateur (`user:{userId}`) et par role (`role:{roleName}`)

## Base de Donnees

### MongoDB 7+ avec Mongoose 8+

- **30+ collections** couvrant tous les modules metier
- **Soft delete** systematique (champ `isActive`)
- **Audit fields** sur chaque document (createdBy, modifiedBy, timestamps)
- **Indexes composes** pour les requetes frequentes
- **Valorisation stock** : CUMP (Cout Unitaire Moyen Pondere)

### Conventions des Schemas

- Timestamps automatiques (`createdAt`, `updatedAt`)
- Virtuals actives sur JSON et Object
- Pre-find middleware excluant les documents soft-deleted
- References inter-modeles via ObjectId

## Deploiement

### Docker Compose

4 services :
- `mongodb` : Base de donnees avec healthcheck
- `backend` : API Node.js
- `frontend` : SPA React servie par Nginx
- `nginx` : Reverse proxy avec SSL, gzip, rate limiting

## Normes

- **SYSCOHADA/OHADA** : Plan comptable classes 1-8
- **DGI Senegal** : Facturation conforme, NINEA, TVA 18%
- **FCFA (XOF)** : Montants en entiers, sans decimales
