// js/main.js
// ระบบโหลดทุกอย่างตามลำดับที่ถูกต้อง

(async function initApp() {
  console.log('🚀 Starting Elderly Cognitive Game...');

  // ========================================
  // STEP 1: โหลด items.js (ต้องมีก่อน)
  // ========================================
  await loadScript('/data/items.js');
  console.log('✅ Items loaded:', window.SHOP_ITEMS?.length || 0);

  // ========================================
  // STEP 2: โหลด Character System
  // ========================================
  await loadScript('/js/character-simple.js');
  console.log('✅ Character System ready');

  // ========================================
  // STEP 3: Setup Character Container
  // ========================================
  if (window.CharacterSystem) {
    const container = window.CharacterSystem.setupContainer();
    
    // หาที่วาง character
    const mountPoint = document.getElementById('character-mount-point') 
                    || document.querySelector('.character-area')
                    || document.querySelector('main')
                    || document.body;
    
    mountPoint.appendChild(container);
    console.log('✅ Character container mounted');

    // Setup event listeners
    window.CharacterSystem.setupEventListeners();

    // โหลดตัวละคร default
    const userId = localStorage.getItem('ecg_current_uid') || 'guest';
    const gender = localStorage.getItem('player_gender') || 'male';
    const displayName = localStorage.getItem('player_name') || 'ผู้เล่น';

    // ตั้งค่าเริ่มต้น
    window.CharacterSystem.currentUserId = userId;

    // โหลด default avatar
    const defaultAvatarId = gender === 'female' ? 'elderly_female_base' : 'elderly_male_base';
    
    const userData = {
      userId: userId,
      displayName: displayName,
      character: { gender: gender },
      stats: {
        totalStars: 0,
        totalGames: 0
      }
    };

    await window.CharacterSystem.loadCharacter(userData);
    console.log('✅ Default character loaded:', defaultAvatarId);

  } else {
    console.error('❌ CharacterSystem not available');
  }

})();

// ========================================
// HELPER: โหลด script แบบ async
// ========================================
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // เช็คว่าโหลดแล้วหรือยัง
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      console.log(`⏭️ Skip (already loaded): ${src}`);
      return resolve();
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false; // โหลดตามลำดับ
    
    script.onload = () => {
      console.log(`✅ Loaded: ${src}`);
      resolve();
    };
    
    script.onerror = () => {
      console.error(`❌ Failed: ${src}`);
      reject(new Error(`Failed to load ${src}`));
    };
    
    document.head.appendChild(script);
  });
}
