# 🎫 Bot Discord de Tickets (Node.js & SQLite)

Un bot Discord complet, moderne et modulaire de gestion de tickets développé en **Node.js** avec **discord.js v14** et **better-sqlite3**, avec **configuration 100% interactive sur Discord** et **fichier .env ultra-simplifié**.

---

## 🌟 Points Forts & Nouveautés

- **Fichier `.env` ultra-simplifié** : Une seule ligne requise (`DISCORD_TOKEN=...`). Plus besoin de chercher ni de copier-coller de `CLIENT_ID` !
- **Déploiement automatique des commandes Slash** : Dès le lancement (`npm start`), le bot enregistre et synchronise lui-même toutes les commandes Slash auprès de Discord.
- **Assistant Interactif `/setup`** : Configurez vos salons de logs, catégories de tickets, rôles Staff et déployez le panneau d'ouverture directement depuis Discord via des **boutons et menus déroulants natifs** (`ChannelSelect`, `RoleSelect`). Aucune manipulation de commande complexe ni d'identifiants n'est nécessaire !
- **Mode Multi-Serveurs & Serveur Staff Centralisé** : Les tickets peuvent être ouverts sur un Serveur Public pendant que tous les logs et transcripts arrivent sur un Serveur Staff privé.
- **Transcripts HTML autonomes stylisés** : Sauvegarde propre et visuelle reprenant le thème sombre de Discord avec messages, avatars et pièces jointes.

---

## 🚀 Démarrage Rapide en 2 Minutes

### 1. Cloner et installer
```bash
npm install
```

### 2. Remplir le fichier `.env`
Créez un fichier `.env` avec uniquement votre token :
```env
DISCORD_TOKEN=votre_token_bot_ici
```

### 3. Démarrer le bot
```bash
npm start
```
> Le bot démarre et synchronise automatiquement toutes les commandes Slash sur vos serveurs !

---

## ⚙️ Configuration Rapide sur Discord (`/setup`)

Tapez simplement la commande suivante dans n'importe quel salon réservé aux administrateurs :
```text
/setup
```

Un tableau de bord interactif s'affiche :
1. Cliquez sur **📜 Définir le salon de logs** ➔ Choisissez votre salon dans la liste déroulante native.
2. Cliquez sur **📂 Catégorie des tickets** ➔ Sélectionnez la catégorie où créer les tickets.
3. Cliquez sur **🛡️ Rôles Staff** ➔ Cochez les rôles qui ont accès à la gestion des tickets.
4. Cliquez sur **🎫 Poster le panneau de tickets** ➔ Choisissez le salon où afficher l'embed et le bouton "Ouvrir un ticket".
5. Cliquez sur **🔄 Actualiser** ➔ L'embed met à jour en temps réel l'ensemble de votre configuration SQLite.

---

## 🛠️ Commandes Disponibles

| Commande | Description | Permission requise |
| :--- | :--- | :--- |
| `/setup` | Assistant interactif de configuration avec boutons et sélecteurs natifs | Administrateur |
| `/setup-tickets [salon] [salon_id]` | Déploie le panneau d'assistance (localement ou à distance) | Administrateur |
| `/config` | Configuration avancée (logs, catégories, délais, cooldowns, serveurs distants) | Administrateur |
| `/ticket list [serveur_id]` | Affiche la liste des tickets actuellement ouverts | Staff |
| `/ticket add <membre>` | Ajoute un utilisateur dans le salon du ticket | Staff |
| `/ticket remove <membre>` | Retire un utilisateur du salon du ticket | Staff |
| `/ticket rename <nom>` | Renomme le salon du ticket | Staff |
| `/ticket priority <niveau>` | Modifie la priorité du ticket (Basse, Normale, Haute, Urgente) | Staff |
| `/ticket close` | Déclenche la procédure de fermeture avec confirmation et transcript | Staff / Créateur |

---

## 📁 Arborescence du Projet

```text
bot_ticket/
├── .env.example              # Modèle minimal (DISCORD_TOKEN uniquement)
├── .gitignore                # Exclusion node_modules, base SQLite, .env
├── deploy-commands.js        # Script de déploiement autonome (CLIENT_ID auto-détecté)
├── package.json              # Dépendances et scripts npm
├── README.md                 # Documentation complète
├── data/                     # Dossier de persistance SQLite (généré automatiquement)
│   └── tickets.db
└── src/
    ├── index.js              # Point d'entrée principal du bot
    ├── config/
    │   └── constants.js      # Couleurs, emojis, priorités et valeurs par défaut
    ├── db/
    │   ├── database.js       # Initialisation SQLite en mode WAL
    │   ├── schema.sql        # Schéma des tables
    │   └── repositories/
    │       ├── configRepository.js # Configuration des guildes et catégories
    │       └── ticketRepository.js # Gestion des tickets et compteurs
    ├── services/
    │   ├── ticketService.js     # Logique métier des tickets
    │   ├── transcriptService.js # Génération des transcripts HTML
    │   └── logService.js        # Gestion des logs centralisés / cross-serveur
    ├── commands/
    │   ├── setup.js          # Tableau de bord interactif /setup
    │   ├── setup-tickets.js  # Déploiement du panneau de tickets
    │   ├── ticket.js         # Commandes staff
    │   └── config.js         # Configuration avancée
    ├── events/
    │   ├── ready.js             # Démarrage & auto-sync des Slash Commands
    │   ├── interactionCreate.js # Routeur de commandes, boutons, menus et modals
    │   └── channelDelete.js     # Détection de suppression manuelle
    └── utils/
        ├── cooldown.js          # Cooldown anti-spam
        ├── embedBuilder.js      # Fabrique d'embeds
        └── permissionHelper.js  # Contrôle des accès Admin/Staff
```
