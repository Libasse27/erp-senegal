# Guide Utilisateur — ERP GesCom-Compta Sénégal

Ce guide est organisé par profil d'utilisateur. Chaque section décrit les fonctionnalités accessibles selon le rôle.

---

## Table des matières

1. [Connexion et navigation](#connexion-et-navigation)
2. [Profil : Administrateur](#profil--administrateur)
3. [Profil : Manager](#profil--manager)
4. [Profil : Comptable](#profil--comptable)
5. [Profil : Commercial / Vendeur](#profil--commercial--vendeur)
6. [Profil : Gestionnaire de stock](#profil--gestionnaire-de-stock)
7. [Profil : Caissier](#profil--caissier)
8. [Profil : RH](#profil--rh)
9. [Profil : Super Admin](#profil--super-admin)
10. [Modules transversaux](#modules-transversaux)

---

## Connexion et navigation

### Se connecter

1. Ouvrir l'application dans le navigateur
2. Saisir votre adresse email et mot de passe
3. Cliquer sur **Connexion**

> Les tokens d'accès expirent après 7 jours. La session se renouvelle automatiquement via le refresh token (30 jours).

### Interface principale

- **Sidebar gauche** — Menu de navigation. Les rubriques affichées dépendent de vos permissions.
- **Tableau de bord** — Vue d'ensemble avec KPIs temps réel.
- **Notifications** — Cloche en haut à droite pour les alertes (stock, paiements, congés en attente…).

---

## Profil : Administrateur

L'administrateur gère l'ensemble de l'entreprise. Il a accès à tous les modules.

### Gestion des utilisateurs

`SYSTEME > Utilisateurs`

- Créer des comptes avec rôle et permissions
- Activer / désactiver un compte
- Réinitialiser un mot de passe
- Consulter le journal d'audit (qui a fait quoi, quand)

### Configuration de l'entreprise

`SYSTEME > Entreprise`

- Modifier les informations légales (NINEA, RCCM, adresse)
- Configurer le logo, les mentions sur les factures
- Paramétrer la TVA et les conditions de paiement par défaut

### Gestion de l'abonnement

`ABONNEMENT > Mon Abonnement`

- Consulter le forfait actif et la date d'expiration
- Voir l'usage (factures du mois, utilisateurs actifs)
- Lancer un paiement Wave ou Orange Money pour renouveler

---

## Profil : Manager

Le manager supervise l'activité commerciale et financière.

### Tableau de bord global

`Tableau de bord`

KPIs disponibles :
- Chiffre d'affaires du mois / trimestre / année
- Nombre de factures en attente de paiement
- Stock faible (alertes)
- Trésorerie nette

### Rapports et analyses

`ANALYSE > Rapports`

- Rapport CA par client, produit, commercial
- Export Excel / PDF des rapports
- Comparaison budget vs réalisé (`ANALYSE > Budget & Prévisions`)

### Budget & Prévisions

`ANALYSE > Budget & Prévisions`

1. **Onglet Comparaison** — Vue agrégée : montant prévu vs réalisé par catégorie, taux de réalisation, graphiques
2. **Onglet Lignes budgétaires** — Détail de chaque ligne, possibilité de modifier ou supprimer

Pour créer un budget :
1. Cliquer sur **Nouveau budget**
2. Choisir l'année et éventuellement le mois (laisser vide = budget annuel)
3. Sélectionner le type (Produit / Charge) et la catégorie
4. Saisir le montant prévisionnel en FCFA
5. Enregistrer

---

## Profil : Comptable

Le comptable gère la comptabilité SYSCOHADA et les états financiers.

### Plan comptable

`COMPTABILITE > Plan Comptable`

- Consulter les comptes OHADA (classes 1 à 8)
- Rechercher un compte par numéro ou libellé

### Écritures comptables

`COMPTABILITE > Ecritures`

- Consulter toutes les écritures générées automatiquement par les transactions
- Saisir des écritures manuelles (OD — Opérations Diverses)
- Lettrer les écritures d'une même contrepartie

### États financiers

| Page | Description |
|------|-------------|
| Grand Livre | Toutes les écritures par compte avec solde progressif |
| Balance | Balance des comptes à 4 colonnes (débit/crédit mouvement + soldes) |
| Compte de Résultat | Produits vs Charges (classes 7 et 6) |
| Bilan | Actif / Passif selon SYSCOHADA |
| Déclaration TVA | TVA collectée vs TVA déductible, solde à reverser |

### Export FEC

`COMPTABILITE > Ecritures > Exporter FEC`

Génère le Fichier des Écritures Comptables conforme DGI Sénégal.

### Exercices comptables

`COMPTABILITE > Exercices`

- Ouvrir un nouvel exercice
- Clôturer l'exercice (génère les écritures de clôture automatiquement)

---

## Profil : Commercial / Vendeur

### Cycle de vente complet

```
Client → Devis → Commande → Bon de livraison → Facture → Paiement
```

### Devis

`VENTES > Devis`

1. Cliquer **Nouveau devis**
2. Sélectionner le client (ou en créer un nouveau)
3. Ajouter les lignes produits (quantité, prix unitaire, remise)
4. La TVA 18 % est calculée automatiquement
5. Enregistrer → statut **Brouillon**

Actions disponibles sur un devis :
- **Envoyer** — Passe en statut "Envoyé"
- **Convertir en commande** — Crée automatiquement une commande
- **Dupliquer** — Copie le devis pour un nouveau client

### Factures

`VENTES > Factures`

- Générer depuis une commande validée
- Télécharger en **PDF** (Puppeteer, en-tête avec logo de l'entreprise)
- Envoyer par email directement depuis l'application

### Avoirs

`VENTES > Avoirs`

Créer un avoir lorsqu'une facture doit être annulée partiellement ou totalement.

### Recouvrement

`VENTES > Recouvrement`

- Liste des factures impayées avec ancienneté (30j / 60j / 90j+)
- Envoyer une relance par email
- Marquer une créance comme irrécupérable

---

## Profil : Gestionnaire de stock

### Gestion des stocks

`COMMERCIAL > Stocks`

- Consulter les niveaux de stock par entrepôt
- Effectuer un **mouvement** (entrée / sortie / ajustement)

### Alertes de stock

`COMMERCIAL > Alertes stock`

Liste des produits dont le stock est en-dessous du seuil minimum configuré.

### Inventaires

`COMMERCIAL > Inventaires`

1. Créer un nouvel inventaire
2. Saisir les quantités comptées par produit et entrepôt
3. Valider → les ajustements sont enregistrés automatiquement

### Transferts inter-dépôts

`COMMERCIAL > Transferts`

Déplacer du stock d'un entrepôt à un autre avec traçabilité complète.

---

## Profil : Caissier

### Enregistrer un paiement

`FINANCE > Paiements`

1. Sélectionner la facture à encaisser
2. Choisir le mode de paiement (espèces, chèque, virement, Wave, Orange Money)
3. Saisir le montant et la référence de transaction
4. Valider → la facture passe en statut **Payé** et une écriture comptable est générée

### Trésorerie

`FINANCE > Trésorerie`

- Vue des encaissements et décaissements par période
- Solde de chaque compte bancaire
- Rapprochement bancaire (pointer les opérations avec le relevé)

---

## Profil : RH

### Gestion des employés

`RESSOURCES HUMAINES > Employés`

#### Créer un employé

1. Cliquer **Nouvel employé**
2. Remplir : prénom, nom, email, poste, département, type de contrat (CDI/CDD/Stage…)
3. Saisir le **salaire brut** en FCFA
4. Les taux de cotisation IPRES (5,6 %) et IR (3 % par défaut) sont pré-remplis
5. Le **salaire net** est calculé en temps réel
6. Enregistrer → un matricule est auto-généré (EMP-YYYY-NNNN)

#### Bulletin de paie

Sur la fiche d'un employé :
1. Aller dans l'onglet / section **Bulletin de paie**
2. Choisir le mois et l'année
3. Cliquer **Générer les écritures comptables**
   - D.661 — Rémunérations brutes
   - C.421 — Rémunérations dues (salaire net)
   - C.431 — IPRES (cotisations salariales)
   - C.447 — IR retenu à la source

### Gestion des congés

`RESSOURCES HUMAINES > Congés`

#### Créer une demande

1. Cliquer **Nouvelle demande**
2. Sélectionner l'employé
3. Choisir le type (congé annuel, maladie, maternité, paternité, sans solde, autre)
4. Saisir les dates de début et de fin
5. Le **nombre de jours ouvrables** est calculé automatiquement (week-ends exclus)
6. Enregistrer → statut **En attente**

#### Approuver ou refuser

1. Ouvrir la demande
2. Cliquer **Approuver** ou **Refuser**
3. Ajouter un commentaire RH (optionnel)

---

## Profil : Super Admin

Le Super Admin gère la **plateforme** SaaS (toutes les entreprises). Il n'a pas accès aux données métier des entreprises clientes.

### Tableau de bord plateforme

`SUPER ADMIN > Tableau de bord SA`

- Nombre d'entreprises actives / en essai / suspendues
- Revenu mensuel récurrent (MRR) en FCFA
- Nouvelles inscriptions du mois

### Gestion des entreprises

`SUPER ADMIN > Entreprises`

- Consulter la liste de toutes les entreprises
- Voir les détails (forfait, statut abonnement, nombre d'utilisateurs)
- Suspendre / réactiver une entreprise
- Étendre manuellement un abonnement

### Monitoring

`SUPER ADMIN > Monitoring`

- Temps de réponse API
- Taux d'erreur
- Utilisation mémoire / CPU du serveur

### Journaux système

`SUPER ADMIN > Journaux système`

Logs serveur avec niveau (info, warn, error) et filtres par date et module.

### Matrice RBAC

`SUPER ADMIN > Matrice RBAC`

Vue globale des rôles et permissions. Permet de créer / modifier des rôles et d'ajuster les permissions par module.

---

## Modules transversaux

### CRM — Pipeline Commercial

`CRM > Pipeline Commercial`

Le pipeline suit les opportunités de vente à travers 6 étapes :

```
Prospect → Qualification → Proposition → Négociation → Gagné / Perdu
```

#### Vue Kanban

Chaque colonne représente une étape. Les cartes affichent le titre, le client, le montant estimé et la probabilité.

- Cliquer sur **→** pour avancer une opportunité à l'étape suivante
- Cliquer sur la carte pour voir le détail

#### Créer une opportunité

1. Cliquer **Nouvelle opportunité**
2. Saisir le titre, sélectionner le client et le commercial responsable
3. Renseigner le montant estimé et la date d'échéance
4. La probabilité est pré-remplie selon l'étape (10 % → 75 %)
5. Enregistrer → référence auto-générée (OPP-YYYY-NNNN)

#### Activités sur une opportunité

Dans le détail d'une opportunité :
- Ajouter une activité (appel 📞, email 📧, réunion 🤝, démonstration 🖥️, relance 🔔)
- Marquer une activité comme **réalisée** (✓)
- Saisir le résultat / outcome

#### Convertir en devis

Quand une opportunité est suffisamment avancée :
1. Ouvrir le détail de l'opportunité
2. Cliquer **Convertir en devis**
3. Un devis brouillon est créé automatiquement avec le client et l'objet pré-remplis
4. Compléter les lignes du devis dans VENTES > Devis

### Notifications

La cloche en haut de l'écran affiche les alertes en temps réel :
- Stock sous le seuil minimum
- Factures impayées depuis plus de 30 jours
- Congés en attente d'approbation
- Abonnement expirant dans moins de 7 jours
- Nouvelles commandes reçues

---

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + /` | Ouvrir / fermer le menu |
| `Ctrl + F` | Recherche globale |
| `Echap` | Fermer une modale |

---

*Guide utilisateur ERP GesCom-Compta Sénégal — Version 1.0 — Juin 2026*
