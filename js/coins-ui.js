// js/coins-ui.js
import { Stars } from './econ-stars.js';

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(text);
}

function render() {
  const { balance, earned } = Stars.totals();
  // ในร้านโชว์ยอดที่ใช้จ่ายได้ปัจจุบัน
  setText('player-coins', balance);
  // ใน quick stats ถ้าต้องการ "สะสมทั้งหมด" ใช้ earned; 
  // ถ้าต้องการ "ยอดคงเหลือ" ให้เปลี่ยนเป็น balance
  setText('total-earned-coins', earned);
}

function mount() {
  render();
  window.addEventListener('stars:updated', render);
  // เผื่อบางหน้าสร้าง DOM ช้า
  document.addEventListener('readystatechange', () => { if (document.readyState==='complete') render(); });
}

document.addEventListener('DOMContentLoaded', mount);
