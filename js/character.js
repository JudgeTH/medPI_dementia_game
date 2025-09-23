/* ========================================
   Fixed Image Character System (Safari + Layout update)
   ======================================== */

class ImageCharacterSystem {
    constructor() {
        // default scene bg: "green" | "blue"
        this.sceneBg = 'green';

        // เปลี่ยนเป็น relative path แก้ปัญหา Safari
        this.imagePaths = {
            base: {
                male: './assets/images/characters/base/elderly_male_base.png',
                female: './assets/images/characters/base/elderly_female_base.png'
            },
            equipment: {
                head: {
                    'hat_01': './assets/images/characters/equipment/head/hat_01.png',
                    'hat_02': './assets/images/characters/equipment/head/hat_02.png',
                    'cap_01': './assets/images/characters/equipment/head/cap_01.png',
                    'beret_01': './assets/images/characters/equipment/head/beret_01.png'
                },
                face: {
                    'glasses_01': './assets/images/characters/equipment/face/glasses_01.png',
                    'glasses_02': './assets/images/characters/equipment/face/glasses_02.png',
                    'sunglasses_01': './assets/images/characters/equipment/face/sunglasses_01.png'
                },
                body: {
                    'shirt_male_01': './assets/images/characters/equipment/body/shirt_male_01.png',
                    'shirt_male_02': './assets/images/characters/equipment/body/shirt_male_02.png',
                    'dress_female_01': './assets/images/characters/equipment/body/dress_female_01.png',
                    'dress_female_02': './assets/images/characters/equipment/body/dress_female_02.png',
                    'sweater_01': './assets/images/characters/equipment/body/sweater_01.png'
                },
                accessory: {
                    'necklace_01': './assets/images/characters/equipment/accessory/necklace_01.png',
                    'watch_01': './assets/images/characters/equipment/accessory/watch_01.png',
                    'brooch_01': './assets/images/characters/equipment/accessory/brooch_01.png'
                },
                weapon: {
                    'walking_stick_01': './assets/images/characters/equipment/weapon/walking_stick_01.png',
                    'walking_stick_02': './assets/images/characters/equipment/weapon/walking_stick_02.png',
                    'umbrella_01': './assets/images/characters/equipment/weapon/umbrella_01.png'
                },
                shoes: {
                    'comfort_shoes_01': './assets/images/characters/equipment/shoes/comfort_shoes_01.png',
                    'slippers_01': './assets/images/characters/equipment/shoes/slippers_01.png'
                },
                pet: {
                    'cat_01': './assets/images/characters/pets/cat_01.png',
                    'dog_01': './assets/images/characters/pets/dog_01.png',
                    'bird_01': './assets/images/characters/pets/bird_01.png'
                }
            }
        };

        this.equipmentData = {
            head: {
                'hat_01': { name: 'หมวกไหมพรม', price: 50, gender: 'both' },
                'hat_02': { name: 'หมวกกันแดด', price: 30, gender: 'both' },
                'cap_01': { name: 'หมวกแก๊ป', price: 40, gender: 'both' },
                'beret_01': { name: 'หมวกเบเร่', price: 80, gender: 'female' }
            },
            face: {
                'glasses_01': { name: 'แว่นตาอ่านหนังสือ', price: 35, gender: 'both' },
                'glasses_02': { name: 'แว่นตาทรงสี่เหลี่ยม', price: 40, gender: 'both' },
                'sunglasses_01': { name: 'แว่นกันแดด', price: 60, gender: 'both' }
            },
            body: {
                'shirt_male_01': { name: 'เสื้อเชิ้ตสีฟ้า', price: 0, gender: 'male' },
                'shirt_male_02': { name: 'เสื้อโปโลสีเขียว', price: 45, gender: 'male' },
                'dress_female_01': { name: 'ชุดเดรสสีม่วง', price: 0, gender: 'female' },
                'dress_female_02': { name: 'ชุดเดรสลายดอก', price: 60, gender: 'female' },
                'sweater_01': { name: 'เสื้อกันหนาว', price: 70, gender: 'both' }
            },
            accessory: {
                'necklace_01': { name: 'สร้อยคอไข่มุก', price: 90, gender: 'female' },
                'watch_01': { name: 'นาฬิกาข้อมือ', price: 120, gender: 'both' },
                'brooch_01': { name: 'เข็มกลัดดอกไม้', price: 50, gender: 'female' }
            },
            weapon: {
                'walking_stick_01': { name: 'ไม้เท้าไม้', price: 0, gender: 'both' },
                'walking_stick_02': { name: 'ไม้เท้าโลหะ', price: 25, gender: 'both' },
                'umbrella_01': { name: 'ร่มสีแดง', price: 30, gender: 'both' }
            },
            shoes: {
                'comfort_shoes_01': { name: 'รองเท้าสบาย', price: 0, gender: 'both' },
                'slippers_01': { name: 'รองเท้าแตะ', price: 15, gender: 'both' }
            },
            pet: {
                'cat_01': { name: 'แมวน้อยสีส้ม', price: 200, gender: 'both' },
                'dog_01': { name: 'สุนัขน้อยสีน้ำตาล', price: 250, gender: 'both' },
                'bird_01': { name: 'นกแก้วเล็ก', price: 180, gender: 'both' }
            }
        };

        this.defaultEquipment = {
            male: { head: null, face: 'glasses_01', body: 'shirt_male_01', accessory: null, weapon: 'walking_stick_01', shoes: 'comfort_shoes_01', pet: null },
            female:{ head: null, face: null, body: 'dress_female_01', accessory: 'necklace_01', weapon: null, shoes: 'comfort_shoes_01', pet: null }
        };

        this.currentCharacter = null;
        this.imageCache = new Map();
        this.animationFrame = 0;
        this.animationInterval = null;
        this.isInitialized = false;
    }

    setSceneBackground(color /* 'green' | 'blue' */) {
        this.sceneBg = (color === 'blue') ? 'blue' : 'green';
        const container = document.getElementById('image-character-container');
        if (container) {
            container.classList.toggle('bg-blue', this.sceneBg === 'blue');
            container.classList.toggle('bg-green', this.sceneBg !== 'blue');
        }
    }

    // ไม่ init ทันที รอให้เรียกจาก app.js
    setupCharacterContainer() {
        // ลบ container เก่า (กันซ้ำ)
        const existingContainer = document.getElementById('image-character-container');
        if (existingContainer) existingContainer.remove();

        const container = document.createElement('div');
        container.id = 'image-character-container';
        container.className = this.sceneBg === 'blue' ? 'bg-blue' : 'bg-green';

        // NOTE: ปรับ layout — ตัดฉากหลัง/ต้นไม้/เก้าอี้ออก เปลี่ยนเป็นกรอบเดียว
        container.innerHTML = `
            <div class="character-scene">
                <div class="character-stage">
                    <div class="character-display-area">
                        <div class="character-container" id="character-container">
                            <div class="character-shadow"></div>

                            <div class="character-layer base-layer">
                                <img id="character-base" class="character-image base-image" src="" alt="Base Character">
                            </div>

                            <div class="character-layer body-layer">
                                <img id="equip-body" class="character-image equipment-image" src="" alt="Body Equipment">
                            </div>

                            <div class="character-layer shoes-layer">
                                <img id="equip-shoes" class="character-image equipment-image" src="" alt="Shoes">
                            </div>

                            <div class="character-layer accessory-layer">
                                <img id="equip-accessory" class="character-image equipment-image" src="" alt="Accessory">
                            </div>

                            <div class="character-layer head-layer">
                                <img id="equip-head" class="character-image equipment-image" src="" alt="Head Equipment">
                            </div>

                            <div class="character-layer face-layer">
                                <img id="equip-face" class="character-image equipment-image" src="" alt="Face Equipment">
                            </div>

                            <div class="character-layer weapon-layer">
                                <img id="equip-weapon" class="character-image equipment-image" src="" alt="Weapon">
                            </div>

                            <div class="character-layer effects-layer">
                                <div class="emotion-effects" id="emotion-effects"></div>
                            </div>
                        </div>

                        <!-- แผงชื่อ + stat วางชิดตัวละคร -->
                        <div class="character-info in-stage">
                            <div class="character-nameplate">
                                <h3 id="character-name">ผู้เล่น</h3>
                                <div class="character-level">Lv. 1</div>
                            </div>
                            <div class="character-stats">
                                <div class="stat-item">
                                    <span class="stat-icon">⭐</span>
                                    <span class="stat-label">เหรียญ:</span>
                                    <span class="stat-value" id="char-coins">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon">🎮</span>
                                    <span class="stat-label">เกม:</span>
                                    <span class="stat-value" id="char-games">0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pet -->
                    <div class="pet-container" id="pet-container">
                        <img id="pet-image" class="pet-image" src="" alt="Pet">
                    </div>
                </div>

                <!-- Emotion buttons -->
                <div class="emotion-controls">
                    <button class="emotion-btn" data-emotion="happy" title="ดีใจ">😊</button>
                    <button class="emotion-btn" data-emotion="wave" title="โบกมือ">👋</button>
                    <button class="emotion-btn" data-emotion="think" title="คิด">🤔</button>
                    <button class="emotion-btn" data-emotion="love" title="รัก">💕</button>
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

    async loadCharacter(userData) {
        if (!userData || !userData.character) {
            console.warn('No character data found');
            return;
        }

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
        } catch (error) {
            console.error('Error loading character:', error);
            this.showError('ไม่สามารถโหลดตัวละครได้');
        } finally {
            this.showLoading(false);
        }
    }

    async loadBaseCharacter(gender) {
        const baseImg = document.getElementById('character-base');
        if (!baseImg) return;

        const imagePath = this.imagePaths.base[gender];

        try {
            await this.loadImage(imagePath);
            baseImg.src = imagePath;
            baseImg.style.display = 'block';
            // Safari-friendly
            baseImg.loading = 'eager';
            baseImg.decoding = 'sync';
            baseImg.referrerPolicy = 'no-referrer';
            baseImg.crossOrigin = 'anonymous';
        } catch {
            baseImg.src = this.getPlaceholderDataUrl();
            baseImg.style.display = 'block';
        }
    }

    async loadAllEquipment(equipment) {
        const loadPromises = [];
        Object.keys(equipment).forEach(slot => {
            const equipmentId = equipment[slot];
            if (equipmentId) {
                loadPromises.push(this.loadEquipmentItem(slot, equipmentId));
            } else {
                this.hideEquipmentSlot(slot);
            }
        });
        await Promise.all(loadPromises);
    }

    async loadEquipmentItem(slot, equipmentId) {
        const imgElement = slot === 'pet'
            ? document.getElementById('pet-image')
            : document.getElementById(`equip-${slot}`);
        if (!imgElement) return;

        const imagePath = this.imagePaths.equipment[slot]
            ? this.imagePaths.equipment[slot][equipmentId]
            : null;

        if (!imagePath) {
            this.hideEquipmentSlot(slot);
            return;
        }

        try {
            await this.loadImage(imagePath);
            imgElement.src = imagePath;
            imgElement.style.display = 'block';
            imgElement.loading = 'eager';
            imgElement.decoding = 'sync';
            imgElement.referrerPolicy = 'no-referrer';
            imgElement.crossOrigin = 'anonymous';
            if (slot === 'pet') {
                const pc = document.getElementById('pet-container');
                if (pc) pc.style.display = 'block';
            }
        } catch {
            imgElement.src = this.getPlaceholderDataUrl();
            imgElement.style.display = 'block';
        }
    }

    hideEquipmentSlot(slot) {
        const imgElement = slot === 'pet'
            ? document.getElementById('pet-image')
            : document.getElementById(`equip-${slot}`);
        if (imgElement) imgElement.style.display = 'none';
        if (slot === 'pet') {
            const pc = document.getElementById('pet-container');
            if (pc) pc.style.display = 'none';
        }
    }

    // โหลดรูป (Safari safe)
    async loadImage(src) {
        if (this.imageCache.has(src)) return this.imageCache.get(src);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.referrerPolicy = 'no-referrer';
            img.loading = 'eager';
            img.decoding = 'sync';

            let timedOut = false;
            const tid = setTimeout(() => {
                timedOut = true;
                // อย่า reject ทันที ให้ resolve ด้วย img (เผื่อ Safari วาดช้า)
                console.warn(`Timeout loading (continue anyway): ${src}`);
                this.imageCache.set(src, img);
                resolve(img);
            }, 12000);

            img.onload = () => {
                if (!timedOut) clearTimeout(tid);
                this.imageCache.set(src, img);
                resolve(img);
            };

            img.onerror = () => {
                if (!timedOut) clearTimeout(tid);
                console.warn(`Failed to load: ${src}`);
                reject(new Error(`Failed to load image: ${src}`));
            };

            img.src = src;
        });
    }

    getPlaceholderDataUrl() {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='192' viewBox='0 0 128 192'%3E%3Crect width='128' height='192' fill='%23F3F4F6' stroke='%23E5E7EB' stroke-width='2' rx='10'/%3E%3Ccircle cx='64' cy='60' r='20' fill='%23D1D5DB'/%3E%3Crect x='44' y='85' width='40' height='60' fill='%23D1D5DB' rx='6'/%3E%3Crect x='49' y='150' width='10' height='30' fill='%23D1D5DB'/%3E%3Crect x='69' y='150' width='10' height='30' fill='%23D1D5DB'/%3E%3C/svg%3E";
    }

    updateCharacterInfo(userData) {
        const nameElement = document.getElementById('character-name');
        const coinsElement = document.getElementById('char-coins');
        const gamesElement = document.getElementById('char-games');

        if (nameElement) nameElement.textContent = userData.displayName || 'ผู้เล่น';
        if (coinsElement && userData.stats) coinsElement.textContent = userData.stats.totalStars || 0;
        if (gamesElement && userData.stats) gamesElement.textContent = userData.stats.totalGames || 0;
    }

    setupEmotionControls() {
        const emotionBtns = document.querySelectorAll('.emotion-btn');
        emotionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emotion = e.currentTarget.dataset.emotion;
                this.playEmotion(emotion);
            });
        });
    }

    playEmotion(emotion) {
        const characterContainer = document.getElementById('character-container');
        const emotionEffects = document.getElementById('emotion-effects');
        if (!characterContainer || !emotionEffects) return;

        characterContainer.className = 'character-container';
        emotionEffects.innerHTML = '';

        switch (emotion) {
            case 'happy':
                characterContainer.classList.add('bounce-animation');
                emotionEffects.innerHTML = '<div class="effect-hearts">💕 💖 💕</div>';
                break;
            case 'wave':
                characterContainer.classList.add('wave-animation');
                emotionEffects.innerHTML = '<div class="effect-sparkles">✨ ⭐ ✨</div>';
                break;
            case 'think':
                characterContainer.classList.add('think-animation');
                emotionEffects.innerHTML = '<div class="effect-thought">💭</div>';
                break;
            case 'love':
                characterContainer.classList.add('love-animation');
                emotionEffects.innerHTML = '<div class="effect-love">💕 💗 💕 💖 💕</div>';
                break;
        }

        setTimeout(() => {
            characterContainer.className = 'character-container';
            emotionEffects.innerHTML = '';
            this.startIdleAnimation();
        }, 3000);
    }

    startIdleAnimation() {
        const characterContainer = document.getElementById('character-container');
        if (!characterContainer) return;
        this.stopCurrentAnimation();
        this.animationInterval = setInterval(() => {
            this.animationFrame += 0.5;
            const breathOffset = Math.sin(this.animationFrame * 0.1) * 2;
            characterContainer.style.transform = `translateY(${breathOffset}px)`;
        }, 50);
    }

    stopCurrentAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('character-loading');
        if (loadingElement) loadingElement.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const container = document.getElementById('image-character-container');
        if (container) {
            container.innerHTML = `
                <div class="character-error">
                    <h3>😞 เกิดข้อผิดพลาด</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="retry-btn">ลองใหม่</button>
                </div>`;
        }
    }

    // CSS ใหม่ (ตัด gradient/ฉากหลังออก, วางชื่อชิดตัวละคร, การ์ด stat ในกรอบเดียวกัน)
    addResponsiveStyles() {
        if (document.getElementById('character-responsive-styles')) return;

        const style = document.createElement('style');
        style.id = 'character-responsive-styles';
        style.textContent = `
            #image-character-container {
                --bg-green: #EFFFF4; /* เขียวอ่อนจาง */
                --bg-blue:  #EAF6FF; /* ฟ้าอ่อนจาง  */
                width: 100%;
                height: 500px;
                position: relative;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }
            #image-character-container.bg-green { background: var(--bg-green); }
            #image-character-container.bg-blue  { background: var(--bg-blue);  }

            .character-scene { width: 100%; height: 100%; position: relative; }
            .character-stage {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .character-display-area {
                display: flex;
                align-items: center;
                gap: 16px; /* ชื่ออยู่ใกล้ตัวละคร */
                z-index: 10;
                padding: 14px 18px;
                border-radius: 16px;
                background: rgba(255,255,255,0.9); /* การ์ดรวม */
                box-shadow: 0 6px 18px rgba(0,0,0,0.08);
            }

            .character-container {
                position: relative;
                width: 128px;
                height: 192px;
                transition: all 0.3s ease;
            }

            .character-shadow {
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 80px;
                height: 20px;
                background: rgba(0,0,0,0.12);
                border-radius: 50%;
                animation: shadowPulse 3s ease-in-out infinite;
            }

            .character-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
            .base-layer { z-index: 1; }
            .shoes-layer { z-index: 2; }
            .body-layer { z-index: 3; }
            .accessory-layer { z-index: 4; }
            .head-layer { z-index: 5; }
            .face-layer { z-index: 6; }
            .weapon-layer { z-index: 7; }
            .effects-layer { z-index: 8; }

            .character-image {
                width: 100%; height: 100%; object-fit: contain; display: none;
                transition: opacity 0.3s ease;
                -webkit-transform: translateZ(0); transform: translateZ(0);
                image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;
            }
            .character-image.base-image { display: block; }
            .equipment-image { transition: all 0.3s ease; }

            /* การ์ด stat อยู่ในกรอบเดียว (ชิดตัวละคร) */
            .character-info.in-stage {
                background: transparent;
                box-shadow: none;
                padding: 0;
                max-width: 220px;
            }
            .character-nameplate { margin: 0 0 6px 0; padding-bottom: 6px; border-bottom: 1px solid #E8E8E8; }
            .character-nameplate h3 { margin: 0; font-size: 1.15rem; color: #2C3E50; font-weight: 800; }
            .character-level { font-size: 0.8rem; color: #7F8C8D; margin-top: 2px; }
            .character-stats { display: flex; flex-direction: column; gap: 6px; }
            .stat-item { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
            .stat-icon { font-size: 1rem; min-width: 20px; }
            .stat-label { color: #34495E; flex: 1; }
            .stat-value { font-weight: 800; color: #E67E22; }

            /* Pet */
            .pet-container { position: absolute; bottom: 40px; right: 40px; display: none; z-index: 5; }
            .pet-image { width: 64px; height: 64px; object-fit: contain; animation: petFloat 3s ease-in-out infinite; }

            /* Emotion controls */
            .emotion-controls { position: absolute; bottom: 15px; right: 15px; display: flex; gap: 8px; z-index: 15; }
            .emotion-btn {
                width: 44px; height: 44px; border-radius: 50%; border: 2px solid #3498DB;
                background: rgba(255,255,255,0.95); font-size: 1.2rem; cursor: pointer;
                transition: all 0.3s ease; display: flex; align-items: center; justify-content: center;
                box-shadow: 0 3px 8px rgba(0,0,0,0.2); backdrop-filter: blur(10px);
                -webkit-tap-highlight-color: transparent;
            }
            .emotion-btn:hover { transform: scale(1.1); background: #3498DB; color: white; box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4); }
            .emotion-btn:active { transform: scale(0.95); }

            .loading-indicator {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                display: none; flex-direction: column; align-items: center; gap: 15px; z-index: 20;
                background: rgba(255,255,255,0.95); padding: 25px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.3);
            }
            .loading-spinner { width: 32px; height: 32px; border: 3px solid #E8E8E8; border-top: 3px solid #3498DB; border-radius: 50%; animation: spin 1s linear infinite; }
            .loading-indicator p { margin: 0; color: #34495E; font-size: 1rem; font-weight: 500; }

            .character-error {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                text-align: center; background: rgba(255,255,255,0.95); padding: 25px; border-radius: 12px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.3); z-index: 20; max-width: 280px;
            }
            .character-error h3 { margin: 0 0 12px 0; color: #E74C3C; font-size: 1.3rem; }
            .character-error p { margin: 0 0 16px 0; color: #7F8C8D; font-size: 0.95rem; }
            .retry-btn { background: #3498DB; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: background 0.3s ease; }
            .retry-btn:hover { background: #2980B9; }

            /* Animations */
            @keyframes shadowPulse { 0%,100%{transform:translateX(-50%) scale(1);opacity:.25} 50%{transform:translateX(-50%) scale(1.1);opacity:.4} }
            @keyframes petFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
            @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
            .bounce-animation { animation: happyBounce .6s ease infinite; }
            .wave-animation { animation: waveMotion 1s ease-in-out 3; }
            .think-animation { animation: thinkSway 2s ease-in-out infinite; }
            .love-animation { animation: loveFloat 1s ease-in-out infinite; }

            @keyframes happyBounce { 0%,100%{transform:translateY(0) scale(1)} 25%{transform:translateY(-10px) scale(1.03)} 75%{transform:translateY(-5px) scale(1.01)} }
            @keyframes waveMotion { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-6deg)} 75%{transform:rotate(6deg)} }
            @keyframes thinkSway { 0%,100%{transform:translateX(0)} 50%{transform:translateX(3px)} }
            @keyframes loveFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-6px) scale(1.02)} }

            .effect-hearts,.effect-sparkles,.effect-thought,.effect-love {
                position: absolute; top: -30px; left: 50%; transform: translateX(-50%); font-size: 1rem;
                animation: effectFloat 2s ease-in-out infinite; pointer-events: none;
            }
            @keyframes effectFloat { 0%,100%{transform:translateX(-50%) translateY(0);opacity:1} 50%{transform:translateX(-50%) translateY(-15px);opacity:.7} }

            /* Mobile */
            @media (max-width: 768px) {
                #image-character-container { height: 360px; margin-bottom: 20px; }
                .character-container { width: 96px; height: 144px; }
                .character-display-area { padding: 10px 12px; gap: 12px; }
                .character-nameplate h3 { font-size: 1rem; }
                .character-level { font-size: .75rem; }
                .stat-item { font-size: .8rem; gap: 4px; }
                .stat-icon { font-size: .9rem; min-width: 16px; }
                .emotion-controls { bottom: 8px; right: 8px; gap: 6px; }
                .emotion-btn { width: 36px; height: 36px; font-size: 1rem; border-width: 1px; }
                .pet-image { width: 48px; height: 48px; }
                .pet-container { right: 20px; bottom: 20px; }
            }

            /* Safari specific fixes */
            @supports (-webkit-appearance:none) {
                .character-image { -webkit-transform: translate3d(0,0,0); transform: translate3d(0,0,0); -webkit-backface-visibility: hidden; backface-visibility: hidden; }
            }
            @media (-webkit-min-device-pixel-ratio:2),(min-resolution:2dppx) {
                .character-image { image-rendering: auto; }
            }
        `;
        document.head.appendChild(style);
    }

    // Utilities
    getAllEquipmentData(){ return this.equipmentData; }
    getCurrentEquipment(){ return this.currentCharacter ? this.currentCharacter.equipment : null; }

    canAfford(category,itemId){
        const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (!user) return false;
        const itemData = this.equipmentData[category]?.[itemId];
        if (!itemData) return false;
        return user.stats.totalStars >= itemData.price;
    }

    async equipItem(category,itemId){
        if (!this.currentCharacter) return { success:false, message:'ไม่พบข้อมูลตัวละคร' };
        const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (!user) return { success:false, message:'ไม่พบข้อมูลผู้เล่น' };
        const itemData = this.equipmentData[category]?.[itemId];
        if (!itemData) return { success:false, message:'ไม่พบอุปกรณ์นี้' };

        const userGender = user.character.gender;
        if (itemData.gender !== 'both' && itemData.gender !== userGender) {
            return { success:false, message:'อุปกรณ์นี้ไม่เหมาะกับเพศของคุณ' };
        }
        if (itemData.price > 0 && user.stats.totalStars < itemData.price) {
            return { success:false, message:'เงินไม่พอ' };
        }

        if (!user.character.equipment) user.character.equipment = {};
        user.character.equipment[category] = itemId;
        if (itemData.price > 0) user.stats.totalStars -= itemData.price;

        window.gameAuth && window.gameAuth.saveCurrentUser();

        await this.loadEquipmentItem(category, itemId);
        this.updateCharacterInfo(user);

        return { success:true, message:`ใส่ ${itemData.name} เรียบร้อย!` };
    }

    unequipItem(category){
        if (!this.currentCharacter) return false;
        const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (!user || !user.character.equipment) return false;
        user.character.equipment[category] = null;
        window.gameAuth.saveCurrentUser();
        this.hideEquipmentSlot(category);
        return true;
    }

    destroy(){
        this.stopCurrentAnimation();
        const container = document.getElementById('image-character-container');
        if (container) container.remove();
        const styles = document.getElementById('character-responsive-styles');
        if (styles) styles.remove();
        this.imageCache.clear();
    }
}

// ไม่สร้าง instance ทันที
window.characterSystem = new ImageCharacterSystem();

/* ===== วิธีเลือกสีพื้นหลังที่ต้องการ =====
   เรียกหลังจาก setupCharacterContainer():
   window.characterSystem.setSceneBackground('green'); // หรือ 'blue'
*/
