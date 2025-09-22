/* ========================================
   Ragnarok-style Character System for Elderly Game
   ======================================== */

class RagnarokCharacterSystem {
    constructor() {
        this.spriteSize = 64; // ขนาด sprite พื้นฐาน
        this.animationFrame = 0;
        this.animationDirection = 1; // 1 = ไปข้างหน้า, -1 = ย้อนกลับ
        
        // ข้อมูลตัวละครพื้นฐาน
        this.characterData = {
            male: {
                base: {
                    skin: '#FDBCB4',
                    hair: '#CCCCCC',
                    facialHair: '#CCCCCC',
                    eyes: '#4A90E2'
                },
                defaultEquipment: {
                    head: null,
                    face: null,
                    body: 'elderlyShirt',
                    weapon: 'walkingStick',
                    shield: null,
                    shoes: 'comfortShoes',
                    accessory: 'glasses'
                }
            },
            female: {
                base: {
                    skin: '#FDBCB4',
                    hair: '#CCCCCC',
                    eyes: '#4A90E2'
                },
                defaultEquipment: {
                    head: null,
                    face: null, 
                    body: 'elderlyDress',
                    weapon: null,
                    shield: 'handbag',
                    shoes: 'comfortShoes',
                    accessory: 'necklace'
                }
            }
        };

        // อุปกรณ์ที่มีในเกม
        this.equipment = {
            head: {
                'warmHat': { name: 'หมวกไหมพรม', sprite: '🧢', color: '#8B4513', price: 50 },
                'sunHat': { name: 'หมวกกันแดด', sprite: '👒', color: '#DEB887', price: 30 },
                'beret': { name: 'หมวกเบเร่', sprite: '🎩', color: '#2F4F4F', price: 80 }
            },
            face: {
                'glasses': { name: 'แว่นตา', sprite: '👓', color: '#000000', price: 40 },
                'sunglasses': { name: 'แว่นกันแดด', sprite: '🕶️', color: '#000000', price: 60 },
                'readingGlasses': { name: 'แว่นอ่านหนังสือ', sprite: '👓', color: '#8B4513', price: 35 }
            },
            body: {
                'elderlyShirt': { name: 'เสื้อผู้สูงอายุ', sprite: '👔', color: '#4A90E2', price: 0 },
                'elderlyDress': { name: 'ชุดผู้สูงอายุ', sprite: '👗', color: '#9B59B6', price: 0 },
                'warmSweater': { name: 'เสื้อกันหนาว', sprite: '🧥', color: '#8B4513', price: 70 },
                'comfortShirt': { name: 'เสื้อสบาย', sprite: '👕', color: '#2ECC71', price: 45 }
            },
            weapon: {
                'walkingStick': { name: 'ไม้เท้า', sprite: '🦯', color: '#8B4513', price: 0 },
                'umbrella': { name: 'ร่ม', sprite: '☂️', color: '#E74C3C', price: 25 }
            },
            shield: {
                'handbag': { name: 'กระเป๋าถือ', sprite: '👜', color: '#8B4513', price: 0 },
                'shoppingBag': { name: 'ถุงช้อปปิ้ง', sprite: '🛍️', color: '#E91E63', price: 20 }
            },
            shoes: {
                'comfortShoes': { name: 'รองเท้าสบาย', sprite: '👟', color: '#34495E', price: 0 },
                'slippers': { name: 'รองเท้าแตะ', sprite: '🩴', color: '#E67E22', price: 15 }
            },
            accessory: {
                'necklace': { name: 'สร้อยคอ', sprite: '📿', color: '#F1C40F', price: 60 },
                'watch': { name: 'นาฬิกา', sprite: '⌚', color: '#34495E', price: 90 }
            },
            pet: {
                'cat': { name: 'แมวน้อย', sprite: '🐱', color: '#FF6B6B', price: 150, animation: true },
                'dog': { name: 'สุนัขน้อย', sprite: '🐶', color: '#4ECDC4', price: 150, animation: true },
                'bird': { name: 'นกน้อย', sprite: '🐦', color: '#45B7D1', price: 120, animation: true }
            }
        };

        this.currentCharacter = null;
        this.animationInterval = null;
        
        this.init();
    }

    init() {
        this.setupCharacterContainer();
        this.addCharacterStyles();
    }

    // สร้างพื้นที่แสดงตัวละคร
    setupCharacterContainer() {
        const container = document.createElement('div');
        container.id = 'ragnarok-character-container';
        container.innerHTML = `
            <div class="character-scene">
                <!-- Background -->
                <div class="character-background">
                    <div class="sky-gradient"></div>
                    <div class="ground"></div>
                    <div class="decorations">
                        <div class="decoration tree">🌳</div>
                        <div class="decoration flowers">🌸🌼</div>
                        <div class="decoration bench">🪑</div>
                    </div>
                </div>

                <!-- Character Display -->
                <div class="character-stage">
                    <div class="character-sprite-container" id="character-sprite">
                        <div class="character-shadow"></div>
                        
                        <!-- Character Layers (เรียงตามลำดับ Z-index) -->
                        <div class="character-layer base-layer">
                            <div class="character-body" id="char-body"></div>
                            <div class="character-head" id="char-head"></div>
                        </div>
                        
                        <div class="character-layer equipment-layer">
                            <div class="equipment-slot body-slot" id="equip-body"></div>
                            <div class="equipment-slot head-slot" id="equip-head"></div>
                            <div class="equipment-slot face-slot" id="equip-face"></div>
                            <div class="equipment-slot weapon-slot" id="equip-weapon"></div>
                            <div class="equipment-slot shield-slot" id="equip-shield"></div>
                            <div class="equipment-slot shoes-slot" id="equip-shoes"></div>
                            <div class="equipment-slot accessory-slot" id="equip-accessory"></div>
                        </div>
                        
                        <!-- Effects Layer -->
                        <div class="character-layer effects-layer">
                            <div class="status-effects" id="status-effects"></div>
                        </div>
                    </div>
                    
                    <!-- Pet -->
                    <div class="pet-container" id="pet-container">
                        <div class="pet-sprite" id="pet-sprite"></div>
                    </div>
                </div>

                <!-- Character Info Panel -->
                <div class="character-info-panel">
                    <div class="character-name" id="character-name">ผู้เล่น</div>
                    <div class="character-stats">
                        <div class="stat-bar">
                            <span class="stat-icon">⭐</span>
                            <span class="stat-label">เหรียญ:</span>
                            <span class="stat-value" id="char-coins">0</span>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-icon">🎮</span>
                            <span class="stat-label">เกมที่เล่น:</span>
                            <span class="stat-value" id="char-games">0</span>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="character-actions">
                    <button class="action-btn emotion-btn" data-action="happy">😊</button>
                    <button class="action-btn emotion-btn" data-action="wave">👋</button>
                    <button class="action-btn emotion-btn" data-action="think">🤔</button>
                    <button class="action-btn emotion-btn" data-action="celebrate">🎉</button>
                </div>
            </div>
        `;

        return container;
    }

    // โหลดตัวละครจากข้อมูลผู้เล่น
    loadCharacter(userData) {
        if (!userData || !userData.character) {
            console.warn('No character data found');
            return;
        }

        this.currentCharacter = userData.character;
        
        // ตั้งค่าข้อมูลพื้นฐาน
        const isFirstTime = !userData.character.equipment;
        const gender = userData.character.gender || 'male';
        
        if (isFirstTime) {
            // ครั้งแรก - ใช้อุปกรณ์เริ่มต้น
            userData.character.equipment = { ...this.characterData[gender].defaultEquipment };
            userData.character.baseStats = { ...this.characterData[gender].base };
            
            // บันทึกข้อมูล
            if (window.gameAuth) {
                window.gameAuth.saveCurrentUser();
            }
        }

        // อัพเดทการแสดงผล
        this.updateCharacterDisplay();
        this.updateCharacterInfo(userData);
        this.setupEmotionButtons();
        this.startIdleAnimation();
    }

    // อัพเดทการแสดงผลตัวละคร
    updateCharacterDisplay() {
        if (!this.currentCharacter) return;

        const gender = this.currentCharacter.gender || 'male';
        const equipment = this.currentCharacter.equipment || {};
        const baseStats = this.currentCharacter.baseStats || this.characterData[gender].base;

        // อัพเดทส่วนหัวและตัว
        this.updateCharacterBase(gender, baseStats);
        
        // อัพเดทอุปกรณ์แต่ละชิ้น
        Object.keys(equipment).forEach(slot => {
            if (equipment[slot]) {
                this.updateEquipmentSlot(slot, equipment[slot]);
            }
        });

        // อัพเดทสัตว์เลี้ยง
        if (equipment.pet) {
            this.showPet(equipment.pet);
        }
    }

    // อัพเดทส่วนพื้นฐานของตัวละคร
    updateCharacterBase(gender, baseStats) {
        const headElement = document.getElementById('char-head');
        const bodyElement = document.getElementById('char-body');
        
        if (headElement) {
            // สร้างหน้าตัวละคร
            const faceHtml = gender === 'male' ? 
                `<div class="elderly-face male-face">
                    <div class="face-skin" style="background: ${baseStats.skin}"></div>
                    <div class="face-hair" style="color: ${baseStats.hair}">👴</div>
                    <div class="face-features">
                        <div class="wrinkles"></div>
                        <div class="smile"></div>
                    </div>
                </div>` :
                `<div class="elderly-face female-face">
                    <div class="face-skin" style="background: ${baseStats.skin}"></div>
                    <div class="face-hair" style="color: ${baseStats.hair}">👵</div>
                    <div class="face-features">
                        <div class="wrinkles"></div>
                        <div class="smile"></div>
                    </div>
                </div>`;
            
            headElement.innerHTML = faceHtml;
        }

        if (bodyElement) {
            // สร้างร่างกาย
            bodyElement.innerHTML = `
                <div class="elderly-body">
                    <div class="body-torso" style="background: ${baseStats.skin}"></div>
                    <div class="body-arms">
                        <div class="arm left-arm"></div>
                        <div class="arm right-arm"></div>
                    </div>
                    <div class="body-legs">
                        <div class="leg left-leg"></div>
                        <div class="leg right-leg"></div>
                    </div>
                </div>
            `;
        }
    }

    // อัพเดทอุปกรณ์ในแต่ละ slot
    updateEquipmentSlot(slotName, equipmentId) {
        const slotElement = document.getElementById(`equip-${slotName}`);
        if (!slotElement) return;

        // หาข้อมูลอุปกรณ์
        let equipmentData = null;
        Object.keys(this.equipment).forEach(category => {
            if (this.equipment[category][equipmentId]) {
                equipmentData = this.equipment[category][equipmentId];
            }
        });

        if (equipmentData) {
            slotElement.innerHTML = `
                <div class="equipment-sprite ${slotName}-equipment" 
                     style="color: ${equipmentData.color}; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));">
                    ${equipmentData.sprite}
                </div>
            `;
            slotElement.style.display = 'block';
        } else {
            slotElement.style.display = 'none';
        }
    }

    // แสดงสัตว์เลี้ยง
    showPet(petId) {
        const petContainer = document.getElementById('pet-container');
        const petSprite = document.getElementById('pet-sprite');
        
        if (!petContainer || !petSprite) return;

        const petData = this.equipment.pet[petId];
        if (petData) {
            petSprite.innerHTML = `
                <div class="pet-character" style="color: ${petData.color};">
                    ${petData.sprite}
                </div>
            `;
            petContainer.style.display = 'block';
            
            if (petData.animation) {
                this.startPetAnimation();
            }
        } else {
            petContainer.style.display = 'none';
        }
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
    setupEmotionButtons() {
        const emotionBtns = document.querySelectorAll('.emotion-btn');
        emotionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.playEmotionAnimation(action);
            });
        });
    }

    // เล่น animation emotion
    playEmotionAnimation(emotion) {
        const characterSprite = document.getElementById('character-sprite');
        const statusEffects = document.getElementById('status-effects');
        
        if (!characterSprite || !statusEffects) return;

        // เคลียร์ animation เก่า
        characterSprite.className = 'character-sprite-container';
        statusEffects.innerHTML = '';

        // เล่น animation ใหม่
        switch (emotion) {
            case 'happy':
                characterSprite.classList.add('happy-bounce');
                statusEffects.innerHTML = '<div class="effect-hearts">💕💕💕</div>';
                break;
            case 'wave':
                characterSprite.classList.add('wave-animation');
                statusEffects.innerHTML = '<div class="effect-sparkles">✨✨✨</div>';
                break;
            case 'think':
                characterSprite.classList.add('think-animation');
                statusEffects.innerHTML = '<div class="effect-thought">💭</div>';
                break;
            case 'celebrate':
                characterSprite.classList.add('celebrate-animation');
                statusEffects.innerHTML = '<div class="effect-celebration">🎉🎊🎉</div>';
                break;
        }

        // เคลียร์ effect หลัง 3 วินาที
        setTimeout(() => {
            characterSprite.className = 'character-sprite-container';
            statusEffects.innerHTML = '';
            this.startIdleAnimation();
        }, 3000);
    }

    // Animation หายใจ
    startIdleAnimation() {
        const characterSprite = document.getElementById('character-sprite');
        if (!characterSprite) return;

        this.stopCurrentAnimation();

        this.animationInterval = setInterval(() => {
            this.animationFrame += this.animationDirection * 0.5;
            
            if (this.animationFrame >= 5) {
                this.animationDirection = -1;
            } else if (this.animationFrame <= 0) {
                this.animationDirection = 1;
            }

            characterSprite.style.transform = `translateY(${this.animationFrame}px)`;
        }, 100);
    }

    // Animation สำหรับสัตว์เลี้ยง
    startPetAnimation() {
        const petContainer = document.getElementById('pet-container');
        if (!petContainer) return;

        setInterval(() => {
            petContainer.style.transform = 'translateX(-3px)';
            setTimeout(() => {
                petContainer.style.transform = 'translateX(3px)';
                setTimeout(() => {
                    petContainer.style.transform = 'translateX(0px)';
                }, 200);
            }, 200);
        }, 3000);
    }

    // หยุด animation
    stopCurrentAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    // เพิ่มอุปกรณ์ใหม่
    equipItem(category, itemId) {
        if (!this.currentCharacter) return false;

        const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (!user) return false;

        // ตรวจสอบว่ามีเงินพอหรือไม่
        const itemData = this.equipment[category] ? this.equipment[category][itemId] : null;
        if (!itemData) return false;

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
        this.loadCharacter(user);

        return { success: true, message: `ใส่ ${itemData.name} เรียบร้อย!` };
    }

    // ถอดอุปกรณ์
    unequipItem(category) {
        if (!this.currentCharacter) return false;

        const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (!user || !user.character.equipment) return false;

        user.character.equipment[category] = null;
        window.gameAuth.saveCurrentUser();
        this.loadCharacter(user);

        return true;
    }

    // เพิ่ม CSS Styles
    addCharacterStyles() {
        if (document.getElementById('ragnarok-character-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ragnarok-character-styles';
        style.textContent = `
            #ragnarok-character-container {
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
            }

            .character-background {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1;
            }

            .sky-gradient {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 70%;
                background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #98FB98 100%);
            }

            .ground {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 30%;
                background: linear-gradient(to bottom, #98FB98 0%, #90EE90 50%, #7CFC00 100%);
            }

            .decorations {
                position: absolute;
                width: 100%;
                height: 100%;
            }

            .decoration {
                position: absolute;
                font-size: 2rem;
                z-index: 2;
            }

            .decoration.tree {
                bottom: 20%;
                left: 15%;
                font-size: 3rem;
            }

            .decoration.flowers {
                bottom: 25%;
                right: 20%;
                font-size: 1.5rem;
            }

            .decoration.bench {
                bottom: 22%;
                right: 50%;
                font-size: 2rem;
            }

            .character-stage {
                position: absolute;
                bottom: 25%;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10;
            }

            .character-sprite-container {
                position: relative;
                width: 80px;
                height: 120px;
                transition: all 0.3s ease;
            }

            .character-shadow {
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 50px;
                height: 15px;
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

            .base-layer {
                z-index: 1;
            }

            .equipment-layer {
                z-index: 2;
            }

            .effects-layer {
                z-index: 3;
            }

            .character-head {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 40px;
            }

            .character-body {
                position: absolute;
                top: 35px;
                left: 50%;
                transform: translateX(-50%);
                width: 50px;
                height: 70px;
            }

            .elderly-face {
                width: 100%;
                height: 100%;
                position: relative;
                border-radius: 50%;
                overflow: hidden;
            }

            .face-skin {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                position: relative;
            }

            .face-hair {
                position: absolute;
                top: -5px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 2.5rem;
                line-height: 1;
            }

            .face-features {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            .elderly-body {
                width: 100%;
                height: 100%;
                position: relative;
            }

            .body-torso {
                width: 30px;
                height: 45px;
                border-radius: 15px;
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
            }

            .body-arms, .body-legs {
                position: absolute;
                width: 100%;
            }

            .body-arms {
                top: 10px;
            }

            .body-legs {
                bottom: 0;
            }

            .arm, .leg {
                width: 8px;
                height: 25px;
                background: #FDBCB4;
                border-radius: 4px;
                position: absolute;
            }

            .left-arm {
                left: 15px;
            }

            .right-arm {
                right: 15px;
            }

            .left-leg, .right-leg {
                height: 30px;
                bottom: 0;
            }

            .left-leg {
                left: 18px;
            }

            .right-leg {
                right: 18px;
            }

            .equipment-slot {
                position: absolute;
                display: none;
            }

            .head-slot {
                top: -5px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 4;
            }

            .face-slot {
                top: 5px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 5;
            }

            .body-slot {
                top: 35px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 3;
            }

            .weapon-slot {
                top: 45px;
                right: -15px;
                z-index: 2;
            }

            .shield-slot {
                top: 45px;
                left: -15px;
                z-index: 2;
            }

            .shoes-slot {
                bottom: 5px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 2;
            }

            .accessory-slot {
                top: 55px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 4;
            }

            .equipment-sprite {
                font-size: 1.5rem;
                line-height: 1;
                text-align: center;
            }

            .pet-container {
                position: absolute;
                bottom: -10px;
                right: -40px;
                display: none;
            }

            .pet-character {
                font-size: 2rem;
                animation: petBounce 2s ease-in-out infinite;
            }

            .character-info-panel {
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(255,255,255,0.95);
                border-radius: 15px;
                padding: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 15;
                min-width: 180px;
            }

            .character-name {
                font-size: 1.2rem;
                font-weight: bold;
                color: #2C3E50;
                margin-bottom: 10px;
                text-align: center;
            }

            .character-stats {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .stat-bar {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 0.9rem;
            }

            .stat-icon {
                font-size: 1.1rem;
            }

            .stat-value {
                font-weight: bold;
                color: #E67E22;
            }

            .character-actions {
                position: absolute;
                bottom: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
                z-index: 15;
            }

            .action-btn {
                width: 45px;
                height: 45px;
                border-radius: 50%;
                border: 3px solid #3498DB;
                background: rgba(255,255,255,0.9);
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            }

            .action-btn:hover {
                transform: scale(1.1);
                background: #3498DB;
                color: white;
                box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
            }

            .action-btn:active {
                transform: scale(0.95);
            }

            /* Status Effects */
            .status-effects {
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                pointer-events: none;
            }

            .effect-hearts, .effect-sparkles, .effect-thought, .effect-celebration {
                font-size: 1.5rem;
                animation: effectFloat 2s ease-in-out infinite;
            }

            /* Character Animations */
            .happy-bounce {
                animation: happyBounce 0.6s ease infinite;
            }

            .wave-animation {
                animation: waveMotion 1s ease-in-out 3;
            }

            .think-animation {
                animation: thinkSway 2s ease-in-out infinite;
            }

            .celebrate-animation {
                animation: celebrateJump 0.5s ease infinite;
            }

            /* Keyframe Animations */
            @keyframes shadowPulse {
                0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.3; }
                50% { transform: translateX(-50%) scale(1.1); opacity: 0.5; }
            }

            @keyframes petBounce {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
            }

            @keyframes effectFloat {
                0%, 100% { transform: translateX(-50%) translateY(0px); opacity: 1; }
                50% { transform: translateX(-50%) translateY(-15px); opacity: 0.7; }
            }

            @keyframes happyBounce {
                0%, 100% { transform: translateY(0px) scale(1); }
                25% { transform: translateY(-8px) scale(1.05); }
                75% { transform: translateY(-4px) scale(1.02); }
            }

            @keyframes waveMotion {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-10deg); }
                75% { transform: rotate(10deg); }
            }

            @keyframes thinkSway {
                0%, 100% { transform: translateX(0px); }
                50% { transform: translateX(3px); }
            }

            @keyframes celebrateJump {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-12px) rotate(5deg); }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                #ragnarok-character-container {
                    height: 400px;
                }

                .character-info-panel {
                    top: 10px;
                    left: 10px;
                    padding: 10px;
                    min-width: 150px;
                }

                .character-actions {
                    bottom: 10px;
                    right: 10px;
                    gap: 8px;
                }

                .action-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 1rem;
                }

                .decoration {
                    font-size: 1.5rem;
                }

                .decoration.tree {
                    font-size: 2rem;
                }
            }

            /* Equipment Glow Effects */
            .equipment-sprite {
                transition: all 0.3s ease;
            }

            .equipment-sprite:hover {
                transform: scale(1.1);
                filter: drop-shadow(0 0 8px rgba(255,215,0,0.8)) drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
            }

            /* Special Equipment Effects */
            .head-equipment {
                animation: gentleGlow 3s ease-in-out infinite;
            }

            .weapon-equipment {
                animation: weaponShine 4s ease-in-out infinite;
            }

            .pet-character {
                animation: petBounce 2s ease-in-out infinite, petGlow 5s ease-in-out infinite;
            }

            @keyframes gentleGlow {
                0%, 100% { filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3)); }
                50% { filter: drop-shadow(0 0 6px rgba(255,255,255,0.6)) drop-shadow(1px 1px 2px rgba(0,0,0,0.3)); }
            }

            @keyframes weaponShine {
                0%, 90%, 100% { filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3)); }
                95% { filter: drop-shadow(0 0 10px rgba(255,255,255,0.8)) drop-shadow(1px 1px 2px rgba(0,0,0,0.3)); }
            }

            @keyframes petGlow {
                0%, 100% { filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.2)); }
                50% { filter: drop-shadow(0 0 8px rgba(255,182,193,0.6)) drop-shadow(1px 1px 2px rgba(0,0,0,0.2)); }
            }

            /* Loading State */
            .character-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                font-size: 1.5rem;
                color: #7F8C8D;
            }

            .character-loading::after {
                content: '';
                width: 20px;
                height: 20px;
                border: 3px solid #BDC3C7;
                border-top: 3px solid #3498DB;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-left: 10px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
    }

    // ทำลาย character system
    destroy() {
        this.stopCurrentAnimation();
        
        const container = document.getElementById('ragnarok-character-container');
        if (container) {
            container.remove();
        }

        const styles = document.getElementById('ragnarok-character-styles');
        if (styles) {
            styles.remove();
        }
    }

    // ดึงข้อมูลอุปกรณ์ทั้งหมด
    getAllEquipment() {
        return this.equipment;
    }

    // ดึงข้อมูลอุปกรณ์ที่ใส่อยู่
    getCurrentEquipment() {
        return this.currentCharacter ? this.currentCharacter.equipment : null;
    }

    // ดึงราคาอุปกรณ์
    getItemPrice(category, itemId) {
        const item = this.equipment[category] ? this.equipment[category][itemId] : null;
        return item ? item.price : 0;
    }

    // ตรวจสอบว่าซื้อได้หรือไม่
    canAfford(category, itemId) {
        const user = window.gameAuth ? window.gameAuth.getCurrentUser() : null;
        if (!user) return false;

        const price = this.getItemPrice(category, itemId);
        return user.stats.totalStars >= price;
    }
}

// สร้าง instance ใหม่
window.characterSystem = new RagnarokCharacterSystem();
