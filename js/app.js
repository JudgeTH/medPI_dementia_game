/* =========================================================
   app.js — Simple Avatar (single-image) + Coins + Shop-ready
   - ไม่ใช้ ES Modules (no import/export)
   - แสดงอวาตาร์จากภาพเดี่ยว (fallback เป็น base ที่ให้มา)
   - เหรียญใต้ชื่อ (ledger แบบง่าย)
   - อินเวนทอรีเฉพาะ "avatars" (ซื้อแล้วเป็นเจ้าของ เปลี่ยนได้)
   - ไม่ยุ่งกับปุ่ม "เล่นเกม"
   ========================================================= */

(function () {
  /* ---------------- Config & Utils ---------------- */
  const KEYS = {
    uid: 'current_uid',
    name: 'player_name',
    coins: 'player_coins',
    ledger: (uid) => `stars_ledger:${uid}`,
    avatarId: 'avatar_id',
    avatarAsset: 'avatar_asset',
    avatarsOwned: 'avatars_owned', // array of avatar ids
  };

  // พาธรูป base ที่อาจารย์มีอยู่แล้ว
  const AVATAR_DEFAULTS = [
    {
      id: 'elderly_male_base',
      name: 'ผู้ชายสูงวัย',
      asset: '/assets/images/characters/base/elderly_male_base.png',
      price: 0
    },
    {
      id: 'elderly_female_base',
      name: 'ผู้หญิงสูงวัย',
      asset: '/assets/images/characters/base/elderly_female_base.png',
      price: 0
    }
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const nowISO = () => new Date().toISOString();
  const toInt = (v, d=0) => (Number.isFinite(+v) ? +v : d);

  const store = {
    get(k, d=null){ try{ const r=localStorage.getItem(k); if(r===null)return d; return /^\[|\{/.test(r)?JSON.parse(r):r; }catch{return d;} },
    set(k,v){ try{ localStorage.setItem(k, typeof v==='object'?JSON.stringify(v):String(v)); }catch{} },
    del(k){ try{ localStorage.removeItem(k);}catch{} }
  };

  /* ---------------- Economy (ledger แบบง่าย) ---------------- */
  const economy = {
    uid(){ return store.get(KEYS.uid) || 'guest'; },
    _ledger(uid=this.uid()){ return store.get(KEYS.ledger(uid), []); },
    _saveLedger(arr, uid=this.uid()){ store.set(KEYS.ledger(uid), arr); },
    async balance(uid=this.uid()){
      const L = this._ledger(uid);
      if (!L.length) return toInt(store.get(KEYS.coins, 0));
      return L.reduce((s,r)=>s+(r.delta||0),0);
    },
    async add(delta, reason='reward', uid=this.uid()){
      if (!delta) return this.balance(uid);
      const L = this._ledger(uid);
      L.push({ id:`${Date.now()}-${Math.random().toString(36).slice(2)}`, at:nowISO(), delta:+delta, reason });
      this._saveLedger(L, uid);
      const bal = await this.balance(uid);
      store.set(KEYS.coins, bal); // เผื่อโค้ดเดิมยังอ่านคีย์นี้
      document.dispatchEvent(new Event('coins:changed'));
      return bal;
    },
    async spend(cost, reason='purchase', uid=this.uid()){
      cost = Math.abs(toInt(cost,0));
      const bal = await this.balance(uid);
      if (bal < cost) throw new Error('เหรียญไม่พอ');
      return this.add(-cost, reason, uid);
    }
  };

  /* ---------------- Avatar (single-image) ---------------- */
  const avatar = {
    // รายการอวาตาร์ที่ “ร้าน” จะใช้ (พยายามโหลดจาก /data/avatars.json ถ้าไม่มีจะใช้ AVATAR_DEFAULTS)
    async listAll(){
      try{
        const res = await fetch('/data/avatars.json', {cache:'no-store'});
        if (res.ok) return await res.json();
      }catch(e){}
      return AVATAR_DEFAULTS;
    },
    owned(){
      return store.get(KEYS.avatarsOwned, []) || [];
    },
    _saveOwned(arr){
      store.set(KEYS.avatarsOwned, arr);
    },
    ensureOwnBase(){
      const own = new Set(this.owned());
      AVATAR_DEFAULTS.forEach(a => own.add(a.id));
      this._saveOwned(Array.from(own));
    },
    current(){
      return {
        id: store.get(KEYS.avatarId) || AVATAR_DEFAULTS[0].id,
        asset: store.get(KEYS.avatarAsset) || AVATAR_DEFAULTS[0].asset
      };
    },
    setCurrent({id, asset}){
      if (id) store.set(KEYS.avatarId, id);
      if (asset) store.set(KEYS.avatarAsset, asset);
      this.render();
    },
    async buyAndEquip(avatarObj){
      const own = new Set(this.owned());
      if (!own.has(avatarObj.id)){
        if (avatarObj.price && avatarObj.price>0){
          await economy.spend(avatarObj.price, `purchase:avatar:${avatarObj.id}`);
        }
        own.add(avatarObj.id);
        this._saveOwned(Array.from(own));
      }
      this.setCurrent({id: avatarObj.id, asset: avatarObj.asset});
      document.dispatchEvent(new Event('inventory:changed'));
      document.dispatchEvent(new Event('coins:changed'));
    },
    render(){
      const area = $('#character-display-area');
      if (!area) return;
      // สร้าง/อัปเดต img เดียว
      let img = area.querySelector('img.avatar-img');
      if (!img){
        area.innerHTML = ''; // ล้าง loader เดิม
        img = document.createElement('img');
        img.className = 'avatar-img';
        img.alt = 'avatar';
        img.style.maxWidth = '260px';
        img.style.maxHeight = '360px';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '18px';
        img.style.boxShadow = '0 6px 24px rgba(0,0,0,.08)';
        area.appendChild(img);
      }
      const cur = this.current();
      img.onerror = () => {
        // หากพาธผิด ให้ย้อนกลับไปยัง base ตัวแรก
        const fallback = AVATAR_DEFAULTS[0];
        img.src = fallback.asset;
        this.setCurrent({id:fallback.id, asset:fallback.asset});
      };
      img.src = cur.asset;
    }
  };

  /* ---------------- Header (ชื่อ + เหรียญ) ---------------- */
  const headerUI = {
    ensureCoinsInline(){
      if (!document.getElementById('header-coins')){
        const host = $('.name-and-coins') || $('.header') || document.body;
        const div = document.createElement('div');
        div.className = 'player-coins-inline';
        div.innerHTML = `<span class="coin-icon">⭐</span> <span id="header-coins">0</span> เหรียญ`;
        host.appendChild(div);
      }
    },
    refreshName(){
      const el = document.getElementById('display-name');
      if (el) el.textContent = store.get(KEYS.name) || 'ผู้เล่น';
    },
    async refreshCoins(){
      const el = document.getElementById('header-coins');
      if (el) el.textContent = await economy.balance();
    },
    init(){
      document.addEventListener('coins:changed', this.refreshCoins);
      document.addEventListener('DOMContentLoaded', () => {
        this.ensureCoinsInline();
        this.refreshName();
        this.refreshCoins();
      });
    }
  };

  /* ---------------- Play Game (ไม่ลบการ์ด) ---------------- */
  function ensurePlayGameCard() {
    if (document.getElementById('open-games')) return;
    const grid = document.querySelector('.actions-grid, .action-grid, .actions, #action-cards, main .container');
    if (!grid) return;
    const btn = document.createElement('button');
    btn.id = 'open-games';
    btn.className = 'action-card games-card';
    btn.innerHTML = `<div class="action-icon">🎮</div><h3>เล่นเกม</h3><p>เริ่มเล่นและสะสมเหรียญ</p>`;
    btn.addEventListener('click', () => {
      if (window.App?.openGame) window.App.openGame();
      else location.href = '/pages/game.html';
    });
    grid.prepend(btn);
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    // ค่าเริ่มต้นปลอดภัย
    if (!store.get(KEYS.uid)) store.set(KEYS.uid, 'guest');
    if (!store.get(KEYS.name)) store.set(KEYS.name, 'ผู้เล่น');

    // ถ้ามีเหรียญเก่าในคีย์ coins แต่ยังไม่มี ledger ให้ย้ายเข้า ledger
    const legacy = toInt(store.get(KEYS.coins, 0));
    if (legacy && economy._ledger(economy.uid()).length === 0){
      await economy.add(legacy, 'migrate:legacy');
    }

    headerUI.init();
    ensurePlayGameCard();

    // ให้เป็นเจ้าของอวาตาร์ base เสมอ
    avatar.ensureOwnBase();

    // ตั้งค่าอวาตาร์ปัจจุบันครั้งแรก (ถ้ายังไม่เคยตั้ง)
    const cur = avatar.current();
    if (!cur || !cur.asset){
      avatar.setCurrent({ id: AVATAR_DEFAULTS[0].id, asset: AVATAR_DEFAULTS[0].asset });
    }

    // วาดอวาตาร์
    avatar.render();
  });

  /* ---------------- Public API ---------------- */
  window.App = Object.assign(window.App || {}, {
    economy,
    avatar,
    // ตัวอย่างใช้ในหน้า "ร้าน": ซื้ออวาตาร์แล้วสวมใส่
    // await App.avatar.buyAndEquip({id:'elderly_male_base', asset:'/assets/...png', price:0})
  });
})();
