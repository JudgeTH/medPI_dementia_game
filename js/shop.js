// js/shop.js
import * as storage from './utils/storage.js';
import { getCurrentUid, getStarBalance, spendStars } from './economy.js';
import { addItem, hasItem } from './inventory.js';

async function loadItems() {
  // โหลดจาก IndexedDB ก่อน ถ้าไม่มีค่อย fetch จากไฟล์แล้ว cache
  let items = await storage.getAll('items');
  if (!items || items.length === 0) {
    const res = await fetch('/data/items.json');
    items = await res.json();
    for (const it of items) await storage.put('items', it);
  }
  return items;
}

function renderItemCard(it, { owned, canBuy, balance }) {
  return `
    <div class="card item-card">
      <img src="${it.asset}" alt="${it.name}" class="item-img" />
      <div class="item-body">
        <div class="item-title">${it.name}</div>
        <div class="item-price">ราคา: ${it.price} ⭐</div>
        <div class="item-actions">
          ${owned ? `<button disabled class="btn owned">เป็นเจ้าของแล้ว</button>`
                  : `<button class="btn buy" data-id="${it.id}" ${!canBuy?'disabled':''}>
                       ซื้อ (${it.price} / ยอดคงเหลือ ${balance})
                     </button>`
          }
        </div>
      </div>
    </div>
  `;
}

async function refresh() {
  const root = document.getElementById('shopRoot');
  const uid = await getCurrentUid();
  if (!uid) { root.innerHTML = '<p>กรุณาเริ่มใช้งาน/เข้าสู่ระบบแบบแฝงก่อน</p>'; return; }

  const [items, balance] = [await loadItems(), await getStarBalance(uid)];
  const cards = await Promise.all(items.map(async (it) => {
    const owned = await hasItem(uid, it.id);
    return renderItemCard(it, { owned, canBuy: balance >= it.price, balance });
  }));
  root.innerHTML = `<div class="grid">${cards.join('')}</div>`;

  // bind buy buttons
  root.querySelectorAll('.buy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const item = await storage.get('items', id);
      try {
        await spendStars(uid, item.price, `purchase:${id}`);
        await addItem(uid, item);
        await refresh();
        alert(`ซื้อ “${item.name}” สำเร็จ!`);
      } catch (e) {
        alert(e.message || 'ซื้อไม่สำเร็จ');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', refresh);
