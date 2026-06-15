# Architecture Technique — ERP GesCom-Compta Sénégal

## Vue d'ensemble

ERP GesCom-Compta est une application **SaaS multi-tenant** construite sur la stack MERN (MongoDB, Express, React, Node.js). Elle cible les PME/TPE au Sénégal et en Afrique de l'Ouest — conformité SYSCOHADA, FCFA, TVA 18 %, DGI Sénégal.

---

## Diagramme d'architecture global

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  Navigateur web (React SPA + PWA) · Mobile (responsive)         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────────┐
│                    VERCEL (CDN + Edge)                           │
│  Build React → fichiers statiques servis depuis le CDN          │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼──────────────────────────────────────────┐
│                   RAILWAY (Backend)                              │
│  Node.js / Express · PM2 · port 5000                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Middlewares globaux                                      │   │
│  │  helmet · cors · rate-limit · morgan · mongo-sanitize    │   │
│  │  hpp · express-validator · compression                   │   │
│  └────────────────────────────┬──────────────────────────── ┘   │
│  ┌────────────────────────────▼───────────────────────────────┐ │
│  │  Routes API (/api/*)                                        │ │
│  │  auth · clients · factures · stocks · comptabilite         │ │
│  │  paiements · employes · conges · crm/* · budgets · ...     │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│  ┌──────────────┐  ┌──────────▼──────────┐  ┌───────────────┐  │
│  │ Auth MW      │  │  Controllers        │  │  Services     │  │
│  │ protect (JWT)│  │  CRUD + métier      │  │  Comptabilité │  │
│  │ tenantMW     │  │  asyncHandler wrap  │  │  Notifications│  │
│  │ rbac (RBAC)  │  │  Response uniforme  │  │  Usage SaaS   │  │
│  │ subscription │  │  { success, data,   │  │  PDF (Puppet) │  │
│  │  Guard       │  │    message }        │  │  PSP Wave/OM  │  │
│  └──────────────┘  └─────────────────────┘  └───────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼──────┐             ┌────────▼───────┐
│  MongoDB Atlas│             │  Redis (cache) │
│  Multi-tenant │             │  Sessions      │
│  Index strat. │             │  Rate-limit    │
└───────────────┘             └────────────────┘
```

---

## Pattern Multi-Tenant

### Isolation par companyId

Chaque document MongoDB contient un champ `companyId` (ObjectId). L'isolation est garantie par :

1. **JWT** — Le token contient `{ userId, companyId, role }` signé avec `JWT_SECRET`.
2. **tenantMiddleware** — À chaque requête, extrait `companyId` du token et l'attache à `req.companyId`.
3. **tenantHelper** — `tc(req)` retourne `req.companyId`. Chaque controller filtre systématiquement par `companyId`.
4. **Indexes composites** — Tous les index MongoDB incluent `companyId` en premier champ.

```js
// tenantHelper.js
const tc = (req) => req.companyId;

// Exemple dans un controller
const factures = await Facture.find({ companyId: tc(req), statut: 'en_attente' });
```

### Scope Super Admin

Le Super Admin possède un token avec `companyId: null` et `scope: 'PLATFORM'`. Le middleware `superAdminGuard` vérifie ce scope avant d'accéder aux routes `/super-admin/*`. Il n'a jamais accès aux routes tenant.

---

## RBAC (Role-Based Access Control)

### Architecture

```
User → Role → [Permission]
```

### Rôles disponibles

| Rôle | Description |
|------|-------------|
| `super_admin` | Scope PLATFORM — gère la plateforme SaaS |
| `admin` | Scope entreprise — accès complet |
| `manager` | Supervision commerciale et financière |
| `comptable` | Comptabilité SYSCOHADA + finance |
| `commercial` | Ventes, CRM, clients |
| `vendeur` | Devis, commandes, stocks |
| `caissier` | Paiements, trésorerie |
| `gestionnaire_stock` | Stocks, inventaires, transferts |

### Middleware RBAC

```js
// rbac.js
exports.authorize = (...permissions) => (req, res, next) => {
  const userPerms = req.user.role.permissions.map(p => p.code);
  const hasAll = permissions.every(p => userPerms.includes(p));
  if (!hasAll) return res.status(403).json({ success: false, message: 'Accès refusé' });
  next();
};
```

### Guard d'abonnement

`subscriptionGuard(moduleCode)` vérifie que l'entreprise a un abonnement actif et que le module est inclus dans son forfait.

```js
router.get('/', subscriptionGuard('COMPTABILITE'), authorize('ecritures:read'), getEcritures);
```

---

## Modules et structure backend

### Structure des fichiers

```
server/src/
├── config/
│   ├── db.js           # Connexion MongoDB avec retry
│   ├── jwt.js          # generateAccessToken, generateRefreshToken
│   ├── redis.js        # Client Redis (cache)
│   ├── swagger.js      # Config swagger-jsdoc (OpenAPI 3.0.3)
│   └── constants.js    # MODULES, ROLES, TVA_TAUX, etc.
├── models/             # 42 modèles Mongoose
├── controllers/        # 1 fichier par domaine métier
├── routes/             # 1 fichier par domaine, annotations Swagger
├── middlewares/
│   ├── auth.js         # protect (verify JWT)
│   ├── tenant.js       # injecte req.companyId
│   ├── rbac.js         # authorize()
│   ├── subscriptionGuard.js
│   ├── errorHandler.js # asyncHandler + centralErrorHandler
│   └── audit.js        # logAudit (AuditLog model)
├── services/
│   ├── comptabiliteService.js  # génération automatique écritures SYSCOHADA
│   ├── notificationService.js  # création notifications temps réel
│   ├── usageService.js         # comptage usage SaaS
│   └── pspService.js           # Wave / Orange Money
├── jobs/
│   ├── subscriptionExpiry.js   # cron quotidien — expire les abonnements
│   └── renewalReminders.js     # cron hebdo — rappels de renouvellement
├── utils/
│   ├── tenantHelper.js
│   ├── formatters.js
│   └── logger.js       # Winston (fichiers + console)
└── seeds/
    ├── planComptable.js        # 130+ comptes OHADA
    ├── roles.js                # rôles et permissions par défaut
    └── forfaits.js             # forfaits SaaS (Standard/Pro/Complet)
```

### Principaux modèles (42 modèles Mongoose)

| Domaine | Modèles |
|---------|---------|
| Auth/Users | User, Company, AuditLog |
| SaaS | Forfait, Abonnement, PaiementSaas |
| Commercial | Client, Fournisseur, Product, Category |
| Stocks | Stock, StockMovement, Warehouse, Inventaire |
| Ventes | Devis, Commande, BonLivraison, Facture, FactureRecurrente, Avoir |
| Achats | CommandeAchat, FactureFournisseur |
| Finance | Payment, BankAccount, Rapprochement |
| Comptabilité | CompteComptable, ExerciceComptable, EcritureComptable |
| Budget | Budget |
| CRM | Opportunite, Activite |
| RH | Employe, Conge |
| Système | Notification, Permission, Role, Settings |

---

## Architecture Frontend (React SPA)

### Structure client/src

```
client/src/
├── components/
│   ├── common/         # Button, Badge, Spinner, EmptyState, ErrorBoundary
│   └── layout/         # Sidebar, Header, PageTitle, NotificationBell
├── contexts/
│   ├── AuthContext.jsx # user, login, logout, hasPermission, hasRole
│   ├── SocketContext.jsx # Socket.io (notifications temps réel)
│   └── NotificationContext.jsx
├── guards/
│   ├── PrivateRoute.jsx      # Redirige vers /login si non authentifié
│   └── SuperAdminGuard.jsx   # Redirige si pas super_admin
├── hooks/
│   ├── usePageTitle.js       # Breadcrumb + titre de page
│   └── useDebounce.js
├── pages/              # 50+ pages React organisées par domaine
├── redux/
│   ├── store.js
│   ├── slices/         # uiSlice (sidebar, loading), authSlice
│   └── api/
│       ├── apiSlice.js         # Base RTK Query (tagTypes)
│       ├── saasApi.js          # Forfaits, abonnements, paiements SaaS
│       ├── crmApi.js           # Opportunités, activités
│       ├── rhApi.js            # Employés, congés
│       ├── budgetApi.js        # Budgets, comparaison
│       └── ...                 # 10+ autres slices RTK Query
├── utils/
│   ├── formatters.js   # formatMoney, formatDate
│   └── axios.js        # instance Axios avec interceptors JWT
└── config/
    └── permissions.js  # PERM — constantes de permission
```

### Gestion d'état

| Type d'état | Solution |
|-------------|----------|
| Serveur (cache API) | RTK Query (invalidatesTags / providesTags) |
| Auth globale | React Context (AuthContext) |
| UI (sidebar, loading) | Redux Toolkit (uiSlice) |
| Formulaires | useState local |
| Temps réel | Socket.io (SocketContext) |

### Interceptors Axios

```js
// Injecte le token à chaque requête
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Rafraîchit le token si expiré (401)
api.interceptors.response.use(null, async error => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    const newToken = await refreshAccessToken();
    error.config.headers.Authorization = `Bearer ${newToken}`;
    return api(error.config);
  }
  return Promise.reject(error);
});
```

---

## Flux de données — Exemple : Créer une facture

```
1. Utilisateur clique "Créer facture" (React)
   ↓
2. useCreateFactureMutation (RTK Query) → POST /api/factures
   ↓
3. Middlewares : protect → tenantMiddleware → authorize('factures:create') → subscriptionGuard('FACTURATION')
   ↓
4. factureController.createFacture()
   ├── Validation des champs (Joi)
   ├── Génération numéro FA{YYYY}-{NNNNN}
   ├── Calcul TVA 18%
   ├── Mongoose: Facture.create({ companyId, ... })
   └── comptabiliteService.genererEcrituresFacture()
       ├── D.411 Clients (HT + TVA)
       ├── C.701 Ventes (HT)
       └── C.4431 TVA collectée
   ↓
5. Response { success: true, data: facture, message: 'Facture créée' }
   ↓
6. RTK Query invalide le tag 'Facture' → refetch automatique des listes
   ↓
7. Toast notification "Facture FA2026-00042 créée"
```

---

## Comptabilité SYSCOHADA — Écritures automatiques

Chaque transaction commerciale génère automatiquement des écritures via `comptabiliteService`.

| Transaction | Débit | Crédit |
|-------------|-------|--------|
| Facture client | D.411 Clients | C.701 Ventes + C.4431 TVA |
| Paiement reçu | D.521/571 Banque/Caisse | C.411 Clients |
| Avoir client | D.701 Ventes + D.4431 TVA | C.411 Clients |
| Facture fournisseur | D.601/... Achats + D.4452 TVA | C.401 Fournisseurs |
| Paiement fournisseur | D.401 Fournisseurs | C.521/571 Banque/Caisse |
| Paie employé | D.661 Rémunérations | C.421 Rémun. dues + C.431 IPRES + C.447 IR |

---

## SaaS — Forfaits et abonnements

### Forfaits disponibles

| Code | Nom | Prix mensuel | Modules |
|------|-----|--------------|---------|
| STANDARD | Standard | 15 000 FCFA | GESCOM, FACTURATION, STOCK |
| PROFESSIONNEL | Professionnel | 35 000 FCFA | + COMPTABILITE, REPORTING |
| COMPLET | Complet | 65 000 FCFA | Tous modules + PAIE + API |

### Cycle d'abonnement

```
Inscription (register-saas)
    ↓
Choix forfait → Initier paiement (Wave / Orange Money)
    ↓
Webhook PSP → Valider paiement → Activer abonnement
    ↓
Cron quotidien → Vérifier date expiration
    ↓
J-7 / J-3 / J-1 → Email de rappel (cron hebdo)
    ↓
Expiration → statut = EXPIRE → subscriptionGuard bloque l'accès
    ↓
Renouvellement → Nouveau paiement → Réactiver
```

---

## Sécurité

| Couche | Mesure |
|--------|--------|
| Transport | HTTPS (Railway + Vercel) |
| Authentification | JWT HS256, bcrypt 12 rounds |
| Autorisation | RBAC + subscriptionGuard |
| Isolation tenant | companyId sur chaque requête |
| Rate limiting | 100 req/15min par IP (express-rate-limit) |
| Headers | helmet (CSP, HSTS, X-Frame-Options...) |
| Injection NoSQL | mongo-sanitize |
| XSS | express-validator + sanitizeHtml |
| Pollution params | hpp |
| CORS | Whitelist CLIENT_URL uniquement |
| Audit | AuditLog sur toutes les mutations |

---

## Infrastructure de déploiement

```
GitHub (main branch)
    ↓ Push
GitHub Actions CI
    ├── Tests Jest (backend)
    ├── ESLint
    └── Build React
    ↓ (si CI passe)
GitHub Actions CD
    ├── Deploy backend → Railway (Node.js)
    └── Deploy frontend → Vercel (CDN global)

Railway
    ├── Node.js process (PM2)
    ├── Variables d'environnement (MONGO_URI, JWT_SECRET, ...)
    └── Health-check /api/health

Vercel
    ├── Build React (npm run build)
    ├── REACT_APP_API_URL → URL Railway
    └── CDN Edge (Europe + Afrique)

MongoDB Atlas
    ├── Cluster M0/M2/M10 (selon charge)
    ├── Network Access → whitelist Railway IPs
    └── Backups automatiques quotidiens
```

---

## Performance

- **Index MongoDB** — Tous les index sont composites et commencent par `companyId`
- **Pagination** — Tous les endpoints de liste sont paginés (page, limit, total, totalPages)
- **Cache Redis** — Cache des données peu changeantes (plan comptable, forfaits)
- **RTK Query** — Cache client-side avec invalidation par tag
- **Socket.io** — Notifications temps réel sans polling
- **Code splitting** — React.lazy() sur toutes les pages (60+ lazy imports dans routes.jsx)
- **PWA** — Service Worker pour le cache statique et le fonctionnement hors-ligne basique

---

## Normes et conformité

| Norme | Détail |
|-------|--------|
| SYSCOHADA / OHADA | Plan comptable classes 1 à 8 (130+ comptes) |
| DGI Sénégal | Mentions légales, NINEA, facturation conforme |
| TVA | 18 % (normal) ou 0 % (exonéré) |
| FCFA (XOF) | Montants en entiers uniquement, sans décimales |
| IPRES | Salariale 5,6 % / Patronale 15,4 % (8,4 % IPRES + 7 % CSS) |
| FEC | Export Fichier des Écritures Comptables conforme DGI |

---

*Documentation technique ERP GesCom-Compta Sénégal — Version 1.0 — Juin 2026*
