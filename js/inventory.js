// /js/inventory.js
(function (global) {
  const getUser = () => (global.gameAuth?.currentUser) || (global.gameAuth?.loadUser?.() || null);

  function _ensure() {
    const u = getUser();
    if (!u) return null;
    u.inventory = u.inventory || { owned: [], equipped: { head: null, body: null, pet: null, bg: null } };
    global.gameAuth?.saveCurrentUser?.();
    return u.inventory;
  }

  function getInventory() {
    return _ensure() || { owned: [], equipped: {} };
  }

  function isOwned(itemId) {
    const inv = _ensure(); if (!inv) return false;
    return inv.owned.includes(itemId);
  }

  function addItem(itemId) {
    const inv = _ensure(); if (!inv) return false;
    if (!inv.owned.includes(itemId)) inv.owned.push(itemId);
    global.gameAuth?.saveCurrentUser?.();
    return true;
  }

  function equip(slot, itemId) {
    const inv = _ensure(); if (!inv) return false;
    inv.equipped[slot] = itemId || null;
    global.gameAuth?.saveCurrentUser?.();
    try {
      // แจ้งระบบตัวละครให้ re-render ถ้ามี
      global.characterSystem?.applyEquipment?.(inv.equipped);
    } catch {}
    return true;
  }

  function getEquipped() {
    return getInventory().equipped;
  }

  global.Inventory = { getInventory, isOwned, addItem, equip, getEquipped };
  if (typeof window !== 'undefined') window.Inventory = global.Inventory;
})(window);
