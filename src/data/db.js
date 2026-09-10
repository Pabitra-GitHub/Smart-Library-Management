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
        console.warn('Database file corrupted or empty. Re-seeding data.');
        this._writeAll(JSON.parse(JSON.stringify(seedData)));
      }
    }
  }

  _readAll() {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading database file:', err);
      return JSON.parse(JSON.stringify(seedData));
    }
  }

  _writeAll(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('Error writing database file:', err);
      return false;
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
    this.insert('auditLogs', entry);
    return entry;
  }

  resetToSeed() {
    this._writeAll(JSON.parse(JSON.stringify(seedData)));
    return true;
  }
}

const db = new JSONDatabase();
module.exports = db;
