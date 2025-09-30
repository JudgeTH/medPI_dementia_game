/* ========================================
   Image Character System — Safari/LINE Proof
   Slots: head, face, body, pet only
   ======================================== */

class ImageCharacterSystem {
  constructor() {
    this.sceneBg = 'green';

    // ใช้ root-absolute paths เพื่อความเสถียรบน Safari/LINE
    this.imagePaths = {
      base: {
        male:   '/assets/images/characters/base/elderly_male_base.png',
        female: '/assets/images/characters/base/elderly_female_base.png',
      },
      equipment: {
        head: {
          'hat_01':    '/assets/images/characters/equipment/head/hat_01.png',
          'hat_02':    '/assets/images/characters/equipment/head/hat_02.png',
          'cap_01':    '/assets/images/characters/equipment/head/cap_01.png',
          'beret_01':  '/assets/images/characters/equipment/head/beret_01.png',
        },
        face: {
          'glasses_01':     '/assets/images/characters/equipment/face/glasses_01.png',
          'glasses_02':     '/assets/images/characters/equipment/face/glasses_02.png',
          'sunglasses_01':  '/assets/images/characters/equipment/face/sunglasses_01.png',
        },
        body: {
          'shirt_male_01':    '/assets/images/characters/equipment/body/shirt_male_01.png',
          'shirt_male_02':    '/assets/images/characters/equipment/body/shirt_male_02.png',
          'dress_female_01':  '/assets/images/characters/equipment/body/dress_female_01.png',
          'dress_female_02':  '/assets/images/characters/equipment/body/dress_female_02.png',
          'sweater_01':       '/assets/images/characters/equipment/body/sweater_01.png',
        },
        pet: {
          'cat_01':  '/assets/images/characters/pets/cat_01.png',
          'dog_01':  '/assets/images/characters/pets/dog_01.png',
          'bird_01': '/assets/images/characters/pets/bird_01.png',
        },
      },
    };

    // เหลือเฉพาะ 4 หมวด
    this.equipmentData = {
      head: {
        'hat_01':   { name: 'หมวกไหมพรม',        price: 50, gender: 'both' },
        'hat_02':   { name: 'หมวกกันแดด',        price: 30, gender: 'both' },
        'cap_01':   { name: 'หมวกแก๊ป',          price: 40, gender: 'both' },
        'beret_01': { name: 'หมวกเบเร่',         price: 80, gender: 'female' },
      },
      face: {
        'glasses_01':    { name: 'แว่นตาอ่านหนังสือ', price: 35, gender: 'both' },
        'glasses_02':    { name: 'แว่นทรงสี่เหลี่ยม', price: 40, gender: 'both' },
        'sunglasses_01': { name: 'แว่นกันแดด',       price: 60, gender: 'both' },
      },
      body: {
        'shirt_male_01':   { name: 'เสื้อเชิ้ตสีฟ้า', price: 0,  gender: 'male' },
        'shirt_male_02':   { name: 'เสื้อโปโลสีเขียว', price: 45, gender: 'male' },
        'dress_female_01': { name: 'เดรสสีม่วง',      price: 0,  gender: 'female' },
        'dress_female_02': { name: 'เดรสลายดอก',     price: 60, gender: 'female' },
        'sweater_01':      { name: 'เสื้อกันหนาว',    price: 70, gender: 'both' },
      },
      pet: {
        'cat_01':  { name: 'แมวน้อยสีส้ม',       price: 200, gender: 'both' },
        'dog_01':  { name: 'สุนัขน้อยสีน้ำตาล',   price: 250, gender: 'both' },
        'bird_01': { name: 'นกแก้วเล็ก',         price: 180, gender: 'both' },
      },
    };

    // default equipment เหลือเฉพาะ 4 slot
    this.defaultEquipment = {
      male:   { head: null, face: 'glasses_01', body: 'shirt_male_01',  pet: null },
      female: { head: null, face: null,         body: 'dress_female_01', pet: null },
    };

    this.currentCharacter = null;
    this.imageCache = new Map();
    this.animationFrame = 0;
    this.animationInterval = null;
    this.isInitialized = false;
  }

  /* ---------- Loader แบบทน Safari/LINE ---------- */
  makeCandidates(src) {
    const clean = src.replace(/^\.?\//, '');
    return [ src, '/' + clean, `${window.location.origin}/${clean}` ];
  }

  preloadOnce(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.loading = 'eager';
      img.decoding = 'sync';
      const to = setTimeout(() => resolve(url), 12000); // อย่า fail ทั้งระบบ
      img.onload  = () => { clearTimeout(to); resolve(url); };
      img.onerror = () => { clearTimeout(to); reject(new Error('img-error')); };
      img.src = url;
    });
  }

  async loadImage(src) {
    if (this.imageCache.has(src)) return this.imageCache.get(src);
    const candidates = this.makeCandidates(src);
    for (const u of candidates) {
      try {
        const ok = await this.preloadOnce(u);
        this.imageCache.set(src, ok);
        return ok;
      } catch { /* try next */ }
    }
    return null;
  }

  /* ---------- Public API ---------- */
  setSceneBackground(color) {
    this.sceneBg = (color === 'blue') ? 'blue' : 'green';
    const el = document.getElementById('image-character-container');
    if (el) {
      el.classList.toggle('bg-blue',  this.sceneBg === 'blue');
      el.classList.toggle('bg-green', this.sceneBg !== 'blue');
    }
  }

  setupCharacterContainer() {
    const ex = document.getElementById('image-character-container');
    if (ex) ex.remove();

    const container = document.createElement('div');
    container.id = 'image-character-container';
    container.className = this.sceneBg === 'blue' ? 'bg-blue' : 'bg-green';

    container.innerHTML = `
      <div class="character-scene">
        <div class="character-stage">
          <div class="character-display-area">
            <div class="character-container" id="character-container">
              <div class="character-shadow"></div>
              <div class="character-layer base-layer"><img id="character-base" class="character-image base-image" alt="Base"></div>

              <!-- ONLY 4 SLOTS -->
              <div class="character-layer body-layer"><img id="equip-body" class="character-image equipment-image" alt="Body"></div>
              <div class="character-layer head-layer"><img id="equip-head" class="character-image equipment-image" alt="Head"></div>
              <div class="character-layer face-layer"><img id="equip-face" class="character-image equipment-image" alt="Face"></div>

              <div class="character-layer effects-layer"><div id="emotion-effects" class="emotion-effects"></div></div>
            </div>

            <div class="character-info in-stage">
              <div class="character-nameplate">
                <h3 id="character-name">ผู้เล่น</h3>
              </div>
              <div class="character-stats">
                <div class="stat-item"><span class="stat-icon">⭐</span><span class="stat-label">เหรียญ:</span><span id="char-coins" class="stat-value">0</span></div>
                <div class="stat-item"><span class="stat-icon">🎮</span><span class="stat-label">เกม:</span><span id="char-games" class="stat-value">0</span></div>
              </div>
            </div>
          </div>

          <!-- pet แยก container -->
          <div class="pet-container" id="pet-container" style="display:none;">
            <img id="pet-image" class="pet-image" alt="Pet">
          </div>
        </div>

        <div class="emotion-controls">
          <button class="emotion-btn" data-emotion="happy">😊</button>
          <button class="emotion-btn" data-emotion="wave">👋</button>
          <button class="emotion-btn" data-emotion="think">🤔</button>
          <button class="emotion-btn" data-emotion="love">💕</button>
        </div>

        <div class="loading-indicator" id="character-loading">
          <div class="loading-spinner"></div>
          <p>กำลังโหลดตัวละคร...</p>
        </div>
      </div>
    `;

    this.addResponsiveStyles();
    this.isInitialized = true;
    return container;
  }

  async loadCharacter(userData) {
    if (!userData || !userData.character) return;

    this.showLoading(true);
    this.currentCharacter = userData.character;

    try {
      const gender = userData.character.gender || 'male';
      if (!userData.character.equipment) {
        userData.character.equipment = { ...this.defaultEquipment[gender] };
        if (window.gameAuth) window.gameAuth.saveCurrentUser();
      }

      await this.loadBaseCharacter(gender);
      await this.loadAllEquipment(userData.character.equipment);

      this.updateCharacterInfo(userData);
      this.setupEmotionControls();
      this.startIdleAnimation();
    } catch (e) {
      console.error('Error loading character:', e);
      this.showError('ไม่สามารถโหลดตัวละครได้');
    } finally {
      this.showLoading(false);
    }
  }

  async loadBaseCharacter(gender) {
    const baseImg = document.getElementById('character-base');
    if (!baseImg) return;

    const okUrl = await this.loadImage(this.imagePaths.base[gender]);
    if (okUrl) {
      baseImg.src = okUrl;
      baseImg.style.display = 'block';
      baseImg.loading = 'eager';
      baseImg.decoding = 'sync';
    } else {
      baseImg.src = this.getPlaceholderDataUrl(); // placeholder เฉพาะ base เท่านั้น
      baseImg.style.display = 'block';
    }
  }

  async loadAllEquipment(equipment) {
    // โหลดเฉพาะ 4 slot เท่านั้น
    const SLOTS = ['head', 'face', 'body', 'pet'];
    const tasks = SLOTS.map(slot => {
      const id = equipment[slot];
      return id ? this.loadEquipmentItem(slot, id) : (this.hideEquipmentSlot(slot), Promise.resolve());
    });
    await Promise.all(tasks);
  }

  async loadEquipmentItem(slot, equipmentId) {
    const el = slot === 'pet'
      ? document.getElementById('pet-image')
      : document.getElementById(`equip-${slot}`);
    if (!el) return;

    const path = this.imagePaths.equipment[slot]?.[equipmentId];
    if (!path) { this.hideEquipmentSlot(slot); return; }

    try {
      const okUrl = await this.loadImage(path);
      if (!okUrl) { this.hideEquipmentSlot(slot); return; }

      el.src = okUrl;
      el.style.display = 'block';
      el.loading = 'eager';
      el.decoding = 'sync';

      if (slot === 'pet') {
        const pc = document.getElementById('pet-container');
        if (pc) pc.style.display = 'block';
      }
    } catch {
      // สำคัญ: ซ่อนทันที ห้ามวาง placeholder บัง base
      this.hideEquipmentSlot(slot);
    }
  }

  hideEquipmentSlot(slot) {
    const el = slot === 'pet'
      ? document.getElementById('pet-image')
      : document.getElementById(`equip-${slot}`);
    if (el) {
      el.style.display = 'none';
      el.removeAttribute('src'); // กัน render ค้าง/บัง
    }
    if (slot === 'pet') {
      const pc = document.getElementById('pet-container');
      if (pc) pc.style.display = 'none';
    }
  }

  getPlaceholderDataUrl() {
    // ใช้กับ base เท่านั้น
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='192' viewBox='0 0 128 192'%3E%3Crect width='128' height='192' fill='%23F3F4F6' stroke='%23E5E7EB' stroke-width='2' rx='10'/%3E%3Ccircle cx='64' cy='60' r='20' fill='%23D1D5DB'/%3E%3Crect x='44' y='85' width='40' height='60' fill='%23D1D5DB' rx='6'/%3E%3Crect x='49' y='150' width='10' height='30' fill='%23D1D5DB'/%3E%3Crect x='69' y='150' width='10' height='30' fill='%23D1D5DB'/%3E%3C/svg%3E";
  }

  updateCharacterInfo(userData) {
    const nameEl = document.getElementById('character-name');
    const coinsEl = document.getElementById('char-coins');
    const gamesEl = document.getElementById('char-games');
    if (nameEl) nameEl.textContent = userData.displayName || 'ผู้เล่น';
    if (coinsEl && userData.stats) coinsEl.textContent = userData.stats.totalStars || 0;
    if (gamesEl && userData.stats) gamesEl.textContent = userData.stats.totalGames || 0;
  }

  setupEmotionControls() {
    document.querySelectorAll('.emotion-btn').forEach(btn => {
      btn.addEventListener('click', e => this.playEmotion(e.currentTarget.dataset.emotion));
    });
  }

  playEmotion(emotion) {
    const box = document.getElementById('character-container');
    const eff = document.getElementById('emotion-effects');
    if (!box || !eff) return;

    box.className = 'character-container';
    eff.innerHTML = '';

    if (emotion === 'happy') { box.classList.add('bounce-animation'); eff.innerHTML = '<div class="effect-hearts">💕 💖 💕</div>'; }
    if (emotion === 'wave')  { box.classList.add('wave-animation');   eff.innerHTML = '<div class="effect-sparkles">✨ ⭐ ✨</div>'; }
    if (emotion === 'think') { box.classList.add('think-animation');  eff.innerHTML = '<div class="effect-thought">💭</div>'; }
    if (emotion === 'love')  { box.classList.add('love-animation');   eff.innerHTML = '<div class="effect-love">💕 💗 💕 💖 💕</div>'; }

    setTimeout(() => { box.className = 'character-container'; eff.innerHTML = ''; this.startIdleAnimation(); }, 3000);
  }

  startIdleAnimation() {
    const box = document.getElementById('character-container');
    if (!box) return;
    this.stopCurrentAnimation();
    this.animationInterval = setInterval(() => {
      this.animationFrame += 0.5;
      const dy = Math.sin(this.animationFrame * 0.1) * 2;
      box.style.transform = `translateY(${dy}px)`;
    }, 50);
  }

  stopCurrentAnimation() {
    if (this.animationInterval) clearInterval(this.animationInterval);
    this.animationInterval = null;
  }

  showLoading(show) {
    const el = document.getElementById('character-loading');
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  showError(msg) {
    const c = document.getElementById('image-character-container');
    if (c) c.innerHTML = `<div class="character-error"><h3>😞 เกิดข้อผิดพลาด</h3><p>${msg}</p><button onclick="location.reload()" class="retry-btn">ลองใหม่</button></div>`;
  }

  /* — minimal styles: พื้นหลังสีอ่อน, ไม่มีการ์ดขาวทับ — */
  addResponsiveStyles() {
    if (document.getElementById('character-responsive-styles')) return;
    const style = document.createElement('style');
    style.id = 'character-responsive-styles';
    style.textContent = `
      #image-character-container{--bg-green:#EFFFF4;--bg-blue:#EAF6FF;width:100%;height:500px;position:relative;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.06);margin-bottom:30px}
      #image-character-container.bg-green{background:var(--bg-green)}
      #image-character-container.bg-blue{background:var(--bg-blue)}
      .character-scene{width:100%;height:100%;position:relative}
      .character-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
      .character-display-area{display:flex;align-items:center;gap:16px;z-index:10;background:transparent;box-shadow:none;padding:0}
      .character-container{position:relative;width:128px;height:192px;transition:all .3s ease}
      .character-shadow{position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:80px;height:20px;background:rgba(0,0,0,.12);border-radius:50%;animation:shadowPulse 3s ease-in-out infinite}
      .character-layer{position:absolute;top:0;left:0;width:100%;height:100%}
      .base-layer{z-index:1}.body-layer{z-index:3}.head-layer{z-index:5}.face-layer{z-index:6}.effects-layer{z-index:8}
      .character-image{width:100%;height:100%;object-fit:contain;display:none;transition:opacity .3s ease}
      .character-image.base-image{display:block}
      .character-info.in-stage{background:transparent;box-shadow:none;padding:0;max-width:220px}
      .character-nameplate{margin:0 0 6px 0;padding-bottom:6px;border-bottom:1px solid #E8E8E8}
      .character-nameplate h3{margin:0;font-size:1.15rem;color:#2C3E50;font-weight:800}
      .character-level{font-size:.8rem;color:#7F8C8D;margin-top:2px}
      .character-stats{display:flex;flex-direction:column;gap:6px}
      .stat-item{display:flex;align-items:center;gap:6px;font-size:.9rem}
      .stat-icon{font-size:1rem;min-width:20px}
      .stat-label{color:#34495E;flex:1}
      .stat-value{font-weight:800;color:#E67E22}
      .pet-container{position:absolute;bottom:40px;right:40px;display:none;z-index:5}
      .pet-image{width:64px;height:64px;object-fit:contain;animation:petFloat 3s ease-in-out infinite}
      .emotion-controls{position:absolute;bottom:15px;right:15px;display:flex;gap:8px;z-index:15}
      .emotion-btn{width:44px;height:44px;border-radius:50%;border:2px solid #3498DB;background:rgba(255,255,255,.95);font-size:1.2rem;cursor:pointer;transition:all .3s ease;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,.2)}
      .emotion-btn:hover{transform:scale(1.1);background:#3498DB;color:#fff}
      .loading-indicator{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:none;flex-direction:column;align-items:center;gap:15px;z-index:20;background:rgba(255,255,255,.95);padding:25px;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,.3)}
      .loading-spinner{width:32px;height:32px;border:3px solid #E8E8E8;border-top:3px solid #3498DB;border-radius:50%;animation:spin 1s linear infinite}
      @keyframes shadowPulse{0%,100%{transform:translateX(-50%) scale(1);opacity:.25}50%{transform:translateX(-50%) scale(1.1);opacity:.4}}
      @keyframes petFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
      @media (max-width:768px){#image-character-container{height:360px;margin-bottom:20px}.character-container{width:96px;height:144px}.character-display-area{gap:12px}.character-nameplate h3{font-size:1rem}.stat-item{font-size:.8rem;gap:4px}}
    `;
    document.head.appendChild(style);
  }
}

/* global instance */
window.characterSystem = new ImageCharacterSystem();
