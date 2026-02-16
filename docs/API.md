# Documentation API - ERP Commercial & Comptable Senegal

## Base URL

```
http://localhost:5000/api
```

## Authentification

Toutes les routes (sauf `/api/auth/login` et `/api/auth/register`) necessitent un token JWT.

**Header requis :**
```
Authorization: Bearer <access_token>
```

## Format de Reponse

### Succes
```json
{
  "success": true,
  "data": {},
  "message": "Operation reussie",
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 142,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

## Pagination

Toutes les listes supportent la pagination via query params :

| Parametre | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Numero de page |
| `limit` | 25 | Elements par page (max: 100) |
| `sort` | `-createdAt` | Tri (prefixe `-` pour descendant) |
| `search` | - | Recherche textuelle |

## Endpoints

### Authentification

| Methode | URL | Description | Auth |
|---------|-----|-------------|------|
| POST | `/auth/register` | Inscription (admin only) | Oui |
| POST | `/auth/login` | Connexion | Non |
| POST | `/auth/refresh` | Renouvellement token | Non |
| POST | `/auth/logout` | Deconnexion | Oui |
| POST | `/auth/forgot-password` | Demande reset password | Non |
| PUT | `/auth/reset-password` | Reset avec token | Non |

### Utilisateurs

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/users` | Liste utilisateurs | users:read |
| GET | `/users/:id` | Detail utilisateur | users:read |
| PUT | `/users/:id` | Modifier utilisateur | users:update |
| DELETE | `/users/:id` | Desactiver utilisateur | users:delete |
| GET | `/users/me` | Mon profil | Authentifie |
| PUT | `/users/me` | Modifier mon profil | Authentifie |

### Clients

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/clients` | Liste + filtres + pagination | clients:read |
| GET | `/clients/:id` | Fiche complete | clients:read |
| POST | `/clients` | Creer client | clients:create |
| PUT | `/clients/:id` | Modifier client | clients:update |
| DELETE | `/clients/:id` | Soft delete | clients:delete |
| GET | `/clients/:id/factures` | Factures du client | clients:read |
| GET | `/clients/:id/paiements` | Paiements du client | clients:read |
| GET | `/clients/:id/stats` | Statistiques client | clients:read |

### Produits

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/products` | Liste + filtres | produits:read |
| GET | `/products/:id` | Fiche produit | produits:read |
| POST | `/products` | Creer produit | produits:create |
| PUT | `/products/:id` | Modifier produit | produits:update |
| DELETE | `/products/:id` | Soft delete | produits:delete |
| GET | `/categories` | Arbre categories | produits:read |
| POST | `/categories` | Creer categorie | produits:create |

### Factures

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/factures` | Liste factures | factures:read |
| POST | `/factures` | Creer facture | factures:create |
| PUT | `/factures/:id` | Modifier brouillon | factures:update |
| POST | `/factures/:id/validate` | Valider facture | factures:validate |
| POST | `/factures/:id/send` | Envoyer par email | factures:read |
| GET | `/factures/:id/pdf` | Telecharger PDF | factures:read |
| POST | `/factures/:id/avoir` | Creer avoir | factures:create |

### Comptabilite

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/comptabilite/plan` | Plan comptable SYSCOHADA | comptabilite:read |
| POST | `/comptabilite/plan` | Ajouter sous-compte | comptabilite:create |
| GET | `/comptabilite/ecritures` | Journal ecritures | ecritures:read |
| POST | `/comptabilite/ecritures` | Saisir ecriture OD | ecritures:create |
| GET | `/comptabilite/grand-livre` | Grand livre | comptabilite:read |
| GET | `/comptabilite/balance` | Balance generale | comptabilite:read |
| GET | `/comptabilite/bilan` | Bilan | comptabilite:read |
| GET | `/comptabilite/compte-resultat` | Compte de resultat | comptabilite:read |
| GET | `/comptabilite/tva` | Declaration TVA | comptabilite:read |
| GET | `/comptabilite/fec` | Export FEC | comptabilite:export |

### Paiements

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/payments` | Liste paiements | paiements:read |
| POST | `/payments` | Enregistrer paiement client | paiements:create |
| POST | `/payments/supplier` | Paiement fournisseur | paiements:create |
| GET | `/payments/schedule` | Echeanciers | paiements:read |
| GET | `/bank-accounts` | Comptes bancaires | comptes_bancaires:read |
| GET | `/tresorerie` | Situation tresorerie | comptes_bancaires:read |

### Dashboard

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/dashboard/commercial` | KPIs commerciaux | dashboard:read |
| GET | `/dashboard/financial` | KPIs financiers | dashboard:read |
| GET | `/dashboard/stocks` | KPIs stocks | dashboard:read |
| GET | `/dashboard/summary` | Resume global | dashboard:read |

## Codes d'erreur HTTP

| Code | Signification |
|------|---------------|
| 200 | Succes |
| 201 | Cree avec succes |
| 400 | Erreur de validation |
| 401 | Non authentifie |
| 403 | Acces interdit (permissions) |
| 404 | Ressource non trouvee |
| 429 | Trop de requetes (rate limit) |
| 500 | Erreur serveur interne |
