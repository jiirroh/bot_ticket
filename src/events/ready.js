const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[INFO] Connecté en tant que ${client.user.tag} (${client.user.id})`);
    
    // Définition du statut du bot
    client.user.setActivity('les tickets d\'assistance | /setup', {
      type: ActivityType.Watching
    });

    // Synchronisation automatique des commandes Slash avec Discord au démarrage
    try {
      if (client.commands && client.commands.size > 0) {
        const commandsData = client.commands.map(cmd => cmd.data.toJSON());
        await client.application.commands.set(commandsData);
        console.log(`[SLASH] ${commandsData.length} commandes Slash synchronisées automatiquement avec Discord !`);
      }
    } catch (err) {
      console.error('[SLASH] Erreur lors de la synchronisation automatique des commandes :', err.message);
    }
  }
};
