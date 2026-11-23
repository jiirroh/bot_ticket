require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('[ERREUR] Veuillez renseigner DISCORD_TOKEN et CLIENT_ID dans votre fichier .env.');
  process.exit(1);
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
      // Supporte un ou plusieurs IDs de serveurs séparés par des virgules (ex: Serveur Staff + Serveur Public)
      const guildIds = process.env.GUILD_ID.split(',').map(id => id.trim()).filter(Boolean);

      for (const gid of guildIds) {
        const data = await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, gid),
          { body: commands }
        );
        console.log(`[SUCCÈS] ${data.length} commandes enregistrées instantanément sur le serveur (GUILD_ID: ${gid}) !`);
      }
    } else {
      // Déploiement global (actif sur tous les serveurs où le bot est présent)
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`[SUCCÈS] ${data.length} commandes enregistrées au niveau GLOBAL !`);
    }
  } catch (error) {
    console.error('[ERREUR] Échec du déploiement des commandes :', error);
  }
})();
