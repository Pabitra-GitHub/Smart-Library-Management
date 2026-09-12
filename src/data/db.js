const fs = require('fs');
const path = require('path');
const seedData = require('./seed');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'library_db.json');

class JSONDatabase {
  constructor() {
    this._ensureStorage();
  }

  _ensureStorage() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      this._writeAll(JSON.parse(JSON.stringify(seedData)));
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        JSON.parse(raw);
      } catch (err) {
        const backupFile = `${DB_FILE}.bak.corrupt-${Date.now()}`;
        try {
          fs.copyFileSync(DB_FILE, backupFile);
          console.warn(`Database corrupted. Backed up to ${backupFile} and re-seeding.`);
        } catch (backupErr) {
          console.warn('Database corrupted; backup also failed. Re-seeding.', backupErr);
        }
        this._writeAll(JSON.parse(JSON.stringify(seedData)));
      }
    }
  }

  _readAll() {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  }

  _writeAll(data) {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
      return true;
    } catch (err) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (cleanupErr) {
        console.error('Error cleaning up temporary database file:', cleanupErr);
      }
      throw new Error(`Error writing database file: ${err.message}`);
    }
  }

  // --- Collection Accessors ---

  get(collectionName) {
    const data = this._readAll();
    return data[collectionName] || [];
  }

  getById(collectionName, id) {
    const collection = this.get(collectionName);
    return collection.find(item => item.id === id) || null;
  }

  find(collectionName, predicate) {
    const collection = this.get(collectionName);
    return collection.filter(predicate);
  }

  findOne(collectionName, predicate) {
    const collection = this.get(collectionName);
    return collection.find(predicate) || null;
  }

  insert(collectionName, item) {
    const data = this._readAll();
    if (!data[collectionName]) data[collectionName] = [];
    if (item && item.id && data[collectionName].some(existing => existing.id === item.id)) {
      throw new Error(`Duplicate id "${item.id}" in ${collectionName}`);
    }
    data[collectionName].push(item);
    this._writeAll(data);
    return item;
  }

  update(collectionName, id, updates) {
    const data = this._readAll();
    const list = data[collectionName] || [];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;

    list[index] = { ...list[index], ...updates };
    data[collectionName] = list;
    this._writeAll(data);
    return list[index];
  }

  delete(collectionName, id) {
    const data = this._readAll();
    const list = data[collectionName] || [];
    const initialLen = list.length;
    data[collectionName] = list.filter(item => item.id !== id);
    if (data[collectionName].length !== initialLen) {
      this._writeAll(data);
      return true;
    }
    return false;
  }

  getSettings() {
    const data = this._readAll();
    return data.settings || seedData.settings;
  }

  updateSettings(newSettings) {
    const data = this._readAll();
    data.settings = { ...(data.settings || {}), ...newSettings };
    this._writeAll(data);
    return data.settings;
  }

  logAudit(action, description, performedBy = 'System') {
    const entry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      description,
      timestamp: new Date().toISOString(),
      performedBy
    };
    // Keep only the most recent 200 audit entries to prevent unbounded growth
    const data = this._readAll();
    if (!data.auditLogs) data.auditLogs = [];
    data.auditLogs.push(entry);
    if (data.auditLogs.length > 200) {
      data.auditLogs = data.auditLogs.slice(-200);
    }
    this._writeAll(data);
    return entry;
  }

  resetToSeed() {
    this._writeAll(JSON.parse(JSON.stringify(seedData)));
    return true;
  }
}

const db = new JSONDatabase();
module.exports = db;
