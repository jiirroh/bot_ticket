const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Répertoire des données
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tickets.db');
const db = new Database(dbPath);

// Configuration optimale SQLite pour haute performance et fiabilité
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Initialisation du schéma SQL
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

module.exports = db;
