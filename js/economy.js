// js/economy.js
import * as storage from './utils/storage.js';
import { STORAGE_KEYS } from './utils/constants.js';

function nowISO() { return new Date().toISOString(); }

export async function getCurrentUid() {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_UID) || null;
}

export async function getStarBalance(userId) {
  // sum ของ delta ทั้งหมดใน stars_ledger ของ userId
  const rows = await storage.queryAll('stars_ledger', r => r.userId === userId);
  return rows.reduce((sum, r) => sum + (r.delta || 0), 0);
}

export async function addStars(userId, delta, reason='reward') {
  if (!userId || !delta) return;
  await storage.put('stars_ledger', {
    id: Date.now() + ':' + Math.random().toString(36).slice(2),
    userId, delta, reason, at: nowISO()
  });
  return getStarBalance(userId);
}

export async function spendStars(userId, cost, reason='purchase') {
  const bal = await getStarBalance(userId);
  if (bal < cost) throw new Error('ดาวไม่พอ');
  // บันทึกเป็นค่า delta ติดลบ
  return addStars(userId, -Math.abs(cost), reason);
}
