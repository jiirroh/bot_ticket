const { PermissionFlagsBits } = require('discord.js');
const configRepository = require('../db/repositories/configRepository');

/**
 * Fonctions d'aide pour la vérification des permissions Discord et Staff
 */
class PermissionHelper {
  /**
   * Vérifie si un membre est administrateur du serveur
   * @param {import('discord.js').GuildMember} member 
   * @returns {boolean}
   */
  isAdmin(member) {
    if (!member) return false;
    return member.permissions.has(PermissionFlagsBits.Administrator);
  }

  /**
   * Vérifie si un membre possède au moins un des rôles staff configurés
   * @param {import('discord.js').GuildMember} member 
   * @returns {boolean}
   */
  isStaff(member) {
    if (!member || !member.guild) return false;
    if (this.isAdmin(member)) return true;

    const staffRoles = configRepository.getStaffRoles(member.guild.id);
    if (!staffRoles || staffRoles.length === 0) return false;

    return member.roles.cache.some(role => staffRoles.includes(role.id));
  }

  /**
   * Vérifie si un membre a le droit de gérer un ticket (Staff ou créateur du ticket)
   * @param {import('discord.js').GuildMember} member 
   * @param {object} ticket 
   * @returns {boolean}
   */
  canManageTicket(member, ticket) {
    if (!member) return false;
    if (this.isStaff(member)) return true;
    return member.id === ticket.user_id;
  }
}

module.exports = new PermissionHelper();
