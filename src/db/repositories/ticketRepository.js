const db = require('../database');

class TicketRepository {
  /**
   * Incrémente de façon atomique et retourne le numéro du prochain ticket
   * @param {string} guildId 
   * @returns {number}
   */
  getNextTicketNumber(guildId) {
    const getNext = db.transaction((gid) => {
      db.prepare(`
        INSERT INTO ticket_counters (guild_id, last_ticket_number)
        VALUES (?, 1)
        ON CONFLICT(guild_id) DO UPDATE SET last_ticket_number = last_ticket_number + 1
      `).run(gid);

      const row = db.prepare('SELECT last_ticket_number FROM ticket_counters WHERE guild_id = ?').get(gid);
      return row.last_ticket_number;
    });

    return getNext(guildId);
  }

  /**
   * Crée un nouvel enregistrement de ticket
   * @param {object} ticketData 
   * @returns {object} Le ticket créé
   */
  createTicket({ guildId, channelId, userId, categoryId, ticketNumber, subject, priority = 'medium' }) {
    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      INSERT INTO tickets (guild_id, channel_id, user_id, category_id, ticket_number, subject, priority, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
    `);

    const result = stmt.run(guildId, channelId, userId, categoryId, ticketNumber, subject, priority, now);
    return this.getTicketById(result.lastInsertRowid);
  }

  /**
   * Récupère un ticket par son identifiant unique ID
   * @param {number} id 
   * @returns {object|null}
   */
  getTicketById(id) {
    return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) || null;
  }

  /**
   * Récupère un ticket par l'ID de son salon Discord
   * @param {string} channelId 
   * @returns {object|null}
   */
  getTicketByChannelId(channelId) {
    return db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId) || null;
  }

  /**
   * Récupère la liste des tickets ouverts pour un serveur
   * @param {string} guildId 
   * @returns {Array}
   */
  getOpenTicketsByGuild(guildId) {
    return db.prepare(`
      SELECT * FROM tickets
      WHERE guild_id = ? AND status = 'open'
      ORDER BY created_at DESC
    `).all(guildId);
  }

  /**
   * Compte le nombre de tickets ouverts d'un membre dans une catégorie
   * @param {string} guildId 
   * @param {string} userId 
   * @param {string} categoryId 
   * @returns {number}
   */
  countOpenTicketsByUserAndCategory(guildId, userId, categoryId) {
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM tickets
      WHERE guild_id = ? AND user_id = ? AND category_id = ? AND status = 'open'
    `).get(guildId, userId, categoryId);

    return row ? row.count : 0;
  }

  /**
   * Marque un ticket comme réclamé (claimed) par un staff
   * @param {string} channelId 
   * @param {string} staffId 
   */
  claimTicket(channelId, staffId) {
    db.prepare('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?').run(staffId, channelId);
  }

  /**
   * Modifie la priorité d'un ticket
   * @param {string} channelId 
   * @param {string} priority 
   */
  updatePriority(channelId, priority) {
    db.prepare('UPDATE tickets SET priority = ? WHERE channel_id = ?').run(priority, channelId);
  }

  /**
   * Marque le ticket comme fermé
   * @param {string} channelId 
   * @param {string} closedByUserId 
   */
  closeTicket(channelId, closedByUserId) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      UPDATE tickets
      SET status = 'closed', closed_at = ?, closed_by = ?
      WHERE channel_id = ?
    `).run(now, closedByUserId, channelId);
  }
}

module.exports = new TicketRepository();
