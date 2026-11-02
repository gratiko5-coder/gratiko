# GRATIKO — Plateforme Internationale de Tickets Virtuels à Gratter & Jeux Instantanés

**GRATIKO** est une plateforme numérique de jeux instantanés et de tickets virtuels à gratter, conçue pour un lancement initial en **Haïti** (en Gourdes Haïtiennes - HTG) avec une architecture prête pour l'expansion aux Caraïbes et en Afrique.

---

## 1. Architecture & Piliers Techniques

GRATIKO est conçu selon les standards les plus stricts de sécurité applicative et d'intégrité financière :

### A. Moteur de Résultats Cryptographique (CSPRNG) & Scellement
* Le résultat de chaque ticket est déterminé **côté serveur** dès l'achat via `crypto.randomInt` (Node.js CSPRNG).
* L'animation de grattage (HTML5 Canvas avec support tactile et souris) n'est qu'un mécanisme visuel de révélation : le navigateur ne peut en aucun cas modifier ou relancer le tirage.
* Les tickets vendus sont scellés de manière immuable avec protection contre les doubles clics via une **clé d'idempotence**.

### B. Grand Livre Comptable à Double Entrée (General Ledger)
* Chaque flux financier est consigné dans un plan comptable rigoureux :
  - `1010-CASH-VAULT` (Actif) : Trésorerie disponible réellement déposée.
  - `2010-PLAYER-BALANCES` (Passif) : Sommes dues aux joueurs (soldes disponibles).
  - `2020-PENDING-WITHDRAWALS` (Passif) : Retraits demandés et verrouillés.
  - `4010-GROSS-SALES` (Produit) : Recettes brutes de vente de tickets.
  - `5010-RESERVE-FUND` (Capitaux Propres / Réserve) : Réserve prudentielle 40%.
  - `5020-PRIZE-POOL` (Passif) : Cagnotte allouée aux lots gagnants.
  - `7010-OPERATOR-COMMISSION` (Produit Net) : Commission opérateur 20%.
* Vérification automatique d'équilibre comptable : **Total Débit = Total Crédit** sur chaque opération.

### C. Modèle Économique & Répartition Financière Initiale
Pour un ticket standard à **100 HTG** :
- **Commission Opérateur cible (20%)** : 20 HTG
- **Allocation Jeu cible (80%)** : 80 HTG
- **Réserve Quotidienne Prudentielle (40% de l'allocation)** : 32 HTG
- **Cagnotte théorique restante pour les gains** : 48 HTG

### D. Gestion par Lots (Batches)
* Les tickets sont émis par lots contrôlés de taille définie (ex: 1 000 tickets).
* Les probabilités et montants de chaque palier de gain sont scellés dans un snapshot immuable lors de la publication du lot.

### E. Contrôle d'Accès par Rôles (RBAC)
* `SUPER_ADMIN` : Vue globale, gestion financière internationale, audits, paramétrage des cotes.
* `COUNTRY_ADMIN` : Gestion des opérations autorisées du marché local.
* `VERIFIER` : Traitement et approbation des recharges manuelles.
* `AUDITOR` : Consultation du grand livre et des journaux d'audit en lecture seule.
* `PLAYER` : Consultation du portefeuille, achat, grattage, demandes de recharge et retrait.

### F. Multilinguisme Intégral
* Externalisation totale des textes en **Créole Haïtien (ht)**, **Français (fr)**, **Anglais (en)** et **Espagnol (es)**.
* Sélecteur de langue persistant dans l'en-tête.

---

## 2. Prérequis & Installation

### Prérequis
* Node.js v18+ (testé et validé sous Node.js v24 LTS)
* npm v10+

### Installation des dépendances
```bash
npm install
```

### Configuration des variables d'environnement
Copiez le fichier `.env.example` vers `.env` :
```env
NEXT_PUBLIC_APP_MODE="DEMO"
APP_MODE="DEMO"
DATABASE_URL="file:./dev.db"
JWT_SECRET="votre-cle-secrete-jwt-tres-longue-et-aleatoire-min-32-caracteres"
DEFAULT_COUNTRY_CODE="HT"
DEFAULT_CURRENCY="HTG"
DEFAULT_LOCALE="fr"
```

### Initialisation de la Base de Données & Données Démo
Générez le client Prisma, appliquez le schéma et chargez les données de démonstration :
```bash
npx prisma generate
npx prisma db push
npm run seed
```

---

## 3. Lancement de l'Application

### En mode Développement
```bash
npm run dev
```
L'application est disponible sur : [http://localhost:3000](http://localhost:3000)

### En mode Production
```bash
npm run build
npm start
```

---

## 4. Comptes de Démonstration Préconfigurés

En mode démo, des comptes avec argent fictif sont disponibles pour tester tous les parcours sans transfert d'argent réel :

| Rôle | Email | Mot de passe | Description |
| :--- | :--- | :--- | :--- |
| **Joueur Démo** | `joueur@gratiko.demo` | `GratikoPlayer2026!` | Portefeuille pré-crédité avec 1 000 HTG fictifs |
| **Super Administrateur** | `superadmin@gratiko.demo` | `GratikoAdmin2026!` | Tableau de bord financier, grand livre, validation |
| **Admin Pays (Haïti)** | `admin.haiti@gratiko.demo` | `GratikoAdmin2026!` | Opérations régionales et supervision des retraits |

---

## 5. Exécution des Tests Automatisés

Le projet comprend une suite complète de tests unitaires, d'intégration et E2E (Vitest) couvrant :
- Hachage cryptographique des mots de passe (bcrypt) et signature JWT (jose).
- Vérification stricte des permissions RBAC.
- Distribution statistique et CSPRNG du moteur de grattage.
- Respect rigoureux de la conservation des fonds (20% comm / 32% réserve / 48% jeu).
- Équilibre strict Débit = Crédit au Grand Livre.
- Parcours complet E2E : inscription, achat idempotent, révélation, réclamation de gain, recharge et retrait.
- Dictionnaires i18n et formateur monétaire HTG.

Pour lancer tous les tests :
```bash
npm run test
```

---

## 6. Liste des Fonctionnalités Implémentées

- [x] Interface Joueur Mobile-First responsive & PWA-ready.
- [x] Surface de grattage interactive en HTML5 Canvas (doigt & souris) + bouton d'accessibilité.
- [x] Résultat de ticket scellé sur le serveur dès l'achat.
- [x] Protection contre les doubles achats et les répétitions de clics (idempotence).
- [x] Grand livre à double entrée et calcul automatique de solvabilité.
- [x] Ventilation financière automatique : 20% commission, 40% de 80% en réserve prudentielle, cagnotte restante.
- [x] Système de recharge manuelle avec file d'attente d'approbation administrative.
- [x] Système de demande de retrait avec verrouillage immédiat des fonds disponibles et quittance de virement.
- [x] Console Super-Administrateur avec indicateur de solvabilité temps réel, balances de comptes et audits.
- [x] Gestion des lots de tickets et vérification de la somme des probabilités à 100%.
- [x] Internationalisation complète (Français, Créole Haïtien, Anglais, Espagnol).
- [x] Pages officielles de transparence, règles des jeux, conditions d'utilisation et jeu responsable.
- [x] Bannière persistante et garde-fous identifiant le mode de démonstration avec argent fictif.

---

## 7. Étapes Restant Avant Lancement en Argent Réel

> **IMPORTANT :** Conformément aux exigences de conformité et de protection des joueurs :
1. **Agréments Juridiques & Réglementaires** : Obtenir les licences et autorisations nécessaires auprès des autorités compétentes en République d'Haïti.
2. **Intégration d'APIs Directes de Paiement** : Remplacer la recharge manuelle déclarative par les passerelles API directes avec webhooks signés (MonCash API marchande Digicel, NatCash API, passerelles bancaires locales).
3. **Vérification d'Identité (KYC)** : Intégrer un module de contrôle automatisé des pièces d'identité et de l'âge des joueurs avant retrait.
4. **Base de Données de Production** : Migrer la source Prisma vers PostgreSQL en haute disponibilité avec sauvegardes chiffrées quotidiennes (`pg_dump`).
5. **Gestion des Secrets** : Déployer les secrets réels (JWT_SECRET, credentials API) via un coffre-fort cloud sécurisé (ex: AWS Secrets Manager / HashiCorp Vault) sans aucune valeur par défaut dans le dépôt.
