-- Schéma de base de données SQLite pour le bot de tickets

-- Table de configuration générale par serveur (guilde)
CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY,
  log_channel_id TEXT DEFAULT NULL,
  ticket_category_id TEXT DEFAULT NULL,
  close_delay_seconds INTEGER DEFAULT 5,
  max_tickets_per_category INTEGER DEFAULT 1,
  cooldown_seconds INTEGER DEFAULT 60,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Table des rôles membres du staff autorisés
CREATE TABLE IF NOT EXISTS guild_staff_roles (
  guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (guild_id, role_id)
);

-- Table des catégories de tickets disponibles par serveur (Support, Recrutement, etc.)
CREATE TABLE IF NOT EXISTS ticket_categories (
  guild_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  discord_category_id TEXT DEFAULT NULL,
  PRIMARY KEY (guild_id, category_id)
);

-- Compteur incrémental de tickets par serveur
CREATE TABLE IF NOT EXISTS ticket_counters (
  guild_id TEXT PRIMARY KEY,
  last_ticket_number INTEGER DEFAULT 0
);

-- Table des tickets créés
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  ticket_number INTEGER NOT NULL,
  subject TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open', -- 'open' | 'closed'
  claimed_by TEXT DEFAULT NULL,
  created_at INTEGER NOT NULL,
  closed_at INTEGER DEFAULT NULL,
  closed_by TEXT DEFAULT NULL
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_tickets_guild_status ON tickets(guild_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_category ON tickets(guild_id, user_id, category_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel_id);
