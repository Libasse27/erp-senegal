# Manuel Utilisateur - ERP Commercial & Comptable Senegal

## Table des Matieres

1. [Introduction](#1-introduction)
2. [Premiers Pas](#2-premiers-pas)
3. [Tableau de Bord](#3-tableau-de-bord)
4. [Gestion Commerciale](#4-gestion-commerciale)
5. [Cycle de Vente](#5-cycle-de-vente)
6. [Gestion des Stocks](#6-gestion-des-stocks)
7. [Paiements et Tresorerie](#7-paiements-et-tresorerie)
8. [Comptabilite SYSCOHADA](#8-comptabilite-syscohada)
9. [Administration](#9-administration)
10. [FAQ et Depannage](#10-faq-et-depannage)

---

## 1. Introduction

### Presentation

L'ERP Commercial & Comptable Senegal est une application web conçue pour les PME/TPE au Senegal et en Afrique de l'Ouest. Il couvre l'ensemble du cycle commercial et comptable :

- **Gestion commerciale** : Clients, fournisseurs, produits, categories
- **Cycle de vente** : Devis → Commandes → Bons de livraison → Factures
- **Gestion des stocks** : Multi-depots, mouvements, alertes, valorisation CUMP
- **Paiements** : Multi-modes (especes, cheque, virement, Orange Money, Wave)
- **Comptabilite** : Plan comptable SYSCOHADA, ecritures automatiques, etats financiers
- **Conformite** : Normes OHADA, TVA 18% (Senegal), facturation conforme DGI

### Devise et TVA

- **Devise** : FCFA (XOF) - valeurs entieres uniquement (pas de centimes)
- **TVA** : 18% (taux normal) ou 0% (exonere)
- Tous les montants sont affiches au format senegalais : `1 500 000 FCFA`

---

## 2. Premiers Pas

### Connexion

1. Ouvrez l'application dans votre navigateur
2. Saisissez votre adresse email et votre mot de passe
3. Cliquez sur **Se connecter**

Votre session reste active pendant 7 jours grace au renouvellement automatique du token.

### Navigation

L'interface se compose de :
- **Barre laterale (Sidebar)** : Menu principal avec les modules accessibles selon votre role
- **En-tete (Header)** : Nom de l'utilisateur, notifications, deconnexion
- **Zone principale** : Contenu de la page active

### Roles Utilisateurs

| Role | Acces |
|------|-------|
| Administrateur | Tout l'ERP + parametres + gestion des roles |
| Manager | Supervision commerciale + tableaux de bord |
| Comptable | Comptabilite + paiements + etats financiers |
| Commercial | Clients + devis + commandes |
| Vendeur | Vente au comptoir + factures |
| Caissier | Encaissements + caisse |
| Gestionnaire Stock | Stocks + depots + mouvements |

### Notifications

Les notifications apparaissent en temps reel dans la cloche en haut a droite :
- Nouvelles factures validees
- Paiements recus
- Alertes de stock bas
- Devis arrives a expiration
- Echeances de factures proches

Cliquez sur une notification pour acceder au document concerne. Marquez-les comme lues individuellement ou en masse.

---

## 3. Tableau de Bord

Le tableau de bord presente une vue synthetique de l'activite :

### KPIs Commerciaux
- **Chiffre d'affaires** du mois en cours
- **Nombre de factures** emises
- **Nombre de devis** envoyes
- **Taux de conversion** devis → commandes

### KPIs Financiers
- **Encaissements** du mois
- **Factures en retard** de paiement
- **Tresorerie disponible**
- **Balance agee** des clients

### KPIs Stocks
- **Valeur totale** du stock
- **Produits en alerte** (sous le seuil)
- **Mouvements recents**

---

## 4. Gestion Commerciale

### 4.1 Clients

**Acceder :** Menu lateral → Gestion Commerciale → Clients

#### Creer un client

1. Cliquez sur **+ Nouveau Client**
2. Selectionnez le type : **Entreprise** ou **Particulier**
3. Remplissez les informations obligatoires :
   - Pour une entreprise : raison sociale, NINEA, RCCM
   - Pour un particulier : prenom, nom
4. Ajoutez les coordonnees (email, telephone, adresse)
5. Definissez les conditions de paiement (comptant, net 30, net 60, net 90)
6. Optionnel : definissez une limite de credit
7. Cliquez sur **Enregistrer**

#### Segmentation ABC

Les clients sont automatiquement classes selon leur chiffre d'affaires :
- **Segment A** : Top 20% des clients (environ 80% du CA)
- **Segment B** : 30% suivants
- **Segment C** : 50% restants

La segmentation peut etre recalculee via le bouton **Recalculer la segmentation**.

#### Fiche client

Chaque fiche client affiche :
- Informations generales
- Historique des factures
- Historique des paiements
- Statistiques (CA total, nombre de factures, solde du)

### 4.2 Fournisseurs

**Acceder :** Menu lateral → Gestion Commerciale → Fournisseurs

Meme fonctionnement que les clients. Les fournisseurs incluent en plus :
- Categories de produits fournis
- Delais de livraison habituels
- Conditions de paiement negociees

### 4.3 Produits et Categories

**Acceder :** Menu lateral → Gestion Commerciale → Produits

#### Categories

Les categories supportent une arborescence (categories parentes/enfants).
Exemple : Informatique → Ordinateurs → Portables

#### Creer un produit

1. Cliquez sur **+ Nouveau Produit**
2. Renseignez :
   - **Nom** et **Reference** (le code PRD-XXXXX est genere automatiquement)
   - **Categorie** parente
   - **Type** : produit ou service
   - **Prix d'achat** et **Prix de vente** (en FCFA)
   - **TVA** : 18% (normal) ou 0% (exonere)
   - **Unite** de mesure
   - **Seuil d'alerte** de stock
3. Cliquez sur **Enregistrer**

La **marge brute** et le **taux de marge** sont calcules automatiquement.

---

## 5. Cycle de Vente

Le cycle de vente suit un processus lineaire :

```
Devis → Commande → Bon de Livraison → Facture → Paiement
```

### 5.1 Devis

**Acceder :** Menu lateral → Ventes → Devis

#### Creer un devis

1. Cliquez sur **+ Nouveau Devis**
2. Selectionnez le **client**
3. Ajoutez des **lignes** :
   - Selectionnez un produit (les prix se remplissent automatiquement)
   - Ajustez la quantite et la remise eventuelle
   - Ajoutez d'autres lignes si necessaire
4. Optionnel : appliquez une **remise globale** (en %)
5. Definissez la **date de validite** (30 jours par defaut)
6. Ajoutez des conditions de paiement et des notes
7. Cliquez sur **Enregistrer** (statut : Brouillon)

#### Cycle de vie d'un devis

| Action | Statut resultant |
|--------|-----------------|
| Creer | Brouillon |
| Envoyer au client | Envoye |
| Client accepte | Accepte |
| Client refuse | Refuse |
| Date de validite depassee | Expire |
| Convertir en commande | Converti |

#### Convertir en commande

Depuis un devis **Accepte**, cliquez sur **Convertir en Commande**. Une commande est automatiquement creee avec les memes lignes.

### 5.2 Commandes

**Acceder :** Menu lateral → Ventes → Commandes

#### Cycle de vie d'une commande

| Statut | Description |
|--------|-------------|
| Brouillon | Commande en cours de redaction |
| Confirmee | Commande validee, prete a etre preparee |
| En cours | Preparation en cours |
| Partiellement livree | Livraison partielle effectuee |
| Livree | Toute la commande est livree |
| Annulee | Commande annulee |

#### Generer un bon de livraison

1. Depuis une commande **Confirmee** ou **En cours**, cliquez sur **Generer BL**
2. Selectionnez les lignes et quantites a livrer
3. Choisissez le depot source
4. Cliquez sur **Generer**

### 5.3 Bons de Livraison

Le bon de livraison est automatiquement cree depuis la commande.

**Validation du BL** :
- Lors de la validation, le stock est automatiquement decremente dans le depot concerne
- La commande est mise a jour (quantites livrees)
- Un mouvement de stock de type "sortie" est enregistre

### 5.4 Factures

**Acceder :** Menu lateral → Ventes → Factures

#### Creer une facture

1. Cliquez sur **+ Nouvelle Facture**
2. Selectionnez le **client**
3. Ajoutez les **lignes** de produits/services
4. Definissez la **date d'echeance**
5. Cliquez sur **Enregistrer** (statut : Brouillon)

#### Valider une facture

La validation d'une facture est une etape critique et irreversible :

1. Cliquez sur **Valider** depuis une facture en brouillon
2. Le systeme genere :
   - Un **numero sequentiel** conforme DGI (ex: FA-2026-00001)
   - Une **ecriture comptable** automatique (journal des ventes)
3. La facture ne peut plus etre modifiee une fois validee

#### Calculs automatiques

Pour chaque ligne :
- **Montant HT** = Quantite x Prix Unitaire x (1 - Remise/100)
- **TVA** = Montant HT x Taux TVA / 100
- **TTC** = Montant HT + TVA

Pour la facture :
- **Total HT** = Somme des lignes HT - Remise globale
- **Total TVA** = Somme des lignes TVA
- **Total TTC** = Total HT + Total TVA
- **Montant Restant** = Total TTC - Montant Paye

#### Telecharger le PDF

Cliquez sur **PDF** pour telecharger une facture au format PDF avec toutes les mentions legales obligatoires.

#### Creer un avoir

Depuis une facture validee, cliquez sur **Creer un Avoir** pour generer une facture d'avoir (remboursement partiel ou total).

---

## 6. Gestion des Stocks

**Acceder :** Menu lateral → Stocks

### 6.1 Depots

L'application supporte le multi-depots. Chaque depot a :
- Un nom et un code
- Une adresse
- Un responsable
- Un indicateur "depot par defaut"

### 6.2 Etat du stock

La page principale affiche pour chaque produit :
- Quantite actuelle par depot
- Valeur du stock (methode CUMP)
- Indicateur d'alerte (rouge si en dessous du seuil)

### 6.3 Mouvements de stock

Trois types de mouvements :

| Type | Description |
|------|-------------|
| **Entree** | Reception de marchandise (achat, retour) |
| **Sortie** | Expedition de marchandise (vente, perte) |
| **Ajustement** | Correction apres inventaire |

Pour creer un mouvement :
1. Cliquez sur **+ Nouveau Mouvement**
2. Selectionnez le type, le produit et le depot
3. Indiquez la quantite et le prix unitaire
4. Ajoutez une reference (numero de BL, facture fournisseur...)
5. Cliquez sur **Enregistrer**

### 6.4 Transferts inter-depots

Pour transferer du stock entre depots :
1. Cliquez sur **Transfert**
2. Selectionnez le produit, le depot source et le depot destination
3. Indiquez la quantite
4. Cliquez sur **Transferer**

### 6.5 Alertes de stock

Consultez la page **Alertes** pour voir tous les produits dont le stock est inferieur au seuil d'alerte defini.

---

## 7. Paiements et Tresorerie

**Acceder :** Menu lateral → Paiements

### 7.1 Enregistrer un paiement

1. Cliquez sur **+ Nouveau Paiement**
2. Selectionnez le type : **Client** ou **Fournisseur**
3. Choisissez le mode de paiement :
   - **Especes** : pas de compte bancaire requis
   - **Cheque** : numero de cheque + compte bancaire
   - **Virement** : reference + compte bancaire
   - **Orange Money** : numero de telephone + reference transaction
   - **Wave** : numero de telephone + reference transaction
4. Selectionnez la facture concernee
5. Saisissez le montant (total ou partiel)
6. Cliquez sur **Enregistrer** (statut : Brouillon)

### 7.2 Valider un paiement

La validation genere :
- Un **numero de paiement** sequentiel (PA-2026-XXXXX)
- Une **ecriture comptable** automatique
- La mise a jour du **statut de la facture** (partiellement payee ou payee)

### 7.3 Comptes bancaires

**Acceder :** Menu lateral → Paiements → Comptes Bancaires

Chaque compte bancaire est lie a un compte comptable (classe 5).

### 7.4 Tresorerie

La page **Tresorerie** presente :
- Solde de chaque compte bancaire
- Solde de la caisse
- Total disponible
- Evolution sur la periode

### 7.5 Echeancier

L'echeancier affiche toutes les factures avec leur date d'echeance et le montant restant a payer, classes par urgence.

---

## 8. Comptabilite SYSCOHADA

**Acceder :** Menu lateral → Comptabilite

### 8.1 Plan Comptable

Le plan comptable est conforme a la norme SYSCOHADA/OHADA avec 8 classes :

| Classe | Intitule |
|--------|----------|
| 1 | Comptes de capitaux |
| 2 | Comptes d'immobilisations |
| 3 | Comptes de stocks |
| 4 | Comptes de tiers |
| 5 | Comptes de tresorerie |
| 6 | Comptes de charges |
| 7 | Comptes de produits |
| 8 | Comptes speciaux |

Plus de 130 comptes sont pre-configures. Vous pouvez ajouter des sous-comptes specifiques.

### 8.2 Ecritures Comptables

#### Ecritures automatiques

Les ecritures sont generees automatiquement lors de :
- **Validation d'une facture** : Debit 411 (Clients) / Credit 701 (Ventes) + 4431 (TVA collectee)
- **Validation d'un paiement** : Debit 521 (Banque) ou 571 (Caisse) / Credit 411 (Clients)
- **Avoir** : Ecritures inverses

#### Saisir une ecriture manuelle (OD)

1. Cliquez sur **+ Nouvelle Ecriture**
2. Selectionnez le journal (**OD** pour operations diverses)
3. Saisissez la date et le libelle
4. Ajoutez les lignes (minimum 2) :
   - Pour chaque ligne : compte, libelle, debit ou credit
   - **Regle** : Total des debits = Total des credits
5. Cliquez sur **Enregistrer** (statut : Brouillon)
6. Pour valider definitivement, cliquez sur **Valider**

#### Contrepassation

Pour annuler une ecriture validee, utilisez la **contrepassation** : une nouvelle ecriture inverse est creee automatiquement.

#### Lettrage

Le lettrage permet de rapprocher les factures et les paiements d'un meme client :
1. Selectionnez les lignes d'ecriture a lettrer (meme compte, solde equilibre)
2. Attribuez un code de lettrage
3. Cliquez sur **Lettrer**

### 8.3 Journaux

| Code | Journal |
|------|---------|
| VE | Ventes |
| AC | Achats |
| BQ | Banque |
| CA | Caisse |
| OD | Operations Diverses |

### 8.4 Exercice Comptable

Un exercice comptable couvre une annee civile (1er janvier au 31 decembre).

**Cloture de l'exercice :**
1. Verifiez que toutes les ecritures sont validees
2. Cliquez sur **Cloturer l'exercice**
3. Le systeme verifie l'equilibre des comptes et genere les ecritures de cloture

### 8.5 Etats Financiers

| Etat | Description |
|------|-------------|
| **Grand Livre** | Detail de tous les mouvements par compte |
| **Balance** | Solde de chaque compte (debit, credit, solde) |
| **Bilan** | Actif / Passif a une date donnee |
| **Compte de Resultat** | Charges / Produits sur une periode |
| **Declaration TVA** | TVA collectee - TVA deductible |
| **Export FEC** | Fichier des Ecritures Comptables (conformite DGI) |

#### Export FEC

Le **Fichier des Ecritures Comptables** est un export au format texte tabule, conforme aux exigences de la Direction Generale des Impots du Senegal. Il contient l'integralite des ecritures comptables de l'exercice.

---

## 9. Administration

**Acceder :** Menu lateral → Administration (role Admin uniquement)

### 9.1 Gestion des Utilisateurs

- Creer, modifier, desactiver des comptes utilisateurs
- Attribuer des roles
- Reinitialiser les mots de passe

### 9.2 Roles et Permissions

- Consulter les roles existants et leurs permissions
- Creer des roles personnalises avec des permissions granulaires
- Chaque permission suit le format `module:action`

### 9.3 Informations Entreprise

Configurez les informations de votre entreprise :
- Raison sociale, forme juridique
- NINEA et RCCM
- Adresse, telephone, email
- Logo (affiche sur les factures et devis)

### 9.4 Parametres

- Devise par defaut (XOF)
- Format de numerotation des documents
- Parametres d'envoi d'emails
- Taux de TVA par defaut

### 9.5 Journal d'Audit

Toutes les actions sont tracees :
- Qui a fait quoi, quand, sur quel document
- Filtrage par utilisateur, module, date
- Statistiques d'activite

---

## 10. FAQ et Depannage

### Q: Comment modifier une facture validee ?

Une facture validee ne peut pas etre modifiee (conformite DGI). Pour corriger une erreur, creez une **facture d'avoir** depuis la facture concernee, puis creez une nouvelle facture.

### Q: Comment annuler un paiement ?

Depuis le detail du paiement, cliquez sur **Annuler**. Une ecriture de contrepassation sera automatiquement creee et le montant paye de la facture sera ajuste.

### Q: Le stock affiche une quantite negative, est-ce normal ?

Non. Une quantite negative indique un probleme de coherence. Effectuez un **inventaire** et creez un mouvement d'**ajustement** pour corriger le stock.

### Q: Comment exporter les donnees pour le comptable ?

Utilisez l'**Export FEC** dans le menu Comptabilite. Ce fichier est au format standard accepte par la DGI et la plupart des logiciels comptables.

### Q: J'ai oublie mon mot de passe

Cliquez sur **Mot de passe oublie** sur la page de connexion. Un email avec un lien de reinitialisation vous sera envoye (valide 10 minutes).

### Q: Les notifications ne s'affichent pas en temps reel

Verifiez que votre connexion Internet est stable. Les notifications temps reel utilisent les WebSockets. Si le probleme persiste, rechargez la page.

### Q: Comment sauvegarder les donnees ?

En production avec Docker, une sauvegarde automatique MongoDB est configuree (2h du matin chaque jour). Pour une sauvegarde manuelle :
```bash
docker compose exec mongodb mongodump --out /backup
```

### Q: L'application est lente

- Verifiez que Redis est actif (cache des donnees frequentes)
- Verifiez les indexes MongoDB
- Utilisez Chrome DevTools pour identifier les goulots d'etranglement
- En developpement, desactivez les extensions de navigateur

### Support

Pour toute question technique, consultez :
- **Documentation API** : `docs/API.md`
- **Guide d'installation** : `docs/INSTALLATION.md`
