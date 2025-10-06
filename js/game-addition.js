// PI Game — เกมบวกเลขเร็ว (พิมพ์คำตอบเอง)
// โหมดเล่นรอบละ 7 ข้อ + คิดดาวจากความถูกต้องและความไว

/***** ค่าปรับแต่งหลัก *****/
const TOTAL_QUESTIONS = 7;             // เล่นรอบละ 7 ข้อ
const MIN_A = 0, MAX_A = 99;           // ช่วงตัวตั้ง/ตัวบวก
const FAST_BONUS_MS = 1800;            // ตอบถูก ≤ 1.8s ได้โบนัส 1 ดาว
const NORMAL_MS = 3500;                // > 3.5s ถือว่าช้า (ไม่มีโบนัส)
const BADGE_IMAGES = [
  // กำหนดไฟล์รูปสรุประดับ 0–7 (ใส่เป็น path ของคุณเอง)
  // ตัวอย่างโฟลเดอร์: /assets/summary/level-0.png ... /assets/summary/level-7.png
  "/assets/summary/level-0.png",
  "/assets/summary/level-1.png",
  "/assets/summary/level-2.png",
  "/assets/summary/level-3.png",
  "/assets/summary/level-4.png",
  "/assets/summary/level-5.png",
  "/assets/summary/level-6.png",
  "/assets/summary/level-7.png"
];

/***** ตัวช่วยสุ่มโจทย์บวก *****/
function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function makeQuestion(){
  const a = randInt(MIN_A, MAX_A);
  const b = randInt(MIN_A, MAX_A);
  return { a, b, ans: a + b, text: `${a} + ${b} = ?` };
}

/***** สถานะเกม *****/
let questions = [];
let index = 0;
let correct = 0;
let stars = 0;
let qStartTime = 0; // ms
let attempts = [];  // เก็บ {q, userAns, correct, rt}

/***** อ้างอิง DOM *****/
const phasePill     = document.getElementById('phasePill');
const qIndexEl      = document.getElementById('qIndex');
const qTotalEl      = document.getElementById('qTotal');
const correctCount  = document.getElementById('correctCount');
const starsCount    = document.getElementById('starsCount');

const questionStage = document.getElementById('questionStage');
const promptEl      = document.getElementById('prompt');
const formEl        = document.getElementById('answerForm');
const inputEl       = document.getElementById('answerInput');
const feedbackEl    = document.getElementById('feedback');

const summaryEl     = document.getElementById('summary');
const sumCorrectEl  = document.getElementById('sumCorrect');
const sumTotalEl    = document.getElementById('sumTotal');
const sumStarsEl    = document.getElementById('sumStars');
const animSlot      = document.getElementById('customAnimationSlot');
const playAgainBtn  = document.getElementById('playAgain');

/***** ฟังก์ชันหลักของเกม *****/
function initGame(){
  // เตรียมโจทย์ 7 ข้อ
  questions = Array.from({length: TOTAL_QUESTIONS}, makeQuestion);
  index = 0;
  correct = 0;
  stars = 0;
  attempts = [];

  qTotalEl.textContent = TOTAL_QUESTIONS;
  correctCount.textContent = 0;
  starsCount.textContent = 0;

  phasePill.textContent = 'คำถาม';
  summaryEl.classList.remove('active');
  questionStage.style.display = '';

  renderCurrentQuestion();
}

function renderCurrentQuestion(){
  const q = questions[index];
  qIndexEl.textContent = index + 1;

  promptEl.textContent = q.text;
  inputEl.value = '';
  inputEl.focus({ preventScroll: true });
  feedbackEl.textContent = '';

  qStartTime = performance.now();
}

function handleSubmit(e){
  e.preventDefault();
  const raw = (inputEl.value ?? '').trim();
  if (raw === '') {
    inputEl.focus();
    return;
  }

  const userAns = Number(raw);
  const q = questions[index];
  const rt = Math.max(0, Math.round(performance.now() - qStartTime)); // ms วัดความไว

  let isCorrect = (userAns === q.ans);
  let gainedStars = 0;

  if (isCorrect){
    correct += 1;
    // ดาวฐาน 1 ต่อคำตอบที่ถูก
    gainedStars += 1;

    // โบนัสความไว (เฉพาะตอบถูก)
    if (rt <= FAST_BONUS_MS) {
      gainedStars += 1; // เร็วมาก
      feedbackEl.textContent = `ถูกต้อง! +2⭐ (เร็วมาก ${rt} ms)`;
      feedbackEl.className = 'feedback ok';
    } else if (rt <= NORMAL_MS) {
      // ไม่ได้โบนัส แต่ยังถือว่าปกติ
      feedbackEl.textContent = `ถูกต้อง! +1⭐ (${rt} ms)`;
      feedbackEl.className = 'feedback ok';
    } else {
      // ช้าไปหน่อย
      feedbackEl.textContent = `ถูกต้อง! +1⭐ (ช้า ${rt} ms)`;
      feedbackEl.className = 'feedback ok';
    }
  } else {
    feedbackEl.textContent = `ยังไม่ถูก (ตอบ ${userAns}, เฉลย ${q.ans})`;
    feedbackEl.className = 'feedback no';
  }

  stars += gainedStars;
  correctCount.textContent = correct;
  starsCount.textContent = stars;

  // เก็บสถิติของข้อนี้
  attempts.push({
    index, question: q.text, userAns, isCorrect, rt, gainedStars
  });

  // ไปข้อถัดไป (เว้นระยะให้เห็น feedback สั้นๆ)
  setTimeout(nextStep, 450);
}

function nextStep(){
  index += 1;
  if (index >= TOTAL_QUESTIONS){
    showSummary();
  } else {
    renderCurrentQuestion();
  }
}

function showSummary(){
  // ซ่อนโซนคำถาม
  questionStage.style.display = 'none';

  // สรุป
  sumCorrectEl.textContent = correct;
  sumTotalEl.textContent   = TOTAL_QUESTIONS;
  sumStarsEl.textContent   = stars;

  // แสดงรูป/แอนิเมชัน 7 ระดับ (0..7) อิงจำนวนข้อที่ถูก
  // หากไม่มีไฟล์จริง จะ fallback เป็นอีโมจิแทน
  animSlot.innerHTML = ''; // ล้างของเดิม
  const level = Math.max(0, Math.min(7, correct));
  const src = BADGE_IMAGES[level];

  if (src && typeof src === 'string') {
    const img = new Image();
    img.alt = `ระดับที่ได้: ${level}/7`;
    img.src = src;
    animSlot.appendChild(img);
  } else {
    // Fallback อีโมจิ 7 ระดับ
    const EMOJI = ['😵‍💫','😕','🙂','😊','😄','🤩','🏆','👑'];
    const div = document.createElement('div');
    div.style.fontSize = '64px';
    div.textContent = EMOJI[level] ?? '✨';
    animSlot.appendChild(div);
  }

  phasePill.textContent = 'สรุป';
  summaryEl.classList.add('active');
}

/***** อีเวนต์ *****/
formEl.addEventListener('submit', handleSubmit);
playAgainBtn.addEventListener('click', initGame);

// เริ่มเกมทันทีเมื่อโหลด
window.addEventListener('DOMContentLoaded', initGame);
