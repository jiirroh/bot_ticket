const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');

const configRepository = require('../db/repositories/configRepository');
const { COLORS, EMOJIS } = require('../config/constants');

function buildSetupDashboard(guild) {
  const config = configRepository.getGuildConfig(guild.id);
  const staffRoles = configRepository.getStaffRoles(guild.id);
  const categories = configRepository.getTicketCategories(guild.id);

  const staffRolesList = staffRoles.length > 0 
    ? staffRoles.map(id => `<@&${id}>`).join(', ') 
    : '*Aucun rôle (Administrateurs uniquement)*';

  const categoriesList = categories.length > 0
    ? categories.map(c => `${c.emoji || '📁'} **${c.label}**`).join(' • ')
    : '*Aucune catégorie active*';

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJIS.SETTINGS} Assistant de Configuration - ${guild.name}`)
    .setDescription(
      'Configurez votre système de tickets en quelques clics grâce aux boutons ci-dessous.\n' +
      'Les modifications s\'enregistrent immédiatement en base de données.\n\n' +
      `**📜 Salon de Logs :** ${config.log_channel_id ? `<#${config.log_channel_id}>` : '*Non défini*'}\n` +
      `**📂 Catégorie des Salons :** ${config.ticket_category_id ? `<#${config.ticket_category_id}>` : '*Racine du serveur*'}\n` +
      `**🛡️ Rôles Staff autorisés :** ${staffRolesList}\n` +
      `**🗂️ Types de tickets :** ${categoriesList}\n` +
      `**⏱️ Délai avant suppression :** \`${config.close_delay_seconds || 5}s\`\n` +
      `**🛑 Limite par catégorie :** \`${config.max_tickets_per_category || 1} ticket/membre\`\n` +
      `**⏳ Cooldown anti-spam :** \`${config.cooldown_seconds || 60}s\``
    )
    .setFooter({ text: 'Cliquez sur un bouton pour modifier un paramètre' })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('setup_btn_logs')
      .setLabel('Définir le salon de logs')
      .setEmoji(EMOJIS.LOG)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('setup_btn_category')
      .setLabel('Catégorie des tickets')
      .setEmoji('📂')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('setup_btn_staff')
      .setLabel('Rôles Staff')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('setup_btn_panel')
      .setLabel('Poster le panneau de tickets')
      .setEmoji(EMOJIS.TICKET)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('setup_btn_refresh')
      .setLabel('Actualiser')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Assistant interactif pour configurer facilement les tickets sans fichier .env')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  buildSetupDashboard,

  /**
   * Exécution de la commande /setup
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    const dashboard = buildSetupDashboard(interaction.guild);
    await interaction.reply({
      ...dashboard,
      ephemeral: true
    });
  }
};
