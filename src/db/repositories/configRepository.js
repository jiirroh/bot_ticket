const db = require('../database');
const { DEFAULTS } = require('../../config/constants');

class ConfigRepository {
  /**
   * Récupère la configuration d'un serveur ou initialise avec les valeurs par défaut
   * @param {string} guildId 
   * @returns {object}
   */
  getGuildConfig(guildId) {
    let config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId);
    if (!config) {
      db.prepare(`
        INSERT INTO guild_config (guild_id, close_delay_seconds, max_tickets_per_category, cooldown_seconds)
        VALUES (?, ?, ?, ?)
      `).run(
        guildId,
        DEFAULTS.CLOSE_DELAY_SECONDS,
        DEFAULTS.MAX_TICKETS_PER_CATEGORY,
        DEFAULTS.COOLDOWN_SECONDS
      );

      config = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId);
      this.initDefaultCategories(guildId);
    }
    return config;
  }

  /**
   * Met à jour une ou plusieurs valeurs de configuration
   * @param {string} guildId 
   * @param {object} updates 
   */
  updateGuildConfig(guildId, updates) {
    this.getGuildConfig(guildId); // S'assure que la ligne existe

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) return;

    fields.push("updated_at = strftime('%s', 'now')");
    values.push(guildId);

    const query = `UPDATE guild_config SET ${fields.join(', ')} WHERE guild_id = ?`;
    db.prepare(query).run(...values);
  }

  /**
   * Récupère la liste des IDs de rôles staff pour un serveur
   * @param {string} guildId 
   * @returns {string[]}
   */
  getStaffRoles(guildId) {
    const rows = db.prepare('SELECT role_id FROM guild_staff_roles WHERE guild_id = ?').all(guildId);
    return rows.map(r => r.role_id);
  }

  /**
   * Ajoute un rôle au staff
   * @param {string} guildId 
   * @param {string} roleId 
   */
  addStaffRole(guildId, roleId) {
    db.prepare('INSERT OR IGNORE INTO guild_staff_roles (guild_id, role_id) VALUES (?, ?)').run(guildId, roleId);
  }

  /**
   * Supprime un rôle du staff
   * @param {string} guildId 
   * @param {string} roleId 
   */
  removeStaffRole(guildId, roleId) {
    db.prepare('DELETE FROM guild_staff_roles WHERE guild_id = ? AND role_id = ?').run(guildId, roleId);
  }

  /**
   * Initialise les catégories par défaut si aucune n'existe pour le serveur
   * @param {string} guildId 
   */
  initDefaultCategories(guildId) {
    const count = db.prepare('SELECT COUNT(*) as count FROM ticket_categories WHERE guild_id = ?').get(guildId);
    if (count.count === 0) {
      const insert = db.prepare(`
        INSERT INTO ticket_categories (guild_id, category_id, label, description, emoji)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((categories) => {
        for (const cat of categories) {
          insert.run(guildId, cat.id, cat.label, cat.description, cat.emoji);
        }
      });

      insertMany(DEFAULTS.DEFAULT_CATEGORIES);
    }
  }

  /**
   * Récupère toutes les catégories de tickets actives d'un serveur
   * @param {string} guildId 
   * @returns {Array}
   */
  getTicketCategories(guildId) {
    this.initDefaultCategories(guildId);
    return db.prepare('SELECT * FROM ticket_categories WHERE guild_id = ?').all(guildId);
  }

  /**
   * Récupère une catégorie précise
   * @param {string} guildId 
   * @param {string} categoryId 
   * @returns {object|null}
   */
  getTicketCategory(guildId, categoryId) {
    return db.prepare('SELECT * FROM ticket_categories WHERE guild_id = ? AND category_id = ?').get(guildId, categoryId);
  }

  /**
   * Ajoute ou met à jour une catégorie de tickets
   * @param {string} guildId 
   * @param {object} categoryData 
   */
  upsertTicketCategory(guildId, { categoryId, label, description, emoji, discordCategoryId }) {
    db.prepare(`
      INSERT INTO ticket_categories (guild_id, category_id, label, description, emoji, discord_category_id)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(guild_id, category_id) DO UPDATE SET
        label = excluded.label,
        description = excluded.description,
        emoji = excluded.emoji,
        discord_category_id = excluded.discord_category_id
    `).run(guildId, categoryId, label, description, emoji, discordCategoryId || null);
  }

  /**
   * Supprime une catégorie de tickets
   * @param {string} guildId 
   * @param {string} categoryId 
   */
  removeTicketCategory(guildId, categoryId) {
    db.prepare('DELETE FROM ticket_categories WHERE guild_id = ? AND category_id = ?').run(guildId, categoryId);
  }
}

module.exports = new ConfigRepository();
