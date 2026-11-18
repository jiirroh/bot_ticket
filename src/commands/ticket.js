const { SlashCommandBuilder } = require('discord.js');
const ticketService = require('../services/ticketService');
const { PRIORITIES } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Commandes de gestion et modération du ticket')
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Ajouter un membre dans le ticket')
        .addUserOption(option =>
          option
            .setName('utilisateur')
            .setDescription('L\'utilisateur à ajouter')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Retirer un membre du ticket')
        .addUserOption(option =>
          option
            .setName('utilisateur')
            .setDescription('L\'utilisateur à retirer')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('rename')
        .setDescription('Renommer le salon du ticket')
        .addStringOption(option =>
          option
            .setName('nom')
            .setDescription('Nouveau nom pour le salon')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('priority')
        .setDescription('Modifier la priorité du ticket')
        .addStringOption(option =>
          option
            .setName('niveau')
            .setDescription('Niveau de priorité')
            .setRequired(true)
            .addChoices(
              { name: '🟢 Basse', value: PRIORITIES.LOW.id },
              { name: '🟡 Normale', value: PRIORITIES.MEDIUM.id },
              { name: '🟠 Haute', value: PRIORITIES.HIGH.id },
              { name: '🔴 Urgente', value: PRIORITIES.URGENT.id }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('close')
        .setDescription('Fermer le ticket actuel')
    ),

  /**
   * Exécution des sous-commandes de /ticket
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'add': {
        const targetUser = interaction.options.getUser('utilisateur');
        await ticketService.addMember(interaction, targetUser);
        break;
      }
      case 'remove': {
        const targetUser = interaction.options.getUser('utilisateur');
        await ticketService.removeMember(interaction, targetUser);
        break;
      }
      case 'rename': {
        const newName = interaction.options.getString('nom');
        await ticketService.renameTicket(interaction, newName);
        break;
      }
      case 'priority': {
        const priority = interaction.options.getString('niveau');
        await ticketService.setPriority(interaction, priority);
        break;
      }
      case 'close': {
        await ticketService.promptClose(interaction);
        break;
      }
    }
  }
};
