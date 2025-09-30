// js/character-simple.js
// ระบบตัวละครแบบใหม่: Avatar เต็มตัว (ไม่ใช่ layer)

class SimpleCharacterSystem {
  constructor() {
    this.currentUserId = null;
    this.currentAvatar = null;
    this.currentPet = null;
    this.currentBackground = 'green';
    this.imageCache = new Map();
    this.isInitialized = false;
    this.animationFrame = 0;
    this.animationInterval = null;
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  setupContainer() {
    const existing = document.getElementById('character-container-wrapper');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'character-container-wrapper';
    wrapper.innerHTML = `
      <div class="character-scene ${this.currentBackground === 'blue' ? 'bg-blue' : 'bg-green'}">
        <!-- Background Layer -->
        <div class="background-layer" id="bg-layer"></div>
        
        <!-- Character Stage -->
        <div class="character-stage">
          <div class="character-display">
            <!-- Shadow -->
            <div class="character-shadow"></div>
            
            <!-- Avatar (ตัวละครเต็มตัว) -->
            <div class="avatar-container" id="avatar-container">
              <img id="avatar-image" class="avatar-image" alt="Avatar" />
            </div>
            
            <!-- Pet (แสดงข้างๆ) -->
            <div class="pet-container" id="pet-container" style="display:none;">
              <img id="pet-image" class="pet-image" alt="Pet" />
              
              <!-- Pet Status Bar -->
              <div class="pet-status" id="pet-status">
                <div class="status-bar">
                  <span class="status-icon">💖</span>
                  <div class="bar"><div class="bar-fill happiness" style="width:100%"></div></div>
                </div>
                <div class="status-bar">
                  <span class="status-icon">🍖</span>
                  <div class="bar"><div class="bar-fill hunger" style="width:0%"></div></div>
                </div>
              </div>
            </div>
            
            <!-- Effects Layer -->
            <div class="effects-layer" id="effects-layer"></div>
          </div>

          <!-- Character Info -->
          <div class="character-info">
            <div class="nameplate">
              <h3 id="char-name">ผู้เล่น</h3>
            </div>
            <div class="stats">
              <div class="stat">
                <span class="stat-icon">⭐</span>
                <span class="stat-label">ดาว:</span>
                <span id="char-stars" class="stat-value">0</span>
              </div>
              <div class="stat">
                <span class="stat-icon">🎮</span>
                <span class="stat-label">เกม:</span>
                <span id="char-games" class="stat-value">0</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Emotion Controls -->
        <div class="emotion-controls">
          <button class="emotion-btn" data-emotion="happy" title="ดีใจ">😊</button>
          <button class="emotion-btn" data-emotion="wave" title="โบกมือ">👋</button>
          <button class="emotion-btn" data-emotion="think" title="คิด">🤔</button>
          <button class="emotion-btn" data-emotion="love" title="รัก">💕</button>
        </div>

        <!-- Loading Indicator -->
        <div class="loading-indicator" id="char-loading">
          <div class="loading-spinner"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    `;

    this.addStyles();
    this.isInitialized = true;
    return wrapper;
  }

  // ========================================
  // LOADING & RENDERING
  // ========================================

  async loadCharacter(userData) {
    if (!userData) return;

    this.showLoading(true);
    this.currentUserId = userData.userId || localStorage.getItem('ecg_current_uid');

    try {
      // โหลดข้อมูล equipment ปัจจุบัน
      const equipment = await this.getEquipment();
      
      // โหลด Avatar
      if (equipment.avatar) {
        await this.loadAvatar(equipment.avatar);
      } else {
        // ถ้าไม่มี avatar ให้ใช้ default
        await this.loadDefaultAvatar(userData.character?.gender || 'male');
      }

      // โหลด Pet (ถ้ามี)
      if (equipment.pet) {
        await this.loadPet(equipment.pet);
      }

      // โหลด Background (ถ้ามี)
      if (equipment.background) {
        await this.loadBackground(equipment.background);
      }

      // อัพเดทข้อมูลผู้เล่น
      this.updateCharacterInfo(userData);

      // Setup controls
      this.setupEmotionControls();
      this.startIdleAnimation();

    } catch (error) {
      console.error('Load character error:', error);
      this.showError('ไม่สามารถโหลดตัวละครได้');
    } finally {
      this.showLoading(false);
    }
  }

  async getEquipment() {
    // ดึงจาก inventory-enhanced.js
    if (window.Inventory?.getCurrentEquipment) {
      return await window.Inventory.getCurrentEquipment(this.currentUserId);
    }
    
    // fallback
    return { avatar: null, pet: null, background: null };
  }

  async loadAvatar(avatarId) {
    const item = this.getItemById(avatarId);
    if (!item) {
      console.warn('Avatar not found:', avatarId);
      return;
    }

    const avatarImg = document.getElementById('avatar-image');
    if (!avatarImg) return;

    try {
      const url = await this.loadImage(item.asset);
      if (url) {
        avatarImg.src = url;
        avatarImg.style.display = 'block';
        this.currentAvatar = avatarId;
      }
    } catch (error) {
      console.error('Failed to load avatar:', error);
      avatarImg.src = this.getPlaceholderSVG('avatar');
      avatarImg.style.display = 'block';
    }
  }

  async loadDefaultAvatar(gender) {
    const defaultId = gender === 'female' ? 'elderly_female_base' : 'elderly_male_base';
    await this.loadAvatar(defaultId);
  }

  async loadPet(petId) {
    const item = this.getItemById(petId);
    if (!item) return;

    const petImg = document.getElementById('pet-image');
    const petContainer = document.getElementById('pet-container');
    
    if (!petImg || !petContainer) return;

    try {
      const url = await this.loadImage(item.asset);
      if (url) {
        petImg.src = url;
        petContainer.style.display = 'block';
        this.currentPet = petId;

        // อัพเดท pet stats
        await this.updatePetStats(petId);
      }
    } catch (error) {
      console.error('Failed to load pet:', error);
    }
  }

  async updatePetStats(petId) {
    if (!window.Inventory?.getPetStats) return;

    try {
      const stats = await window.Inventory.getPetStats(this.currentUserId, petId);
      
      const happinessBar = document.querySelector('.bar-fill.happiness');
      const hungerBar = document.querySelector('.bar-fill.hunger');
      
      if (happinessBar) happinessBar.style.width = `${stats.happiness}%`;
      if (hungerBar) hungerBar.style.width = `${stats.hunger}%`;
    } catch (error) {
      console.warn('Could not load pet stats:', error);
    }
  }

  async loadBackground(bgId) {
    const item = this.getItemById(bgId);
    if (!item) return;

    const bgLayer = document.getElementById('bg-layer');
    if (!bgLayer) return;

    try {
      const url = await this.loadImage(item.asset);
      if (url) {
        bgLayer.style.backgroundImage = `url(${url})`;
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
      }
    } catch (error) {
      console.error('Failed to load background:', error);
    }
  }

  // ========================================
  // IMAGE LOADING
  // ========================================

  async loadImage(src) {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

      img.onload = () => {
        clearTimeout(timeout);
        this.imageCache.set(src, src);
        resolve(src);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load'));
      };

      img.src = src;
    });
  }

  // ========================================
  // ANIMATIONS
  // ========================================

  playEmotion(emotion) {
    const avatarContainer = document.getElementById('avatar-container');
    const effectsLayer = document.getElementById('effects-layer');
    
    if (!avatarContainer || !effectsLayer) return;

    this.stopCurrentAnimation();
    avatarContainer.className = 'avatar-container';
    effectsLayer.innerHTML = '';

    const animations = {
      happy: {
        class: 'bounce-animation',
        effect: '<div class="effect-hearts">💕 💖 💕</div>'
      },
      wave: {
        class: 'wave-animation',
        effect: '<div class="effect-sparkles">✨ ⭐ ✨</div>'
      },
      think: {
        class: 'think-animation',
        effect: '<div class="effect-thought">💭</div>'
      },
      love: {
        class: 'love-animation',
        effect: '<div class="effect-love">💕 💗 💕 💖 💕</div>'
      }
    };

    const anim = animations[emotion];
    if (anim) {
      avatarContainer.classList.add(anim.class);
      effectsLayer.innerHTML = anim.effect;

      setTimeout(() => {
        avatarContainer.className = 'avatar-container';
        effectsLayer.innerHTML = '';
        this.startIdleAnimation();
      }, 3000);
    }
  }

  startIdleAnimation() {
    const container = document.getElementById('avatar-container');
    if (!container) return;

    this.stopCurrentAnimation();
    
    this.animationInterval = setInterval(() => {
      this.animationFrame += 0.5;
      const dy = Math.sin(this.animationFrame * 0.1) * 3;
      container.style.transform = `translateY(${dy}px)`;
    }, 50);
  }

  stopCurrentAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  // ========================================
  // UI UPDATES
  // ========================================

  updateCharacterInfo(userData) {
    const nameEl = document.getElementById('char-name');
    const starsEl = document.getElementById('char-stars');
    const gamesEl = document.getElementById('char-games');

    if (nameEl) nameEl.textContent = userData.displayName || 'ผู้เล่น';
    if (starsEl && userData.stats) starsEl.textContent = userData.stats.totalStars || 0;
    if (gamesEl && userData.stats) gamesEl.textContent = userData.stats.totalGames || 0;
  }

  setupEmotionControls() {
    document.querySelectorAll('.emotion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.playEmotion(btn.dataset.emotion);
      });
    });
  }

  showLoading(show) {
    const el = document.getElementById('char-loading');
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  showError(msg) {
    const scene = document.querySelector('.character-scene');
    if (scene) {
      scene.innerHTML = `
        <div class="character-error">
          <h3>😞 เกิดข้อผิดพลาด</h3>
          <p>${msg}</p>
          <button onclick="location.reload()" class="retry-btn">ลองใหม่</button>
        </div>
      `;
    }
  }

  // ========================================
  // HELPERS
  // ========================================

  getItemById(id) {
    if (window.ShopUtils?.getById) {
      return window.ShopUtils.getById(id);
    }
    if (window.SHOP_ITEMS) {
      return window.SHOP_ITEMS.find(item => item.id === id);
    }
    return null;
  }

  getPlaceholderSVG(type) {
    if (type === 'avatar') {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='192' viewBox='0 0 128 192'%3E%3Crect width='128' height='192' fill='%23F3F4F6' stroke='%23E5E7EB' stroke-width='2' rx='10'/%3E%3Ccircle cx='64' cy='60' r='20' fill='%23D1D5DB'/%3E%3Crect x='44' y='85' width='40' height='60' fill='%23D1D5DB' rx='6'/%3E%3C/svg%3E";
    }
    return '';
  }

  setBackground(color) {
    this.currentBackground = color;
    const scene = document.querySelector('.character-scene');
    if (scene) {
      scene.classList.toggle('bg-blue', color === 'blue');
      scene.classList.toggle('bg-green', color !== 'blue');
    }
  }

  // ========================================
  // STYLES
  // ========================================

  addStyles() {
    if (document.getElementById('character-simple-styles')) return;

    const style = document.createElement('style');
    style.id = 'character-simple-styles';
    style.textContent = `
      #character-container-wrapper{width:100%;margin:0 auto}
      .character-scene{width:100%;height:500px;position:relative;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08);transition:background .3s}
      .character-scene.bg-green{background:linear-gradient(135deg,#EFFFF4 0%,#C8E6C9 100%)}
      .character-scene.bg-blue{background:linear-gradient(135deg,#EAF6FF 0%,#BBDEFB 100%)}
      .background-layer{position:absolute;inset:0;z-index:1}
      .character-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:20px;z-index:10}
      .character-display{display:flex;align-items:flex-end;gap:30px}
      .character-shadow{position:absolute;bottom:-15px;left:50%;transform:translateX(-50%);width:90px;height:20px;background:rgba(0,0,0,.15);border-radius:50%;animation:shadowPulse 3s ease-in-out infinite;z-index:1}
      .avatar-container{position:relative;width:160px;height:240px;z-index:5}
      .avatar-image{width:100%;height:100%;object-fit:contain;display:none}
      .pet-container{position:relative;width:80px;height:80px;z-index:4}
      .pet-image{width:100%;height:100%;object-fit:contain;animation:petFloat 3s ease-in-out infinite}
      .pet-status{position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.95);border-radius:12px;padding:6px 10px;box-shadow:0 4px 12px rgba(0,0,0,.15);min-width:100px}
      .status-bar{display:flex;align-items:center;gap:4px;margin:2px 0}
      .status-icon{font-size:12px}
      .bar{flex:1;height:6px;background:#E0E0E0;border-radius:3px;overflow:hidden}
      .bar-fill{height:100%;transition:width .3s ease}
      .bar-fill.happiness{background:linear-gradient(90deg,#FF6B9D,#FEC7D7)}
      .bar-fill.hunger{background:linear-gradient(90deg,#FFA726,#FFCC80)}
      .effects-layer{position:absolute;inset:0;pointer-events:none;z-index:20}
      .effect-hearts,.effect-sparkles,.effect-thought,.effect-love{font-size:28px;animation:floatUp 2s ease-out}
      .character-info{background:rgba(255,255,255,.92);border-radius:16px;padding:16px 20px;box-shadow:0 6px 20px rgba(0,0,0,.1);min-width:200px}
      .nameplate{border-bottom:2px solid #E8E8E8;padding-bottom:8px;margin-bottom:10px}
      .nameplate h3{margin:0;font-size:1.3rem;color:#2C3E50;font-weight:800}
      .stats{display:flex;flex-direction:column;gap:8px}
      .stat{display:flex;align-items:center;gap:8px;font-size:.95rem}
      .stat-icon{font-size:1.1rem;min-width:22px}
      .stat-label{color:#34495E;flex:1}
      .stat-value{font-weight:800;color:#E67E22}
      .emotion-controls{position:absolute;bottom:20px;right:20px;display:flex;gap:10px;z-index:30}
      .emotion-btn{width:50px;height:50px;border-radius:50%;border:3px solid #3498DB;background:rgba(255,255,255,.95);font-size:1.4rem;cursor:pointer;transition:all .3s;box-shadow:0 4px 12px rgba(0,0,0,.2)}
      .emotion-btn:hover{transform:scale(1.15);background:#3498DB}
      .loading-indicator{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.95);z-index:40}
      .loading-spinner{width:40px;height:40px;border:4px solid #E8E8E8;border-top:4px solid #3498DB;border-radius:50%;animation:spin 1s linear infinite}
      .character-error{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;background:rgba(255,255,255,.95)}
      .character-error h3{font-size:1.8rem;margin-bottom:12px;color:#E74C3C}
      .character-error p{font-size:1.1rem;color:#7F8C8D;margin-bottom:20px}
      .retry-btn{padding:12px 32px;background:#3498DB;color:#fff;border:none;border-radius:999px;font-size:1rem;font-weight:700;cursor:pointer;transition:all .3s}
      .retry-btn:hover{background:#2980B9;transform:translateY(-2px)}
      @keyframes shadowPulse{0%,100%{transform:translateX(-50%) scale(1);opacity:.2}50%{transform:translateX(-50%) scale(1.15);opacity:.35}}
      @keyframes petFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      @keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-60px)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      .bounce-animation{animation:bounce .6s ease-in-out 3}
      .wave-animation{animation:wave .8s ease-in-out 2}
      .think-animation{animation:think 1s ease-in-out}
      .love-animation{animation:heartBeat .5s ease-in-out 3}
      @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
      @keyframes wave{0%,100%{transform:rotate(0)}25%{transform:rotate(-15deg)}75%{transform:rotate(15deg)}}
      @keyframes think{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
      @keyframes heartBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
      @media (max-width:768px){
        .character-scene{height:400px}
        .character-display{gap:15px}
        .avatar-container{width:120px;height:180px}
        .pet-container{width:60px;height:60px}
        .character-info{min-width:160px;padding:12px 16px}
        .nameplate h3{font-size:1.1rem}
        .stat{font-size:.85rem}
        .emotion-controls{bottom:15px;right:15px;gap:8px}
        .emotion-btn{width:42px;height:42px;font-size:1.2rem}
      }
    `;
    document.head.appendChild(style);
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================

  setupEventListeners() {
    // ฟังเมื่อมีการเปลี่ยน avatar
    window.addEventListener('avatar:changed', async (e) => {
      const { avatarId } = e.detail;
      if (avatarId) {
        await this.loadAvatar(avatarId);
      } else {
        const avatarImg = document.getElementById('avatar-image');
        if (avatarImg) avatarImg.style.display = 'none';
      }
    });

    // ฟังเมื่อมีการเปลี่ยน pet
    window.addEventListener('pet:changed', async (e) => {
      const { petId } = e.detail;
      if (petId) {
        await this.loadPet(petId);
      } else {
        const petContainer = document.getElementById('pet-container');
        if (petContainer) petContainer.style.display = 'none';
      }
    });

    // ฟังเมื่อให้อาหาร pet
    window.addEventListener('pet:fed', async (e) => {
      const { petId, newStats } = e.detail;
      if (petId === this.currentPet) {
        await this.updatePetStats(petId);
        this.playEmotion('happy');
      }
    });

    // ฟังเมื่อมีการเปลี่ยน background
    window.addEventListener('background:changed', async (e) => {
      const { bgId } = e.detail;
      if (bgId) {
        await this.loadBackground(bgId);
      }
    });

    // ฟังเมื่อมีการอัพเดทดาว
    window.addEventListener('stars:updated', (e) => {
      const starsEl = document.getElementById('char-stars');
      if (starsEl && e.detail) {
        starsEl.textContent = e.detail.balance || 0;
      }
    });
  }

  // ========================================
  // PUBLIC API
  // ========================================

  async refresh() {
    if (!this.currentUserId) return;
    
    const userData = {
      userId: this.currentUserId,
      displayName: localStorage.getItem('player_name') || 'ผู้เล่น',
      stats: {
        totalStars: window.Economy?.getBalance() || 0,
        totalGames: 0
      }
    };

    await this.loadCharacter(userData);
  }
}

// ========================================
// GLOBAL INSTANCE
// ========================================

window.CharacterSystem = new SimpleCharacterSystem();

// Setup ตอน DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const container = window.CharacterSystem.setupContainer();
  const targetEl = document.getElementById('character-mount-point') || document.body;
  targetEl.appendChild(container);
  
  window.CharacterSystem.setupEventListeners();
});

console.log('✅ Simple Character System loaded');
