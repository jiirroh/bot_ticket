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
      // Déploiement instantané sur un serveur spécifique (idéal en développement)
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`[SUCCÈS] ${data.length} commandes enregistrées instantanément sur le serveur (GUILD_ID: ${process.env.GUILD_ID}) !`);
    } else {
      // Déploiement global (peut prendre jusqu'à 1 heure pour être propagé partout)
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
