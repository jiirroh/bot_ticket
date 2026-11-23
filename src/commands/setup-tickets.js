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
        .setDescription('Le salon où envoyer le panneau (sur le serveur actuel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('salon_id')
        .setDescription('ID direct du salon (utile pour déployer à distance sur un autre serveur)')
        .setRequired(false)
    ),

  /**
   * Exécution de la commande /setup-tickets
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
  async execute(interaction) {
    const channelOption = interaction.options.getChannel('salon');
    const channelIdOption = interaction.options.getString('salon_id');

    let targetChannel = null;

    if (channelIdOption) {
      targetChannel = await interaction.client.channels.fetch(channelIdOption.trim()).catch(() => null);
      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.reply({
          embeds: [embedBuilder.error(`Le salon avec l'ID \`${channelIdOption}\` est introuvable ou n'est pas un salon textuel.`)],
          ephemeral: true
        });
      }
    } else if (channelOption) {
      targetChannel = channelOption;
    } else {
      targetChannel = interaction.channel;
    }

    // Création du bouton d'ouverture persistant
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_create_btn')
        .setLabel('Ouvrir un ticket')
        .setEmoji(EMOJIS.TICKET)
        .setStyle(ButtonStyle.Primary)
    );

    const panelEmbed = embedBuilder.panel(targetChannel.guild.name);

    try {
      await targetChannel.send({
        embeds: [panelEmbed],
        components: [row]
      });

      await interaction.reply({
        embeds: [embedBuilder.success(`Le panneau d'ouverture de tickets a été envoyé dans <#${targetChannel.id}> (Serveur : **${targetChannel.guild.name}**) !`)],
        ephemeral: true
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du panneau de tickets:', error);
      await interaction.reply({
        embeds: [embedBuilder.error('Impossible d\'envoyer le panneau dans ce salon. Vérifiez que le bot a bien les permissions d\'écriture dans ce salon.')],
        ephemeral: true
      });
    }
  }
};
