// js/econ-stars.js
const STAR_KEY = 'pi_star_ledger_v1'; // [{delta, reason, at}]

function _load() {
  try { return JSON.parse(localStorage.getItem(STAR_KEY) || '[]'); }
  catch { return []; }
}
function _save(rows) {
  localStorage.setItem(STAR_KEY, JSON.stringify(rows));
  const t = Stars.totals();
  window.dispatchEvent(new CustomEvent('stars:updated', { detail: t }));
}

export const Stars = {
  add(delta, reason='reward') {
    if (!delta || isNaN(delta)) return;
    const rows = _load();
    rows.push({ delta: Number(delta), reason, at: new Date().toISOString() });
    _save(rows);
  },
  totals() {
    const rows = _load();
    let balance = 0, earned = 0, spent = 0;
    for (const r of rows) {
      balance += (r.delta||0);
      if ((r.delta||0) > 0) earned += r.delta; else spent += -(r.delta||0);
    }
    return { balance, earned, spent, count: rows.length };
  },
  resetForTest() {
    localStorage.removeItem(STAR_KEY);
    window.dispatchEvent(new CustomEvent('stars:updated', { detail: { balance:0, earned:0, spent:0, count:0 } }));
  }
};
window.PiStars = Stars; // เผื่อเรียกเทสต์จาก console
