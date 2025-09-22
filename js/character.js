/* ========================================
   Image-Based Character System for Elderly Game
   ======================================== */

class ImageCharacterSystem {
    constructor() {
        // โครงสร้างไฟล์ภาพ
        this.imagePaths = {
            base: {
                male: 'assets/images/characters/base/elderly_male_base.png',
                female: 'assets/images/characters/base/elderly_female_base.png'
            },
            equipment: {
                head: {
                    'hat_01': 'assets/images/characters/equipment/head/hat_01.png',
                    'hat_02': 'assets/images/characters/equipment/head/hat_02.png',
                    'cap_01': 'assets/images/characters/equipment/head/cap_01.png',
                    'beret_01': 'assets/images/characters/equipment/head/beret_01.png'
                },
                face: {
                    'glasses_01': 'assets/images/characters/equipment/face/glasses_01.png',
                    'glasses_02': 'assets/images/characters/equipment/face/glasses_02.png',
                    'sunglasses_01': 'assets/images/characters/equipment/face/sunglasses_01.png'
                },
                body: {
                    'shirt_male_01': 'assets/images/characters/equipment/body/shirt_male_01.png',
                    'shirt_male_02': 'assets/images/characters/equipment/body/shirt_male_02.png',
                    'dress_female_01': 'assets/images/characters/equipment/body/dress_female_01.png',
                    'dress_female_02': 'assets/images/characters/equipment/body/dress_female_02.png',
                    'sweater_01': 'assets/images/characters/equipment/body/sweater_01.png'
                },
                accessory: {
                    'necklace_01': 'assets/images/characters/equipment/accessory/necklace_01.png',
                    'watch_01': 'assets/images/characters/equipment/accessory/watch_01.png',
                    'brooch_01': 'assets/images/characters/equipment/accessory/brooch_01.png'
                },
                weapon: {
                    'walking_stick_01': 'assets/images/characters/equipment/weapon/walking_stick_01.png',
                    'walking_stick_02': 'assets/images/characters/equipment/weapon/walking_stick_02.png',
                    'umbrella_01': 'assets/images/characters/equipment/weapon/umbrella_01.png'
                },
                shoes: {
                    'comfort_shoes_01': 'assets/images/characters/equipment/shoes/comfort_shoes_01.png',
                    'slippers_01': 'assets/images/characters/equipment/shoes/slippers_01.png'
                },
                pet: {
                    'cat_01': 'assets/images/characters/pets/cat_01.png',
                    'dog_01': 'assets/images/characters/pets/dog_01.png',
                    'bird_01': 'assets/images/characters/pets/bird_01.png'
                }
            },
            placeholder: 'assets/images/characters/placeholder.png' // รูปใส่ไว้ก่อนที่จะมีรูปจริง
        };

        // ข้อมูลอุปกรณ์พร้อมราคา
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

        // การตั้งค่าเริ่มต้นตามเพศ
        this.defaultEquipment = {
            male: {
                head: null,
                face: 'glasses_01',
                body: 'shirt_male_01',
                accessory: null,
                weapon: 'walking_stick_01',
                shoes: 'comfort_shoes_01',
                pet: null
            },
            female: {
                head: null,
                face: null,
                body: 'dress_female_01',
                accessory: 'necklace_01',
                weapon: null,
                shoes: 'comfort_shoes_01',
                pet: null
            }
        };

        this.currentCharacter = null;
        this.imageCache = new Map();
        this.animationFrame = 0;
        this.animationInterval = null;
        
        this.init();
    }

    init() {
        this.preloadPlaceholderImages();
        this.setupCharacterContainer();
        this.addCharacterStyles();
    }

    // โหลดรูป placeholder ก่อน
    preloadPlaceholderImages() {
        const placeholderImg = new Image();
        placeholderImg.src = 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="128" height="192" viewBox="0 0 128 192">
                <rect width="128" height="192" fill="#E8E8E8" stroke="#CCCCCC" stroke-width="2"/>
                <text x="64" y="100" text-anchor="middle" font-family="Arial" font-size="14" fill="#999999">
                    รอรูปภาพ
                </text>
                <text x="64" y="120" text-anchor="middle" font-family="Arial" font-size="12" fill="#BBBBBB">
                    128x192px
                </text>
            </svg>
        `);
        this.imageCache.set('placeholder', placeholderImg);
    }

    // สร้างพื้นที่แสดงตัวละคร
    setupCharacterContainer() {
        const container = document.createElement('div');
        container.id = 'image-character-container';
        container.innerHTML = `
            <div class="character-scene">
                <!-- Background Scene -->
                <div class="scene-background">
                    <div class="sky-layer"></div>
                    <div class="ground-layer"></div>
                    <div class="environment-objects">
                        <div class="env-object tree"></div>
                        <div class="env-object bench"></div>
                        <div class="env-object flowers"></div>
                    </div>
                </div>

                <!-- Character Display Area -->
                <div class="character-display-area">
                    <!-- Character Layers (เรียงตาม Z-index) -->
                    <div class="character-container" id="character-container">
                        <!-- Shadow -->
                        <div class="character-shadow"></div>
                        
                        <!-- Base Character -->
                        <div class="character-layer base-layer">
                            <img id="character-base" class="character-image base-image" src="" alt="Base Character">
                        </div>
                        
                        <!-- Equipment Layers -->
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
                        
                        <!-- Effects Layer -->
                        <div class="character-layer effects-layer">
                            <div class="emotion-effects" id="emotion-effects"></div>
                        </div>
                    </div>
                    
                    <!-- Pet -->
                    <div class="pet-container" id="pet-container">
                        <img id="pet-image" class="pet-image" src="" alt="Pet">
                    </div>
                </div>

                <!-- Character Information -->
                <div class="character-info">
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

                <!-- Emotion Buttons -->
                <div class="emotion-controls">
                    <button class="emotion-btn" data-emotion="happy" title="ดีใจ">😊</button>
                    <button class="emotion-btn" data-emotion="wave" title="โบกมือ">👋</button>
                    <button class="emotion-btn" data-emotion="think" title="คิด">🤔</button>
                    <button class="emotion-btn" data-emotion="love" title="รัก">💕</button>
                </div>

                <!-- Loading Indicator -->
                <div class="loading-indicator" id="character-loading">
                    <div class="loading-spinner"></div>
                    <p>กำลังโหลดตัวละคร...</p>
                </div>
            </div>
        `;

        return container;
    }

    // โหลดตัวละครจากข้อมูลผู้เล่น
    async loadCharacter(userData) {
        if (!userData || !userData.character) {
            console.warn('No character data found');
            return;
        }

        this.showLoading(true);
        this.currentCharacter = userData.character;
        
        try {
            const gender = userData.character.gender || 'male';
            
            // ตั้งค่าอุปกรณ์เริ่มต้นถ้าเป็นครั้งแรก
            if (!userData.character.equipment) {
                userData.character.equipment = { ...this.defaultEquipment[gender] };
                if (window.gameAuth) {
                    window.gameAuth.saveCurrentUser();
                }
            }

            // โหลดภาพพื้นฐาน
            await this.loadBaseCharacter(gender);
            
            // โหลดอุปกรณ์
            await this.loadAllEquipment(userData.character.equipment);
            
            // อัพเดทข้อมูล
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

    // โหลดตัวละครพื้นฐาน
    async loadBaseCharacter(gender) {
        const baseImg = document.getElementById('character-base');
        if (!baseImg) return;

        const imagePath = this.imagePaths.base[gender];
        
        try {
            await this.loadImage(imagePath);
            baseImg.src = imagePath;
            baseImg.style.display = 'block';
        } catch (error) {
            console.warn(`Base character image not found: ${imagePath}`);
            baseImg.src = this.getPlaceholderDataUrl();
            baseImg.style.display = 'block';
        }
    }

    // โหลดอุปกรณ์ทั้งหมด
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

    // โหลดอุปกรณ์แต่ละชิ้น
    async loadEquipmentItem(slot, equipmentId) {
        const imgElement = document.getElementById(`equip-${slot}`) || document.getElementById('pet-image');
        if (!imgElement) return;

        const imagePath = this.imagePaths.equipment[slot] ? this.imagePaths.equipment[slot][equipmentId] : null;
        
        if (!imagePath) {
            this.hideEquipmentSlot(slot);
            return;
        }

        try {
            await this.loadImage(imagePath);
            imgElement.src = imagePath;
            imgElement.style.display = 'block';
            
            // แสดง pet container ถ้าเป็นสัตว์เลี้ยง
            if (slot === 'pet') {
                document.getElementById('pet-container').style.display = 'block';
            }
        } catch (error) {
            console.warn(`Equipment image not found: ${imagePath}`);
            imgElement.src = this.getPlaceholderDataUrl();
            imgElement.style.display = 'block';
        }
    }

    // ซ่อน equipment slot
    hideEquipmentSlot(slot) {
        const imgElement = document.getElementById(`equip-${slot}`);
        if (imgElement) {
            imgElement.style.display = 'none';
        }
        
        if (slot === 'pet') {
            document.getElementById('pet-container').style.display = 'none';
        }
    }

    // โหลดรูปภาพและ cache
    async loadImage(src) {
        if (this.imageCache.has(src)) {
            return this.imageCache.get(src);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(src, img);
                resolve(img);
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    // สร้างภาพ placeholder
    getPlaceholderDataUrl() {
        return 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="128" height="192" viewBox="0 0 128 192">
                <rect width="128" height="192" fill="#F0F0F0" stroke="#DDDDDD" stroke-width="2" rx="8"/>
                <circle cx="64" cy="60" r="20" fill="#CCCCCC"/>
                <rect x="44" y="85" width="40" height="60" fill="#CCCCCC" rx="4"/>
                <rect x="49" y="150" width="10" height="30" fill="#CCCCCC"/>
                <rect x="69" y="150" width="10" height="30" fill="#CCCCCC"/>
                <text x="64" y="200" text-anchor="middle" font-family="Arial" font-size="10" fill="#999999">
                    ใส่รูปที่นี่
                </text>
            </svg>
        `);
    }

    // อัพเดทข้อมูลตัวละคร
    updateCharacterInfo(userData) {
        const nameElement = document.getElementById('character-name');
        const coinsElement = document.getElementById('char-coins');
        const gamesElement = document.getElementById('char-games');

        if (nameElement) {
            nameElement.textContent = userData.displayName || 'ผู้เล่น';
        }

        if (coinsElement && userData.stats) {
            coinsElement.textContent = userData.stats.totalStars || 0;
        }

        if (gamesElement && userData.stats) {
            gamesElement.textContent = userData.stats.totalGames || 0;
        }
    }

    // ตั้งค่าปุ่ม emotion
    setupEmotionControls() {
        const emotionBtns = document.querySelectorAll('.emotion-btn');
        emotionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emotion = e.target.dataset.emotion;
                this.playEmotion(emotion);
            });
        });
    }

    // เล่น emotion animation
    playEmotion(emotion) {
        const characterContainer = document.getElementById('character-container');
        const emotionEffects = document.getElementById('emotion-effects');
        
        if (!characterContainer || !emotionEffects) return;

        // เคลียร์ effect เก่า
        characterContainer.className = 'character-container';
        emotionEffects.innerHTML = '';

        // เล่น animation ใหม่
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

        // เคลียร์หลัง 3 วินาที
        setTimeout(() => {
            characterContainer.className = 'character-container';
            emotionEffects.innerHTML = '';
            this.startIdleAnimation();
        }, 3000);
    }

    // Animation หายใจ
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

    // หยุด animation
    stopCurrentAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    // ใส่อุปกรณ์ใหม่
    async equipItem(category, itemId) {
        if (!this.currentCharacter) return { success: false, message: 'ไม่พบข้อมูลตัวละคร' };

        const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (!user) return { success: false, message: 'ไม่พบข้อมูลผู้เล่น' };

        const itemData = this.equipmentData[category] ? this.equipmentData[category][itemId] : null;
        if (!itemData) return { success: false, message: 'ไม่พบอุปกรณ์นี้' };

        // ตรวจสอบเพศ
        const userGender = user.character.gender;
        if (itemData.gender !== 'both' && itemData.gender !== userGender) {
            return { success: false, message: 'อุปกรณ์นี้ไม่เหมาะกับเพศของคุณ' };
        }

        // ตรวจสอบเงิน
        if (itemData.price > 0 && user.stats.totalStars < itemData.price) {
            return { success: false, message: 'เงินไม่พอ' };
        }

        // ใส่อุปกรณ์
        if (!user.character.equipment) {
            user.character.equipment = {};
        }

        user.character.equipment[category] = itemId;

        // หักเงิน
        if (itemData.price > 0) {
            user.stats.totalStars -= itemData.price;
        }

        // บันทึกข้อมูล
        window.gameAuth.saveCurrentUser();

        // อัพเดทการแสดงผล
        await this.loadEquipmentItem(category, itemId);
        this.updateCharacterInfo(user);

        return { success: true, message: `ใส่ ${itemData.name} เรียบร้อย!` };
    }

    // ถอดอุปกรณ์
    unequipItem(category) {
        if (!this.currentCharacter) return false;

        const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (!user || !user.character.equipment) return false;

        user.character.equipment[category] = null;
        window.gameAuth.saveCurrentUser();
        
        this.hideEquipmentSlot(category);
        return true;
    }

    // แสดง/ซ่อน loading
    showLoading(show) {
        const loadingElement = document.getElementById('character-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    // แสดง error
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

    // ดึงข้อมูลอุปกรณ์ทั้งหมด
    getAllEquipmentData() {
        return this.equipmentData;
    }

    // ดึงข้อมูลอุปกรณ์ที่ใส่อยู่
    getCurrentEquipment() {
        return this.currentCharacter ? this.currentCharacter.equipment : null;
    }

    // ตรวจสอบว่าซื้อได้หรือไม่
    canAfford(category, itemId) {
        const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (!user) return false;

        const itemData = this.equipmentData[category] ? this.equipmentData[category][itemId] : null;
        if (!itemData) return false;

        return user.stats.totalStars >= itemData.price;
    }

    // เพิ่ม CSS Styles
    addCharacterStyles() {
        if (document.getElementById('image-character-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'image-character-styles';
        style.textContent = `
            #image-character-container {
                width: 100%;
                height: 500px;
                position: relative;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                margin-bottom: 30px;
            }

            .character-scene {
                width: 100%;
                height: 100%;
                position: relative;
                background: linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%);
            }

            .scene-background {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1;
            }

            .sky-layer {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 70%;
                background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #98FB98 100%);
            }

            .ground-layer {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 30%;
                background: linear-gradient(to bottom, #98FB98 0%, #90EE90 50%, #7CFC00 100%);
            }

            .environment-objects {
                position: absolute;
                width: 100%;
                height: 100%;
            }

            .env-object {
                position: absolute;
                font-size: 2rem;
                z-index: 2;
            }

            .env-object.tree {
                bottom: 25%;
                left: 10%;
                font-size: 3rem;
            }

            .env-object.tree::before {
                content: '🌳';
            }

            .env-object.bench {
                bottom: 30%;
                right: 20%;
                font-size: 2rem;
            }

            .env-object.bench::before {
                content: '🪑';
            }

            .env-object.flowers {
                bottom: 28%;
                right: 50%;
                font-size: 1.5rem;
            }

            .env-object.flowers::before {
                content: '🌸🌼🌻';
            }

            .character-display-area {
                position: absolute;
                bottom: 20%;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10;
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
                background: rgba(0,0,0,0.3);
                border-radius: 50%;
                animation: shadowPulse 3s ease-in-out infinite;
            }

            .character-layer {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }

            .base-layer { z-index: 1; }
            .shoes-layer { z-index: 2; }
            .body-layer { z-index: 3; }
            .accessory-layer { z-index: 4; }
            .head-layer { z-index: 5; }
            .face-layer { z-index: 6; }
            .weapon-layer { z-index: 7; }
            .effects-layer { z-index: 8; }

            .character-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
                image-rendering: pixelated; /* สำหรับภาพ pixel art */
                display: none;
            }

            .character-image.base-image {
                display: block;
            }

            .equipment-image {
                transition: all 0.3s ease;
            }

            .pet-container {
                position: absolute;
                bottom: -20px;
                right: -60px;
                display: none;
                z-index: 5;
            }

            .pet-image {
                width: 64px;
                height: 64px;
                object-fit: contain;
                animation: petFloat 3s ease-in-out infinite;
            }

            .character-info {
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(255,255,255,0.95);
                border-radius: 15px;
                padding: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 15;
                min-width: 200px;
                backdrop-filter: blur(10px);
            }

            .character-nameplate {
                text-align: center;
                margin-bottom: 12px;
                border-bottom: 2px solid #E8E8E8;
                padding-bottom: 8px;
            }

            .character-nameplate h3 {
                margin: 0;
                font-size: 1.3rem;
                color: #2C3E50;
                font-weight: bold;
            }

            .character-level {
                font-size: 0.9rem;
                color: #7F8C8D;
                margin-top: 4px;
            }

            .character-stats {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .stat-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.95rem;
            }

            .stat-icon {
                font-size: 1.2rem;
                min-width: 24px;
            }

            .stat-label {
                color: #34495E;
                min-width: 50px;
            }

            .stat-value {
                font-weight: bold;
                color: #E67E22;
                margin-left: auto;
            }

            .emotion-controls {
                position: absolute;
                bottom: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
                z-index: 15;
            }

            .emotion-btn {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: 3px solid #3498DB;
                background: rgba(255,255,255,0.95);
                font-size: 1.4rem;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                backdrop-filter: blur(10px);
            }

            .emotion-btn:hover {
                transform: scale(1.15);
                background: #3498DB;
                color: white;
                box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
            }

            .emotion-btn:active {
                transform: scale(0.95);
            }

            .loading-indicator {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: none;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                z-index: 20;
                background: rgba(255,255,255,0.95);
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #E8E8E8;
                border-top: 4px solid #3498DB;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .loading-indicator p {
                margin: 0;
                color: #34495E;
                font-size: 1.1rem;
                font-weight: 500;
            }

            .character-error {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                background: rgba(255,255,255,0.95);
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 20;
            }

            .character-error h3 {
                margin: 0 0 15px 0;
                color: #E74C3C;
                font-size: 1.5rem;
            }

            .character-error p {
                margin: 0 0 20px 0;
                color: #7F8C8D;
                font-size: 1rem;
            }

            .retry-btn {
                background: #3498DB;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.3s ease;
            }

            .retry-btn:hover {
                background: #2980B9;
            }

            /* Character Animations */
            .bounce-animation {
                animation: happyBounce 0.6s ease infinite;
            }

            .wave-animation {
                animation: waveMotion 1s ease-in-out 3;
            }

            .think-animation {
                animation: thinkSway 2s ease-in-out infinite;
            }

            .love-animation {
                animation: loveFloat 1s ease-in-out infinite;
            }

            /* Effects */
            .emotion-effects {
                position: absolute;
                top: -40px;
                left: 50%;
                transform: translateX(-50%);
                pointer-events: none;
                z-index: 10;
            }

            .effect-hearts, .effect-sparkles, .effect-thought, .effect-love {
                font-size: 1.2rem;
                animation: effectFloat 2s ease-in-out infinite;
                text-align: center;
            }

            .effect-love {
                animation: effectFloat 2s ease-in-out infinite, effectGlow 1s ease-in-out infinite;
            }

            /* Keyframe Animations */
            @keyframes shadowPulse {
                0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.3; }
                50% { transform: translateX(-50%) scale(1.2); opacity: 0.5; }
            }

            @keyframes petFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }

            @keyframes happyBounce {
                0%, 100% { transform: translateY(0px) scale(1); }
                25% { transform: translateY(-12px) scale(1.05); }
                75% { transform: translateY(-6px) scale(1.02); }
            }

            @keyframes waveMotion {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-8deg); }
                75% { transform: rotate(8deg); }
            }

            @keyframes thinkSway {
                0%, 100% { transform: translateX(0px); }
                50% { transform: translateX(4px); }
            }

            @keyframes loveFloat {
                0%, 100% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(-8px) scale(1.03); }
            }

            @keyframes effectFloat {
                0%, 100% { transform: translateX(-50%) translateY(0px); opacity: 1; }
                50% { transform: translateX(-50%) translateY(-20px); opacity: 0.8; }
            }

            @keyframes effectGlow {
                0%, 100% { filter: drop-shadow(0 0 5px rgba(255,182,193,0.8)); }
                50% { filter: drop-shadow(0 0 15px rgba(255,182,193,1)); }
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                #image-character-container {
                    height: 400px;
                }

                .character-info {
                    top: 10px;
                    left: 10px;
                    padding: 12px;
                    min-width: 180px;
                }

                .emotion-controls {
                    bottom: 10px;
                    right: 10px;
                    gap: 8px;
                }

                .emotion-btn {
                    width: 45px;
                    height: 45px;
                    font-size: 1.2rem;
                }

                .character-container {
                    width: 100px;
                    height: 150px;
                }

                .pet-image {
                    width: 50px;
                    height: 50px;
                }
            }

            /* Image Loading States */
            .character-image {
                transition: opacity 0.3s ease;
            }

            .character-image:not([src=""]) {
                opacity: 1;
            }

            .character-image[src=""] {
                opacity: 0;
            }

            /* Equipment Hover Effects */
            .equipment-image:hover {
                filter: drop-shadow(0 0 10px rgba(255,215,0,0.8));
                transform: scale(1.02);
            }

            /* High Quality Image Rendering */
            .character-image {
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }

            /* สำหรับภาพคุณภาพสูง */
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
                .character-image {
                    image-rendering: auto;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // ทำลาย character system
    destroy() {
        this.stopCurrentAnimation();
        
        const container = document.getElementById('image-character-container');
        if (container) {
            container.remove();
        }

        const styles = document.getElementById('image-character-styles');
        if (styles) {
            styles.remove();
        }

        // เคลียร์ image cache
        this.imageCache.clear();
    }
}

// สร้าง instance ใหม่
window.characterSystem = new ImageCharacterSystem();
