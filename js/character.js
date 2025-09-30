/* ========================================
   Simple Character System
   Avatar + Pet only (ไม่มี equipment แยกชิ้น)
   ======================================== */

class ImageCharacterSystem {
  constructor() {
    this.sceneBg = 'green';

    // เก็บแค่ path ของ Avatar และ Pet
    this.imagePaths = {
      // Avatar เต็มตัว
      base: {
        male:   '/assets/images/characters/base/elderly_male_base.png',
        female: '/assets/images/characters/base/elderly_female_base.png',
      },
      // สัตว์เลี้ยง
      pet: {
        'cat_01':  '/assets/images/characters/pets/cat_01.png',
        'dog_01':  '/assets/images/characters/pets/dog_01.png',
        'bird_01': '/assets/images/characters/pets/bird_01.png',
      },
    };

    this.currentCharacter = null;
    this.imageCache = new Map();
    this.animationFrame = 0;
    this.animationInterval = null;
    this.isInitialized = false;
  }

  /* ---------- Image Loader ---------- */
  makeCandidates(src) {
    const clean = src.replace(/^\.?\//, '');
    return [ src, '/' + clean, `${window.location.origin}/${clean}` ];
  }

  preloadOnce(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.loading = 'eager';
      img.decoding = 'sync';
      const timeout = setTimeout(() => resolve(url), 12000);
      img.onload  = () => { clearTimeout(timeout); resolve(url); };
      img.onerror = () => { clearTimeout(timeout); reject(new Error('img-error')); };
      img.src = url;
    });
  }

  async loadImage(src) {
    if (this.imageCache.has(src)) return this.imageCache.get(src);
    
    const candidates = this.makeCandidates(src);
    for (const url of candidates) {
      try {
        const loaded = await this.preloadOnce(url);
        this.imageCache.set(src, loaded);
        return loaded;
      } catch { /* try next */ }
    }
    return null;
  }

  /* ---------- Setup Container ---------- */
  setSceneBackground(color) {
    this.sceneBg = (color === 'blue') ? 'blue' : 'green';
    const el = document.getElementById('image-character-container');
    if (el) {
      el.classList.toggle('bg-blue',  this.sceneBg === 'blue');
      el.classList.toggle('bg-green', this.sceneBg !== 'blue');
    }
  }

  setupCharacterContainer() {
    const existing = document.getElementById('image-character-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'image-character-container';
    container.className = this.sceneBg === 'blue' ? 'bg-blue' : 'bg-green';

    container.innerHTML = `
      <div class="character-scene">
        <div class="character-stage">
          <div class="character-display-area">
            <!-- ตัวละคร Avatar -->
            <div class="character-container" id="character-container">
              <div class="character-shadow"></div>
              <div class="character-layer base-layer">
                <img id="character-base" class="character-image base-image" alt="Avatar">
              </div>
              <div class="character-layer effects-layer">
                <div id="emotion-effects" class="emotion-effects"></div>
              </div>
            </div>

            <!-- ข้อมูลผู้เล่น -->
            <div class="character-info in-stage">
              <div class="character-nameplate">
                <h3 id="character-name">ผู้เล่น</h3>
              </div>
            </div>
          </div>

          <!-- สัตว์เลี้ยง -->
          <div class="pet-container" id="pet-container" style="display:none;">
            <img id="pet-image" class="pet-image" alt="Pet">
          </div>
        </div>

        <!-- ปุ่มอารมณ์ -->
        <div class="emotion-controls">
          <button class="emotion-btn" data-emotion="happy">😊</button>
          <button class="emotion-btn" data-emotion="wave">👋</button>
          <button class="emotion-btn" data-emotion="think">🤔</button>
          <button class="emotion-btn" data-emotion="love">💕</button>
        </div>

        <!-- Loading -->
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

  /* ---------- Load Character ---------- */
  async loadCharacter(userData) {
    if (!userData || !userData.character) return;

    this.showLoading(true);
    this.currentCharacter = userData.character;

    try {
      const gender = userData.character.gender || 'male';
      
      // โหลด Avatar
      await this.loadAvatar(gender);
      
      // โหลด Pet (ถ้ามี)
      if (userData.character.petId) {
        await this.loadPet(userData.character.petId);
      }

      this.updateCharacterInfo(userData);
      this.setupEmotionControls();
      this.startIdleAnimation();
      
      console.log('✅ Character loaded:', gender, userData.character.petId || 'no pet');
    } catch (error) {
      console.error('❌ Error loading character:', error);
      this.showError('ไม่สามารถโหลดตัวละครได้');
    } finally {
      this.showLoading(false);
    }
  }

  async loadAvatar(gender) {
    const avatarImg = document.getElementById('character-base');
    if (!avatarImg) return;

    const path = this.imagePaths.base[gender];
    const loadedUrl = await this.loadImage(path);
    
    if (loadedUrl) {
      avatarImg.src = loadedUrl;
      avatarImg.style.display = 'block';
      console.log('✅ Avatar loaded:', path);
    } else {
      // ใช้ placeholder SVG
      avatarImg.src = this.getPlaceholderSVG(gender);
      avatarImg.style.display = 'block';
      console.log('⚠️ Using placeholder for:', gender);
    }
  }

  async loadPet(petId) {
    const petImg = document.getElementById('pet-image');
    const petContainer = document.getElementById('pet-container');
    if (!petImg || !petContainer) return;

    const path = this.imagePaths.pet[petId];
    if (!path) {
      console.warn('Pet path not found:', petId);
      return;
    }

    const loadedUrl = await this.loadImage(path);
    if (loadedUrl) {
      petImg.src = loadedUrl;
      petContainer.style.display = 'block';
      console.log('✅ Pet loaded:', petId);
    } else {
      petContainer.style.display = 'none';
      console.warn('Failed to load pet:', petId);
    }
  }

  /* ---------- Placeholder SVG ---------- */
  getPlaceholderSVG(gender) {
    // SVG ตัวละครชาย
    if (gender === 'male') {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='240'%3E%3Crect fill='%23E3F2FD' width='160' height='240' rx='12'/%3E%3Ccircle cx='80' cy='70' r='28' fill='%23FFCC80'/%3E%3Crect x='55' y='105' width='50' height='80' fill='%2364B5F6' rx='8'/%3E%3Crect x='55' y='190' width='20' height='40' fill='%238D6E63' rx='4'/%3E%3Crect x='85' y='190' width='20' height='40' fill='%238D6E63' rx='4'/%3E%3Ctext x='80' y='228' text-anchor='middle' font-size='14' fill='%23666'%3E%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%9B%E0%B8%B9%E0%B9%88%3C/text%3E%3C/svg%3E";
    }
    
    // SVG ตัวละครหญิง
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='240'%3E%3Crect fill='%23F3E5F5' width='160' height='240' rx='12'/%3E%3Ccircle cx='80' cy='70' r='28' fill='%23FFCC80'/%3E%3Cpath d='M55 105 L105 105 L105 195 L55 195 Z' fill='%23CE93D8'/%3E%3Crect x='55' y='190' width='20' height='40' fill='%238D6E63' rx='4'/%3E%3Crect x='85' y='190' width='20' height='40' fill='%238D6E63' rx='4'/%3E%3Ctext x='80' y='228' text-anchor='middle' font-size='14' fill='%23666'%3E%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%A2%E0%B9%88%E0%B8%B2%3C/text%3E%3C/svg%3E";
  }

  /* ---------- UI Updates ---------- */
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
      btn.addEventListener('click', () => {
        this.playEmotion(btn.dataset.emotion);
      });
    });
  }

  playEmotion(emotion) {
    const container = document.getElementById('character-container');
    const effects = document.getElementById('emotion-effects');
    if (!container || !effects) return;

    container.className = 'character-container';
    effects.innerHTML = '';

    const emotionMap = {
      happy: { class: 'bounce-animation', effect: '💕 💖 💕' },
      wave:  { class: 'wave-animation',   effect: '✨ ⭐ ✨' },
      think: { class: 'think-animation',  effect: '💭💭💭💭' },
      love:  { class: 'love-animation',   effect: '💕 💗 💕 💖 💕' }
    };

    const action = emotionMap[emotion];
    if (action) {
      container.classList.add(action.class);
      effects.innerHTML = `<div class="effect-${emotion}">${action.effect}</div>`;

      setTimeout(() => {
        container.className = 'character-container';
        effects.innerHTML = '';
        this.startIdleAnimation();
      }, 3000);
    }
  }

  /* ---------- Animations ---------- */
  startIdleAnimation() {
    const container = document.getElementById('character-container');
    if (!container) return;
    
    this.stopCurrentAnimation();
    this.animationInterval = setInterval(() => {
      this.animationFrame += 0.5;
      const dy = Math.sin(this.animationFrame * 0.1) * 2;
      container.style.transform = `translateY(${dy}px)`;
    }, 50);
  }

  stopCurrentAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  /* ---------- Loading & Error ---------- */
  showLoading(show) {
    const el = document.getElementById('character-loading');
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  showError(message) {
    const container = document.getElementById('image-character-container');
    if (container) {
      container.innerHTML = `
        <div class="character-error">
          <h3>😞 เกิดข้อผิดพลาด</h3>
          <p>${message}</p>
          <button onclick="location.reload()" class="retry-btn">ลองใหม่</button>
        </div>
      `;
    }
  }

  /* ---------- Styles ---------- */
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
      .base-layer{z-index:1}.effects-layer{z-index:8}
      .character-image{width:100%;height:100%;object-fit:contain;display:none;transition:opacity .3s ease}
      .character-image.base-image{display:block}
      .character-info.in-stage{background:transparent;box-shadow:none;padding:0;max-width:220px}
      .character-nameplate{margin:0 0 6px 0;padding-bottom:6px;border-bottom:1px solid #E8E8E8}
      .character-nameplate h3{margin:0;font-size:1.15rem;color:#2C3E50;font-weight:800}
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
      .character-error{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px}
      .character-error h3{font-size:1.8rem;margin-bottom:12px;color:#E74C3C}
      .character-error p{font-size:1.1rem;color:#7F8C8D;margin-bottom:20px}
      .retry-btn{padding:12px 32px;background:#3498DB;color:#fff;border:none;border-radius:999px;font-size:1rem;font-weight:700;cursor:pointer;transition:all .3s}
      .retry-btn:hover{background:#2980B9;transform:translateY(-2px)}
      @keyframes shadowPulse{0%,100%{transform:translateX(-50%) scale(1);opacity:.25}50%{transform:translateX(-50%) scale(1.1);opacity:.4}}
      @keyframes petFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @media (max-width:768px){#image-character-container{height:360px;margin-bottom:20px}.character-container{width:96px;height:144px}.character-display-area{gap:12px}.character-nameplate h3{font-size:1rem}.stat-item{font-size:.8rem;gap:4px}}
    `;
    document.head.appendChild(style);
  }
}

/* Global Instance */
window.characterSystem = new ImageCharacterSystem();
console.log('✅ Simple Character System loaded (Avatar + Pet only)');
