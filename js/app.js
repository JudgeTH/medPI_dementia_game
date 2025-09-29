/* =========================================================
   app.js — Integrated with character.js (Adapter-first)
   - Reads avatar & renders via character.js (no guessing)
   - Listens to Character events (ready/updated)
   - Coins under name + pet slot transparent when none
   - Does NOT remove the Play Game widget
   ========================================================= */

(function () {

  /* ---------------- Basic utils ---------------- */
  const KEYS = {
    uid: 'current_uid',
    name: 'player_name',
    coins: 'player_coins',
    petAsset: 'player_pet_asset',
    inv: (uid) => `inventory:${uid}`,
    ledger: (uid) => `stars_ledger:${uid}`,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const nowISO = () => new Date().toISOString();
  const safeInt = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

  const store = {
    get(k, d=null){ try{ const r=localStorage.getItem(k); if(r===null)return d; return /^\[|\{/.test(r)?JSON.parse(r):r; }catch{return d;} },
    set(k,v){ try{ localStorage.setItem(k, (typeof v==='object')?JSON.stringify(v):String(v)); }catch{} },
    del(k){ try{ localStorage.removeItem(k); }catch{} },
  };

  /* ---------------- Economy & Inventory ---------------- */
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

  /* ---------------- Pet Slot ---------------- */
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

  /* ---------------- Header UI ---------------- */
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
        const host = $('.name-and-coins') || $('.header') || document.body;
        const div = document.createElement('div');
        div.className = 'player-coins-inline';
        div.innerHTML = `<span class="coin-icon">⭐</span> <span id="header-coins">0</span> เหรียญ`;
        host.appendChild(div);
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

  /* ---------------- Character Adapter ----------------
     จุดประสงค์: พูดภาษาเดียวกับ character.js ไม่ว่ารูปแบบ API จะเป็นแบบไหน
     รองรับ:
       - window.Character.mount(target) / render(target) / renderTo(target) / init(target)
       - window.Character.getAvatarAsset() หรือ getAvatar() -> {asset|sprite|url}
       - window.Character.state.avatar.asset
       - Event: Character.on('ready'|'updated') และ DOM events: character:ready / character:updated
  ----------------------------------------------------- */
  const CharacterAdapter = (function(){
    const api = {
      isReady(){
        return !!window.Character;
      },
      on(evt, cb){
        let off = ()=>{};
        // 1) Character.on
        if (window.Character && typeof window.Character.on === 'function'){
          try {
            const ret = window.Character.on(evt, cb);
            if (typeof ret === 'function') off = ret;
          } catch {}
        }
        // 2) DOM CustomEvent
        const domHandler = (e)=>cb(e.detail||e);
        document.addEventListener(`character:${evt}`, domHandler);
        // 3) บางโปรเจกต์ยิง 'ready' ตรง ๆ
        if (evt === 'ready') document.addEventListener('ready', domHandler);
        return () => {
          off();
          document.removeEventListener(`character:${evt}`, domHandler);
          if (evt === 'ready') document.removeEventListener('ready', domHandler);
        };
      },
      async render(targetSelector){
        const target = (typeof targetSelector==='string') ? $(targetSelector) : targetSelector;
        if (!target) return false;
        const C = window.Character;
        if (!C) return false;
        try {
          if (typeof C.mount === 'function') return !!(await C.mount(target));
          if (typeof C.renderTo === 'function') return !!(await C.renderTo(target));
          if (typeof C.render === 'function') return !!(await C.render(target));
          if (typeof C.init === 'function') return !!(await C.init(target));
        } catch(e){ console.warn('Character.render error:', e); }
        return false;
      },
      getAvatarAsset(){
        const C = window.Character;
        if (!C) return null;
        try {
          if (typeof C.getAvatarAsset === 'function') return C.getAvatarAsset();
          if (typeof C.getAvatar === 'function'){
            const a = C.getAvatar();
            return a?.asset || a?.sprite || a?.url || null;
          }
          if (C.avatarAsset) return C.avatarAsset;
          if (C.state?.avatar?.asset) return C.state.avatar.asset;
        } catch(e){}
        return null;
      }
    };
    return api;
  })();

  /* ---------------- Character Bootstrap ---------------- */
  function characterMounted() {
    const area = $('#character-display-area');
    if (!area) return false;
    return !!area.querySelector('#image-character-container, .character-container, canvas, img.character-sprite');
  }

  async function mountCharacter() {
    const areaSel = '#character-display-area';
    const loader = $('.character-loading');
    if (loader) loader.style.opacity = .8;

    // ถ้า Character ยังไม่พร้อม ให้รอเป็นช่วง ๆ แล้วลองใหม่
    let tries = 0;
    while (!CharacterAdapter.isReady() && tries < 12) { // รวม ~3วินาที
      await new Promise(r => setTimeout(r, 250));
      tries++;
    }
    if (!CharacterAdapter.isReady()) return false;

    // bind events: ready/updated -> sync avatar if needed
    CharacterAdapter.on('ready', syncAvatarLabelOnly);
    CharacterAdapter.on('updated', syncAvatarLabelOnly);

    // render
    const ok = await CharacterAdapter.render(areaSel);
    if (ok && loader) loader.remove();
    // อ่าน asset (ถ้ามี) -> ใส่ alt/src ให้ container ปัจจุบัน (ไม่ทับ DOM ที่ character.js วาด)
    syncAvatarLabelOnly();
    return ok;
  }

  function syncAvatarLabelOnly(){
    // ใช้เพื่ออัพเดต alt/src ของรูปหลัก ถ้า character.js เปิดให้ดึง asset ได้
    const asset = CharacterAdapter.getAvatarAsset();
    const container = $('#image-character-container') || $('#character-display-area');
    if (!container) return;
    if (asset){
      let img = container.querySelector('img.character-sprite, img[data-role="avatar"], img');
      if (!img){
        img = document.createElement('img');
        img.setAttribute('data-role','avatar');
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        container.appendChild(img);
      }
      if (img && !img.classList.contains('character-sprite')) {
        img.src = asset;
      }
    }
  }

  /* ---------------- Play Game button (no removal) ---------------- */
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

  /* ---------------- Boot ---------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    // defaults
    if (!store.get(KEYS.uid)) store.set(KEYS.uid, 'guest');
    if (!store.get(KEYS.name)) store.set(KEYS.name, 'ผู้เล่น');

    headerUI.init();
    ensurePlayGameCard();

    // migrate legacy coins -> ledger (ทำซ้ำได้)
    const legacy = safeInt(store.get(KEYS.coins, 0));
    if (legacy && economy._getLedger(economy.getUid()).length === 0) {
      await economy.addStars(legacy, 'migrate:legacy');
    }

    // เชื่อม character.js จริง
    mountCharacter();
  });

  /* ---------------- Public API ---------------- */
  window.App = Object.assign(window.App || {}, {
    economy, inventory, pet,
    ui: {
      refreshCoins: headerUI.refreshCoins,
      refreshPet: pet.refreshSlot,
      refreshName: headerUI.refreshName,
    },
    character: {
      mount: mountCharacter,
      getAvatarAsset: () => CharacterAdapter.getAvatarAsset()
    },
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
