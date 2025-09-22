/* ========================================
   Main App Controller for Elderly Cognitive Game
   ======================================== */

class GameApp {
    constructor() {
        this.currentPage = 'login';
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
        // ระบบ auth จะ auto login ถ้ามี user เก่า
        const currentUser = window.gameAuth.getCurrentUser();
        if (currentUser) {
            console.log(`👋 ยินดีต้อนรับกลับ: ${currentUser.displayName}`);
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

        // Game Cards ในหน้า Dashboard
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', (e) => this.handleGameSelect(e));
        });

        // ปุ่มแต่งตัวละคร
        const customizeBtn = document.getElementById('customize-character');
        if (customizeBtn) {
            customizeBtn.addEventListener('click', () => this.openCharacterCustomization());
        }

        // ปุ่มต่างๆ ที่อาจจะมีภายหลัง
        this.setupDynamicListeners();
    }

    setupDynamicListeners() {
        // Event delegation สำหรับปุ่มที่สร้างภายหลัง
        document.addEventListener('click', (e) => {
            if (e.target.matches('.gender-select-btn')) {
                this.handleGenderSelect(e);
            }
            
            if (e.target.matches('.logout-btn')) {
                this.handleLogout();
            }
            
            if (e.target.matches('.back-btn')) {
                this.goBack();
            }
        });
    }

    // จัดการการ Login
    handleLogin(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();
        
        if (name.length < 2) {
            this.showMessage('กรุณาใส่ชื่อให้ครบ (อย่างน้อย 2 ตัวอักษร)', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // ลอง login
            const result = window.gameAuth.login(name);
            
            if (result.needGender) {
                // ผู้ใช้ใหม่ - ต้องเลือกเพศ
                this.pendingName = name;
                this.showGenderSelection();
            } else if (result.isNew) {
                // ผู้ใช้ใหม่ที่เลือกเพศแล้ว
                this.showMessage(`ยินดีต้อนรับ ${result.user.displayName}! 🎉`, 'success');
                this.navigateToDashboard();
            } else {
                // ผู้ใช้เก่า
                this.showMessage(`ยินดีต้อนรับกลับ ${result.user.displayName}! 👋`, 'success');
                this.navigateToDashboard();
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // แสดงหน้าเลือกเพศ
    showGenderSelection() {
        const loginCard = document.querySelector('.welcome-card');
        
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

    // จัดการการเลือกเพศ
    handleGenderSelect(e) {
        const gender = e.currentTarget.dataset.gender;
        
        if (!this.pendingName || !gender) return;

        try {
            this.showLoading(true);
            
            // สร้างผู้ใช้ใหม่พร้อมเพศ
            const result = window.gameAuth.login(this.pendingName, gender);
            
            if (result.user) {
                this.showMessage(`สร้างตัวละครสำเร็จ! ยินดีต้อนรับ ${result.user.displayName} 🎉`, 'success');
                this.navigateToDashboard();
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.pendingName = null;
            this.showLoading(false);
        }
    }

    // ไปหน้า Dashboard
    navigateToDashboard() {
        setTimeout(() => {
            document.getElementById('login-page').classList.remove('active');
            document.getElementById('dashboard-page').classList.add('active');
            this.currentPage = 'dashboard';
            
            // อัพเดทข้อมูลในหน้า dashboard
            window.gameAuth.updateDashboard();
        }, 1000);
    }

    // จัดการการเลือกเกม
    handleGameSelect(e) {
        const gameType = e.currentTarget.dataset.game;
        
        if (!gameType) return;

        this.showMessage(`เตรียมเริ่มเกม: ${this.getGameName(gameType)}`, 'info');
        
        // ในอนาคตจะไปหน้าเกม
        setTimeout(() => {
            this.startGame(gameType);
        }, 1000);
    }

    // เริ่มเกม (ตอนนี้เป็น placeholder)
    startGame(gameType) {
        this.showMessage(`เกม ${this.getGameName(gameType)} กำลังพัฒนา... 🚧`, 'info');
        
        // TODO: ไปหน้าเกมจริง
        console.log(`Starting game: ${gameType}`);
    }

    // ได้ชื่อเกมภาษาไทย
    getGameName(gameType) {
        const gameNames = {
            memory: 'จำภาพ',
            pattern: 'จำลำดับ', 
            attention: 'สมาธิ',
            logic: 'ตรรกะ'
        };
        return gameNames[gameType] || gameType;
    }

    // เปิดหน้าแต่งตัวละคร
    openCharacterCustomization() {
        this.showMessage('ระบบแต่งตัวละครกำลังพัฒนา... 👗', 'info');
        
        // TODO: เปิดหน้าแต่งตัวละคร
    }

    // Logout
    handleLogout() {
        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            window.gameAuth.logout();
            this.currentPage = 'login';
            this.showMessage('ออกจากระบบเรียบร้อย', 'success');
        }
    }

    // กลับหน้าก่อน
    goBack() {
        if (this.currentPage === 'login') {
            // รีเซ็ต login form
            const loginCard = document.querySelector('.welcome-card');
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
        // สร้าง toast notification แบบง่าย
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // เพิ่ม CSS inline
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
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
        `;
        
        document.body.appendChild(toast);
        
        // แสดง toast
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // ซ่อน toast
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
            
            .gender-select-btn:active {
                transform: translateY(0);
            }
            
            .gender-icon {
                font-size: 3rem;
                line-height: 1;
            }
            
            .gender-select-btn.male:hover {
                border-color: #2196F3;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
            }
            
            .gender-select-btn.female:hover {
                border-color: #E91E63;
                box-shadow: 0 4px 12px rgba(233, 30, 99, 0.2);
            }
        `;
        
        document.head.appendChild(style);
    }
}

// เริ่มต้นแอพ
window.gameApp = new GameApp();
