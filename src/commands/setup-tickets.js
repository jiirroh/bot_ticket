const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ChannelType, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const embedBuilder = require('../utils/embedBuilder');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-tickets')
    .setDescription('Déploie le panneau d\'ouverture de tickets dans un salon (Admin uniquement)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('salon')
        .setDescription('Le salon où envoyer le panneau de tickets (salon actuel par défaut)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  /**
   * Exécution de la commande /setup-tickets
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;

    // Création du bouton d'ouverture persistant
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_create_btn')
        .setLabel('Ouvrir un ticket')
        .setEmoji(EMOJIS.TICKET)
        .setStyle(ButtonStyle.Primary)
    );

    const panelEmbed = embedBuilder.panel(interaction.guild.name);

    try {
      await targetChannel.send({
        embeds: [panelEmbed],
        components: [row]
      });

      await interaction.reply({
        embeds: [embedBuilder.success(`Le panneau d'ouverture de tickets a été envoyé dans <#${targetChannel.id}> !`)],
        ephemeral: true
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du panneau de tickets:', error);
      await interaction.reply({
        embeds: [embedBuilder.error('Impossible d\'envoyer le panneau dans ce salon. Vérifiez les permissions du bot.')],
        ephemeral: true
      });
    }
  }
};
