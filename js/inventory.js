// js/inventory.js
import * as storage from './utils/storage.js';

function nowISO() { return new Date().toISOString(); }

export async function listOwned(userId) {
  return storage.queryAll('inventory', r => r.userId === userId);
}

export async function hasItem(userId, itemId) {
  const key = [userId, itemId];
  const row = await storage.get('inventory', key);
  return !!row;
}

export async function addItem(userId, item) {
  // item: {id, type, slot, asset, name, price}
  await storage.put('inventory', { userId, itemId: item.id, ownedAt: nowISO(), item });
  return true;
}
