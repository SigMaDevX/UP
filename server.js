// server.js
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { QuickDB } = require('quick.db');
const dbLib = require('./lib/database');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'jawadxBot804';

// === FIXED: Use RELATIVE paths (Render allows ./data, not /app/data) ===
const DATA_DIR = './data';
const UPLOADS_DIR = './uploads';
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');
const BACKUP_PATH = path.join(UPLOADS_DIR, 'backup.json');

// === Create directories SAFELY ===
[DATA_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (err) {
      if (err.code !== 'EACCES') throw err;
      console.warn(`Could not create ${dir} (permission denied). Will try to use if exists.`);
    }
  }
});

// Middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize DB
let db;
(async () => {
  try {
    db = await dbLib.init(DB_PATH);
    console.log('Database loaded:', DB_PATH);

    // Auto-restore from backup if DB missing
    if (!fs.existsSync(DB_PATH) && fs.existsSync(BACKUP_PATH)) {
      console.log('Database missing. Restoring from backup...');
      await dbLib.restoreFromBackup(BACKUP_PATH, db);
      console.log('Restored from backup.json');
    }

    // Auto-backup every 30 mins
    setInterval(() => {
      dbLib.createBackup(BACKUP_PATH, db);
    }, 30 * 60 * 1000);
    console.log('Auto-backup scheduled every 30 mins');
  } catch (err) {
    console.error('DB init failed:', err);
  }
})();

// === AUTH ===
const requireAuth = (req, res, next) => {
  if (req.headers.authorization === API_KEY) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Unauthorized' });
  }
};

// === ROUTES ===
app.get('/status', (req, res) => {
  res.json({ status: 'running' });
});

app.post('/set', requireAuth, async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ success: false, error: 'key and value required' });
  }
  await db.set(key, value);
  console.log(`SET: ${key}`);
  res.json({ success: true, key, value });
});

app.get('/get/:key', requireAuth, async (req, res) => {
  const { key } = req.params;
  const value = await db.get(key);
  if (value === null || value === undefined) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }
  res.json({ success: true, key, value });
});

app.delete('/delete/:key', requireAuth, async (req, res) => {
  const { key } = req.params;
  const exists = await db.has(key);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }
  await db.delete(key);
  console.log(`DELETED: ${key}`);
  res.json({ success: true, key });
});

app.get('/export', requireAuth, async (req, res) => {
  const all = await db.all();
  const data = Object.fromEntries(all.map(i => [i.id, i.data]));
  res.json({ success: true, data, count: all.length });
});

app.post('/import', requireAuth, async (req, res) => {
  const { data, replace } = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, error: 'Valid data object required' });
  }
  if (replace) await db.clear();
  let count = 0;
  for (const [k, v] of Object.entries(data)) {
    await db.set(k, v);
    count++;
  }
  console.log(`IMPORTED: ${count} entries (${replace ? 'replace' : 'merge'})`);
  res.json({ success: true, imported: count, mode: replace ? 'replace' : 'merge' });
});

app.get('/dbfile', requireAuth, (req, res) => {
  if (!fs.existsSync(DB_PATH)) {
    return res.status(404).json({ success: false, error: 'Database file not found' });
  }
  res.download(DB_PATH, 'database.sqlite');
});

// Start
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`API Key: ${API_KEY}`);
});
