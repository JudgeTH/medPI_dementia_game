// js/pet.js
(function(){
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function el(tag, cls){ const x=document.createElement(tag); if(cls) x.className=cls; return x; }

  const PETS_BASE   = '/assets/pets/';   // โฟลเดอร์รูปสัตว์เลี้ยงของคุณ
  const STORAGE_KEY = 'currentPet';
  const DEFAULT_PET = 'dog_01.png';

  function resolveFile(idOrFile){
    if (!idOrFile) return DEFAULT_PET;
    return /\.(png|jpe?g|gif|webp)$/i.test(idOrFile) ? idOrFile : (idOrFile + '.png');
  }

  function renderPet(slot, idOrFile){
    if (!slot) return;
    const file = resolveFile(idOrFile);
    slot.innerHTML = '';
    const img = new Image();
    img.alt = 'สัตว์เลี้ยง';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = PETS_BASE + file;
    slot.appendChild(img);
  }

  function setPet(idOrFile){
    try { localStorage.setItem(STORAGE_KEY, idOrFile); } catch(_) {}
    const slot = qs('.pet-slot');
    renderPet(slot, idOrFile);
  }

  // รอให้ .character-container โผล่มาก่อน (บางที character.js สร้าง async)
  function setup(){
    const container =
      qs('.character-container') ||
      qs('.character-display-area .character-container');
    if (!container) return false;

    // มีสลอตหรือยัง ถ้ายังให้สร้าง
    let slot = qs('.pet-slot', container);
    if (!slot) {
      slot = el('div','pet-slot');
      slot.id = 'petSlot';
      slot.setAttribute('aria-label','pet');
      container.appendChild(slot);
    }

    // โหลดค่าที่เคยเลือกไว้
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch(_) {}
    renderPet(slot, saved || DEFAULT_PET);

    // ฟังอีเวนต์จากร้านค้าเพื่อเปลี่ยนสัตว์เลี้ยง
    window.addEventListener('shop:petChange', (ev) => {
      const val = ev && ev.detail && ev.detail.pet;
      if (val) setPet(val);
    });

    // เผื่อดีบักในคอนโซล
    window.setPet = setPet;
    return true;
  }

  // ลอง setup ตอน DOM พร้อมก่อน
  if (!setup()) {
    // ถ้ายังไม่เจอคอนเทนเนอร์ ให้สังเกตการณ์ DOM จนกว่าจะเจอ
    const mo = new MutationObserver(() => { if (setup()) mo.disconnect(); });
    mo.observe(document.documentElement, { childList:true, subtree:true });
    // กันพลาดอีกชั้น: ลองซ้ำทุก 500ms สัก 5 วินาที
    let tries = 0;
    const t = setInterval(() => {
      if (setup() || ++tries > 10) clearInterval(t);
    }, 500);
  }
})();
/* ===== PET DEBUG PATCH: path + position + size ===== */
(function(){
  // <<<<< ตรงนี้คือ "โฟลเดอร์" ที่อ่านรูปสัตว์เลี้ยง >>>>>
  const PETS_BASE   = window.PETS_BASE || '/assets/pets/';  // <-- ปรับตามโปรเจกต์
  const STORAGE_KEY = 'currentPet';
  const DEFAULT_PET = 'dog-1.png';
  const DEBUG       = true; // สลับ false ได้

  // inject CSS ช่วยมองเห็น
  (function injectCSS(){
    if (document.getElementById('pet-debug-css')) return;
    const css = `
      .pet-slot{ position:absolute; bottom:-4px; left:-24px; width:96px; height:96px; z-index:9999; }
      .pet-slot.debug{ outline:2px dashed #e74c3c; background:rgba(255,0,0,.05); }
      .pet-debug-badge{
        position:absolute; left:0; top:-22px; transform:translateY(-100%);
        font:12px/1.3 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;
        background:rgba(0,0,0,.75); color:#fff; padding:6px 8px; border-radius:8px;
        box-shadow:0 2px 6px rgba(0,0,0,.25); white-space:nowrap; pointer-events:none; z-index:10000;
      }`;
    const s=document.createElement('style'); s.id='pet-debug-css'; s.textContent=css; document.head.appendChild(s);
  })();

  function qs(sel,root){ return (root||document).querySelector(sel); }
  function el(tag, cls){ const x=document.createElement(tag); if(cls) x.className=cls; return x; }

  function resolveFile(idOrFile){
    if (!idOrFile) return DEFAULT_PET;
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(idOrFile) ? idOrFile : (idOrFile + '.png');
  }

  function ensureSlot(){
    // หา container ของตัวละคร
    const container =
      qs('.character-container') ||
      qs('.character-display-area .character-container');
    if (!container) return null;

    let slot = qs('.pet-slot', container);
    if (!slot) {
      slot = el('div','pet-slot');
      slot.id = 'petSlot';
      container.appendChild(slot);
    }
    if (DEBUG) slot.classList.add('debug');
    return slot;
  }

  function updateBadge(slot, img, src, statusText){
    if (!DEBUG || !slot) return;
    let badge = qs('.pet-debug-badge', slot);
    if (!badge) { badge = el('div','pet-debug-badge'); slot.appendChild(badge); }
    const r = slot.getBoundingClientRect();
    const ir = img ? img.getBoundingClientRect() : null;

    badge.textContent =
      `slot ${Math.round(r.width)}x${Math.round(r.height)} @ (${Math.round(r.left)},${Math.round(r.top)})` +
      (ir ? ` | img ${Math.round(ir.width)}x${Math.round(ir.height)}` : '') +
      (src ? ` | src: ${src}` : '') +
      (statusText ? ` | ${statusText}` : '');
  }

  function renderPet(idOrFile){
    const slot = ensureSlot();
    if (!slot) { if (DEBUG) console.warn('[PET] no slot/container'); return; }

    const file = resolveFile(idOrFile);
    const src  = PETS_BASE.replace(/\/+$/,'/') + file;

    slot.innerHTML = '';
    const img = new Image();
    img.alt = 'สัตว์เลี้ยง';
    img.loading = 'lazy';
    img.decoding = 'async';

    img.onload = function(){
      if (DEBUG) console.log('[PET] loaded:', src, `${img.naturalWidth}x${img.naturalHeight}`);
      updateBadge(slot, img, src, `loaded ✓ ${img.naturalWidth}x${img.naturalHeight}`);
    };
    img.onerror = function(e){
      if (DEBUG) console.error('[PET] ERROR loading:', src, e);
      updateBadge(slot, img, src, 'ERROR ✗');
    };

    if (DEBUG) console.log('[PET] try load:', src);
    img.src = src;
    slot.appendChild(img);
    updateBadge(slot, img, src, 'loading...');
    return { slot, img, src };
  }

  function setPet(idOrFile){
    try { localStorage.setItem(STORAGE_KEY, idOrFile); } catch(_){}
    return renderPet(idOrFile);
  }

  // init: เรียกตอน DOM พร้อม
  function init(){
    const slot = ensureSlot();
    if (!slot) return false;
    let saved = null; try { saved = localStorage.getItem(STORAGE_KEY); } catch(_){}
    renderPet(saved || DEFAULT_PET);

    // อัปเดต badge เมื่อรีไซซ์/สกรอลล์
    if (DEBUG) {
      const upd = () => updateBadge(slot, qs('img', slot), null, '');
      window.addEventListener('resize', upd);
      window.addEventListener('scroll', upd, { passive:true });
      const mo = new MutationObserver(upd);
      mo.observe(slot, { childList:true, subtree:true, attributes:true });
    }

    // hook ร้านค้า
    window.addEventListener('shop:petChange', (ev)=>{
      const val = ev && ev.detail && ev.detail.pet;
      if (val) setPet(val);
    });

    // ดีบักจากคอนโซล
    window.setPet = setPet;
    window.__PET_BASE = PETS_BASE;
    return true;
  }

  if (!init()) {
    // ถ้ายังไม่เจอ DOM ให้รอ
    const ob = new MutationObserver(()=>{ if (init()) ob.disconnect(); });
    ob.observe(document.documentElement, { childList:true, subtree:true });
  }
})();
