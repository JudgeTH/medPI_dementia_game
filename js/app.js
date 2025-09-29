/* ========================================
   app.js — PWA Game (HOTFIX)
   - DO NOT remove game widget anymore
   - Restore/ensure "Play Game" button if missing
   - Keep coins under name + pet slot
   - Economy (ledger) + Inventory
   ======================================== */

(function () {
  // ====== CONFIG ======
  const KEYS = {
    uid: 'current_uid',
    name: 'player_name',
    coins: 'player_coins',
    petAsset: 'player_pet_asset',
    inv: (uid) => `inventory:${uid}`,
    ledger: (uid) => `stars_ledger:${uid}`,
  };

  // ====== UTIL ======
  const nowISO = () => new Date().toISOString();
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const safeInt = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

  // ====== STORAGE (localStorage) ======
  const store = {
    get(k, d=null){ try{ const r=localStorage.getItem(k); if(r===null)return d; return /^\[|\{/.test(r)?JSON.parse(r):r; }catch{return d;} },
    set(k,v){ try{ localStorage.setItem(k, (typeof v==='object')?JSON.stringify(v):String(v)); }catch{} },
    del(k){ try{ localStorage.removeItem(k); }catch{} },
  };

  // ====== ECONOMY ======
  const economy = {
    getUid(){ return store.get(KEYS.uid) || 'guest'; },
    _getLedger(uid){ return store.get(KEYS.ledger(uid), []); },
    _setLedger(uid, arr){ store.set(KEYS.ledger(uid), arr); },
    async getStarBalance(uid = economy.getUid()){
      const ledger = economy._getLedger(uid);
      if (!ledger.length) return safeInt(store.get(KEYS.coins, 0));
      return ledger.reduce((s, r) => s + (r.delta || 0), 0);
    },
    async addStars(delta, reason='reward', uid = economy.getUid()){
      if (!delta) return economy.getStarBalance(uid);
      const ledger = economy._getLedger(uid);
      ledger.push({ id:`${Date.now()}-${Math.random().toString(36).slice(2)}`, at: nowISO(), delta:+delta, reason });
      economy._setLedger(uid, ledger);
      const bal = await economy.getStarBalance(uid);
      store.set(KEYS.coins, bal);
      document.dispatchEvent(new Event('coins:changed'));
      return bal;
    },
    async spendStars(cost, reason='purchase', uid = economy.getUid()){
      cost = Math.abs(safeInt(cost, 0));
      const bal = await economy.getStarBalance(uid);
      if (bal < cost) throw new Error('เหรียญไม่พอ');
      return economy.addStars(-cost, reason, uid);
    }
  };

  // ====== INVENTORY ======
  const inventory = {
    _read(uid=economy.getUid()){ return store.get(KEYS.inv(uid), []); },
    _write(arr, uid=economy.getUid()){ store.set(KEYS.inv(uid), arr); },
    async listOwned(uid=economy.getUid()){ return inventory._read(uid); },
    async hasItem(itemId, uid=economy.getUid()){ return inventory._read(uid).some(x=>x.itemId===itemId); },
    async addItem(item, uid=economy.getUid()){
      const arr = inventory._read(uid);
      if (!arr.some(x=>x.itemId===item.id)){ arr.push({ itemId:item.id, ownedAt:nowISO(), item }); inventory._write(arr, uid); }
      document.dispatchEvent(new Event('inventory:changed'));
      return true;
    }
  };

  // ====== PET SLOT ======
  const pet = {
    getAsset(){ return store.get(KEYS.petAsset, null); },
    setAsset(src){ if(src) store.set(KEYS.petAsset, src); else store.del(KEYS.petAsset); document.dispatchEvent(new Event('pet:changed')); },
    refreshSlot(){
      const img = document.getElementById('pet-image');
      if (!img) return;
      const src = pet.getAsset();
      if (src){ if (img.src !== src) img.src = src; img.style.opacity = 1; }
      else { img.removeAttribute('src'); img.style.opacity = 0; }
    }
  };

  // ====== HEADER (name + coins) ======
  const headerUI = {
    refreshName(){
      const el = document.getElementById('display-name');
      if (!el) return;
      el.textContent = store.get(KEYS.name) || 'ผู้เล่น';
    },
    async refreshCoins(){
      const el = document.getElementById('header-coins');
      if (!el) return;
      el.textContent = await economy.getStarBalance();
    },
    ensureCoinsInline(){
      if (!document.getElementById('header-coins')){
        const nameWrap = $('.name-and-coins') || $('.header') || document.body;
        const div = document.createElement('div');
        div.className = 'player-coins-inline';
        div.innerHTML = `<span class="coin-icon">⭐</span> <span id="header-coins">0</span> เหรียญ`;
        nameWrap.appendChild(div);
      }
    },
    init(){
      document.addEventListener('coins:changed', headerUI.refreshCoins);
      document.addEventListener('pet:changed', pet.refreshSlot);
      document.addEventListener('DOMContentLoaded', () => {
        headerUI.ensureCoinsInline();
        headerUI.refreshName();
        headerUI.refreshCoins();
        pet.refreshSlot();
      });
    }
  };

  // ====== GAME WIDGET (restore if missing) ======
  function ensurePlayGameCard() {
    // ไม่ลบอะไรอีกแล้ว — ถ้าไม่มีปุ่มเล่นเกม เราจะ “เพิ่ม” ให้
    if (document.getElementById('open-games')) return;

    // หา grid ที่วางการ์ด (เดา class ที่พบบ่อย)
    const containers = [
      $('.actions-grid'),
      $('.actions'),
      $('#action-cards'),
      document.querySelector('main .container'),
    ].filter(Boolean);

    if (!containers.length) return;

    const btn = document.createElement('button');
    btn.id = 'open-games';
    btn.className = 'action-card games-card';
    btn.innerHTML = `
      <div class="action-icon">🎮</div>
      <h3>เล่นเกม</h3>
      <p>เริ่มเล่นและสะสมเหรียญ</p>
    `;

    // พฤติกรรมเมื่อกด: เรียกฟังก์ชันถ้ามี, ไม่งั้นเดาง่ายๆ
    btn.addEventListener('click', () => {
      if (window.App && typeof window.App.openGame === 'function') {
        window.App.openGame();
      } else if (document.getElementById('start-game')) {
        document.getElementById('start-game').click();
      } else if (location.pathname.endsWith('/') || location.pathname.endsWith('index.html')) {
        // ลองไปหน้าเกมมาตรฐาน
        const candidates = ['/game.html', '/pages/game.html', '/pages/games.html'];
        const target = candidates.find(p => p);
        location.href = target;
      } else {
        // ยิงอีเวนต์ให้โค้ดเดิมจับไปเปิดเกมเอง
        document.dispatchEvent(new Event('ui:open-game'));
      }
    });

    // ใส่เป็นใบแรกในกริด
    containers[0].prepend(btn);
  }

  // ====== BOOTSTRAP ======
  document.addEventListener('DOMContentLoaded', async () => {
    // init defaults
    if (!store.get(KEYS.uid)) store.set(KEYS.uid, 'guest');
    if (!store.get(KEYS.name)) store.set(KEYS.name, 'ผู้เล่น');

    headerUI.init();
    ensurePlayGameCard();

    // migrate legacy coins -> ledger (ครั้งเดียวก็ได้ ทำซ้ำไม่พัง)
    const legacy = safeInt(store.get(KEYS.coins, 0));
    if (legacy && economy._getLedger(economy.getUid()).length === 0) {
      await economy.addStars(legacy, 'migrate:legacy');
    }
  });

  // ====== PUBLIC API ======
  window.App = Object.assign(window.App || {}, {
    economy, inventory, pet,
    ui: {
      refreshCoins: headerUI.refreshCoins,
      refreshPet: pet.refreshSlot,
      refreshName: headerUI.refreshName,
    },
    // ให้หน้าอื่นเรียกเปิดเกมแบบกำหนดเองได้
    openGame: window.App?.openGame || null,
    purchaseItemById: async function (itemId, getItemByIdFn) {
      const item = await Promise.resolve(getItemByIdFn(itemId));
      if (!item) throw new Error('ไม่พบสินค้า');
      await economy.spendStars(item.price, `purchase:${item.id}`);
      await inventory.addItem(item);
      document.dispatchEvent(new Event('coins:changed'));
      return true;
    },
  });

})();
