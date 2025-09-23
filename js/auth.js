/* ========================================
   Simple Authentication System for Elderly
   (Fixed: gender sync with character + update for existing users)
   ======================================== */

class SimpleAuth {
    constructor() {
        this.storageKey = 'elderlyGame_user';
        this.currentUser = null;
        this.init();
    }

    init() {
        // ตรวจสอบว่ามี user login อยู่หรือไม่
        this.loadUser();
        
        // ถ้ามี user แล้ว auto login
        if (this.currentUser) {
            this.autoLogin();
        }
    }

    // สร้าง Device ID เรียบง่าย (ไม่ซับซ้อน)
    generateDeviceId() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = canvas.toDataURL() + 
                          navigator.userAgent + 
                          screen.width + 
                          screen.height + 
                          new Date().getTimezoneOffset();
        
        // สร้าง hash เรียบง่าย
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36).substring(0, 8);
    }

    // ตรวจสอบว่าชื่อซ้ำหรือไม่
    checkDuplicateName(name) {
        const existingUsers = this.getAllUsers();
        const baseName = name.trim();
        const duplicates = existingUsers.filter(user => 
            user.displayName === baseName || 
            user.username.startsWith(baseName + '_')
        );
        
        if (duplicates.length === 0) {
            return baseName;
        }
        
        // หาเลขต่อท้ายที่ว่าง
        let counter = 1;
        let uniqueName;
        do {
            uniqueName = `${baseName}_${counter.toString().padStart(3, '0')}`;
            counter++;
        } while (existingUsers.some(user => user.username === uniqueName));
        
        return uniqueName;
    }

    // ดึงรายชื่อผู้ใช้ทั้งหมด
    getAllUsers() {
        const users = localStorage.getItem('elderlyGame_allUsers');
        return users ? JSON.parse(users) : [];
    }

    // บันทึกผู้ใช้ใหม่
    saveUser(user) {
        const allUsers = this.getAllUsers();
        allUsers.push(user);
        localStorage.setItem('elderlyGame_allUsers', JSON.stringify(allUsers));
    }

    // ====== จุดสำคัญ: สร้างตัวละครตามเพศ และฝัง gender ไว้ใน character ด้วย ======
    createUser(displayName, gender) {
        const deviceId = this.generateDeviceId();
        const username = this.checkDuplicateName(displayName);
        
        const user = {
            id: Date.now().toString() + deviceId,
            username: username,
            displayName: displayName,
            gender: gender, // เก็บที่ระดับ user ด้วย
            deviceId: deviceId,
            character: {
                ...this.generateCharacter(gender),
                gender: gender      // 👈 สำคัญ: ให้ character มี gender ด้วย (character.js ใช้อ่านจากตรงนี้)
            },
            stats: {
                totalGames: 0,
                totalStars: 0,
                bestScores: {
                    memory: 0,
                    pattern: 0,
                    attention: 0,
                    logic: 0
                },
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
            }
        };

        // บันทึกผู้ใช้
        this.saveUser(user);
        this.currentUser = user;
        this.saveCurrentUser();
        
        return user;
    }

    // สร้างโครง character เบื้องต้นตามเพศ
    generateCharacter(gender) {
        const characters = {
            male: {
                emoji: '👴',
                skinColor: '#FDBCB4',
                hairColor: '#CCCCCC',
                clothes: {
                    shirt: '👕',
                    color: '#4CAF50'
                }
            },
            female: {
                emoji: '👵',
                skinColor: '#FDBCB4', 
                hairColor: '#CCCCCC',
                clothes: {
                    shirt: '👚',
                    color: '#E91E63'
                }
            }
        };

        return characters[gender] || characters.male;
    }

    // บันทึกผู้ใช้ปัจจุบัน
    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
        }
    }

    // โหลดผู้ใช้ปัจจุบัน + ซ่อมค่า character.gender ถ้าขาด
    loadUser() {
        const userData = localStorage.getItem(this.storageKey);
        if (userData) {
            this.currentUser = JSON.parse(userData);

            // 👇 Compatibility fix: ถ้า user เก่าไม่มี character.gender ให้เติมจาก user.gender
            if (this.currentUser && this.currentUser.character) {
                if (!this.currentUser.character.gender) {
                    const g = this.currentUser.gender || 'male';
                    this.currentUser.character = {
                        ...this.generateCharacter(g),
                        gender: g
                    };
                }
            } else if (this.currentUser) {
                // กรณีไม่มี character เลย
                const g = this.currentUser.gender || 'male';
                this.currentUser.character = {
                    ...this.generateCharacter(g),
                    gender: g
                };
            }
            
            // อัพเดท last login
            this.currentUser.stats.lastLoginAt = new Date().toISOString();
            this.saveCurrentUser();
        }
    }

    // Auto login สำหรับผู้ใช้เก่า
    autoLogin() {
        if (this.currentUser) {
            console.log(`Auto login: ${this.currentUser.displayName}`);
            
            // ซ่อนหน้า login และแสดงหน้า dashboard
            document.getElementById('login-page').classList.remove('active');
            document.getElementById('dashboard-page').classList.add('active');
            
            // อัพเดทข้อมูลในหน้า dashboard
            this.updateDashboard();
            
            return true;
        }
        return false;
    }

    // Login ด้วยชื่อ (และอาจมี gender ถ้าเป็นผู้ใช้ใหม่ หรืออยากสลับเพศ)
    login(name, gender = null) {
        const trimmedName = name.trim();
        
        if (trimmedName.length < 2) {
            throw new Error('กรุณาใส่ชื่อให้ครบ (อย่างน้อย 2 ตัวอักษร)');
        }

        // หา user เก่าจากชื่อ + device
        const deviceId = this.generateDeviceId();
        const existingUser = this.findExistingUser(trimmedName, deviceId);
        
        if (existingUser) {
            this.currentUser = existingUser;
            this.currentUser.stats.lastLoginAt = new Date().toISOString();

            // 👇 ถ้ามีการส่ง gender ใหม่เข้ามา และต่างจากเดิม → อัปเดตให้ทันที
            if (gender && this.currentUser.gender !== gender) {
                this.currentUser.gender = gender;
                this.currentUser.character = {
                    ...this.generateCharacter(gender),
                    gender: gender
                };
            }

            this.saveCurrentUser();
            return { isNew: false, user: this.currentUser };
        }

        // ถ้าเป็นผู้ใช้ใหม่ แต่ยังไม่ได้เลือกเพศ → ให้เลือกเพศก่อน
        if (!gender) {
            return { isNew: true, needGender: true };
        }

        // ผู้ใช้ใหม่ + มี gender แล้ว → สร้างเลย
        const newUser = this.createUser(trimmedName, gender);
        return { isNew: true, user: newUser };
    }

    // หาผู้ใช้เก่าที่มีชื่อเดียวกันและอุปกรณ์เดียวกัน
    findExistingUser(displayName, deviceId) {
        const allUsers = this.getAllUsers();
        return allUsers.find(user => 
            user.displayName === displayName && 
            user.deviceId === deviceId
        );
    }

    // อัพเดทข้อมูลในหน้า dashboard
    updateDashboard() {
        if (!this.currentUser) return;

        // อัพเดทชื่อผู้เล่น
        const displayNameEl = document.getElementById('display-name');
        if (displayNameEl) {
            displayNameEl.textContent = this.currentUser.displayName;
        }

        // อัพเดทจำนวนดาว (ถ้ามี element นี้ในหน้า)
        const totalStarsEl = document.getElementById('total-stars');
        if (totalStarsEl) {
            totalStarsEl.textContent = this.currentUser.stats.totalStars;
        }

        // อัพเดทตัวละครอีโมจิ (ถ้ามี element ตัวนี้)
        const characterAvatars = document.querySelectorAll('.character-avatar');
        characterAvatars.forEach(avatar => {
            avatar.textContent = this.currentUser.character?.emoji || '👴';
        });

        // อัพเดทสถิติ
        const todayGamesEl = document.getElementById('today-games');
        const avgScoreEl = document.getElementById('avg-score');
        
        if (todayGamesEl) {
            todayGamesEl.textContent = '0';
        }

        if (avgScoreEl) {
            const scores = Object.values(this.currentUser.stats.bestScores || {});
            const avgScore = scores.length > 0 ? 
                Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            avgScoreEl.textContent = avgScore + '%';
        }
    }

    // ออกจากระบบ
    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.storageKey);
        
        // กลับไปหน้า login
        document.getElementById('dashboard-page').classList.remove('active');
        document.getElementById('login-page').classList.add('active');
        
        // เคลียร์ form
        const nameInput = document.getElementById('player-name');
        if (nameInput) nameInput.value = '';
    }

    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    getCurrentUser() {
        return this.currentUser;
    }

    // อัพเดทคะแนนและดาว
    updateScore(gameType, score, stars) {
        if (!this.currentUser) return;

        // อัพเดทคะแนนสูงสุด
        if (score > (this.currentUser.stats.bestScores?.[gameType] || 0)) {
            this.currentUser.stats.bestScores[gameType] = score;
        }

        // เพิ่มดาว
        this.currentUser.stats.totalStars += (stars || 0);
        this.currentUser.stats.totalGames += 1;

        // บันทึกข้อมูล
        this.saveCurrentUser();
        this.updateDashboard();
    }
}

// สร้าง instance ของระบบ auth
window.gameAuth = new SimpleAuth();
