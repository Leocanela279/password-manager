const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

function initDatabase(app) {
  if (db) {
    return db;
  }

  const dbPath = path.join(app.getPath('userData'), 'cinnamon-key.db');

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Connected to the cinnamon-key database.');
  });

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS passwords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        password TEXT NOT NULL,
        iv TEXT NOT NULL,
        link TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
  });

  return db;
}

module.exports = { initDatabase };
