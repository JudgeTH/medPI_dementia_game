/* ========================================
   8-bit Character System for Elderly Game
   ======================================== */

class CharacterSystem {
    constructor() {
        this.defaultCharacters = {
            male: {
                base: '👴',
                skin: '#FDBCB4',
                hair: '#CCCCCC',
                clothes: {
                    shirt: '👕',
                    pants: '👖',
                    shoes: '👞'
                },
                accessories: {
                    hat: null,
                    glasses: null,
                    pet: null
                },
                animation: 'idle'
            },
            female: {
                base: '👵',
                skin: '#FDBCB4',
                hair: '#CCCCCC', 
                clothes: {
                    shirt: '👚',
                    pants: '👖',
                    shoes: '👠'
                },
                accessories: {
                    hat: null,
                    glasses: null,
                    pet: null
                },
                animation: 'idle'
            }
        };

        this.animations = ['idle', 'happy', 'thinking', 'celebrating'];
        this.currentAnimation = 'idle';
        this.animationInterval = null;
        
        this.init();
    }

    init() {
        this.setupCharacterContainer();
        this.startIdleAnimation();
    }

    // สร้างพื้นที่แสดงตัวละคร
    setupCharacterContainer() {
        const existingContainer = document.getElementById('character-display-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = 'character-display-container';
        container.innerHTML = `
            <div class="character-main-display">
                <div class="character-background">
                    <div class="background-elements">
                        <div class="cloud cloud-1">☁️</div>
                        <div class="cloud cloud-2">☁️</div>
                        <div class="sun">☀️</div>
                        <div class="grass">🌱🌱🌱🌱🌱</div>
                    </div>
                </div>
                
                <div class="character-container">
                    <div class="character-sprite" id="main-character">
                        <div class="character-body">
                            <div class="character-head">
                                <div class="character-face"></div>
                                <div class="character-accessories"></div>
                            </div>
                            <div class="character-torso">
                                <div class="character-clothes"></div>
                            </div>
                            <div class="character-legs"></div>
                        </div>
                        <div class="character-shadow"></div>
                    </div>
                    
                    <!-- Pet ถ้ามี -->
                    <div class="character-pet" id="character-pet" style="display: none;">
                        <div class="pet-sprite"></div>
                    </div>
                </div>

                <!-- Status Display -->
                <div class="character-status">
                    <div class="status-item">
                        <span class="status-icon">⭐</span>
                        <span class="status-value" id="total-coins">0</span>
                    </div>
                    <div class="status-item">
                        <span class="status-icon">🎮</span>
                        <span class="status-value" id="games-played">0</span>
                    </div>
                </div>
            </div>
        `;

        // เพิ่ม CSS สำหรับตัวละคร
        this.addCharacterStyles();
        
        return container;
    }

    // โหลดตัวละครจากข้อมูลผู้เล่น
    loadCharacter(userData) {
        if (!userData || !userData.character) {
            console.warn('No character data found');
            return;
        }

        const character = userData.character;
        const characterElement = document.getElementById('main-character');
        
        if (!characterElement) {
            console.warn('Character element not found');
            return;
        }

        // อัพเดทหน้าตัวละคร
        const faceElement = characterElement.querySelector('.character-face');
        if (faceElement) {
            faceElement.textContent = character.base || character.emoji;
        }

        // อัพเดทเสื้อผ้า
        const clothesElement = characterElement.querySelector('.character-clothes');
        if (clothesElement && character.clothes) {
            clothesElement.innerHTML = `
                <span class="clothing-item shirt">${character.clothes.shirt}</span>
            `;
        }

        // อัพเดทอุปกรณ์เสริม
        const accessoriesElement = characterElement.querySelector('.character-accessories');
        if (accessoriesElement && character.accessories) {
            let accessoriesHtml = '';
            
            if (character.accessories.hat) {
                accessoriesHtml += `<span class="accessory hat">${character.accessories.hat}</span>`;
            }
            
            if (character.accessories.glasses) {
                accessoriesHtml += `<span class="accessory glasses">${character.accessories.glasses}</span>`;
            }
            
            accessoriesElement.innerHTML = accessoriesHtml;
        }

        // อัพเดทสัตว์เลี้ยง
        if (character.accessories && character.accessories.pet) {
            this.showPet(character.accessories.pet);
        }

        // อัพเดทสถิติ
        this.updateCharacterStats(userData.stats);
    }

    // แสดงสัตว์เลี้ยง
    showPet(petEmoji) {
        const petElement = document.getElementById('character-pet');
        const petSprite = petElement.querySelector('.pet-sprite');
        
        if (petSprite) {
            petSprite.textContent = petEmoji;
            petElement.style.display = 'block';
            
            // เพิ่ม animation สำหรับสัตว์เลี้ยง
            this.startPetAnimation();
        }
    }

    // อัพเดทสถิติตัวละคร
    updateCharacterStats(stats) {
        const coinsElement = document.getElementById('total-coins');
        const gamesElement = document.getElementById('games-played');
        
        if (coinsElement && stats) {
            coinsElement.textContent = stats.totalStars || 0;
        }
        
        if (gamesElement && stats) {
            gamesElement.textContent = stats.totalGames || 0;
        }
    }

    // เริ่ม animation แบบ idle
    startIdleAnimation() {
        const character = document.getElementById('main-character');
        if (!character) return;

        // Animation หายใจ
        this.animationInterval = setInterval(() => {
            character.style.transform = 'translateY(-2px)';
            setTimeout(() => {
                character.style.transform = 'translateY(0px)';
            }, 1000);
        }, 3000);
    }

    // Animation เมื่อดีใจ
    playHappyAnimation() {
        const character = document.getElementById('main-character');
        if (!character) return;

        this.stopCurrentAnimation();
        
        character.classList.add('happy-animation');
        
        // เล่น animation 2 วินาที
        setTimeout(() => {
            character.classList.remove('happy-animation');
            this.startIdleAnimation();
        }, 2000);
    }

    // Animation เมื่อคิด
    playThinkingAnimation() {
        const character = document.getElementById('main-character');
        if (!character) return;

        this.stopCurrentAnimation();
        
        character.classList.add('thinking-animation');
        
        setTimeout(() => {
            character.classList.remove('thinking-animation');
            this.startIdleAnimation();
        }, 3000);
    }

    // หยุด animation ปัจจุบัน
    stopCurrentAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    // Animation สำหรับสัตว์เลี้ยง
    startPetAnimation() {
        const pet = document.getElementById('character-pet');
        if (!pet) return;

        setInterval(() => {
            pet.style.transform = 'translateX(-5px)';
            setTimeout(() => {
                pet.style.transform = 'translateX(5px)';
                setTimeout(() => {
                    pet.style.transform = 'translateX(0px)';
                }, 500);
            }, 500);
        }, 4000);
    }

    // เพิ่มไอเทมใหม่ให้ตัวละคร
    addAccessory(type, item) {
        const user = window.gameAuth.getCurrentUser();
        if (!user) return false;

        if (!user.character.accessories) {
            user.character.accessories = {};
        }

        user.character.accessories[type] = item;
        
        // บันทึกการเปลี่ยนแปลง
        window.gameAuth.saveCurrentUser();
        
        // อัพเดทการแสดงผล
        this.loadCharacter(user);
        
        return true;
    }

    // เปลี่ยนเสื้อผ้า
    changeClothing(type, item) {
        const user = window.gameAuth.getCurrentUser();
        if (!user) return false;

        if (!user.character.clothes) {
            user.character.clothes = {};
        }

        user.character.clothes[type] = item;
        
        // บันทึกการเปลี่ยนแปลง
        window.gameAuth.saveCurrentUser();
        
        // อัพเดทการแสดงผล
        this.loadCharacter(user);
        
        return true;
    }

    // เพิ่ม CSS styles
    addCharacterStyles() {
        if (document.getElementById('character-system-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'character-system-styles';
        style.textContent = `
            .character-main-display {
                position: relative;
                width: 100%;
                height: 400px;
                background: linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%);
                border-radius: 20px;
                overflow: hidden;
                margin-bottom: 30px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }

            .character-background {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1;
            }

            .background-elements {
                position: relative;
                width: 100%;
                height: 100%;
            }

            .cloud {
                position: absolute;
                font-size: 2rem;
                animation: float 6s ease-in-out infinite;
            }

            .cloud-1 {
                top: 20px;
                left: 20%;
                animation-delay: 0s;
            }

            .cloud-2 {
                top: 40px;
                right: 15%;
                animation-delay: 3s;
            }

            .sun {
                position: absolute;
                top: 30px;
                right: 30px;
                font-size: 2.5rem;
                animation: rotate 20s linear infinite;
            }

            .grass {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                font-size: 1.5rem;
                text-align: center;
                padding: 10px;
            }

            .character-container {
                position: absolute;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 2;
            }

            .character-sprite {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                transition: all 0.3s ease;
            }

            .character-body {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }

            .character-head {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .character-face {
                font-size: 4rem;
                line-height: 1;
                filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
            }

            .character-accessories {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .accessory {
                position: absolute;
                font-size: 2rem;
            }

            .accessory.hat {
                top: -30px;
            }

            .accessory.glasses {
                top: 5px;
            }

            .character-clothes {
                display: flex;
                gap: 5px;
                font-size: 2.5rem;
            }

            .character-shadow {
                width: 60px;
                height: 20px;
                background: rgba(0,0,0,0.3);
                border-radius: 50%;
                margin-top: 10px;
                animation: shadowPulse 3s ease-in-out infinite;
            }

            .character-pet {
                position: absolute;
                bottom: -20px;
                right: -50px;
                font-size: 2rem;
                animation: petBounce 2s ease-in-out infinite;
            }

            .character-status {
                position: absolute;
                top: 20px;
                left: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 3;
            }

            .status-item {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(255,255,255,0.9);
                padding: 8px 15px;
                border-radius: 25px;
                font-size: 1.2rem;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }

            .status-icon {
                font-size: 1.5rem;
            }

            /* Animations */
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes shadowPulse {
                0%, 100% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.1); opacity: 0.5; }
            }

            @keyframes petBounce {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
            }

            .happy-animation {
                animation: bounce 0.5s ease infinite;
            }

            .thinking-animation .character-face::after {
                content: "💭";
                position: absolute;
                top: -30px;
                right: -20px;
                font-size: 1.5rem;
                animation: fadeInOut 1s ease infinite;
            }

            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
            }

            @keyframes fadeInOut {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
    }

    // ทำลาย character system
    destroy() {
        this.stopCurrentAnimation();
        
        const container = document.getElementById('character-display-container');
        if (container) {
            container.remove();
        }
    }
}

// สร้าง instance
window.characterSystem = new CharacterSystem();
