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
  {id:'m-001', image:'/assets/images/memory/fruits.jpg',  prompt:'จากภาพที่เห็น ผลไม้ชนิดใด "ไม่ได้" ปรากฏอยู่?', choices:['สตรอว์เบอร์รี','กล้วย','กีวี','แตงโม'], answerIndex:2},
  {id:'m-002', image:'/assets/images/memory/station.jpg', prompt:'ในภาพมี “รถไฟ” หรือไม่?', choices:['มี','ไม่มี','ไม่แน่ใจ','เป็นสถานีรถเมล์'], answerIndex:0},
  {id:'m-003', image:'/assets/images/memory/kitchen.jpg', prompt:'ในภาพ ห้องครัวมีของชิ้นใด?', choices:['ไมโครเวฟ','ทีวี','โน้ตบุ๊ก','จักรยาน'], answerIndex:0},
  {id:'m-004', image:'/assets/images/memory/office.jpg',  prompt:'ในภาพมี “เก้าอี้” กี่ตัว?', choices:['1','2','3','มากกว่า 3'], answerIndex:3},
  {id:'m-005', image:'/assets/images/memory/park.jpg',    prompt:'ภาพสวนสาธารณะมีอะไรเด่นที่สุด?', choices:['ม้านั่ง','สไลเดอร์','ลานสเก็ต','รถเข็น'], answerIndex:0},
  {id:'m-006', image:'/assets/images/memory/class.jpg',   prompt:'ในภาพห้องเรียน มีวัตถุใดอยู่หน้าห้อง?', choices:['กระดาน','เตียง','ตู้เย็น','พัดลมเพดาน'], answerIndex:0},
  {id:'m-007', image:'/assets/images/memory/pets.jpg',    prompt:'ในภาพมีสัตว์ชนิดใดมากที่สุด?', choices:['สุนัข','แมว','นก','หนูแฮมสเตอร์'], answerIndex:1},
]};
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
   ⭐ Memory Game — Star Rewards (Append-only, Non-destructive)
   - ไม่แก้โค้ดเดิม แค่สวมทับฟังก์ชันที่มี (win/match)
   - ให้ดาว = WIN_BONUS + MATCH_BONUS * matches
   - ใช้ App.economy.addStars ถ้ามี, ถ้าไม่มีก็ยิง event + เขียน ledger
   ========================================================= */
(function MemoryStarRewards(){
  if (window.__MEMORY_STAR_REWARDS__) return; // กันวางซ้ำ
  window.__MEMORY_STAR_REWARDS__ = true;

  /* ---------- CONFIG ---------- */
  var CONFIG = {
    WIN_BONUS: 10,     // ดาวเมื่อชนะเกม
    MATCH_BONUS: 1,    // ดาวต่อ 1 คู่ที่จับถูก
    REASON_WIN: 'game:memory:win',
    REASON_MATCH: 'game:memory:match'
  };

  /* ---------- SAFE ECONOMY (fallback) ---------- */
  var Econ = (function(){
    var K = {
      uid: 'current_uid',
      legacy: 'player_coins',
      ledger: function(u){ return 'stars_ledger:' + u; }
    };
    function uid(){
      var u = localStorage.getItem(K.uid);
      if (!u){ u = 'guest'; localStorage.setItem(K.uid, u); }
      return u;
    }
    function readLedger(u){ try { return JSON.parse(localStorage.getItem(K.ledger(u))||'[]'); } catch(_) { return []; } }
    function writeLedger(arr,u){ localStorage.setItem(K.ledger(u), JSON.stringify(arr)); }
    function sum(arr){ return arr.reduce(function(s,r){ return s + (r.delta||0); }, 0); }
    async function getBalance(){
      // ถ้า App.economy มีอยู่ ใช้ของเดิม
      try{
        if (window.App && window.App.economy && typeof window.App.economy.getStarBalance === 'function'){
          return await window.App.economy.getStarBalance(uid());
        }
      }catch(_){}
      // ledger → legacy fallback
      var L = readLedger(uid());
      if (L.length) return sum(L);
      var legacy = parseInt(localStorage.getItem(K.legacy)||'0',10)||0;
      return legacy;
    }
    async function addStars(n, reason){
      // ใช้ของเดิมถ้ามี
      if (window.App && window.App.economy && typeof window.App.economy.addStars === 'function'){
        return await window.App.economy.addStars(n, reason, uid());
      }
      // ยิง event ให้ระบบภายนอก (ถ้ามี SafeEconomyAppendOnly อยู่จะรับ)
      try {
        document.dispatchEvent(new CustomEvent('game:reward',{ detail:{ stars:n, reason: reason || 'game:memory' } }));
      } catch(_){}

      // เขียนเองแบบง่าย (fallback)
      var L = readLedger(uid());
      L.push({ id: Date.now()+'-'+Math.random().toString(36).slice(2), at: new Date().toISOString(), delta: +n, reason: reason||'game:memory' });
      writeLedger(L, uid());
      localStorage.setItem(K.legacy, String(await getBalance())); // sync คีย์เก่า
      // แจ้ง UI
      try { document.dispatchEvent(new Event('coins:changed')); } catch(_){}
      return getBalance();
    }
    return { getBalance: getBalance, addStars: addStars };
  })();

  /* ---------- TOAST UI (เล็ก ๆ) ---------- */
  function toastStars(n){
    if (!n) return;
    var el = document.createElement('div');
    el.textContent = '+' + n + ' ⭐';
    Object.assign(el.style, {
      position:'fixed', left:'50%', top:'14px', transform:'translateX(-50%)',
      background:'rgba(0,0,0,.75)', color:'#fff', padding:'8px 12px',
      borderRadius:'999px', fontWeight:'700', boxShadow:'0 6px 18px rgba(0,0,0,.25)', zIndex:99999,
      transition:'all .3s ease', opacity:'0'
    });
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.style.opacity='1'; });
    setTimeout(function(){ el.style.opacity='0'; setTimeout(function(){ el.remove(); }, 350); }, 1500);
  }

  /* ---------- COUNTERS ---------- */
  var matchCount = 0;

  // ดัก “แมตช์สำเร็จ” จากชื่อฟังก์ชันยอดฮิต แล้วเพิ่มตัวนับให้เอง
  function wrapMatch(fnOwner, key){
    if (!fnOwner || typeof fnOwner[key] !== 'function') return;
    var orig = fnOwner[key];
    fnOwner[key] = function(){
      try { matchCount++; } catch(_){}
      return orig.apply(this, arguments);
    };
  }

  // ดัก “ชนะเกม/จบเกม”
  function wrapWin(fnOwner, key){
    if (!fnOwner || typeof fnOwner[key] !== 'function') return;
    var orig = fnOwner[key];
    fnOwner[key] = async function(){
      var ret = orig.apply(this, arguments);
      try {
        var stars = (CONFIG.WIN_BONUS||0) + (CONFIG.MATCH_BONUS||0) * matchCount;
        if (stars > 0){
          await Econ.addStars(stars, CONFIG.REASON_WIN);
          toastStars(stars);
        }
      } catch(err){
        console.warn('[MemoryRewards] addStars error:', err);
      } finally {
        // รีเซ็ตตัวนับรอบใหม่
        matchCount = 0;
      }
      return ret;
    };
  }

  // รายชื่อคีย์ที่พบบ่อยในเกมความจำ
  var CANDIDATES = {
    match: ['onMatch','handleMatch','markMatch','setMatched','pairMatched'],
    win:   ['onWin','handleWin','endGame','gameComplete','finishGame','showWin','showVictory']
  };

  // พยายามหาออพเจ็กต์เกมหลักเพื่อ wrap (เช่น window.GameMemory หรือ this)
  var roots = [window, window.GameMemory, window.game, window.memoryGame].filter(Boolean);

  roots.forEach(function(R){
    CANDIDATES.match.forEach(function(k){ wrapMatch(R, k); });
    CANDIDATES.win.forEach(function(k){ wrapWin(R, k); });
  });

  // เผื่อเกมยิงอีเวนต์เอง เรารับไว้ด้วย (ไม่พึ่งชื่อฟังก์ชัน)
  document.addEventListener('memory:match', function(){ matchCount++; }, {capture:true});
  document.addEventListener('memory:win', async function(){
    try{
      var stars = (CONFIG.WIN_BONUS||0) + (CONFIG.MATCH_BONUS||0) * matchCount;
      if (stars>0){
        await Econ.addStars(stars, CONFIG.REASON_WIN);
        toastStars(stars);
      }
    } finally { matchCount = 0; }
  }, {capture:true});

  // ปุ่มทดสอบ (ปิดเสียง/ลบออกได้): Shift+Alt+M → +5⭐
  document.addEventListener('keydown', function(e){
    if (e.shiftKey && e.altKey && e.code === 'KeyM'){
      Econ.addStars(5, 'debug:manual').then(function(){ toastStars(5); });
    }
  });

})();

