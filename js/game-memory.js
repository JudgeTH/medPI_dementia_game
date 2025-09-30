// ===== helpers =====
const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>[...r.querySelectorAll(s)];
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const now = ()=>performance.now();
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function pickUnique(a,n){return shuffle(a).slice(0,n)}
function choiceWithNewAnswerIndex(choices,idx){
  const pairs = choices.map((t,i)=>({t,ok:i===idx}));
  const sh = shuffle(pairs);
  return { items: sh.map(p=>p.t), correctIndex: sh.findIndex(p=>p.ok) };
}
function showEl(el){ if(!el) return; el.hidden=false; el.style.display=''; }
function hideEl(el){ if(!el) return; el.hidden=true;  el.style.display='none'; }

// ===== config =====
const LS={TIME_ON_IMAGE_MS:'memory.timeOnImageMs', TIME_TO_ANSWER_MS:'memory.timeToAnswerMs', DAILY_STAR_CAP:'game.dailyStarCap', BONUS_T1_MS:'game.bonusT1Ms', BONUS_T2_MS:'game.bonusT2Ms'};
const readNum=(k,d)=>{const v=Number(localStorage.getItem(k));return Number.isFinite(v)&&v>0?v:d}
const CONFIG={
  QUESTIONS_PER_SESSION:7,
  MOVE_ON_DELAY_MS:700,
  REVEAL_REACTION_MS:400,
  STAR_PER_CORRECT:1,
  STAR_STREAK_BONUS:1,
  TIME_ON_IMAGE_MS: readNum(LS.TIME_ON_IMAGE_MS, 5000),
  TIME_TO_ANSWER_MS: readNum(LS.TIME_TO_ANSWER_MS, 15000),
  DAILY_STAR_CAP:    readNum(LS.DAILY_STAR_CAP, 50),
  BONUS_T1_MS:       readNum(LS.BONUS_T1_MS, 1500),
  BONUS_T2_MS:       readNum(LS.BONUS_T2_MS, 3000),
};

// override ผ่าน query
const qp=new URLSearchParams(location.search);
if(qp.has('timeOnImageSec')){const v=Math.max(1,Number(qp.get('timeOnImageSec'))|0)*1000;localStorage.setItem(LS.TIME_ON_IMAGE_MS,String(v));CONFIG.TIME_ON_IMAGE_MS=v}
if(qp.has('timeToAnswerSec')){const v=Math.max(1,Number(qp.get('timeToAnswerSec'))|0)*1000;localStorage.setItem(LS.TIME_TO_ANSWER_MS,String(v));CONFIG.TIME_TO_ANSWER_MS=v}

// ===== storage =====
const UID = localStorage.getItem('ecg_current_uid') || 'guest';
const K_STARS=`pi.stars_ledger.${UID}`, K_SESS=`pi.sessions.${UID}`, K_ATT=`pi.attempts.${UID}`;
const jget=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}
const jset=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const addStars=(delta,reason)=>{if(!delta)return; const a=jget(K_STARS,[]); a.push({delta,reason,at:new Date().toISOString()}); jset(K_STARS,a)}
const starsToday=()=>jget(K_STARS,[]).filter(x=>String(x.at||'').startsWith(new Date().toISOString().slice(0,10))).reduce((s,x)=>s+(x.delta||0),0)
const addAttempt=(x)=>{const a=jget(K_ATT,[]); a.push(x); jset(K_ATT,a)}
const addSession=(x)=>{const a=jget(K_SESS,[]); a.push(x); jset(K_SESS,a)}

// ===== UI refs =====
const UI={
  phasePill:$('#phasePill'), qIndex:$('#qIndex'), qTotal:$('#qTotal'),
  correctCount:$('#correctCount'), starsCount:$('#starsCount'),
  imageStage:$('#imageStage'), qImage:$('#qImage'),
  questionStage:$('#questionStage'), prompt:$('#prompt'), choices:$('#choices'),
  progressWrap:$('#imgProgress'), progressBar:$('#progressBar'),
  summary:$('#summary'), sumCorrect:$('#sumCorrect'), sumTotal:$('#sumTotal'), sumStars:$('#sumStars'),
  playAgain:$('#playAgain'),
  gradeImage:$('#gradeImage') // 🆕 สำหรับแสดงรูปตามเกรด
};
UI.qTotal.textContent=CONFIG.QUESTIONS_PER_SESSION;

const setProgress = (ratio) => {
  const r = Math.max(0, Math.min(1, ratio));
  if (UI.progressBar) UI.progressBar.style.width = (r*100).toFixed(1) + '%';
};

// ===== 🔧 FIX #1: โหลดคำถามจาก JSON อย่างถูกต้อง =====
const SAMPLE={ items:[
  {
    "id": "m-001",
    "image": "/assets/images/memory/pet1.png",
    "prompt": "จากภาพที่เห็น มีสัตว์สีส้ม กี่ตัว?",
    "choices": ["1 ตัว", "2 ตัว", "ไม่มีเลย", "5 ตัว"],
    "answerIndex": 1
  },
  {
    "id": "m-003",
    "image": "/assets/images/memory/pet2.png",
    "prompt": "จากภาพที่เห็นเป็นสัตว์ชนิดใด?",
    "choices": ["แมว", "หมา", "ปลา", "เสือ"],
    "answerIndex": 0
  },
  {
    "id": "m-004",
    "image": "/assets/images/memory/pet3.png",
    "prompt": "มีหมายืนสองขากี่ตัว?",
    "choices": ["1 ตัว", "2 ตัว", "ไม่มีเลย", "3 ตัว"],
    "answerIndex": 0
  },
  {
    "id": "m-005",
    "image": "/assets/images/memory/sea1.png",
    "prompt": "จากภาพที่เห็น มีหอย กี่ตัว?",
    "choices": ["1 ตัว", "2 ตัว", "ไม่มีเลย", "3 ตัว"],
    "answerIndex": 3
  },
  {
    "id": "m-007",
    "image": "/assets/images/memory/farm1.png",
    "prompt": "จากภาพที่เห็นมีเป็ดกี่ตัว?",
    "choices": ["1 ตัว", "2 ตัว", "ไม่มีเลย", "5 ตัว"],
    "answerIndex": 0
  },
  {
    "id": "m-008",
    "image": "/assets/images/memory/pet4.png",
    "prompt": "จากภาพที่เห็นมีกระรอกกี่ตัว?",
    "choices": ["4 ตัว", "5 ตัว", "ไม่มีเลย", "3 ตัว"],
    "answerIndex": 1
  },
  {
    "id": "m-010",
    "image": "/assets/images/memory/pet5.png",
    "prompt": "จากภาพที่เห็น ลูกช้างกำลังเหยียบผลไม้อะไร?",
    "choices": ["มะละกอ", "แตงโม", "สัปปะรด", "กล้วย"],
    "answerIndex": 1
  }
]};

async function loadQuestions(){
  console.log('🔍 กำลังโหลดคำถามจาก /data/questions/memory.json...');
  
  try {
    // ลอง fetch จาก JSON file
    const res = await fetch('/data/questions/memory.json', {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ โหลดสำเร็จจาก JSON:', data);
      
      // ตรวจสอบว่ามีข้อมูลครบถ้วน
      if (data && Array.isArray(data.items) && data.items.length >= CONFIG.QUESTIONS_PER_SESSION) {
        console.log(`✅ พบคำถาม ${data.items.length} ข้อ`);
        return data;
      } else {
        console.warn('⚠️ JSON ไม่ครบ, ใช้ SAMPLE แทน');
      }
    } else {
      console.warn(`⚠️ ไม่สามารถโหลด JSON (HTTP ${res.status}), ใช้ SAMPLE แทน`);
    }
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการโหลด JSON:', err);
  }
  
  console.log('ℹ️ ใช้คำถามสำรอง (SAMPLE)');
  return SAMPLE;
}

// ===== 🔧 FIX #3: ระบบตัดเกรด 7 ระดับ =====
function getGradeImage(correctCount, totalQuestions) {
  // เกรด 1-7 ตามจำนวนข้อถูก
  const gradeMap = [
    { min: 0, max: 1, image: '/assets/animations/celebrate1.png' },  // 0-1 ข้อถูก
    { min: 2, max: 2, image: '/assets/animations/celebrate2.png' },  // 2 ข้อถูก
    { min: 3, max: 3, image: '/assets/animations/celebrate3.png' },  // 3 ข้อถูก
    { min: 4, max: 4, image: '/assets/animations/celebrate4.png' },  // 4 ข้อถูก
    { min: 5, max: 5, image: '/assets/animations/celebrate5.png' },  // 5 ข้อถูก
    { min: 6, max: 6, image: '/assets/animations/celebrate6.png' },  // 6 ข้อถูก
    { min: 7, max: 7, image: '/assets/animations/celebrate7.png' }   // 7 ข้อถูก (เต็ม)
  ];
  
  const grade = gradeMap.find(g => correctCount >= g.min && correctCount <= g.max);
  return grade ? grade.image : gradeMap[0].image;
}

// ===== state =====
const state={ 
  sessionId:`s_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, 
  questions:[], 
  current:-1, 
  correct:0, 
  stars:0, 
  streak:0, 
  imageShownAt:0, 
  questionShownAt:0, 
  answering:false 
};

// ===== render =====
function renderChoices(q){
  UI.choices.innerHTML='';
  const {items,correctIndex}=choiceWithNewAnswerIndex(q.choices,q.answerIndex);
  items.forEach((label,idx)=>{
    const btn=document.createElement('button');
    btn.className='choice'; btn.type='button'; btn.textContent=label;
    const em=document.createElement('span'); em.className='emoji'; btn.appendChild(em);
    btn.addEventListener('click',()=>handleAnswer(q,idx,idx===correctIndex,btn));
    UI.choices.appendChild(btn);
  });
}

async function showImagePhase(q){
  UI.phasePill.textContent='ดูภาพ';
  UI.qImage.src=q.image;

  showEl(UI.imageStage);
  hideEl(UI.questionStage);
  if (UI.progressWrap) showEl(UI.progressWrap);

  setProgress(0);
  state.imageShownAt=now();

  const t = CONFIG.TIME_ON_IMAGE_MS;
  const start = now();
  let raf;
  await new Promise(resolve => {
    (function loop(){
      const elapsed = now() - start;
      setProgress(elapsed / t);
      if (elapsed >= t){
        cancelAnimationFrame(raf);
        setProgress(1);
        return resolve();
      }
      raf = requestAnimationFrame(loop);
    })();
  });
}

function showQuestionPhase(q){
  UI.phasePill.textContent='คำถาม';

  hideEl(UI.imageStage);
  if (UI.progressWrap) hideEl(UI.progressWrap);
  setProgress(0);

  showEl(UI.questionStage);
  UI.prompt.textContent = q.prompt;
  renderChoices(q);

  state.questionShownAt=now();
  state.answering=true;

  const start = state.questionShownAt, limit = CONFIG.TIME_TO_ANSWER_MS;
  (function watch(){
    if(!state.answering) return;
    if(now()-start >= limit){
      state.answering=false;
      afterAnswer(q,{isCorrect:false,choiceIndex:-1,responseMs:limit});
    } else {
      requestAnimationFrame(watch);
    }
  })();
}

// ===== answer flow =====
async function handleAnswer(q,idx,isCorrect,btn){
  if(!state.answering) return;
  state.answering=false;
  const rt=Math.round(now()-state.questionShownAt);

  btn.classList.add(isCorrect?'correct':'wrong');
  const em=btn.querySelector('.emoji'); em.textContent=isCorrect?'🙂':'😅';
  btn.classList.add('show-emoji');
  $$('.choice').forEach(b=>b.setAttribute('disabled',''));

  hideEl(UI.questionStage);

  await sleep(CONFIG.REVEAL_REACTION_MS);
  await afterAnswer(q,{isCorrect,choiceIndex:idx,responseMs:rt});
}

async function afterAnswer(q,{isCorrect,choiceIndex,responseMs}){
  if(isCorrect){
    state.correct+=1; state.streak+=1;
    let bonus=0; if(responseMs<=CONFIG.BONUS_T1_MS) bonus=2; else if(responseMs<=CONFIG.BONUS_T2_MS) bonus=1;
    let streakBonus=(state.streak>=3)?CONFIG.STAR_STREAK_BONUS:0;
    state.stars += CONFIG.STAR_PER_CORRECT + bonus + streakBonus;
  } else {
    state.streak=0;
  }

  addAttempt({
    id:`a_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    sessionId:state.sessionId,
    questionId:q.id,
    shownImageMs: CONFIG.TIME_ON_IMAGE_MS,
    answeredAt:new Date().toISOString(),
    isCorrect, responseMs, choiceIndex
  });

  UI.correctCount.textContent=state.correct;
  UI.starsCount.textContent=state.stars;

  await sleep(CONFIG.MOVE_ON_DELAY_MS);
  nextQuestion();
}

// ===== 🔧 FIX #2: เก็บดาวให้ตัวละครอย่างถูกต้อง =====
function endSession(){
  hideEl(UI.imageStage);
  hideEl(UI.questionStage);
  if (UI.progressWrap) hideEl(UI.progressWrap);

  const awarded=starsToday(); 
  const remain=Math.max(0,CONFIG.DAILY_STAR_CAP - awarded);
  const grant=Math.min(state.stars,remain); 
  const cut=state.stars-grant;
  
  // 🆕 บันทึกดาวเข้าระบบ
  if(grant>0) {
    addStars(grant,`session:${state.sessionId}`);
    console.log(`✅ บันทึก ${grant} ⭐ เข้าระบบแล้ว`);
    
    // ยิง event เพื่อให้ส่วนอื่นๆ อัพเดท
    try {
      document.dispatchEvent(new CustomEvent('coins:changed', {
        detail: { stars: grant, reason: 'memory-game' }
      }));
    } catch(e) {
      console.warn('ไม่สามารถยิง coins:changed event:', e);
    }
  }

  addSession({
    id: state.sessionId,
    gameType: 'memory',
    score: state.correct,
    starsEarned: grant,
    endedAt: new Date().toISOString()
  });

  UI.sumCorrect.textContent=state.correct;
  UI.sumTotal.textContent=CONFIG.QUESTIONS_PER_SESSION;
  UI.sumStars.textContent=`${grant}${cut>0?` (จำกัด – ตัด ${cut})`:''}`;

  // 🆕 แสดงรูปตามเกรด (7 ระดับ)
  const gradeImagePath = getGradeImage(state.correct, CONFIG.QUESTIONS_PER_SESSION);
  if (UI.gradeImage) {
    UI.gradeImage.src = gradeImagePath;
    UI.gradeImage.alt = `คุณตอบถูก ${state.correct} ข้อ`;
    console.log(`🎯 เกรด: ${state.correct}/${CONFIG.QUESTIONS_PER_SESSION} → ${gradeImagePath}`);
  }

  UI.summary.classList.add('active');
  UI.playAgain.onclick=()=>location.reload();
}

// ===== driver =====
async function nextQuestion(){
  hideEl(UI.questionStage);
  hideEl(UI.imageStage);
  if (UI.progressWrap) hideEl(UI.progressWrap);

  state.current+=1;
  $('#qIndex').textContent=Math.min(state.current+1,CONFIG.QUESTIONS_PER_SESSION);
  if(state.current>=state.questions.length) return endSession();

  const q=state.questions[state.current];
  await showImagePhase(q);
  showQuestionPhase(q);
}

(async function start(){
  const dataset=await loadQuestions(); 
  const all=dataset.items||[];
  
  if(all.length<CONFIG.QUESTIONS_PER_SESSION) {
    console.warn(`⚠️ คลังคำถามมีเพียง ${all.length} ข้อ (ต้องการ ${CONFIG.QUESTIONS_PER_SESSION})`);
  }
  
  // พรีโหลดภาพ
  all.forEach(it=>{const im=new Image(); im.src=it.image;});
  
  state.questions=pickUnique(all, Math.min(CONFIG.QUESTIONS_PER_SESSION, all.length));
  console.log(`🎮 เริ่มเกมด้วยคำถาม ${state.questions.length} ข้อ`);
  
  nextQuestion();
})();
