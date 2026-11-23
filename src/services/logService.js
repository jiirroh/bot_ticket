const { EmbedBuilder } = require('discord.js');
const configRepository = require('../db/repositories/configRepository');
const { COLORS, EMOJIS, PRIORITIES } = require('../config/constants');

class LogService {
  /**
   * Récupère le salon de log configuré (sur le serveur local ou un serveur externe comme le serveur Staff)
   * @param {import('discord.js').Guild} guild 
   * @returns {Promise<import('discord.js').TextChannel|null>}
   */
  async getLogChannel(guild) {
    if (!guild || !guild.client) return null;
    const config = configRepository.getGuildConfig(guild.id);
    if (!config || !config.log_channel_id) return null;

    try {
      // client.channels.fetch permet de trouver le salon même s'il se trouve sur un autre serveur (ex: Serveur Staff)
      const channel = await guild.client.channels.fetch(config.log_channel_id).catch(() => null);
      if (channel && channel.isTextBased()) return channel;
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Log d'ouverture de ticket
   */
  async logTicketCreated({ guild, ticket, user, channel, category, subject }) {
    const logChannel = await this.getLogChannel(guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.TICKET} Ticket Ouvert`)
      .addFields(
        { name: '🌐 Serveur', value: `**${guild.name}** (\`${guild.id}\`)`, inline: true },
        { name: '🎫 Ticket', value: `<#${channel.id}> (\`#${String(ticket.ticket_number).padStart(4, '0')}\`)`, inline: true },
        { name: '👤 Utilisateur', value: `<@${user.id}> (\`${user.id}\`)`, inline: true },
        { name: '📂 Catégorie', value: `${category.emoji || ''} ${category.label}`, inline: true },
        { name: '📝 Motif', value: `\`\`\`\n${subject || 'Non spécifié'}\n\`\`\``, inline: false }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  }

  /**
   * Log de prise en charge (claim) de ticket
   */
  async logTicketClaimed({ guild, ticket, channel, staffMember }) {
    const logChannel = await this.getLogChannel(guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.CLAIM} Ticket Réclamé`)
      .addFields(
        { name: '🌐 Serveur', value: `**${guild.name}**`, inline: true },
        { name: '🎫 Salon', value: `<#${channel.id}>`, inline: true },
        { name: '👤 Pris en charge par', value: `<@${staffMember.id}>`, inline: true },
        { name: '🔢 Numéro', value: `#${String(ticket.ticket_number).padStart(4, '0')}`, inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  }

  /**
   * Log d'ajout de membre dans le ticket
   */
  async logMemberAdded({ guild, ticket, channel, staffMember, targetMember }) {
    const logChannel = await this.getLogChannel(guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.ADD_USER} Membre Ajouté au Ticket`)
      .addFields(
        { name: '🌐 Serveur', value: `**${guild.name}**`, inline: true },
        { name: '🎫 Salon', value: `<#${channel.id}>`, inline: true },
        { name: '👤 Membre ajouté', value: `<@${targetMember.id}>`, inline: true },
        { name: '🛡️ Action effectuée par', value: `<@${staffMember.id}>`, inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  }

  /**
   * Log de retrait de membre du ticket
   */
  async logMemberRemoved({ guild, ticket, channel, staffMember, targetMember }) {
    const logChannel = await this.getLogChannel(guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.REMOVE_USER} Membre Retiré du Ticket`)
      .addFields(
        { name: '🌐 Serveur', value: `**${guild.name}**`, inline: true },
        { name: '🎫 Salon', value: `<#${channel.id}>`, inline: true },
        { name: '👤 Membre retiré', value: `<@${targetMember.id}>`, inline: true },
        { name: '🛡️ Action effectuée par', value: `<@${staffMember.id}>`, inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  }

  /**
   * Log de modification de priorité
   */
  async logPriorityChanged({ guild, ticket, channel, staffMember, oldPriority, newPriority }) {
    const logChannel = await this.getLogChannel(guild);
    if (!logChannel) return;

    const oldPrio = Object.values(PRIORITIES).find(p => p.id === oldPriority) || PRIORITIES.MEDIUM;
    const newPrio = Object.values(PRIORITIES).find(p => p.id === newPriority) || PRIORITIES.MEDIUM;

    const embed = new EmbedBuilder()
      .setColor(newPrio.color)
      .setTitle(`⚡ Priorité Modifiée`)
      .addFields(
        { name: '🌐 Serveur', value: `**${guild.name}**`, inline: true },
        { name: '🎫 Salon', value: `<#${channel.id}>`, inline: true },
        { name: '🛡️ Modifié par', value: `<@${staffMember.id}>`, inline: true },
        { name: '📊 Évolution', value: `${oldPrio.emoji} ${oldPrio.label} ➔ ${newPrio.emoji} ${newPrio.label}`, inline: false }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  }

  /**
   * Log de fermeture de ticket avec transcript joint
   */
  async logTicketClosed({ guild, ticket, channelName, closedBy, attachment, durationStr }) {
    const logChannel = await this.getLogChannel(guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle(`${EMOJIS.LOCK} Ticket Fermé`)
      .addFields(
        { name: '🌐 Serveur', value: `**${guild.name}** (\`${guild.id}\`)`, inline: true },
        { name: '🎫 Nom du salon', value: `\`${channelName}\``, inline: true },
        { name: '🔢 Numéro', value: `#${String(ticket.ticket_number).padStart(4, '0')}`, inline: true },
        { name: '👤 Créateur', value: `<@${ticket.user_id}>`, inline: true },
        { name: '🔒 Fermé par', value: `<@${closedBy.id}>`, inline: true },
        { name: '⏱️ Durée d\'ouverture', value: durationStr, inline: true }
      )
      .setFooter({ text: 'Le transcript HTML est joint à ce message' })
      .setTimestamp();

    const payload = { embeds: [embed] };
    if (attachment) {
      payload.files = [attachment];
    }

    await logChannel.send(payload).catch(() => null);
  }
}

module.exports = new LogService();
