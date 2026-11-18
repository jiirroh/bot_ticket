const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, PRIORITIES } = require('../config/constants');

class CustomEmbedBuilder {
  /**
   * Embed d'erreur standard
   * @param {string} description 
   * @returns {EmbedBuilder}
   */
  error(description) {
    return new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setDescription(`${EMOJIS.ERROR} ${description}`);
  }

  /**
   * Embed de succès standard
   * @param {string} description 
   * @returns {EmbedBuilder}
   */
  success(description) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setDescription(`${EMOJIS.SUCCESS} ${description}`);
  }

  /**
   * Embed d'avertissement standard
   * @param {string} description 
   * @returns {EmbedBuilder}
   */
  warning(description) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setDescription(`${EMOJIS.WARNING} ${description}`);
  }

  /**
   * Embed d'information standard
   * @param {string} description 
   * @returns {EmbedBuilder}
   */
  info(description) {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setDescription(`${EMOJIS.LOG} ${description}`);
  }

  /**
   * Embed principal du panneau de tickets (affiché via /setup-tickets)
   * @param {string} guildName 
   * @returns {EmbedBuilder}
   */
  panel(guildName) {
    return new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.TICKET} Centre d'Assistance & Support`)
      .setDescription(
        `Bienvenue sur le système d'assistance de **${guildName}** !\n\n` +
        `Pour toute demande d'aide, signalement ou question à l'équipe, cliquez sur le bouton ci-dessous pour ouvrir un ticket privé.\n\n` +
        `> 💡 **Rappel :** Merci de décrire précisément votre motif pour une prise en charge rapide.`
      )
      .setFooter({ text: 'Système de tickets sécurisé' })
      .setTimestamp();
  }

  /**
   * Embed de bienvenue posté dans le salon privé à l'ouverture du ticket
   * @param {object} params
   * @returns {EmbedBuilder}
   */
  ticketWelcome({ user, category, ticketNumber, subject, priority = 'medium' }) {
    const prioConfig = Object.values(PRIORITIES).find(p => p.id === priority) || PRIORITIES.MEDIUM;

    return new EmbedBuilder()
      .setColor(prioConfig.color)
      .setTitle(`${EMOJIS.TICKET} Ticket #${String(ticketNumber).padStart(4, '0')} - ${category.label}`)
      .setDescription(
        `Bonjour <@${user.id}>, votre ticket a bien été ouvert !\n` +
        `Un membre de l'équipe du staff va prendre en charge votre demande dans les plus brefs délais.\n\n` +
        `**Motif / Sujet :**\n\`\`\`\n${subject || 'Non spécifié'}\n\`\`\``
      )
      .addFields(
        { name: '👤 Auteur', value: `<@${user.id}> (\`${user.id}\`)`, inline: true },
        { name: '📂 Catégorie', value: `${category.emoji || '📁'} ${category.label}`, inline: true },
        { name: '⚡ Priorité', value: `${prioConfig.emoji} ${prioConfig.label}`, inline: true }
      )
      .setFooter({ text: 'Utilisez les boutons ci-dessous pour gérer ce ticket' })
      .setTimestamp();
  }

  /**
   * Embed de confirmation de fermeture de ticket
   * @returns {EmbedBuilder}
   */
  closeConfirmation() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.LOCK} Confirmation de fermeture`)
      .setDescription(
        'Êtes-vous sûr de vouloir fermer ce ticket ?\n' +
        'Un transcript complet sera généré et envoyé dans le salon de logs ainsi qu\'en message privé.'
      );
  }
}

module.exports = new CustomEmbedBuilder();
