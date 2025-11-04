// lib/database.js
const { QuickDB } = require('quick.db');
const fs = require('fs');

const init = async (dbPath) => {
  const driver = require('better-sqlite3')(dbPath);
  const db = new QuickDB({ driver, file: dbPath });
  await db.init();
  return db;
};

const createBackup = async (backupPath, db) => {
  try {
    const all = await db.all();
    const data = Object.fromEntries(all.map(i => [i.id, i.data]));
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log('Backup created: ./uploads/backup.json');
  } catch (err) {
    console.error('Backup failed:', err);
  }
};

const restoreFromBackup = async (backupPath, db) => {
  try {
    const raw = fs.readFileSync(backupPath, 'utf-8');
    const data = JSON.parse(raw);
    for (const [k, v] of Object.entries(data)) {
      await db.set(k, v);
    }
  } catch (err) {
    console.error('Restore failed:', err);
  }
};

module.exports = { init, createBackup, restoreFromBackup };
