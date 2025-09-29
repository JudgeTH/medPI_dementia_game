/* ========================================
   app.js — PWA Game (single-file integration)
   - Hides the "Games" widget
   - Shows live coins under display name
   - Reserves a pet slot (transparent if none)
   - Simple Economy (ledger) + Inventory (own items)
   - Event hooks for UI refresh
   ======================================== */

(function () {
  // ====== CONFIG ======
  const USE_INDEXEDDB = false; // ถ้ายังไม่ใช้ IndexedDB ให้ false ไว้ก่อน
  const KEYS = {
    uid: 'current_uid',
    name: 'player_name',
    coins: 'player_coins', // fallback (ถ้าไม่ใช้ ledger)
    petAsset: 'player_pet_asset',
    inv: (uid) => `inventory:${uid}`,
    ledger: (uid) => `stars_ledger:${uid}`,
  };

  // ====== UTIL ======
  const nowISO = () => new Date().toISOString();
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const safeInt = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

  // ====== STORAGE (LocalStorage fallback) ======
  const store = {
    get(key, def = null) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return def;
        // auto JSON parse if looks like array/object
        if (/^\[|\{/.test(raw)) return JSON.parse(raw);
        return raw;
      } catch {
        return def;
      }
    },
    set(key, val) {
      try {
        if (typeof val === 'object') localStorage.setItem(key, JSON.stringify(val));
        else localStorage.setItem(key, String(val));
      } catch {}
    },
    del(key) {
      try { localStorage.removeItem(key); } catch {}
    },
  };

  // ====== ECONOMY (ledger: +/− เหรียญ พร้อมเหตุผล) ======
  const economy = {
    getUid() {
      return store.get(KEYS.uid) || 'guest';
    },
    _getLedger(uid) {
      return store.get(KEYS.ledger(uid), []);
    },
    _setLedger(uid, arr) {
      store.set(KEYS.ledger(uid), arr);
    },
    async getStarBalance(uid = economy.getUid()) {
      // ถ้ายังไม่เคยใช้ ledger ให้ fallback ใช้คีย์ coins เดิม
      const ledger = economy._getLedger(uid);
      if (!ledger.length) {
        return safeInt(store.get(KEYS.coins, 0));
      }
      return ledger.reduce((s, r) => s + (r.delta || 0), 0);
    },
    async addStars(delta, reason = 'reward', uid = economy.getUid()) {
      if (!delta) return economy.getStarBalance(uid);
      const ledger = economy._getLedger(uid);
      ledger.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, at: nowISO(), delta: +delta, reason });
      economy._setLedger(uid, ledger);
      // sync fallback coins for old UI
      const bal = await economy.getStarBalance(uid);
      store.set(KEYS.coins, bal);
      document.dispatchEvent(new Event('coins:changed'));
      return bal;
    },
    async spendStars(cost, reason = 'purchase', uid = economy.getUid()) {
      cost = Math.abs(safeInt(cost, 0));
      const bal = await economy.getStarBalance(uid);
      if (bal < cost) throw new Error('เหรียญไม่พอ');
      return economy.addStars(-cost, reason, uid);
    },
  };

  // ====== INVENTORY (ของที่เป็นเจ้าของ) ======
  const inventory = {
    getUid() { return economy.getUid(); },
    _read(uid = inventory.getUid()) {
      return store.get(KEYS.inv(uid), []);
    },
    _write(arr, uid = inventory.getUid()) {
      store.set(KEYS.inv(uid), arr);
    },
    async listOwned(uid = inventory.getUid()) {
      return inventory._read(uid);
    },
    async hasItem(itemId, uid = inventory.getUid()) {
      return inventory._read(uid).some(x => x.itemId === itemId);
    },
    async addItem(item, uid = inventory.getUid()) {
      // item: {id, name, type, slot, price, asset}
      const arr = inventory._read(uid);
      if (!arr.some(x => x.itemId === item.id)) {
        arr.push({ itemId: item.id, ownedAt: nowISO(), item });
        inventory._write(arr, uid);
      }
      document.dispatchEvent(new Event('inventory:changed'));
      return true;
    },
  };

  // ====== PET (ช่องสัตว์เลี้ยง) ======
  const pet = {
    getAsset() { return store.get(KEYS.petAsset, null); },
    setAsset(src) {
      if (src) store.set(KEYS.petAsset, src);
      else store.del(KEYS.petAsset);
      document.dispatchEvent(new Event('pet:changed'));
    },
    refreshSlot() {
      const img = $('#pet-image');
      if (!img) return;
      const src = pet.getAsset();
      if (src) {
        if (img.src !== src) img.src = src;
        img.style.opacity = 1;
      } else {
        img.removeAttribute('src');
        img.style.opacity = 0;
      }
    },
  };

  // ====== HEADER UI (ชื่อ + เหรียญ + ช่องสัตว์เลี้ยง) ======
  const headerUI = {
    refreshName() {
      const el = $('#display-name');
      if (!el) return;
      const name = store.get(KEYS.name) || 'ผู้เล่น';
      el.textContent = name;
    },
    async refreshCoins() {
      const el = document.getElementById('header-coins');
      if (!el) return;
      const n = await economy.getStarBalance();
      el.textContent = n;
    },
    initEvents() {
      document.addEventListener('coins:changed', headerUI.refreshCoins);
      document.addEventListener('pet:changed', pet.refreshSlot);
      document.addEventListener('DOMContentLoaded', () => {
        headerUI.refreshName();
        headerUI.refreshCoins();
        pet.refreshSlot();
      });
      // เผยเมธอด global ให้หน้าอื่นเรียกได้
      window.App = Object.assign(window.App || {}, {
        economy,
        inventory,
        pet,
        ui: {
          refreshCoins: headerUI.refreshCoins,
          refreshPet: pet.refreshSlot,
          refreshName: headerUI.refreshName,
        },
      });
    },
  };

  // ====== BOOTSTRAP ======
  function removeGamesWidgetIfAny() {
    // ลบแผง/ปุ่มเกมที่อยู่ข้างอวาตาร์ (ถ้ามี)
    const idsToRemove = ['open-games'];
    idsToRemove.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.parentElement) el.parentElement.removeChild(el);
    });
    // เผื่อเคสเป็นการ์ดแบบอื่น: หา textContent มีคำว่า "เล่นเกม"
    const candidates = $$('.action-card, .card, button');
    candidates.forEach(el => {
      const txt = (el.textContent || '').trim();
      if (/เล่นเกม|Games?/i.test(txt) && el.id !== 'open-shop' && el.id !== 'view-stats' && el.id !== 'customize-character') {
        el.remove();
      }
    });
  }

  function ensureHeaderCoinsWidget() {
    // ถ้าใน Header ยังไม่มีตัวเลขเหรียญ ให้สร้างอย่างสุภาพ (ไม่รบกวน layout เดิม)
    if (!document.getElementById('header-coins')) {
      const nameAndCoins = $('.name-and-coins') || $('.header .left, .header .title, header .container') || $('.header');
      if (nameAndCoins) {
        const div = document.createElement('div');
        div.className = 'player-coins-inline';
        div.innerHTML = `<span class="coin-icon">⭐</span> <span id="header-coins">0</span> เหรียญ`;
        nameAndCoins.appendChild(div);
      }
    }
  }

  function attachGlobalShortcuts() {
    // ตัวอย่าง: กด ๆ ทดสอบรับเหรียญ 1 ดวง (Shift+Alt+A)
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && e.altKey && e.code === 'KeyA') {
        economy.addStars(1, 'debug:hotkey');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // 1) เตรียม Widget ชื่อ + เหรียญ + ช่องสัตว์เลี้ยง
    ensureHeaderCoinsWidget();
    headerUI.initEvents();

    // 2) ตั้งค่าเริ่มต้น (กรณียังไม่มี uid/name)
    if (!store.get(KEYS.uid)) store.set(KEYS.uid, 'guest');
    if (!store.get(KEYS.name)) store.set(KEYS.name, 'ผู้เล่น');

    // 3) ลบวิดเจ็ต "เกมส์" ข้างอวาตาร์
    removeGamesWidgetIfAny();

    // 4) รีเฟรชค่าเบื้องต้น
    headerUI.refreshName();
    headerUI.refreshCoins();
    pet.refreshSlot();

    // 5) ช่วยแสดงเหรียญทันทีถ้าเคยเก็บในคีย์เก่า
    const legacy = safeInt(store.get(KEYS.coins, 0));
    if (legacy && economy._getLedger(economy.getUid()).length === 0) {
      // migrate one-time (ไม่มีผลเสีย หากทำซ้ำ)
      await economy.addStars(legacy, 'migrate:legacy');
    }

    attachGlobalShortcuts();
  });

  // ====== OPTIONAL: SIMPLE SHOP HELPERS ======
  // ถ้าต้องการเชื่อมกับหน้า shop ให้เรียกเมธอดพวกนี้ได้
  window.App = Object.assign(window.App || {}, {
    economy,
    inventory,
    pet,
    purchaseItemById: async function (itemId, getItemByIdFn) {
      // getItemByIdFn: (id) => item object {id, name, price, ...}
      const item = await Promise.resolve(getItemByIdFn(itemId));
      if (!item) throw new Error('ไม่พบสินค้า');
      await economy.spendStars(item.price, `purchase:${item.id}`);
      await inventory.addItem(item);
      document.dispatchEvent(new Event('coins:changed'));
      return true;
    },
  });

})();
