// PI Game — เกมบวกเลขเร็ว (พิมพ์คำตอบเอง)
// โหมดเล่นรอบละ 7 ข้อ + คิดดาวจากความถูกต้องและความไว

/***** ค่าปรับแต่งหลัก *****/
const TOTAL_QUESTIONS = 7;             // เล่นรอบละ 7 ข้อ
const MIN_A = 0, MAX_A = 99;           // ช่วงตัวตั้ง/ตัวบวก
const FAST_BONUS_MS = 1800;            // ตอบถูก ≤ 1.8s ได้โบนัส 1 ดาว
const NORMAL_MS = 3500;                // > 3.5s ถือว่าช้า (ไม่มีโบนัส)

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
const playAgainBtn  = document.getElementById('playAgain');

/***** ฟังก์ชันแสดงรูปสรุปตามที่ผู้ใช้กำหนด *****/
function renderSummaryAnimation(correctCount) {
  const slot = document.getElementById('customAnimationSlot');
  if (!slot) return;
  slot.innerHTML = "";
  let imgSrc = null;
  if (correctCount <= 0) imgSrc = "/assets/animations/celebrate1.png";
  else if (correctCount === 1) imgSrc = "/assets/animations/celebrate2.png";
  else if (correctCount === 2) imgSrc = "/assets/animations/celebrate3.png";
  else if (correctCount === 3) imgSrc = "/assets/animations/celebrate4.png";
  else if (correctCount === 4) imgSrc = "/assets/animations/celebrate5.png";
  else if (correctCount === 5) imgSrc = "/assets/animations/celebrate6.png";
  else if (correctCount === 6) imgSrc = "/assets/animations/celebrate7.png";
  // กันพลาดกรณีถูกครบ 7 ข้อ ให้ใช้รูป celebrate7 เช่นกัน
  else if (correctCount >= 7) imgSrc = "/assets/animations/celebrate7.png";

  if (imgSrc) {
    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = "สรุปผล";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    slot.appendChild(img);
  }
}

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
      feedbackEl.textContent = `ถูกต้อง! +1⭐ (${rt} ms)`;
      feedbackEl.className = 'feedback ok';
    } else {
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

  // เรียกใช้ภาพสรุปตาม mapping ที่กำหนด
  renderSummaryAnimation(correct);

  phasePill.textContent = 'สรุป';
  summaryEl.classList.add('active');
}

/***** อีเวนต์ *****/
formEl.addEventListener('submit', handleSubmit);
playAgainBtn.addEventListener('click', initGame);

// เริ่มเกมทันทีเมื่อโหลด
window.addEventListener('DOMContentLoaded', initGame);
