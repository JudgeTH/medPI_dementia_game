// js/econ-stars.js
// ========== ใช้แค่ไฟล์นี้ก่อน ยังไม่ยุ่งกับระบบอื่น ==========
const STAR_KEY = 'pi_star_ledger_v1'; // ledger เป็นอาเรย์ของ {delta, reason, at}

function _loadLedger() {
  try {
    return JSON.parse(localStorage.getItem(STAR_KEY) || '[]');
  } catch {
    return [];
  }
}

function _saveLedger(rows) {
  localStorage.setItem(STAR_KEY, JSON.stringify(rows));
  // แจ้ง UI อื่นๆ (เช่น badge) ว่าค่าเปลี่ยน
  window.dispatchEvent(new CustomEvent('stars:updated', { detail: { balance: Stars.getBalance() } }));
}

export const Stars = {
  /** ยอดคงเหลือ = sum(delta) */
  getBalance() {
    const rows = _loadLedger();
    return rows.reduce((s, r) => s + (r.delta || 0), 0);
  },
  /** บันทึก +/− ดาว (delta เช่น +5, -20) พร้อมเหตุผล */
  add(delta, reason = 'reward') {
    if (!delta || isNaN(delta)) return;
    const rows = _loadLedger();
    rows.push({ delta: Number(delta), reason, at: new Date().toISOString() });
    _saveLedger(rows);
  },
  /** เคลียร์ทั้งหมด (ไว้ทดสอบ/รีเซ็ตเท่านั้น) */
  _reset() {
    localStorage.removeItem(STAR_KEY);
    window.dispatchEvent(new CustomEvent('stars:updated', { detail: { balance: 0 } }));
  }
};

// ให้เรียกใช้ได้จาก console เวลาเทส
window.PiStars = Stars;
