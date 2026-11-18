require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Vérification de la présence du token
if (!process.env.DISCORD_TOKEN) {
  console.error('[ERREUR] Le token Discord est manquant. Définissez DISCORD_TOKEN dans votre fichier .env');
  process.exit(1);
}

// Initialisation du client Discord avec les intents nécessaires
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Collection des commandes Slash
client.commands = new Collection();

// Chargement dynamique des commandes
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`[COMMANDE] Chargée : /${command.data.name}`);
    } else {
      console.warn(`[ATTENTION] La commande dans ${file} est incomplète.`);
    }
  }
}

// Chargement dynamique des événements
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`[ÉVÉNEMENT] Enregistré : ${event.name}`);
  }
}

// Gestion des erreurs non interceptées pour empêcher tout arrêt du processus
process.on('unhandledRejection', (reason, promise) => {
  console.error('[PROMISE REJECTION]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
});

// Connexion du bot
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('[ERREUR CONNEXION]', err.message);
});
