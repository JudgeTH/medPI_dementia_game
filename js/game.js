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

// ===== config =====
const LS={TIME_TO_ANSWER_MS:'game.timeToAnswerMs', DAILY_STAR_CAP:'game.dailyStarCap', BONUS_T1_MS:'game.bonusT1Ms', BONUS_T2_MS:'game.bonusT2Ms'};
const readNum=(k,d)=>{const v=Number(localStorage.getItem(k));return Number.isFinite(v)&&v>0?v:d}
const CONFIG={
  QUESTIONS_PER_SESSION:7,
  MOVE_ON_DELAY_MS:700,
  REVEAL_REACTION_MS:400,
  STAR_PER_CORRECT:1,
  STAR_STREAK_BONUS:1,
  TIME_TO_ANSWER_MS: readNum(LS.TIME_TO_ANSWER_MS, 15000), // ใช้จำกัดหลังบ้าน (ไม่โชว์บนจอ)
  DAILY_STAR_CAP:    readNum(LS.DAILY_STAR_CAP, 50),
  BONUS_T1_MS:       readNum(LS.BONUS_T1_MS, 1500),
  BONUS_T2_MS:       readNum(LS.BONUS_T2_MS, 3000),
};
const qp=new URLSearchParams(location.search);
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
  questionStage:$('#questionStage'), prompt:$('#prompt'), choices:$('#choices'),
  summary:$('#summary'), sumCorrect:$('#sumCorrect'), sumTotal:$('#sumTotal'), sumStars:$('#sumStars'),
  playAgain:$('#playAgain')
};
UI.qTotal.textContent=CONFIG.QUESTIONS_PER_SESSION;

// ===== dataset (ข้อความล้วน) =====
const SAMPLE={ items:[
  {id:'q-001', prompt:'ผลไม้ใดมีโพแทสเซียมสูงและสีเหลือง?', choices:['แอปเปิล','กล้วย','องุ่น','ส้ม'], answerIndex:1},
  {id:'q-002', prompt:'รถชนิดใดมีสองล้อ?', choices:['รถบัส','จักรยาน','รถไฟ','เรือ'], answerIndex:1},
  {id:'q-003', prompt:'สัตว์ใดบินได้?', choices:['ช้าง','ม้า','นก','สิงโต'], answerIndex:2},
  {id:'q-004', prompt:'2 + 3 เท่ากับเท่าใด?', choices:['4','5','6','7'], answerIndex:1},
  {id:'q-005', prompt:'กรุงเทพฯ เป็นเมืองหลวงของประเทศใด?', choices:['ไทย','ลาว','กัมพูชา','เมียนมา'], answerIndex:0},
  {id:'q-006', prompt:'วันศุกร์อยู่ถัดจากวันใด?', choices:['พุธ','พฤหัสบดี','เสาร์','อาทิตย์'], answerIndex:1},
  {id:'q-007', prompt:'สีของท้องฟ้าในวันที่อากาศแจ่มใสคือ?', choices:['เขียว','น้ำเงิน','แดง','เหลือง'], answerIndex:1},
]};
async function loadQuestions(){
  try{
    const res=await fetch('/data/questions/attention.json',{cache:'no-store'});
    if(res.ok){ const d=await res.json(); if(d && Array.isArray(d.items) && d.items.length) return d; }
  }catch{}
  return SAMPLE;
}

// ===== state =====
const state={ sessionId:`s_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, questions:[], current:-1, correct:0, stars:0, streak:0, questionShownAt:0, answering:false };

// ===== rendering =====
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
function showQuestion(q){
  UI.prompt.textContent=q.prompt;
  renderChoices(q);
  state.questionShownAt = now();
  state.answering = true;

  // มี time limit หลังบ้าน (ถ้าต้องการหมดเวลาอัตโนมัติ) — ไม่โชว์บนจอ
  const start = state.questionShownAt;
  const limit = CONFIG.TIME_TO_ANSWER_MS;
  (function tick(){
    if(!state.answering) return;
    const elapsed = now()-start;
    if(elapsed >= limit){
      state.answering=false;
      afterAnswer(q,{isCorrect:false,choiceIndex:-1,responseMs:limit});
    } else {
      requestAnimationFrame(tick);
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

  await sleep(CONFIG.REVEAL_REACTION_MS);
  await afterAnswer(q,{isCorrect,choiceIndex:idx,responseMs:rt});
}
async function afterAnswer(q,{isCorrect,choiceIndex,responseMs}){
  // คิดคะแนน/ดาว (ยังมีโบนัสเวลา แต่ไม่โชว์ตัวจับเวลาบนจอ)
  if(isCorrect){
    state.correct += 1; state.streak += 1;
    let bonus=0; if(responseMs<=CONFIG.BONUS_T1_MS) bonus=2; else if(responseMs<=CONFIG.BONUS_T2_MS) bonus=1;
    let streakBonus=(state.streak>=3)?CONFIG.STAR_STREAK_BONUS:0;
    state.stars += CONFIG.STAR_PER_CORRECT + bonus + streakBonus;
  } else {
    state.streak = 0;
  }

  // log การตอบ (เก็บ responseMs ไว้วิเคราะห์ภายหลัง)
  addAttempt({
    id:`a_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    sessionId:state.sessionId,
    questionId:q.id,
    answeredAt:new Date().toISOString(),
    isCorrect, responseMs, choiceIndex
  });

  // ต่อข้อถัดไป
  UI.correctCount.textContent = state.correct;
  UI.starsCount.textContent = state.stars;
  await sleep(CONFIG.MOVE_ON_DELAY_MS);
  nextQuestion();
}

// ===== session end =====
function endSession(){
  // ซ่อน phase คำถามทั้งหมด เหลือแค่สรุปผล
  UI.questionStage.hidden = true;

  // กำหนดดาวรายวัน
  const awarded=starsToday(); const remain=Math.max(0,CONFIG.DAILY_STAR_CAP - awarded);
  const grant=Math.min(state.stars,remain); const cut=state.stars-grant;
  if(grant>0) addStars(grant,`session:${state.sessionId}`);

  addSession({
    id: state.sessionId,
    score: state.correct,
    starsEarned: grant,
    endedAt: new Date().toISOString()
  });

  UI.sumCorrect.textContent = state.correct;
  UI.sumTotal.textContent = CONFIG.QUESTIONS_PER_SESSION;
  UI.sumStars.textContent = `${grant}${cut>0?` (จำกัด – ตัด ${cut})`:''}`;

  UI.summary.classList.add('active');
  UI.playAgain.onclick=()=>location.reload();
}

// ===== driver =====
async function nextQuestion(){
  state.current += 1;
  $('#qIndex').textContent = Math.min(state.current+1, CONFIG.QUESTIONS_PER_SESSION);
  if(state.current >= state.questions.length){ return endSession(); }
  const q = state.questions[state.current];
  showQuestion(q);
}

(async function start(){
  const dataset=await loadQuestions(); const all=dataset.items||[];
  if(all.length < CONFIG.QUESTIONS_PER_SESSION){ console.warn('คลังคำถามมีน้อยกว่า 7 ใช้เท่าที่มี'); }
  state.questions = pickUnique(all, CONFIG.QUESTIONS_PER_SESSION);
  nextQuestion();
})();
