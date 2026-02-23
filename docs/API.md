# Documentation API - ERP Commercial & Comptable Senegal

## Base URL

```
http://localhost:5000/api
```

## Authentification

Toutes les routes (sauf `/api/auth/login`, `/api/auth/refresh-token`, `/api/auth/forgot-password` et `/api/auth/reset-password/:token`) necessitent un token JWT.

**Header requis :**
```
Authorization: Bearer <access_token>
```

Le token d'acces expire apres 15 minutes. Utilisez le refresh token (stocke en cookie httpOnly) pour obtenir un nouveau token via `POST /api/auth/refresh-token`.

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

---

## 1. Authentification (`/api/auth`)

| Methode | URL | Description | Auth | Permission |
|---------|-----|-------------|------|------------|
| POST | `/auth/login` | Connexion | Non | - |
| POST | `/auth/refresh-token` | Renouveler le token d'acces | Non | - |
| POST | `/auth/forgot-password` | Demander un reset de mot de passe | Non | - |
| PUT | `/auth/reset-password/:token` | Reinitialiser le mot de passe | Non | - |
| POST | `/auth/register` | Inscrire un utilisateur | Oui | Role admin |
| POST | `/auth/logout` | Deconnexion (supprime le cookie) | Oui | - |

### POST `/auth/login`
```json
{
  "email": "admin@erp-senegal.com",
  "password": "Admin@2026"
}
```
**Reponse 200 :**
```json
{
  "success": true,
  "data": {
    "user": { "id", "firstName", "lastName", "email", "role" },
    "accessToken": "eyJhbG..."
  }
}
```
Le refresh token est envoye en cookie httpOnly (`refreshToken`, 7 jours).

### POST `/auth/register` (admin uniquement)
```json
{
  "firstName": "Moussa",
  "lastName": "Diop",
  "email": "moussa@erp-senegal.com",
  "password": "Moussa@2026",
  "role": "<role_id>"
}
```

---

## 2. Utilisateurs (`/api/users`)

Toutes les routes necessitent une authentification.

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/users/me` | Mon profil | Authentifie |
| PUT | `/users/me` | Modifier mon profil | Authentifie |
| GET | `/users` | Liste des utilisateurs | users:read |
| GET | `/users/:id` | Detail d'un utilisateur | users:read |
| POST | `/users` | Creer un utilisateur | users:create |
| PUT | `/users/:id` | Modifier un utilisateur | users:update |
| DELETE | `/users/:id` | Desactiver un utilisateur (soft delete) | users:delete |

---

## 3. Entreprise (`/api/company`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/company` | Informations de l'entreprise (cache 5min) | company:read |
| PUT | `/company` | Modifier les informations | company:update |

### PUT `/company`
```json
{
  "raisonSociale": "Senegal Trading SARL",
  "ninea": "12345678A",
  "rccm": "SN-DKR-2020-A-12345",
  "adresse": { "rue": "...", "ville": "Dakar", "pays": "Senegal" },
  "telephone": "+221 33 800 00 00",
  "email": "contact@senegal-trading.com",
  "formeJuridique": "SARL",
  "capitalSocial": 10000000
}
```

---

## 4. Parametres (`/api/settings`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/settings` | Parametres de l'application (cache 5min) | settings:read |
| PUT | `/settings` | Modifier les parametres | settings:update |

---

## 5. Administration (`/api/admin`)

Toutes les routes necessitent le role `admin`.

### Roles

| Methode | URL | Description |
|---------|-----|-------------|
| GET | `/admin/roles` | Liste des roles |
| GET | `/admin/roles/:id` | Detail d'un role |
| POST | `/admin/roles` | Creer un role |
| PUT | `/admin/roles/:id` | Modifier un role |
| DELETE | `/admin/roles/:id` | Supprimer un role |

### Permissions

| Methode | URL | Description |
|---------|-----|-------------|
| GET | `/admin/permissions` | Liste de toutes les permissions |

### Journal d'audit

| Methode | URL | Description |
|---------|-----|-------------|
| GET | `/admin/audit-logs` | Liste des logs d'audit |
| GET | `/admin/audit-logs/stats` | Statistiques d'audit |
| GET | `/admin/audit-logs/:id` | Detail d'un log |

### Entreprise & Parametres (via admin)

| Methode | URL | Description |
|---------|-----|-------------|
| GET | `/admin/company` | Info entreprise |
| PUT | `/admin/company` | Modifier entreprise |
| GET | `/admin/settings` | Parametres |
| PUT | `/admin/settings` | Modifier parametres |

---

## 6. Clients (`/api/clients`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/clients` | Liste + filtres + pagination | clients:read |
| GET | `/clients/:id` | Fiche complete | clients:read |
| GET | `/clients/:id/stats` | Statistiques du client (CA, factures, paiements) | clients:read |
| POST | `/clients` | Creer un client | clients:create |
| PUT | `/clients/:id` | Modifier un client | clients:update |
| DELETE | `/clients/:id` | Soft delete | clients:delete |
| POST | `/clients/segmentation` | Recalculer la segmentation ABC | clients:update |

### POST `/clients`
```json
{
  "type": "entreprise",
  "raisonSociale": "Societe Exemple SARL",
  "ninea": "12345678A",
  "rccm": "SN-DKR-2020-A-12345",
  "email": "contact@exemple.com",
  "telephone": "+221 77 000 00 00",
  "adresse": {
    "rue": "123 Avenue Bourguiba",
    "ville": "Dakar",
    "region": "Dakar",
    "pays": "Senegal"
  },
  "conditionsPaiement": "net_30",
  "limiteCredit": 5000000,
  "commercial": "<user_id>"
}
```

**Filtres disponibles :** `?type=entreprise&segmentation=A&commercial=<id>&ville=Dakar`

---

## 7. Fournisseurs (`/api/fournisseurs`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/fournisseurs` | Liste + filtres + pagination | fournisseurs:read |
| GET | `/fournisseurs/:id` | Fiche complete | fournisseurs:read |
| POST | `/fournisseurs` | Creer un fournisseur | fournisseurs:create |
| PUT | `/fournisseurs/:id` | Modifier un fournisseur | fournisseurs:update |
| DELETE | `/fournisseurs/:id` | Soft delete | fournisseurs:delete |

### POST `/fournisseurs`
```json
{
  "raisonSociale": "Fournisseur Dakar SARL",
  "ninea": "87654321B",
  "email": "contact@fournisseur.sn",
  "telephone": "+221 33 900 00 00",
  "adresse": { "rue": "...", "ville": "Dakar", "pays": "Senegal" },
  "conditionsPaiement": "net_30",
  "categoriesFournies": ["Informatique", "Bureautique"]
}
```

---

## 8. Categories (`/api/categories`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/categories` | Liste des categories (cache 2min) | categories:read |
| GET | `/categories/tree` | Arborescence des categories (cache 2min) | categories:read |
| GET | `/categories/:id` | Detail d'une categorie | categories:read |
| POST | `/categories` | Creer une categorie | categories:create |
| PUT | `/categories/:id` | Modifier une categorie | categories:update |
| DELETE | `/categories/:id` | Supprimer une categorie | categories:delete |

### POST `/categories`
```json
{
  "name": "Informatique",
  "description": "Materiel et logiciels informatiques",
  "parent": "<category_id ou null>"
}
```

---

## 9. Produits (`/api/products`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/products` | Liste + filtres + pagination | produits:read |
| GET | `/products/:id` | Fiche produit complete | produits:read |
| POST | `/products` | Creer un produit | produits:create |
| PUT | `/products/:id` | Modifier un produit | produits:update |
| DELETE | `/products/:id` | Soft delete | produits:delete |

### POST `/products`
```json
{
  "name": "Ordinateur Portable HP",
  "reference": "HP-PRO-15",
  "category": "<category_id>",
  "type": "produit",
  "prixAchat": 350000,
  "prixVente": 450000,
  "tauxTVA": 18,
  "unite": "Unite",
  "seuilAlerte": 5,
  "description": "HP ProBook 15 pouces"
}
```

**Filtres disponibles :** `?category=<id>&type=produit&minPrice=100000&maxPrice=500000&inStock=true`

---

## 10. Stocks (`/api/stocks`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/stocks` | Etat du stock par produit/depot | stocks:read |
| GET | `/stocks/alerts` | Produits en dessous du seuil d'alerte | stocks:read |
| GET | `/stocks/:id` | Detail d'un stock | stocks:read |
| GET | `/stocks/movements` | Historique des mouvements de stock | stocks:read |
| GET | `/stocks/movements/:id` | Detail d'un mouvement | stocks:read |
| POST | `/stocks/movements` | Creer un mouvement (entree/sortie/ajustement) | stocks:create |
| POST | `/stocks/transfer` | Transfert inter-depots | stocks:create |

### POST `/stocks/movements`
```json
{
  "type": "entree",
  "product": "<product_id>",
  "warehouse": "<warehouse_id>",
  "quantite": 50,
  "prixUnitaire": 350000,
  "reference": "BL-FOURN-001",
  "notes": "Reception commande fournisseur"
}
```

### POST `/stocks/transfer`
```json
{
  "product": "<product_id>",
  "warehouseSource": "<warehouse_id>",
  "warehouseDestination": "<warehouse_id>",
  "quantite": 10,
  "notes": "Transfert vers depot secondaire"
}
```

---

## 11. Depots (`/api/warehouses`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/warehouses` | Liste des depots | depots:read |
| GET | `/warehouses/:id` | Detail d'un depot avec stocks | depots:read |
| POST | `/warehouses` | Creer un depot | depots:create |
| PUT | `/warehouses/:id` | Modifier un depot | depots:update |
| DELETE | `/warehouses/:id` | Supprimer un depot | depots:delete |

### POST `/warehouses`
```json
{
  "name": "Depot Principal Dakar",
  "code": "DPD",
  "adresse": { "rue": "...", "ville": "Dakar" },
  "responsable": "<user_id>",
  "isDefault": true
}
```

---

## 12. Devis (`/api/devis`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/devis` | Liste des devis | devis:read |
| GET | `/devis/:id` | Detail d'un devis | devis:read |
| GET | `/devis/:id/pdf` | Telecharger le PDF | devis:read |
| POST | `/devis` | Creer un devis | devis:create |
| PUT | `/devis/:id` | Modifier un devis (brouillon uniquement) | devis:update |
| DELETE | `/devis/:id` | Supprimer un devis | devis:delete |
| PUT | `/devis/:id/status` | Changer le statut | devis:update |
| POST | `/devis/:id/send` | Envoyer par email | devis:update |
| POST | `/devis/:id/convert` | Convertir en commande | devis:update |

### POST `/devis`
```json
{
  "client": "<client_id>",
  "dateDevis": "2026-01-15",
  "dateValidite": "2026-02-14",
  "lignes": [
    {
      "product": "<product_id>",
      "designation": "Ordinateur Portable HP",
      "quantite": 5,
      "prixUnitaire": 450000,
      "remise": 5,
      "tauxTVA": 18
    }
  ],
  "remiseGlobale": 0,
  "conditionsPaiement": "Paiement a 30 jours",
  "notes": "Offre speciale entreprise"
}
```

### PUT `/devis/:id/status`
```json
{
  "statut": "envoye"
}
```
**Statuts possibles :** `brouillon` → `envoye` → `accepte` | `refuse` | `expire` | `converti`

---

## 13. Commandes (`/api/commandes`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/commandes` | Liste des commandes | commandes:read |
| GET | `/commandes/:id` | Detail d'une commande | commandes:read |
| POST | `/commandes` | Creer une commande | commandes:create |
| PUT | `/commandes/:id` | Modifier une commande | commandes:update |
| DELETE | `/commandes/:id` | Supprimer une commande | commandes:delete |
| PUT | `/commandes/:id/status` | Changer le statut | commandes:update |
| POST | `/commandes/:id/livraison` | Generer un bon de livraison | bons_livraison:create |

### POST `/commandes/:id/livraison`
```json
{
  "lignes": [
    {
      "ligneCommandeId": "<ligne_id>",
      "quantite": 3,
      "warehouse": "<warehouse_id>"
    }
  ],
  "adresseLivraison": { "rue": "...", "ville": "Dakar" },
  "notes": "Livraison partielle"
}
```

**Statuts :** `brouillon` → `confirmee` → `en_cours` → `partiellement_livree` → `livree` | `annulee`

---

## 14. Bons de Livraison (`/api/bons-livraison`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/bons-livraison` | Liste des bons de livraison | bons_livraison:read |
| GET | `/bons-livraison/:id` | Detail d'un bon | bons_livraison:read |
| POST | `/bons-livraison` | Creer un bon de livraison | bons_livraison:create |
| POST | `/bons-livraison/:id/validate` | Valider (decremente le stock) | bons_livraison:validate |

**Statuts :** `brouillon` → `valide`

---

## 15. Factures (`/api/factures`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/factures` | Liste des factures | factures:read |
| GET | `/factures/:id` | Detail d'une facture | factures:read |
| GET | `/factures/:id/pdf` | Telecharger le PDF | factures:read |
| POST | `/factures` | Creer une facture | factures:create |
| PUT | `/factures/:id` | Modifier (brouillon uniquement) | factures:update |
| DELETE | `/factures/:id` | Supprimer (brouillon uniquement) | factures:delete |
| POST | `/factures/:id/validate` | Valider (genere numero DGI + ecriture comptable) | factures:validate |
| POST | `/factures/:id/send` | Envoyer par email au client | factures:update |
| POST | `/factures/:id/avoir` | Creer une facture d'avoir | factures:create |

### POST `/factures`
```json
{
  "client": "<client_id>",
  "dateFacture": "2026-01-20",
  "dateEcheance": "2026-02-19",
  "lignes": [
    {
      "product": "<product_id>",
      "designation": "Ordinateur Portable HP",
      "quantite": 5,
      "prixUnitaire": 450000,
      "remise": 5,
      "tauxTVA": 18
    }
  ],
  "remiseGlobale": 0,
  "conditionsPaiement": "Paiement a 30 jours"
}
```

### POST `/factures/:id/avoir`
```json
{
  "motif": "Retour marchandise defectueuse",
  "lignes": [
    {
      "product": "<product_id>",
      "designation": "Ordinateur Portable HP",
      "quantite": 1,
      "prixUnitaire": 450000,
      "tauxTVA": 18
    }
  ]
}
```

**Statuts :** `brouillon` → `validee` → `envoyee` → `partiellement_payee` → `payee` | `annulee`

**Calculs automatiques :**
- Montant HT par ligne = `quantite * prixUnitaire * (1 - remise/100)`
- TVA par ligne = `montantHT * tauxTVA / 100`
- Total HT = somme des lignes HT - remise globale
- Total TVA = somme des lignes TVA
- Total TTC = Total HT + Total TVA

---

## 16. Paiements (`/api/payments`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/payments/tresorerie` | Situation de tresorerie | paiements:read |
| GET | `/payments/schedule` | Echeancier des paiements | paiements:read |
| GET | `/payments` | Liste des paiements | paiements:read |
| GET | `/payments/:id` | Detail d'un paiement | paiements:read |
| POST | `/payments` | Enregistrer un paiement | paiements:create |
| PUT | `/payments/:id` | Modifier un paiement (brouillon) | paiements:update |
| DELETE | `/payments/:id` | Supprimer un paiement (brouillon) | paiements:delete |
| POST | `/payments/:id/validate` | Valider (genere numero + ecriture comptable) | paiements:validate |
| POST | `/payments/:id/cancel` | Annuler un paiement valide | paiements:delete |

### POST `/payments`
```json
{
  "typePaiement": "client",
  "modePaiement": "virement",
  "datePaiement": "2026-01-25",
  "montant": 2137500,
  "client": "<client_id>",
  "facture": "<facture_id>",
  "compteBancaire": "<bank_account_id>",
  "notes": "Virement recu"
}
```

**Types de paiement :** `client`, `fournisseur`

**Modes de paiement :** `especes`, `cheque`, `virement`, `carte_bancaire`, `orange_money`, `wave`, `autre`

---

## 17. Comptes Bancaires (`/api/bank-accounts`)

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/bank-accounts` | Liste des comptes bancaires | comptes_bancaires:read |
| GET | `/bank-accounts/:id` | Detail d'un compte | comptes_bancaires:read |
| POST | `/bank-accounts` | Creer un compte bancaire | comptes_bancaires:create |
| PUT | `/bank-accounts/:id` | Modifier un compte | comptes_bancaires:update |
| DELETE | `/bank-accounts/:id` | Supprimer un compte | comptes_bancaires:delete |
| GET | `/bank-accounts/:id/reconciliation` | Rapprochement bancaire | comptes_bancaires:read |

### POST `/bank-accounts`
```json
{
  "nomBanque": "CBAO Groupe Attijariwafa Bank",
  "numeroCompte": "SN012 01001 000012345678 90",
  "intitule": "Compte courant CBAO",
  "devise": "XOF",
  "soldeInitial": 5000000,
  "compteComptable": "<compte_comptable_id>",
  "isPrincipal": true
}
```

---

## 18. Comptabilite (`/api/comptabilite`)

### Plan Comptable SYSCOHADA

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/comptabilite/plan` | Plan comptable complet (cache 5min) | comptabilite:read |
| GET | `/comptabilite/plan/:id` | Detail d'un compte | comptabilite:read |
| POST | `/comptabilite/plan` | Creer un sous-compte | comptabilite:create |
| PUT | `/comptabilite/plan/:id` | Modifier un compte | comptabilite:update |
| DELETE | `/comptabilite/plan/:id` | Supprimer un compte (sans ecritures) | comptabilite:delete |

### Ecritures Comptables

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/comptabilite/ecritures` | Journal des ecritures | ecritures:read |
| GET | `/comptabilite/ecritures/:id` | Detail d'une ecriture | ecritures:read |
| POST | `/comptabilite/ecritures` | Saisir une ecriture (OD) | ecritures:create |
| PUT | `/comptabilite/ecritures/:id` | Modifier (brouillon) | ecritures:update |
| DELETE | `/comptabilite/ecritures/:id` | Supprimer (brouillon) | ecritures:delete |
| POST | `/comptabilite/ecritures/:id/validate` | Valider une ecriture | ecritures:validate |
| POST | `/comptabilite/ecritures/:id/contrepasser` | Contrepasser une ecriture validee | ecritures:create |

### Lettrage

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| POST | `/comptabilite/lettrage` | Lettrer des lignes d'ecritures | ecritures:update |

### Exercices Comptables

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/comptabilite/exercices` | Liste des exercices | comptabilite:read |
| POST | `/comptabilite/exercices` | Creer un exercice | comptabilite:create |
| POST | `/comptabilite/exercices/:id/cloture` | Cloturer un exercice | comptabilite:validate |

### Etats Financiers

| Methode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/comptabilite/grand-livre` | Grand livre comptable | comptabilite:read |
| GET | `/comptabilite/balance` | Balance generale | comptabilite:read |
| GET | `/comptabilite/compte-resultat` | Compte de resultat | comptabilite:read |
| GET | `/comptabilite/bilan` | Bilan comptable | comptabilite:read |
| GET | `/comptabilite/tva` | Declaration de TVA | comptabilite:read |
| GET | `/comptabilite/fec` | Export FEC (Fichier des Ecritures Comptables) | comptabilite:export |

### POST `/comptabilite/ecritures`
```json
{
  "journal": "OD",
  "dateEcriture": "2026-01-31",
  "libelle": "Provision charges a payer",
  "exercice": "<exercice_id>",
  "lignes": [
    {
      "compte": "<compte_id>",
      "libelle": "Charges a payer",
      "debit": 500000,
      "credit": 0
    },
    {
      "compte": "<compte_id>",
      "libelle": "Provision",
      "debit": 0,
      "credit": 500000
    }
  ]
}
```

**Journaux :** `VE` (Ventes), `AC` (Achats), `BQ` (Banque), `CA` (Caisse), `OD` (Operations Diverses)

**Regle :** Total debits = Total credits (ecriture equilibree obligatoire)

### POST `/comptabilite/lettrage`
```json
{
  "ligneIds": ["<ligne_id_1>", "<ligne_id_2>"],
  "codeLettrage": "AA"
}
```

### GET `/comptabilite/fec`
**Parametres :** `?exercice=<exercice_id>&format=txt`

Export au format FEC conforme a la norme DGI Senegal. Colonnes : JournalCode, JournalLib, EcritureNum, EcritureDate, CompteNum, CompteLib, CompAuxNum, CompAuxLib, PieceRef, PieceDate, EcritureLib, Debit, Credit, EcritureLet, DateLet, ValidDate, Montantdevise, Idevise.

---

## 19. Notifications (`/api/notifications`)

Toutes les routes necessitent uniquement l'authentification (pas de permission specifique). Chaque utilisateur accede uniquement a ses propres notifications.

| Methode | URL | Description |
|---------|-----|-------------|
| GET | `/notifications` | Mes notifications (paginee) |
| GET | `/notifications/unread-count` | Nombre de notifications non lues |
| PUT | `/notifications/:id/read` | Marquer une notification comme lue |
| PUT | `/notifications/read-all` | Marquer toutes comme lues |
| DELETE | `/notifications/:id` | Supprimer une notification |

### Types de notifications

| Type | Description |
|------|-------------|
| `facture_validee` | Facture validee, prete a envoyer |
| `paiement_recu` | Paiement enregistre sur une facture |
| `stock_alerte` | Stock en dessous du seuil d'alerte |
| `devis_expire` | Devis arrive a expiration |
| `commande_confirmee` | Commande confirmee par le client |
| `echeance_proche` | Facture bientot a echeance |

### Temps reel (Socket.io)

Les notifications sont egalement envoyees en temps reel via Socket.io :
- **Room utilisateur :** `user:<userId>` - notifications personnelles
- **Room role :** `role:<roleName>` - notifications par role

---

## Codes d'erreur HTTP

| Code | Signification |
|------|---------------|
| 200 | Succes |
| 201 | Cree avec succes |
| 400 | Erreur de validation (champs manquants, format incorrect) |
| 401 | Non authentifie (token manquant ou expire) |
| 403 | Acces interdit (permissions insuffisantes) |
| 404 | Ressource non trouvee |
| 409 | Conflit (doublon, reference existante) |
| 422 | Entite non traitable (regle metier non respectee) |
| 429 | Trop de requetes (rate limit : 100/min par defaut) |
| 500 | Erreur serveur interne |

---

## Roles et Permissions

### Roles par defaut

| Role | Description |
|------|-------------|
| `admin` | Acces complet a toutes les fonctionnalites |
| `manager` | Gestion commerciale et supervision |
| `comptable` | Comptabilite, paiements, etats financiers |
| `commercial` | Clients, devis, commandes |
| `vendeur` | Ventes au comptoir, factures |
| `caissier` | Encaissements, caisse |
| `gestionnaire_stock` | Stocks, depots, mouvements |

### Structure des permissions

Les permissions suivent le format `module:action` :
- Actions : `read`, `create`, `update`, `delete`, `validate`, `export`
- Modules : `clients`, `fournisseurs`, `produits`, `categories`, `stocks`, `depots`, `devis`, `commandes`, `bons_livraison`, `factures`, `paiements`, `comptes_bancaires`, `comptabilite`, `ecritures`, `users`, `settings`, `company`, `dashboard`
