# 🎫 Bot Discord de Tickets (Node.js & SQLite)

Un bot Discord complet, moderne et modulaire de gestion de tickets développé en **Node.js** avec **discord.js v14** et **better-sqlite3**.

---

## 🌟 Fonctionnalités

- **Panneau persistant (`/setup-tickets`)** : Envoi d'un embed d'accueil élégant avec bouton d'ouverture dans le salon de votre choix. Fonctionne 24h/24 même après redémarrage du bot.
- **Menu dynamique & Modals** : Sélection de la catégorie (Support, Recrutement, Signalement, etc.) suivie d'un formulaire interactif (Modal) demandant le motif détaillé.
- **Salons privés sécurisés** :
  - Création automatique au format `ticket-<pseudo>-<numéro>` (ex: `ticket-jean-0001`).
  - Permissions strictes : visible uniquement par l'auteur, les rôles Staff configurés et le bot (`@everyone` masqué).
- **Actions rapides par boutons** :
  - 🔒 **Fermer** : Déclenche la procédure de fermeture avec demande de confirmation.
  - 🙋‍♂️ **Réclamer (Claim)** : Permet à un membre du staff de prendre en charge le ticket.
  - ➕ **Ajouter un membre** : Ouvre un menu interactif pour inviter un utilisateur directement dans le salon.
- **Transcripts HTML modernes & complets** :
  - Génération d'une archive HTML autonome reprenant le thème sombre de Discord (avatars, pseudos, messages, embeds, pièces jointes et horodatages).
  - Envoi automatique du transcript dans le salon de logs et en **message privé (MP)** à l'auteur du ticket.
- **Commandes Staff dédiées** :
  - `/ticket add <utilisateur>` : Ajouter un membre au ticket.
  - `/ticket remove <utilisateur>` : Retirer un membre du ticket.
  - `/ticket rename <nom>` : Renommer le salon de ticket.
  - `/ticket priority <low|medium|high|urgent>` : Définir la priorité.
  - `/ticket close` : Fermer le ticket.
- **Système anti-spam & limites** :
  - Limite personnalisable du nombre de tickets ouverts simultanés par membre et par catégorie.
  - Cooldown anti-spam paramétrable entre chaque ouverture.
- **Configuration dynamique via `/config`** :
  - `/config view` : Affiche l'ensemble des paramètres du serveur.
  - `/config logs <#salon>` : Configure le salon des logs d'actions.
  - `/config category <#catégorie>` : Définit la catégorie Discord où créer les tickets.
  - `/config staff-role <add|remove> <@role>` : Gère les rôles ayant accès aux tickets.
  - `/config ticket-types <list|add|remove>` : Gère les types/catégories de tickets disponibles.
  - `/config delay <secondes>` : Règle le délai avant suppression du salon après fermeture.
  - `/config limit <nombre>` : Règle la limite max de tickets par membre.
  - `/config cooldown <secondes>` : Règle le temps de recharge anti-spam.

---

## 📁 Arborescence du Projet

```text
bot_ticket/
├── .env.example              # Modèle des variables d'environnement
├── .gitignore                # Exclusion node_modules, base SQLite, .env
├── deploy-commands.js        # Script d'enregistrement des slash commands
├── package.json              # Dépendances et scripts npm
├── README.md                 # Documentation complète d'installation et d'utilisation
├── data/                     # Dossier de persistance SQLite (généré automatiquement)
│   └── tickets.db
└── src/
    ├── index.js              # Point d'entrée principal du bot
    ├── config/
    │   └── constants.js      # Couleurs, emojis, priorités et valeurs par défaut
    ├── db/
    │   ├── database.js       # Initialisation better-sqlite3 (mode WAL)
    │   ├── schema.sql        # Schéma des tables SQLite
    │   └── repositories/
    │       ├── configRepository.js # Accès aux données de configuration
    │       └── ticketRepository.js # Gestion des tickets et compteurs
    ├── services/
    │   ├── ticketService.js     # Logique métier des tickets (création, claim, fermeture)
    │   ├── transcriptService.js # Récupération des messages et génération HTML
    │   └── logService.js        # Envoi des embeds de logs
    ├── commands/
    │   ├── setup-tickets.js  # Commande /setup-tickets
    │   ├── ticket.js         # Sous-commandes /ticket (add, remove, rename, priority...)
    │   └── config.js         # Commande de configuration /config
    ├── events/
    │   ├── ready.js             # Événement de démarrage
    │   ├── interactionCreate.js # Routeur de commandes, boutons, menus et modals
    │   └── channelDelete.js     # Détection de suppression manuelle de salon
    └── utils/
        ├── cooldown.js          # Gestion du cooldown anti-spam
        ├── embedBuilder.js      # Fabrique d'embeds stylisés
        └── permissionHelper.js  # Vérifications de droits Staff et Admin
```

---

## ⚙️ Prérequis

- [Node.js](https://nodejs.org/) version **16.9.0** ou supérieure (v18, v20, v22 ou v24 recommandées).
- Un compte Discord et une application créée sur le [Discord Developer Portal](https://discord.com/developers/applications).

---

## 🔑 Permissions et Privileged Intents Discord

### 1. Activer les Privileged Gateway Intents
Dans le [Discord Developer Portal](https://discord.com/developers/applications) :
1. Sélectionnez votre application -> onglet **Bot**.
2. Dans la section **Privileged Gateway Intents**, activez :
   - **Message Content Intent** *(Requis pour lire le contenu des messages afin de générer les transcripts HTML)*.
   - **Server Members Intent** *(Recommandé pour récupérer les membres et avatars)*.

### 2. Permissions du Bot dans le serveur
Lors de la génération de l'URL d'invitation (onglet **OAuth2** -> **URL Generator**, cochez `bot` et `applications.commands`) :
- **Manage Channels** (Gérer les salons : indispensable pour créer et supprimer les salons de tickets)
- **Manage Roles / Permissions** (Modifier les permissions du salon privé)
- **View Channels** (Voir les salons)
- **Send Messages** (Envoyer des messages)
- **Embed Links** (Intégrer des liens)
- **Attach Files** (Joindre des fichiers pour les transcripts)
- **Read Message History** (Lire l'historique pour générer le transcript)
- **Manage Messages** (Optionnel, utile pour épingler ou gérer l'interface)

---

## 🚀 Installation et Lancement

### Étape 1 : Cloner ou extraire le projet
Ouvrez un terminal dans le dossier du projet :
```bash
cd bot_ticket
```

### Étape 2 : Installer les dépendances
```bash
npm install
```

### Étape 3 : Configurer le fichier `.env`
Copiez le fichier `.env.example` en `.env` :
```bash
cp .env.example .env
```
Éditez le fichier `.env` avec vos informations :
```env
DISCORD_TOKEN=OTkxMjM...votre_token_bot
CLIENT_ID=123456789012345678
GUILD_ID=123456789012345678 # Idéal pour tester immédiatement sur votre serveur de test
```
> 💡 *Astuce : Renseigner `GUILD_ID` déploie les slash commands instantanément sur votre serveur. Si vous laissez `GUILD_ID` vide, le déploiement sera global (peut prendre jusqu'à 1 heure pour se propager).*

### Étape 4 : Déployer les Slash Commands
Exécutez le script d'enregistrement des commandes auprès de Discord :
```bash
npm run deploy
```

### Étape 5 : Démarrer le bot
```bash
npm start
```
Vous devriez voir dans la console :
```text
[COMMANDE] Chargée : /config
[COMMANDE] Chargée : /setup-tickets
[COMMANDE] Chargée : /ticket
[ÉVÉNEMENT] Enregistré : ready
[ÉVÉNEMENT] Enregistré : interactionCreate
[ÉVÉNEMENT] Enregistré : channelDelete
[INFO] Connecté en tant que MonBot#0000 (ID)
```

---

## 📖 Guide d'Utilisation

### 1. Configuration Initiale (Admin)
1. **Définir le salon de logs** :
   ```text
   /config logs salon:#logs-tickets
   ```
2. **Définir la catégorie où créer les tickets** :
   ```text
   /config category categorie:Assistance
   ```
3. **Ajouter un rôle Staff** :
   ```text
   /config staff-role action:Ajouter role:@Modérateur
   ```
4. **Vérifier la configuration** :
   ```text
   /config view
   ```

### 2. Déployer le panneau de tickets
Dans le salon où vous souhaitez que les membres puissent ouvrir un ticket :
```text
/setup-tickets salon:#support
```

### 3. Cycle de vie d'un ticket
1. Le membre clique sur **"Ouvrir un ticket"**.
2. Il choisit un type de demande dans le menu déroulant.
3. Un formulaire modal s'affiche : il renseigne le sujet court et sa description détaillée.
4. Le bot crée automatiquement le salon privé `ticket-<pseudo>-0001` et ping l'auteur et le staff.
5. Un membre du staff peut cliquer sur **🙋‍♂️ Réclamer** pour s'attribuer le ticket.
6. En cliquant sur **➕ Ajouter un membre**, on peut ajouter un utilisateur tiers au salon.
7. Quand la demande est résolue, n'importe quel membre autorisé ou le créateur clique sur **🔒 Fermer** puis valide la confirmation.
8. Le transcript HTML est généré, envoyé dans les logs et en MP au membre, puis le salon est supprimé automatiquement.

---

## 🛡️ Robustesse et Conception Technique
- **Persistance totale** : Les boutons et menus utilisent des identifiants `customId` structurés (`ticket_close:<id>`, `ticket_claim:<id>`). Redémarrer le bot ne casse aucune interaction active.
- **Base de données SQLite performante** : Conçue avec `better-sqlite3` en mode Write-Ahead Logging (WAL) pour des lectures/écritures atomiques sans latence.
- **Gestion des interactions expirées** : Tous les traitements asynchrones utilisent `deferReply()` ou `isRepliable()` pour prévenir les erreurs HTTP 40060 (Unknown Interaction).
