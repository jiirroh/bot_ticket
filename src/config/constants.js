/**
 * Constantes globales de l'application
 */
module.exports = {
  // Couleurs standards des embeds (Format hexadécimal numérique)
  COLORS: {
    PRIMARY: 0x5865f2,   // Blurple Discord
    SUCCESS: 0x57f287,   // Vert
    WARNING: 0xfee75c,   // Jaune
    DANGER: 0xed4245,    // Rouge
    INFO: 0x3498db,      // Bleu clair
    DARK: 0x2b2d31       // Gris foncé moderne
  },

  // Emojis d'interface
  EMOJIS: {
    TICKET: '🎫',
    LOCK: '🔒',
    CLAIM: '🙋‍♂️',
    ADD_USER: '➕',
    REMOVE_USER: '➖',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    LOG: '📜',
    SETTINGS: '⚙️'
  },

  // Niveaux de priorité autorisés pour les tickets
  PRIORITIES: {
    LOW: {
      id: 'low',
      label: 'Basse',
      emoji: '🟢',
      color: 0x57f287
    },
    MEDIUM: {
      id: 'medium',
      label: 'Normale',
      emoji: '🟡',
      color: 0xfee75c
    },
    HIGH: {
      id: 'high',
      label: 'Haute',
      emoji: '🟠',
      color: 0xe67e22
    },
    URGENT: {
      id: 'urgent',
      label: 'Urgente',
      emoji: '🔴',
      color: 0xed4245
    }
  },

  // Valeurs par défaut de configuration pour une guilde
  DEFAULTS: {
    CLOSE_DELAY_SECONDS: 5,
    MAX_TICKETS_PER_CATEGORY: 1,
    COOLDOWN_SECONDS: 60,
    DEFAULT_CATEGORIES: [
      {
        id: 'support',
        label: 'Support Général',
        description: 'Assistance technique ou question générale',
        emoji: '💡'
      },
      {
        id: 'recrutement',
        label: 'Recrutement',
        description: 'Postuler pour rejoindre l\'équipe du serveur',
        emoji: '📝'
      },
      {
        id: 'signalement',
        label: 'Signalement',
        description: 'Signaler un abus, un joueur ou un comportement',
        emoji: '🚨'
      }
    ]
  }
};
