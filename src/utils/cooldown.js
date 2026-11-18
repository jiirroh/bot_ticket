/**
 * Gestionnaire de cooldowns anti-spam en mémoire
 */
class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
  }

  /**
   * Vérifie si un utilisateur est sous cooldown pour une action
   * @param {string} key Identifiant unique (ex: `open_ticket_${userId}`)
   * @param {number} cooldownSeconds Durée du cooldown en secondes
   * @returns {{ onCooldown: boolean, remainingSeconds: number }}
   */
  check(key, cooldownSeconds) {
    const now = Date.now();
    const expiresAt = this.cooldowns.get(key);

    if (expiresAt && now < expiresAt) {
      const remainingSeconds = Math.ceil((expiresAt - now) / 1000);
      return { onCooldown: true, remainingSeconds };
    }

    // Applique le nouveau cooldown
    this.cooldowns.set(key, now + (cooldownSeconds * 1000));
    return { onCooldown: false, remainingSeconds: 0 };
  }

  /**
   * Réinitialise un cooldown spécifique
   * @param {string} key 
   */
  reset(key) {
    this.cooldowns.delete(key);
  }
}

module.exports = new CooldownManager();
