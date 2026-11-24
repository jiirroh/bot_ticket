require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

if (!process.env.DISCORD_TOKEN) {
  console.error('[ERREUR] Veuillez renseigner DISCORD_TOKEN dans votre fichier .env.');
  process.exit(1);
}

// Extraction automatique du CLIENT_ID depuis le token Discord si non renseigné
let clientId = process.env.CLIENT_ID;
if (!clientId) {
  try {
    const base64Part = process.env.DISCORD_TOKEN.split('.')[0];
    clientId = Buffer.from(base64Part, 'base64').toString('utf-8');
    console.log(`[INFO] CLIENT_ID extrait automatiquement du token : ${clientId}`);
  } catch (err) {
    console.error('[ERREUR] Impossible d\'extraire le CLIENT_ID du token. Renseignez CLIENT_ID dans .env.');
    process.exit(1);
  }
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`[CHARGEMENT] Commande prête : /${command.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\n[DÉPLOIEMENT] Début de l'enregistrement de ${commands.length} commande(s) Slash...`);

    if (process.env.GUILD_ID) {
      // Supporte un ou plusieurs IDs de serveurs séparés par des virgules
      const guildIds = process.env.GUILD_ID.split(',').map(id => id.trim()).filter(Boolean);

      for (const gid of guildIds) {
        const data = await rest.put(
          Routes.applicationGuildCommands(clientId, gid),
          { body: commands }
        );
        console.log(`[SUCCÈS] ${data.length} commandes enregistrées instantanément sur le serveur (${gid}) !`);
      }
    } else {
      // Déploiement global automatique
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`[SUCCÈS] ${data.length} commandes enregistrées au niveau GLOBAL !`);
    }
  } catch (error) {
    console.error('[ERREUR] Échec du déploiement des commandes :', error);
  }
})();
