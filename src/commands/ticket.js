const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ticketService = require('../services/ticketService');
const ticketRepository = require('../db/repositories/ticketRepository');
const embedBuilder = require('../utils/embedBuilder');
const permissionHelper = require('../utils/permissionHelper');
const { PRIORITIES, COLORS, EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Commandes de gestion et modération du ticket')
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('Lister les tickets actuellement ouverts sur un serveur')
        .addStringOption(option =>
          option
            .setName('serveur_id')
            .setDescription('ID du serveur (laisser vide pour le serveur actuel)')
            .setRequired(false)
        )
    )
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
      case 'list': {
        if (!permissionHelper.isStaff(interaction.member)) {
          return interaction.reply({
            embeds: [embedBuilder.error('Seuls les membres du staff peuvent consulter la liste des tickets.')],
            ephemeral: true
          });
        }

        const customGuildId = interaction.options.getString('serveur_id');
        const targetGuildId = customGuildId ? customGuildId.trim() : interaction.guild.id;
        const targetGuild = await interaction.client.guilds.fetch(targetGuildId).catch(() => null);

        const openTickets = ticketRepository.getOpenTicketsByGuild(targetGuildId);

        if (openTickets.length === 0) {
          return interaction.reply({
            embeds: [embedBuilder.info(`Aucun ticket ouvert actuellement sur **${targetGuild ? targetGuild.name : targetGuildId}** !`)],
            ephemeral: true
          });
        }

        const lines = openTickets.map(t => {
          const prio = Object.values(PRIORITIES).find(p => p.id === t.priority) || PRIORITIES.MEDIUM;
          const claimedStr = t.claimed_by ? `(Réclamé par <@${t.claimed_by}>)` : '*(Non réclamé)*';
          return `• **#${String(t.ticket_number).padStart(4, '0')}** <#${t.channel_id}> - <@${t.user_id}> | ${prio.emoji} ${prio.label} ${claimedStr}`;
        });

        const embed = new EmbedBuilder()
          .setColor(COLORS.PRIMARY)
          .setTitle(`${EMOJIS.TICKET} Tickets Ouverts - ${targetGuild ? targetGuild.name : targetGuildId} (${openTickets.length})`)
          .setDescription(lines.join('\n'))
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

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
