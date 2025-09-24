// /js/economy.js
// หนึ่งแหล่งความจริงเรื่องดาว — ใช้ร่วมทุกมินิเกม/ร้านค้า

(function (global) {
  const ECON_KEY_PREFIX = 'pi';
  const getUID = () => {
    try { return (window.gameAuth?.currentUser?.id) || localStorage.getItem('ecg_current_uid') || 'guest'; }
    catch { return 'guest'; }
  };

  const kStarsLedger = (uid) => `${ECON_KEY_PREFIX}.stars_ledger.${uid}`;
  const kDailyCap    = (uid) => `${ECON_KEY_PREFIX}.daily_cap.${uid}`; // reserve for per-user cap if needed

  const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const jset = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const DEFAULT_DAILY_CAP = 50;

  function getLedger(uid = getUID()) {
    return jget(kStarsLedger(uid), []);
  }

  function starsToday(uid = getUID()) {
    const today = new Date().toISOString().slice(0, 10);
    return getLedger(uid).filter(x => String(x.at || '').startsWith(today))
                         .reduce((s, x) => s + (x.delta || 0), 0);
  }

  function getDailyCap(uid = getUID()) {
    return jget(kDailyCap(uid), DEFAULT_DAILY_CAP);
  }

  // ผลรวมยอดดาว (เลเจอร์เป็นจริงที่สุด)
  function getBalance(uid = getUID()) {
    const sum = getLedger(uid).reduce((s, x) => s + (x.delta || 0), 0);
    // sync ไปที่ auth ถ้ามี
    try {
      if (global.gameAuth?.currentUser) {
        global.gameAuth.currentUser.stats = global.gameAuth.currentUser.stats || {};
        global.gameAuth.currentUser.stats.totalStars = sum;
        global.gameAuth.saveCurrentUser?.();
        global.gameAuth.updateDashboard?.();
      }
    } catch {}
    return sum;
  }

  // รับดาว (มีเพดานรายวัน)
  function earnStars(delta, meta = {}) {
    if (!delta) return { ok: true, added: 0, reason: 'no-change' };
    const uid = getUID();
    const cap = getDailyCap(uid);
    const todayUsed = starsToday(uid);
    const remain = Math.max(0, cap - todayUsed);
    const add = Math.max(0, Math.min(remain, delta));

    if (add > 0) {
      const ledger = getLedger(uid);
      ledger.push({ delta: add, at: new Date().toISOString(), ...meta });
      jset(kStarsLedger(uid), ledger);
      getBalance(uid); // sync
      return { ok: true, added: add, capped: add < delta, remainAfter: Math.max(0, remain - add) };
    } else {
      return { ok: false, added: 0, reason: 'daily-cap-reached', cap, todayUsed };
    }
  }

  function canSpend(cost) {
    return getBalance() >= cost;
  }

  function spendStars(cost, meta = {}) {
    if (cost <= 0) return { ok: true };
    if (!canSpend(cost)) return { ok: false, reason: 'insufficient' };
    const uid = getUID();
    const ledger = getLedger(uid);
    ledger.push({ delta: -Math.abs(cost), at: new Date().toISOString(), ...meta });
    jset(kStarsLedger(uid), ledger);
    getBalance(uid); // sync
    return { ok: true, spent: Math.abs(cost), balance: getBalance(uid) };
  }

  // ส่งออก
  global.Economy = { getUID, getBalance, getLedger, earnStars, spendStars, canSpend, starsToday, getDailyCap };
  // สำหรับ ES module import ได้ด้วย
  if (typeof window !== 'undefined') window.Economy = global.Economy;
})(window);
