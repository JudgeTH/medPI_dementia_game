/* ========================================
   Main App Controller - Final Fixed Version
   ======================================== */

class GameApp {
    constructor() {
        this.currentPage = 'login';
        this.currentView = 'main';
        this.isFirstTime = false;
        this.pendingName = null;
        
        this.init();
    }

    init() {
        // รอให้ DOM โหลดเสร็จ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        console.log('🎮 Starting Elderly Cognitive Game...');
        
        // ตั้งค่า Event Listeners
        this.setupEventListeners();
        
        // ตรวจสอบว่ามี user login อยู่หรือไม่
        const currentUser = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (currentUser) {
            console.log(`👋 ยินดีต้อนรับกลับ: ${currentUser.displayName}`);
            this.showDashboard();
        } else {
            console.log('🆕 ผู้ใช้ใหม่ - กรุณาใส่ชื่อ');
        }
    }

    setupEventListeners() {
        // Login Form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Action Buttons
        this.setupActionButtons();

        // Dynamic Event Listeners
        this.setupDynamicListeners();
    }

    setupActionButtons() {
        // ใช้ setTimeout เพื่อให้แน่ใจว่า DOM โหลดเสร็จ
        setTimeout(() => {
            const shopBtn = document.getElementById('open-shop');
            if (shopBtn) {
                shopBtn.addEventListener('click', () => this.showShop());
            }

            const gamesBtn = document.getElementById('open-games');
            if (gamesBtn) {
                gamesBtn.addEventListener('click', () => this.showGamesMenu());
            }

            const statsBtn = document.getElementById('view-stats');
            if (statsBtn) {
                statsBtn.addEventListener('click', () => this.showStats());
            }

            const customizeBtn = document.getElementById('customize-character');
            if (customizeBtn) {
                customizeBtn.addEventListener('click', () => this.showCustomization());
            }
        }, 100);
    }

    setupDynamicListeners() {
        // Event delegation สำหรับปุ่มที่สร้างภายหลัง
        document.addEventListener('click', (e) => {
            try {
                // ปุ่มเลือกเพศ
                if (e.target.closest('.gender-select-btn')) {
                    this.handleGenderSelect(e);
                    return;
                }
                
                // ปุ่ม logout
                if (e.target.matches('.logout-btn')) {
                    this.handleLogout();
                    return;
                }
                
                // ปุ่มกลับ
                if (e.target.matches('.back-btn')) {
                    this.goBack();
                    return;
                }

                // ปุ่มกลับหน้าหลัก
                if (e.target.matches('.back-to-main')) {
                    this.showMainView();
                    return;
                }

                // ปุ่มเกม
                if (e.target.closest('.game-card')) {
                    this.handleGameSelect(e);
                    return;
                }
            } catch (error) {
                console.error('Event handling error:', error);
            }
        });
    }

    // จัดการการ Login
    handleLogin(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('player-name');
        if (!nameInput) {
            this.showMessage('ไม่พบช่องใส่ชื่อ', 'error');
            return;
        }

        const name = nameInput.value.trim();
        
        if (name.length < 2) {
            this.showMessage('กรุณาใส่ชื่อให้ครบ (อย่างน้อย 2 ตัวอักษร)', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // ตรวจสอบว่า gameAuth พร้อมใช้งาน
            if (!window.gameAuth) {
                throw new Error('ระบบยังไม่พร้อม กรุณาลองใหม่');
            }
            
            // ลอง login
            const result = window.gameAuth.login(name);
            
            if (!result) {
                throw new Error('ไม่สามารถเข้าสู่ระบบได้');
            }
            
            if (result.needGender) {
                // ผู้ใช้ใหม่ - ต้องเลือกเพศ
                this.pendingName = name;
                this.showGenderSelection();
            } else if (result.isNew && result.user) {
                // ผู้ใช้ใหม่ที่เลือกเพศแล้ว
                this.showMessage(`ยินดีต้อนรับ ${result.user.displayName}! 🎉`, 'success');
                this.navigateToDashboard();
            } else if (result.user) {
                // ผู้ใช้เก่า
                this.showMessage(`ยินดีต้อนรับกลับ ${result.user.displayName}! 👋`, 'success');
                this.navigateToDashboard();
            } else {
                throw new Error('ข้อมูลผู้ใช้ไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // แสดงหน้าเลือกเพศ
    showGenderSelection() {
        const loginCard = document.querySelector('.welcome-card');
        if (!loginCard) {
            this.showMessage('ไม่พบหน้า Login', 'error');
            return;
        }
        
        loginCard.innerHTML = `
            <div class="character-preview">
                <div class="character-simple">🤔</div>
            </div>
            
            <h2>เลือกเพศของคุณ</h2>
            <p>เพื่อสร้างตัวละครที่เหมาะสม</p>
            
            <div class="gender-selection">
                <button type="button" class="gender-select-btn male" data-gender="male">
                    <div class="gender-icon">👴</div>
                    <span>ชาย</span>
                </button>
                
                <button type="button" class="gender-select-btn female" data-gender="female">
                    <div class="gender-icon">👵</div>
                    <span>หญิง</span>
                </button>
            </div>
            
            <button type="button" class="btn btn-secondary back-btn">
                ← กลับไปแก้ไขชื่อ
            </button>
        `;

        // เพิ่ม CSS สำหรับปุ่มเลือกเพศ
        this.addGenderSelectionStyles();
    }

    // จัดการการเลือกเพศ - แก้ไขให้ปลอดภัย
    handleGenderSelect(e) {
        try {
            console.log('Gender select clicked');
            
            const button = e.target.closest('.gender-select-btn');
            if (!button) {
                console.log('Button not found');
                return;
            }

            const gender = button.getAttribute('data-gender') || button.dataset.gender;
            console.log('Selected gender:', gender);
            
            if (!this.pendingName) {
                console.log('No pending name');
                this.showMessage('ไม่พบชื่อที่บันทึกไว้', 'error');
                return;
            }

            if (!gender) {
                console.log('No gender selected');
                this.showMessage('กรุณาเลือกเพศ', 'error');
                return;
            }

            this.showLoading(true);
            
            // ตรวจสอบว่า gameAuth พร้อมใช้งาน
            if (!window.gameAuth) {
                throw new Error('ระบบยังไม่พร้อม กรุณาลองใหม่');
            }
            
            // สร้างผู้ใช้ใหม่พร้อมเพศ
            const result = window.gameAuth.login(this.pendingName, gender);
            console.log('Login result:', result);
            
            if (result && result.user) {
                this.showMessage(`สร้างตัวละครสำเร็จ! ยินดีต้อนรับ ${result.user.displayName} 🎉`, 'success');
                this.pendingName = null; // เคลียร์ก่อน navigate
                this.navigateToDashboard();
            } else {
                throw new Error('ไม่สามารถสร้างตัวละครได้');
            }
        } catch (error) {
            console.error('Gender selection error:', error);
            this.showMessage(error.message || 'เกิดข้อผิดพลาดในการเลือกเพศ', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // ไปหน้า Dashboard
    navigateToDashboard() {
        setTimeout(() => {
            const loginPage = document.getElementById('login-page');
            const dashboardPage = document.getElementById('dashboard-page');
            
            if (loginPage && dashboardPage) {
                loginPage.classList.remove('active');
                dashboardPage.classList.add('active');
                this.currentPage = 'dashboard';
                
                // แสดงตัวละครและอัพเดทข้อมูล
                this.showDashboard();
            } else {
                this.showMessage('ไม่พบหน้า Dashboard', 'error');
            }
        }, 1000);
    }

    // แสดง Dashboard
    showDashboard() {
        // อัพเดทข้อมูลในหน้า dashboard
        if (window.gameAuth) {
            window.gameAuth.updateDashboard();
        }
        
        // แสดงตัวละคร
        this.setupCharacterDisplay();
        
        // แสดงหน้าหลัก
        this.showMainView();
        
        // ตั้งค่า Action Buttons อีกครั้ง
        setTimeout(() => {
            this.setupActionButtons();
        }, 500);
    }

    // ตั้งค่าการแสดงตัวละคร
    setupCharacterDisplay() {
        const characterArea = document.getElementById('character-display-area');
        if (!characterArea) {
            console.log('Character display area not found');
            return;
        }

        // สร้างและแสดงตัวละคร
        if (window.characterSystem) {
            try {
                const characterContainer = window.characterSystem.setupCharacterContainer();
                characterArea.innerHTML = '';
                characterArea.appendChild(characterContainer);
                
                // โหลดข้อมูลตัวละคร
                const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
                if (user) {
                    window.characterSystem.loadCharacter(user);
                }
            } catch (error) {
                console.error('Character setup error:', error);
                characterArea.innerHTML = '<div style="text-align: center; padding: 40px;"><h3>ตัวละครกำลังโหลด... 👴</h3></div>';
            }
        } else {
            console.log('Character system not available');
            characterArea.innerHTML = '<div style="text-align: center; padding: 40px;"><h3>ตัวละครกำลังโหลด... 👴</h3></div>';
        }
    }

    // แสดงหน้าหลัก
    showMainView() {
        this.currentView = 'main';
        
        const actionButtons = document.querySelector('.action-buttons');
        const gamesSelection = document.getElementById('games-selection');
        const shopSection = document.getElementById('shop-section');
        
        if (actionButtons) actionButtons.style.display = 'block';
        if (gamesSelection) gamesSelection.style.display = 'none';
        if (shopSection) shopSection.style.display = 'none';
    }

    // แสดงเมนูเกม
    showGamesMenu() {
        this.currentView = 'games';
        
        const actionButtons = document.querySelector('.action-buttons');
        const gamesSelection = document.getElementById('games-selection');
        const shopSection = document.getElementById('shop-section');
        
        if (actionButtons) actionButtons.style.display = 'none';
        if (shopSection) shopSection.style.display = 'none';
        if (gamesSelection) gamesSelection.style.display = 'block';
    }

    // แสดงร้านค้า
    showShop() {
        this.currentView = 'shop';
        
        const actionButtons = document.querySelector('.action-buttons');
        const gamesSelection = document.getElementById('games-selection');
        const shopSection = document.getElementById('shop-section');
        
        if (actionButtons) actionButtons.style.display = 'none';
        if (gamesSelection) gamesSelection.style.display = 'none';
        if (shopSection) shopSection.style.display = 'block';
        
        this.showMessage('ร้านค้ากำลังพัฒนา... 🛒', 'info');
    }

    // แสดงสถิติ
    showStats() {
        this.showMessage('หน้าสถิติกำลังพัฒนา... 📊', 'info');
    }

    // แสดงการปรับแต่ง
    showCustomization() {
        this.showMessage('ระบบปรับแต่งตัวละครกำลังพัฒนา... ✨', 'info');
    }

    // จัดการการเลือกเกม
    handleGameSelect(e) {
        try {
            const gameCard = e.target.closest('.game-card');
            const gameType = gameCard ? gameCard.getAttribute('data-game') || gameCard.dataset.game : null;
            
            if (!gameType) return;

            this.showMessage(`เตรียมเริ่มเกม: ${this.getGameName(gameType)}`, 'info');
            
            setTimeout(() => {
                this.startGame(gameType);
            }, 1000);
        } catch (error) {
            console.error('Game select error:', error);
        }
    }

    // เริ่มเกม
    // เริ่มเกม
   startGame(gameType) {
       // กรณี "เกมจำภาพ" ให้พาไปหน้า /pages/game.html
       if (gameType === 'memory') {
           // ถ้าคุณใช้ multi-page ธรรมดา (ไม่มี router) ใช้บรรทัดนี้
           window.location.href = '/pages/game.html';
           return;
       }
      // กรณี "เกมคิดเลขเร็ว" ให้พาไปหน้า /pages/game-addition.html
       if (gameType === 'addition') {
           // ถ้าคุณใช้ multi-page ธรรมดา (ไม่มี router) ใช้บรรทัดนี้
           window.location.href = '/pages/game-addition.html';
           return;
       }
      // กรณี "จำลำดับ" ให้พาไปหน้า /pages/game-addition.html
       if (gameType === 'pattern') {
           // ถ้าคุณใช้ multi-page ธรรมดา (ไม่มี router) ใช้บรรทัดนี้
           window.location.href = '/pages/game-pattern.html';
           return;
       }
       // กรณี "ตรรกะ" ให้พาไปหน้า /pages/game-addition.html
       if (gameType === 'logic') {
           // ถ้าคุณใช้ multi-page ธรรมดา (ไม่มี router) ใช้บรรทัดนี้
           window.location.href = '/pages/game-logic.html';
           return;
       }
       // เกมอื่น ๆ ยังไม่ทำ แสดงสถานะเดิมไปก่อน
       this.showMessage(`เกม ${this.getGameName(gameType)} กำลังพัฒนา... 🚧`, 'info');
       console.log(`Starting game:`, gameType);
   }

    // ได้ชื่อเกมภาษาไทย
    getGameName(gameType) {
        const gameNames = {
            memory: 'จำภาพ',
            pattern: 'จำลำดับ', 
            addition: 'คิดเลขเร็ว',
            logic: 'ตรรกะ'
        };
        return gameNames[gameType] || gameType;
    }

    // Logout
    handleLogout() {
        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            if (window.gameAuth) {
                window.gameAuth.logout();
            }
            this.currentPage = 'login';
            this.showMessage('ออกจากระบบเรียบร้อย', 'success');
        }
    }

    // กลับหน้าก่อน
    goBack() {
        if (this.currentPage === 'login') {
            this.resetLoginForm();
        } else if (this.currentView !== 'main') {
            this.showMainView();
        }
    }

    // รีเซ็ต login form
    resetLoginForm() {
        const loginCard = document.querySelector('.welcome-card');
        if (!loginCard) return;
        
        loginCard.innerHTML = `
            <div class="character-preview">
                <div class="character-simple">👵</div>
            </div>
            
            <h2>ยินดีต้อนรับ!</h2>
            <p>กรุณาใส่ชื่อของคุณเพื่อเริ่มเล่นเกม</p>
            
            <form id="login-form">
                <div class="input-group">
                    <label for="player-name">ชื่อของคุณ:</label>
                    <input 
                        type="text" 
                        id="player-name" 
                        name="playerName" 
                        placeholder="ใส่ชื่อของคุณ..."
                        required
                        minlength="2"
                        maxlength="20"
                    >
                </div>
                
                <button type="submit" class="btn btn-primary btn-large">
                    เริ่มเล่นเกม
                </button>
            </form>
        `;
        
        // ตั้งค่า event listener ใหม่
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    // แสดง Loading
    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('active');
            } else {
                loadingOverlay.classList.remove('active');
            }
        }
    }

    // แสดงข้อความ
    showMessage(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        const colors = {
            error: '#f44336',
            success: '#4caf50',
            info: '#2196f3',
            warning: '#ff9800'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // เพิ่ม CSS สำหรับปุ่มเลือกเพศ
    addGenderSelectionStyles() {
        if (document.getElementById('gender-selection-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'gender-selection-styles';
        style.textContent = `
            .gender-selection {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 30px 0;
            }
            
            .gender-select-btn {
                background: white;
                border: 3px solid #e0e0e0;
                border-radius: 12px;
                padding: 24px 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                min-height: 120px;
                font-size: 18px;
                font-weight: 500;
                color: #333;
            }
            
            .gender-select-btn:hover {
                border-color: #4CAF50;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
            }
            
            .gender-icon {
                font-size: 3rem;
                line-height: 1;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// เริ่มต้นแอพ
document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new GameApp();
});

/* =========================================================
   🔒 Safe Shop Linker (append-only)
   - Non-destructive: ไม่แก้อะไรของเดิม, แค่อัพลิงก์ไป "ร้านค้า"
   - ใช้ openShop() หรือ App.openShop ถ้ามีอยู่แล้ว
   - รองรับ trigger หลายแบบ: #open-shop, #btnShop, [data-nav="shop"],
     และ <a href=".../pages/shop.html">
   ========================================================= */
(function ShopLinkerSafe() {
  // ป้องกันซ้ำ (ถ้าเผลอใส่หลายครั้ง)
  if (window.__SHOP_LINKER_ATTACHED__) return;
  window.__SHOP_LINKER_ATTACHED__ = true;

  // ฟังก์ชันนำทางไปร้านค้าแบบไม่ทำลายของเดิม
  function goShop(opts) {
    try {
      // ใช้ของเดิม หากมี (ลำดับความสำคัญจากเจาะจงมาก -> ทั่วไป)
      if (window.App && typeof window.App.openShop === 'function') {
        window.App.openShop(Object.assign({ tab: 'featured', returnTo: location.pathname }, opts || {}));
        return;
      }
      if (typeof window.openShop === 'function') {
        window.openShop(Object.assign({ tab: 'featured', returnTo: location.pathname }, opts || {}));
        return;
      }
      // ถ้าโค้ดเดิมไม่มี API เลย → พาไปหน้า shop.html ตรง ๆ
      var candidates = [
        '/pages/shop.html',
        './pages/shop.html',
        'pages/shop.html'
      ];
      var link = candidates[0];
      // ถ้าอยู่ subpath (เช่น /app/…)
      try {
        var base = document.querySelector('base[href]')?.getAttribute('href') || '';
        if (base && base !== '/' && !base.startsWith('http')) {
          link = base.replace(/\/+$/,'') + '/pages/shop.html';
        }
      } catch(_) {}
      location.href = link;
    } catch (err) {
      console.warn('[ShopLinker] fallback to /pages/shop.html due to error:', err);
      location.href = '/pages/shop.html';
    }
  }

  // ติดตั้ง listener แบบระวังผลข้างเคียง
  function attachShopListeners() {
    // 1) ปุ่มการ์ด/ปุ่มทั่วไปตาม id ที่พบบ่อย
    var ids = ['open-shop', 'btnShop'];
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el && !el.__shopLinked) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          goShop();
        });
        el.__shopLinked = true;
      }
    });

    // 2) Event delegation: รองรับ data-attr / ลิงก์ shop.html
    document.addEventListener('click', function(e) {
      // หา element ที่เป็น trigger ใกล้ที่สุด
      var trigger = e.target.closest('[data-nav="shop"], #open-shop, #btnShop, a[href*="pages/shop.html"]');
      if (!trigger) return;
      // กันยิงซ้ำถ้ามีโค้ดเดิมจับคลิกอยู่แล้ว
      if (trigger.__shopLinkedHandled) return;
      trigger.__shopLinkedHandled = true;

      // เคารพ behavior เดิมถ้าเป็น <a target="_blank">
      if (trigger.tagName === 'A' && trigger.getAttribute('target') === '_blank') return;

      e.preventDefault();
      goShop();
      // ย้อนสถานะ handled ให้คลิกครั้งถัดไปทำงานได้ตามปกติ
      setTimeout(function(){ trigger.__shopLinkedHandled = false; }, 0);
    }, { capture: true }); // ใช้ capture เพื่อตัดหน้า handler อื่นให้น้อยสุด
  }

  // ติดตั้งเมื่อ DOM พร้อม
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachShopListeners);
  } else {
    attachShopListeners();
  }

  // เผย util เล็ก ๆ (ไม่ทับของเดิม)
  window.App = Object.assign(window.App || {}, {
    __goShopSafe: goShop
  });
})();
