/* ========================================
   app.js — PWA Game (HOTFIX 2: Character Bootstrapper)
   - Keep coins under name + pet slot
   - Restore/ensure Play Game card (no removal)
   - Try to mount character; else draw fallback avatar
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
  const FALLBACK_AVATAR = {
    // ใส่ path รูป placeholder ได้ ถ้าไม่มีจะใช้ emoji
    src: '/assets/images/characters/default.png',
    bg: 'linear-gradient(180deg,#f7faff 0%, #eef5ff 100%)'
  };

  // ====== UTIL ======
  const nowISO = () => new Date().toISOString();
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const safeInt = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
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
    if (document.getElementById('open-games')) return;
    const containers = [
      $('.actions-grid'), $('.action-grid'),
      $('.actions'), $('#action-cards'),
      document.querySelector('main .container')
    ].filter(Boolean);
    if (!containers.length) return;
    const btn = document.createElement('button');
    btn.id = 'open-games';
    btn.className = 'action-card games-card';
    btn.innerHTML = `<div class="action-icon">🎮</div><h3>เล่นเกม</h3><p>เริ่มเล่นและสะสมเหรียญ</p>`;
    btn.addEventListener('click', () => {
      if (window.App && typeof window.App.openGame === 'function') window.App.openGame();
      else if (document.getElementById('start-game')) document.getElementById('start-game').click();
      else location.href = '/pages/game.html';
    });
    containers[0].prepend(btn);
  }

  // ====== CHARACTER BOOTSTRAPPER ======
  function hasCharacterMounted() {
    // มองหาคอนเทนเนอร์หลักที่ character.js น่าจะสร้าง
    const area = $('#character-display-area');
    if (!area) return false;
    return !!area.querySelector('#image-character-container, .character-container, canvas, img.character-sprite');
  }

  async function tryMountCharacter() {
    // เรียกเมธอดที่อาจจะมีอยู่ใน character.js
    const targetSel = '#character-display-area';
    try {
      if (window.Character && typeof window.Character.mount === 'function')
        return !!(await window.Character.mount(targetSel));
      if (window.Character && typeof window.Character.renderTo === 'function')
        return !!(await window.Character.renderTo(targetSel));
      if (window.Character && typeof window.Character.init === 'function')
        return !!(await window.Character.init(targetSel));
      if (typeof window.renderCharacter === 'function')
        return !!(await window.renderCharacter(targetSel));
    } catch(e){
      console.warn('Character API error:', e);
    }
    return false;
  }

  function drawFallbackCharacter() {
    const area = $('#character-display-area');
    if (!area) return;
    // เคลียร์ loader แล้ววาด Fallback
    area.innerHTML = `
      <div id="image-character-container" class="character-container" 
           style="width:260px;height:360px;border-radius:18px;display:flex;align-items:center;justify-content:center;
                  background:${FALLBACK_AVATAR.bg}; box-shadow:0 6px 24px rgba(0,0,0,.08); position:relative;">
        <div style="position:absolute;top:10px;left:10px;font-weight:700;background:rgba(255,255,255,.75);
                    border-radius:10px;padding:6px 10px;backdrop-filter:blur(4px);">
          <span id="fallback-name"></span>
        </div>
        <img id="fallback-img" alt="" style="max-width:90%;max-height:90%;object-fit:contain;"/>
      </div>
    `;
    // ชื่อผู้เล่น
    $('#fallback-name').textContent = store.get(KEYS.name) || 'ผู้เล่น';
    // รูปภาพ (ถ้าไม่มีไฟล์จริง ให้ใช้ emoji)
    const img = $('#fallback-img');
    img.onerror = () => { img.replaceWith(Object.assign(document.createElement('div'), {textContent:'🧍', style:'font-size:96px;'})); };
    img.src = FALLBACK_AVATAR.src;
  }

  function bootCharacter() {
    // 1) รอ DOM พร้อมก่อน
    document.addEventListener('DOMContentLoaded', async () => {
      const loader = $('.character-loading');
      if (loader) loader.style.opacity = .7;

      // 2) พยายาม mount ผ่าน character.js ภายใน 800ms
      let mounted = await Promise.race([
        tryMountCharacter(),
        new Promise(res => setTimeout(()=>res(false), 800))
      ]);

      // 3) ถ้ายังไม่เจอ ให้รอต่ออีกนิด (บางไฟล์โหลดช้า)
      if (!mounted) {
        mounted = await Promise.race([
          tryMountCharacter(),
          new Promise(res => setTimeout(()=>res(false), 900))
        ]);
      }

      // 4) ถ้าไม่สำเร็จจริง ๆ -> วาด Fallback
      if (!mounted && !hasCharacterMounted()) {
        drawFallbackCharacter();
      }
    });
  }

  // ====== BOOTSTRAP ======
  document.addEventListener('DOMContentLoaded', async () => {
    if (!store.get(KEYS.uid)) store.set(KEYS.uid, 'guest');
    if (!store.get(KEYS.name)) store.set(KEYS.name, 'ผู้เล่น');

    headerUI.init();
    ensurePlayGameCard();

    // migrate legacy coins -> ledger (ทำซ้ำได้ไม่พัง)
    const legacy = safeInt(store.get(KEYS.coins, 0));
    if (legacy && economy._getLedger(economy.getUid()).length === 0) {
      await economy.addStars(legacy, 'migrate:legacy');
    }
  });

  bootCharacter();

  // ====== PUBLIC API ======
  window.App = Object.assign(window.App || {}, {
    economy, inventory, pet,
    ui: {
      refreshCoins: headerUI.refreshCoins,
      refreshPet: pet.refreshSlot,
      refreshName: headerUI.refreshName,
    },
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
