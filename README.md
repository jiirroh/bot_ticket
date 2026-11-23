# 🎫 Bot Discord de Tickets (Node.js & SQLite)

Un bot Discord complet, moderne et modulaire de gestion de tickets développé en **Node.js** avec **discord.js v14** et **better-sqlite3**, supportant le mode **Multi-Serveurs & Serveur Staff Centralisé**.

---

## 🌟 Fonctionnalités

- **Support Inter-Serveurs & Serveur Staff dédié** :
  - Déployez les panneaux et créez les tickets sur votre **Serveur Public**.
  - Configurez le bot et **recevez tous les logs d'actions (ouvertures, prises en charge, fermetures, transcripts HTML)** directement dans un salon dédié sur votre **Serveur Staff**.
  - Consultez les tickets actifs de n'importe quel serveur avec `/ticket list`.
- **Panneau persistant (`/setup-tickets`)** : Envoi d'un embed d'accueil élégant avec bouton d'ouverture dans le salon de votre choix (localement ou à distance via `salon_id`).
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
  - Envoi automatique du transcript dans le salon de logs (sur le serveur Staff) et en **message privé (MP)** à l'auteur du ticket.
- **Commandes Staff dédiées** :
  - `/ticket list [serveur_id]` : Afficher la liste des tickets ouverts.
  - `/ticket add <utilisateur>` : Ajouter un membre au ticket.
  - `/ticket remove <utilisateur>` : Retirer un membre du ticket.
  - `/ticket rename <nom>` : Renommer le salon de ticket.
  - `/ticket priority <low|medium|high|urgent>` : Définir la priorité.
  - `/ticket close` : Fermer le ticket.
- **Système anti-spam & limites** :
  - Limite personnalisable du nombre de tickets ouverts simultanés par membre et par catégorie.
  - Cooldown anti-spam paramétrable entre chaque ouverture.
- **Configuration avancée via `/config` (supporte `serveur_id`)** :
  - `/config servers` : Liste tous les serveurs où se trouve le bot avec leurs IDs.
  - `/config view [serveur_id]` : Affiche l'ensemble des paramètres d'un serveur.
  - `/config logs [salon] [salon_id] [serveur_id]` : Définit le salon de logs (peut être sur le serveur Staff).
  - `/config category [categorie] [categorie_id] [serveur_id]` : Définit la catégorie Discord où créer les tickets.
  - `/config staff-role <add|remove> [role] [role_id] [serveur_id]` : Gère les rôles ayant accès aux tickets.
  - `/config ticket-types <list|add|remove> ... [serveur_id]` : Gère les types/catégories de tickets disponibles.
  - `/config delay <secondes> [serveur_id]` : Règle le délai avant suppression du salon après fermeture.
  - `/config limit <nombre> [serveur_id]` : Règle la limite max de tickets par membre.
  - `/config cooldown <secondes> [serveur_id]` : Règle le temps de recharge anti-spam.

---

## 🏢 Mode Inter-Serveurs : Serveur Public ➔ Serveur Staff

Ce mode vous permet de piloter le bot depuis un **Serveur Staff privé**, tout en laissant les membres ouvrir des tickets sur un **Serveur Public**.

### 1. Inviter le bot sur les deux serveurs
Ajoutez le bot avec les permissions requises à la fois sur :
- Votre **Serveur Public** (où les tickets seront ouverts).
- Votre **Serveur Staff** (où les logs seront centralisés).

### 2. Récupérer l'ID du Serveur Public
Depuis le Serveur Staff, tapez :
```text
/config servers
```
Copiez l'identifiant du Serveur Public (ex: `111222333444555666`).

### 3. Diriger les logs du Serveur Public vers un salon du Serveur Staff
Sur le Serveur Staff, dans le salon `#logs-tickets-public` que vous souhaitez utiliser :
```text
/config logs salon:#logs-tickets-public serveur_id:111222333444555666
```
> 🎉 **C'est tout !** Tous les logs de tickets du Serveur Public (ouvertures, prises en charge, fermetures, transcripts HTML) arriveront en temps réel dans `#logs-tickets-public` sur votre Serveur Staff !

### 4. Déployer le panneau sur le Serveur Public depuis le Serveur Staff
Vous pouvez même déployer le panneau d'assistance directement avec son ID de salon :
```text
/setup-tickets salon_id:999888777666555444
```

---

## 📁 Arborescence du Projet

```text
bot_ticket/
├── .env.example              # Modèle des variables d'environnement
├── .gitignore                # Exclusion node_modules, base SQLite, .env
├── deploy-commands.js        # Script de déploiement des slash commands (multi-serveurs / global)
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
    │       ├── configRepository.js # Accès aux données de configuration (multi-serveurs)
    │       └── ticketRepository.js # Gestion des tickets, compteurs et statuts
    ├── services/
    │   ├── ticketService.js     # Logique métier des tickets (création, claim, fermeture)
    │   ├── transcriptService.js # Récupération des messages et génération HTML
    │   └── logService.js        # Envoi des embeds de logs (supporte les salons cross-serveur)
    ├── commands/
    │   ├── setup-tickets.js  # Commande /setup-tickets (supporte salon distant)
    │   ├── ticket.js         # Sous-commandes /ticket (add, remove, rename, priority, list)
    │   └── config.js         # Commande de configuration /config (supporte serveur_id)
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

### 2. Permissions du Bot dans les serveurs
Lors de la génération de l'URL d'invitation (onglet **OAuth2** -> **URL Generator**, cochez `bot` et `applications.commands`) :
- **Manage Channels** (Créer et supprimer les salons de tickets)
- **Manage Roles / Permissions** (Configurer les permissions privées du salon)
- **View Channels** (Voir les salons)
- **Send Messages** (Envoyer des messages)
- **Embed Links** (Intégrer des liens)
- **Attach Files** (Joindre les transcripts HTML)
- **Read Message History** (Historique de messages pour le transcript)
- **Manage Messages** (Gestion des composants et messages)

---

## 🚀 Installation et Lancement

### Étape 1 : Installer les dépendances
```bash
npm install
```

### Étape 2 : Configurer le fichier `.env`
Copiez le fichier `.env.example` en `.env` :
```env
DISCORD_TOKEN=votre_token_bot
CLIENT_ID=votre_client_id
# Optionnel : IDs séparés par des virgules pour un déploiement instantané sur vos serveurs de test
GUILD_ID=id_serveur_staff,id_serveur_public
```

### Étape 3 : Déployer les Slash Commands
```bash
npm run deploy
```

### Étape 4 : Démarrer le bot
```bash
npm start
```
