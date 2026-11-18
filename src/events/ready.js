const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[INFO] Connecté en tant que ${client.user.tag} (${client.user.id})`);
    
    // Définition du statut du bot
    client.user.setActivity('les tickets d\'assistance', {
      type: ActivityType.Watching
    });
  }
};
