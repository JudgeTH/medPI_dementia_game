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
// บังคับ show/hide ให้ชัวร์ (กัน CSS ทับ)
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
  TIME_ON_IMAGE_MS: readNum(LS.TIME_ON_IMAGE_MS, 10000), // 10s
  TIME_TO_ANSWER_MS: readNum(LS.TIME_TO_ANSWER_MS, 15000),
  DAILY_STAR_CAP:    readNum(LS.DAILY_STAR_CAP, 50),
  BONUS_T1_MS:       readNum(LS.BONUS_T1_MS, 1500),
  BONUS_T2_MS:       readNum(LS.BONUS_T2_MS, 3000),
};
// override ผ่าน query เช่น ?timeOnImageSec=8&timeToAnswerSec=12
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
  playAgain:$('#playAgain')
};
UI.qTotal.textContent=CONFIG.QUESTIONS_PER_SESSION;

// progress helper
const setProgress = (ratio) => {
  const r = Math.max(0, Math.min(1, ratio));
  if (UI.progressBar) UI.progressBar.style.width = (r*100).toFixed(1) + '%';
};

// ===== dataset (image + text question) =====
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
    },
    {
      "id": "m-011",
      "image": "/assets/images/memory/sale1.png",
      "prompt": "ในภาพกล้วยกี่ลูก?",
      "choices": ["1 ลูก", "2 ลูก", "4 ลูก", "3 ลูก"],
      "answerIndex": 3
    }]};
async function loadQuestions(){
  try{
    const res=await fetch('/data/questions/memory.json',{cache:'no-store'});
    if(res.ok){ const d=await res.json(); if(d && Array.isArray(d.items) && d.items.length) return d; }
  }catch{}
  return SAMPLE;
}

// ===== state =====
const state={ sessionId:`s_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, questions:[], current:-1, correct:0, stars:0, streak:0, imageShownAt:0, questionShownAt:0, answering:false };

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

  // โชว์รูป + แถบเวลา
  showEl(UI.imageStage);
  hideEl(UI.questionStage);
  if (UI.progressWrap) showEl(UI.progressWrap);

  setProgress(0);
  state.imageShownAt=now();

  // แอนิเมตแถบเวลา (RAF)
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

  // ซ่อนรูป + แถบเวลา
  hideEl(UI.imageStage);
  if (UI.progressWrap) hideEl(UI.progressWrap);
  setProgress(0);

  // โชว์คำถามข้อความ
  showEl(UI.questionStage);
  UI.prompt.textContent = q.prompt;
  renderChoices(q);

  state.questionShownAt=now();
  state.answering=true;

  // time limit หลังบ้าน (ไม่แสดงบนจอ)
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

  // ซ่อนคำถามไว้ก่อนจะไปข้อถัดไป
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

// ===== session end =====
function endSession(){
  hideEl(UI.imageStage);
  hideEl(UI.questionStage);
  if (UI.progressWrap) hideEl(UI.progressWrap);

  const awarded=starsToday(); const remain=Math.max(0,CONFIG.DAILY_STAR_CAP - awarded);
  const grant=Math.min(state.stars,remain); const cut=state.stars-grant;
  if(grant>0) addStars(grant,`session:${state.sessionId}`);

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

  UI.summary.classList.add('active');
  UI.playAgain.onclick=()=>location.reload();
}

// ===== driver =====
async function nextQuestion(){
  // รีเซ็ตไม่ให้ค้าง
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
  const dataset=await loadQuestions(); const all=dataset.items||[];
  if(all.length<CONFIG.QUESTIONS_PER_SESSION) console.warn('คลังคำถามมีไม่ครบ 7 ใช้เท่าที่มี');
  // พรีโหลดภาพ
  all.forEach(it=>{const im=new Image(); im.src=it.image;});
  state.questions=pickUnique(all, CONFIG.QUESTIONS_PER_SESSION);
  nextQuestion();
})();

/* =========================================================
   ⭐ Per-Question Stars (append-only, non-destructive)
   - 1 คำตอบถูก = 1 ⭐ (สะสมไว้)
   - เมื่อ "จบเกม" (เล่นครบ 7 ข้อหรือเกมประกาศจบ) → มอบ⭐รวมครั้งเดียว
   - ไม่แตะของเดิม, ดักอีเวนต์/ฟังก์ชันยอดนิยมให้อัตโนมัติ
   ========================================================= */
(function MemoryStarsPerQuestion(){
  if (window.__MEMORY_STARS_PER_Q__) return;
  window.__MEMORY_STARS_PER_Q__ = true;

  /* ---------- CONFIG ---------- */
  var CONFIG = {
    QUESTIONS_PER_ROUND: 7,            // จำนวนข้อ/รอบ (หรือปล่อยเกมกำหนดเองก็ได้)
    REQUIRE_ROUND_LIMIT: true,         // true: จบเมื่อครบ 7 หรือเกมประกาศจบ; false: รอเกมประกาศจบเท่านั้น
    REASON: 'game:memory:perQuestion', // เหตุผลบันทึกใน ledger
    SHOW_TOAST: true                   // โชว์ +⭐ ตอนมอบรวม
  };

  /* ---------- ECONOMY (ไม่ทำลายของเดิม) ---------- */
  var Econ = (function(){
    var K = {
      uid: 'current_uid',
      legacy: 'player_coins',
      ledger: function(u){ return 'stars_ledger:' + u; }
    };
    function uid(){ var u = localStorage.getItem(K.uid); if(!u){u='guest'; localStorage.setItem(K.uid,u);} return u; }
    function readL(u){ try{ return JSON.parse(localStorage.getItem(K.ledger(u))||'[]'); }catch(_){ return []; } }
    function writeL(a,u){ localStorage.setItem(K.ledger(u), JSON.stringify(a)); }
    function sum(a){ return a.reduce(function(s,r){return s+(r.delta||0);},0); }
    async function balance(){
      try{ if (window.App?.economy?.getStarBalance) return await window.App.economy.getStarBalance(uid()); }catch(_){}
      var L = readL(uid()); if (L.length) return sum(L);
      return parseInt(localStorage.getItem(K.legacy)||'0',10)||0;
    }
    async function addStars(n, reason){
      n = Number(n)||0; if (!n) return balance();
      // ใช้ API เดิมก่อน
      if (window.App?.economy?.addStars){
        var v = await window.App.economy.addStars(n, reason, uid());
        try{ document.dispatchEvent(new Event('coins:changed')); }catch(_){}
        return v;
      }
      // ยิง event เผื่อมีตัวรับ
      try{ document.dispatchEvent(new CustomEvent('game:reward',{detail:{stars:n,reason:reason||CONFIG.REASON}})); }catch(_){}
      // เขียน ledger เอง (fallback)
      var L = readL(uid());
      L.push({ id: Date.now()+'-'+Math.random().toString(36).slice(2), at: new Date().toISOString(), delta: +n, reason: reason||CONFIG.REASON });
      writeL(L, uid());
      localStorage.setItem(K.legacy, String(await balance()));
      try{ document.dispatchEvent(new Event('coins:changed')); }catch(_){}
      return balance();
    }
    return { addStars:addStars, balance:balance };
  })();

  /* ---------- UI: Toast ---------- */
  function toast(msg){
    if (!CONFIG.SHOW_TOAST) return;
    var el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position:'fixed', left:'50%', top:'14px', transform:'translateX(-50%)',
      background:'rgba(0,0,0,.75)', color:'#fff', padding:'8px 12px', borderRadius:'999px',
      fontWeight:'700', boxShadow:'0 6px 18px rgba(0,0,0,.25)', zIndex:99999, opacity:'0', transition:'opacity .25s ease'
    });
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.style.opacity='1'; });
    setTimeout(function(){ el.style.opacity='0'; setTimeout(function(){ el.remove(); }, 280); }, 1500);
  }

  /* ---------- STATE ---------- */
  var correctThisRound = 0;
  var answeredThisRound = 0;
  var awarded = false;

  function resetRoundState(){
    correctThisRound = 0;
    answeredThisRound = 0;
    awarded = false;
  }

  // เรียกตอนตอบ "ถูก" 1 ข้อ
  function markCorrect(){
    correctThisRound++;
  }
  // เรียกทุกครั้งที่ "ตอบไปแล้ว" 1 ข้อ (ถูก/ผิดก็เพิ่ม)
  function markAnswered(){
    answeredThisRound++;
    if (CONFIG.REQUIRE_ROUND_LIMIT && CONFIG.QUESTIONS_PER_ROUND > 0){
      if (answeredThisRound >= CONFIG.QUESTIONS_PER_ROUND){
        finalizeIfNeeded('round-limit');
      }
    }
  }

  async function finalizeIfNeeded(source){
    if (awarded) return;
    awarded = true;
    var stars = correctThisRound; // 1 คำตอบถูก = 1 ดาว
    if (stars > 0){
      await Econ.addStars(stars, CONFIG.REASON);
      toast('+'+stars+' ⭐');
    }
    // เตรียมรอบใหม่ (ถ้ามีเล่นต่อ)
    setTimeout(resetRoundState, 300);
  }

  /* ---------- PUBLIC HELPERS (ปลอดภัย, ใช้ได้ทันที) ----------
     👉 แนะนำใส่บรรทัดเดียวในโค้ดเดิม:
        - ตอนตรวจ "ตอบถูก":     window.memoryMarkCorrect();
        - ตอน "กดส่งคำตอบ":     window.memoryMarkAnswered();
        - ตอน "จบเกม/โชว์ผล":    window.memoryFinishRound();
     ถ้าไม่ได้ใส่ โค้ดนี้ยังพยายามเดา/ดักอัตโนมัติให้
  ---------------------------------------------------------------- */
  window.memoryMarkCorrect  = function(){ try{ markCorrect(); }catch(_){ } };
  window.memoryMarkAnswered = function(){ try{ markAnswered(); }catch(_){ } };
  window.memoryFinishRound  = function(){ finalizeIfNeeded('manual'); };

  /* ---------- AUTO-HOOKS: พยายามดักของเดิมให้เอง ---------- */
  // 1) ดัก "ตอบถูก" จากชื่อฟังก์ชันยอดนิยม
  function wrap(owner, key, fn){
    if (!owner || typeof owner[key] !== 'function') return;
    var orig = owner[key];
    owner[key] = function(){
      try{ fn.apply(this, arguments); }catch(_){}
      return orig.apply(this, arguments);
    };
  }

  var roots = [window, window.GameMemory, window.game, window.memoryGame].filter(Boolean);

  // ถูก: onCorrect/handleCorrect/markCorrect/correctAnswer
  ['onCorrect','handleCorrect','markCorrect','correctAnswer','answerCorrect'].forEach(function(k){
    roots.forEach(function(R){ wrap(R, k, markCorrect); });
  });

  // ตอบไปแล้ว: onAnswered/nextQuestion/submitAnswer/processAnswer
  ['onAnswered','nextQuestion','submitAnswer','processAnswer','handleAnswer'].forEach(function(k){
    roots.forEach(function(R){ wrap(R, k, markAnswered); });
  });

  // จบเกม/สรุปผล: endGame/showResults/gameComplete/finishGame
  ['endGame','showResults','gameComplete','finishGame','showWin','showVictory'].forEach(function(k){
    roots.forEach(function(R){ wrap(R, k, function(){ finalizeIfNeeded(k); }); });
  });

  // 2) ดักผ่าน Custom Events ถ้าโค้ดเดิมยิงเอง
  //   - ตอนตอบถูกให้ dispatch อะไรแบบนี้ก็ได้: document.dispatchEvent(new Event('answer:correct'))
  document.addEventListener('answer:correct',  function(){ markCorrect(); },  {capture:true});
  document.addEventListener('question:answered',function(){ markAnswered(); }, {capture:true});
  document.addEventListener('memory:finish',    function(){ finalizeIfNeeded('event'); }, {capture:true});
  document.addEventListener('game:finish',      function(){ finalizeIfNeeded('event'); }, {capture:true});

  // 3) กันลืม: ปุ่มลัด Shift+Alt+K → จำลอง "ตอบถูก" 1 ข้อ / Shift+Alt+F → จบเกม
  document.addEventListener('keydown', function(e){
    if (e.shiftKey && e.altKey && e.code === 'KeyK'){ markCorrect(); markAnswered(); }
    if (e.shiftKey && e.altKey && e.code === 'KeyF'){ finalizeIfNeeded('hotkey'); }
  });

  // 4) เริ่มรอบใหม่เมื่อโหลดเกม
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', resetRoundState);
  } else {
    resetRoundState();
  }
})();

