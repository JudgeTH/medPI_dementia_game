// js/utils/storage.js
const DB_NAME = 'ecg-db';
const DB_VERSION = 1;
let dbPromise;

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = req.result;
        // stores หลักตามสคีมา (users, sessions, attempts, inventory, stars_ledger, items)
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'uid' });
        if (!db.objectStoreNames.contains('inventory')) db.createObjectStore('inventory', { keyPath: ['userId','itemId'] });
        if (!db.objectStoreNames.contains('stars_ledger')) db.createObjectStore('stars_ledger', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
        // คุณอาจมี sessions/attempts อยู่แล้วตามระบบเกม
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('attempts')) db.createObjectStore('attempts', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx(store, mode='readonly') {
  const db = await openDB();
  return db.transaction(store, mode).objectStore(store);
}

export async function get(store, key) {
  const s = await tx(store);
  return new Promise((resolve, reject) => {
    const r = s.get(key);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}

export async function put(store, value) {
  const s = await tx(store, 'readwrite');
  return new Promise((resolve, reject) => {
    const r = s.put(value);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function del(store, key) {
  const s = await tx(store, 'readwrite');
  return new Promise((resolve, reject) => {
    const r = s.delete(key);
    r.onsuccess = () => resolve(true);
    r.onerror = () => reject(r.error);
  });
}

export async function getAll(store) {
  const s = await tx(store);
  return new Promise((resolve, reject) => {
    const r = s.getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}

export async function queryAll(store, filterFn) {
  const all = await getAll(store);
  return all.filter(filterFn || (()=>true));
}
