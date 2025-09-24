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

// ===== config (แก้เวลาได้ง่าย) =====
const LS={TIME_ON_IMAGE_MS:'game.timeOnImageMs', TIME_TO_ANSWER_MS:'game.timeToAnswerMs', DAILY_STAR_CAP:'game.dailyStarCap', BONUS_T1_MS:'game.bonusT1Ms', BONUS_T2_MS:'game.bonusT2Ms'};
const readNum=(k,d)=>{const v=Number(localStorage.getItem(k));return Number.isFinite(v)&&v>0?v:d}
const CONFIG={
  QUESTIONS_PER_SESSION:7,
  MOVE_ON_DELAY_MS:800,
  REVEAL_REACTION_MS:500,
  STAR_PER_CORRECT:1,
  STAR_STREAK_BONUS:1,
  TIME_ON_IMAGE_MS: readNum(LS.TIME_ON_IMAGE_MS, 30000), // 30s
  TIME_TO_ANSWER_MS: readNum(LS.TIME_TO_ANSWER_MS, 15000),
  DAILY_STAR_CAP:    readNum(LS.DAILY_STAR_CAP, 50),
  BONUS_T1_MS:       readNum(LS.BONUS_T1_MS, 1500),
  BONUS_T2_MS:       readNum(LS.BONUS_T2_MS, 3000),
};
const qp=new URLSearchParams(location.search);
if(qp.has('timeOnImageSec')){const v=Math.max(1,Number(qp.get('timeOnImageSec'))|0)*1000;localStorage.setItem(LS.TIME_ON_IMAGE_MS,String(v));CONFIG.TIME_ON_IMAGE_MS=v}
if(qp.has('timeToAnswerSec')){const v=Math.max(1,Number(qp.get('timeToAnswerSec'))|0)*1000;localStorage.setItem(LS.TIME_TO_ANSWER_MS,String(v));CONFIG.TIME_TO_ANSWER_MS=v}

// ===== storage (ดาว/สถิติแบบง่าย) =====
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
  progressBar:$('#progressBar'), imageStage:$('#imageStage'), qImage:$('#qImage'),
  questionStage:$('#questionStage'), prompt:$('#prompt'), choices:$('#choices'),
  answerSecs:$('#answerSecs'), rt:$('#rt'),
  summary:$('#summary'), sumCorrect:$('#sumCorrect'), sumTotal:$('#sumTotal'), sumStars:$('#sumStars'),
  playAgain:$('#playAgain')
};
UI.qTotal.textContent=CONFIG.QUESTIONS_PER_SESSION;
UI.answerSecs.textContent=Math.round(CONFIG.TIME_TO_ANSWER_MS/1000);

// ===== dataset (ถ้าไม่พบไฟล์ จะใช้ชุดตัวอย่าง) =====
const SAMPLE={
  items:[
    {id:'att-001', image:'/assets/images/game-images/attention/cat1.jpg',  prompt:'สัตว์ในภาพคืออะไร?', choices:['แมว','สุนัข','กระต่าย','หนู'], answerIndex:0},
    {id:'att-002', image:'/assets/images/game-images/attention/dog1.jpg',  prompt:'สัตว์ในภาพคืออะไร?', choices:['แมว','สุนัข','หมู','แพะ'],   answerIndex:1},
    {id:'att-003', image:'/assets/images/game-images/attention/apple1.jpg',prompt:'ของในภาพคืออะไร?',  choices:['ส้ม','กล้วย','แอปเปิล','แตงโม'], answerIndex:2},
    {id:'att-004', image:'/assets/images/game-images/attention/bus1.jpg',  prompt:'ยานพาหนะในภาพคืออะไร?', choices:['รถบัส','เรือ','เครื่องบิน','จักรยาน'], answerIndex:0},
    {id:'att-005', image:'/assets/images/game-images/attention/banana1.jpg',prompt:'ผลไม้ในภาพคืออะไร?',  choices:['แอปเปิล','กล้วย','สตอว์เบอร์รี','ส้ม'], answerIndex:1},
    {id:'att-006', image:'/assets/images/game-images/attention/bird1.jpg', prompt:'สัตว์ในภาพคืออะไร?', choices:['ปลา','นก','สุนัข','แมว'], answerIndex:1},
    {id:'att-007', image:'/assets/images/game-images/attention/car1.jpg',  prompt:'ยานพาหนะในภาพคืออะไร?', choices:['รถยนต์','รถไฟ','เรือ','เครื่องบิน'], answerIndex:0},
  ]
};
async function loadQuestions(){
  try{
    const res=await fetch('/data/questions/attention.json',{cache:'no-store'});
    if(res.ok){ const d=await res.json(); if(d && Array.isArray(d.items) && d.items.length) return d; }
  }catch{}
  return SAMPLE;
}

// ===== state =====
const state={ sessionId:`s_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, questions:[], current:-1, correct:0, stars:0, streak:0, imageShownAt:0, questionShownAt:0, answering:false };
const setPhase=(t)=>UI.phasePill.textContent=t;
const setProg=(r)=>UI.progressBar.style.width=`${(Math.max(0,Math.min(1,r))*100).toFixed(1)}%`;

// ===== phases =====
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
  setPhase('ดูภาพ'); UI.qImage.src=q.image; UI.imageStage.hidden=false; UI.questionStage.hidden=true;
  state.imageShownAt=now();
  const t=CONFIG.TIME_ON_IMAGE_MS; const s=now(); let raf;
  await new Promise(res=>{(function loop(){const e=now()-s; setProg(e/t); if(e>=t){cancelAnimationFrame(raf);res()} else {raf=requestAnimationFrame(loop)}})()});
}
async function showQuestionPhase(q){
  setPhase('คำถาม'); UI.imageStage.hidden=true; UI.questionStage.hidden=false; UI.rt.textContent='–';
  renderChoices(q); state.questionShownAt=now(); state.answering=true;
  const t=CONFIG.TIME_TO_ANSWER_MS; const s=state.questionShownAt; let raf;
  await new Promise(res=>{(function loop(){const e=now()-s; setProg(1-Math.min(1,e/t)); if(e>=t || !state.answering){cancelAnimationFrame(raf);res()} else {raf=requestAnimationFrame(loop)}})()});
  if(state.answering){ state.answering=false; await afterAnswer(q,{isCorrect:false,choiceIndex:-1,responseMs:CONFIG.TIME_TO_ANSWER_MS});}
}
async function handleAnswer(q,idx,isCorrect,btn){
  if(!state.answering) return; state.answering=false; const rt=Math.round(now()-state.questionShownAt);
  btn.classList.add(isCorrect?'correct':'wrong'); const em=btn.querySelector('.emoji'); em.textContent=isCorrect?'🙂':'😅'; btn.classList.add('show-emoji'); $$('.choice').forEach(b=>b.setAttribute('disabled',''));
  UI.rt.textContent=String(rt); await sleep(CONFIG.REVEAL_REACTION_MS); await afterAnswer(q,{isCorrect,choiceIndex:idx,responseMs:rt});
}
async function afterAnswer(q,{isCorrect,choiceIndex,responseMs}){
  if(isCorrect){
    state.correct+=1; state.streak+=1;
    let bonus=0; if(responseMs<=CONFIG.BONUS_T1_MS) bonus=2; else if(responseMs<=CONFIG.BONUS_T2_MS) bonus=1;
    let streakBonus=(state.streak>=3)?CONFIG.STAR_STREAK_BONUS:0;
    state.stars += CONFIG.STAR_PER_CORRECT + bonus + streakBonus;
  } else { state.streak=0; }
  addAttempt({id:`a_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, sessionId:state.sessionId, questionId:q.id, answeredAt:new Date().toISOString(), isCorrect, responseMs, choiceIndex});
  UI.correctCount.textContent=state.correct; UI.starsCount.textContent=state.stars;
  await sleep(CONFIG.MOVE_ON_DELAY_MS); nextQuestion();
}
function endSession(){
  setPhase('จบเกม'); UI.imageStage.hidden=true; UI.questionStage.hidden=true; UI.summary.classList.add('active');
  const awarded=starsToday(); const remain=Math.max(0,CONFIG.DAILY_STAR_CAP - awarded); const grant=Math.min(state.stars,remain); const cut=state.stars-grant;
  if(grant>0) addStars(grant,`session:${state.sessionId}`);
  addSession({id:state.sessionId, score:state.correct, starsEarned:grant, endedAt:new Date().toISOString()});
  UI.sumCorrect.textContent=state.correct; UI.sumTotal.textContent=CONFIG.QUESTIONS_PER_SESSION; UI.sumStars.textContent=`${grant}${cut>0?` (จำกัด – ตัด ${cut})`:''}`;
  UI.playAgain.onclick=()=>location.reload();
}
async function nextQuestion(){
  state.current+=1; UI.qIndex.textContent=Math.min(state.current+1,CONFIG.QUESTIONS_PER_SESSION); setProg(0);
  if(state.current>=state.questions.length) return endSession();
  const q=state.questions[state.current]; await showImagePhase(q); await showQuestionPhase(q);
}

// ===== boot =====
(async function start(){
  const dataset=await loadQuestions(); const all=dataset.items||[]; if(all.length<CONFIG.QUESTIONS_PER_SESSION) console.warn('คลังคำถามมีไม่ครบ 7 ข้อ ใช้เท่าที่มี');
  state.questions=pickUnique(all, CONFIG.QUESTIONS_PER_SESSION);
  // พรีโหลดภาพ
  state.questions.forEach(it=>{const im=new Image(); im.src=it.image;});
  nextQuestion();
})();
