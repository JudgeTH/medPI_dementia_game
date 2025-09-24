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
  // NEW: progress bar elements
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
  {id:'m-001', image:'/assets/images/pattern/fruits.jpg',  prompt:'จากภาพที่เห็น ผลไม้ชนิดใด "ไม่ได้" ปรากฏอยู่?', choices:['สตรอว์เบอร์รี','กล้วย','กีวี','แตงโม'], answerIndex:2},
  {id:'m-002', image:'/assets/images/pattern/station.jpg', prompt:'ในภาพมี “รถไฟ” หรือไม่?', choices:['มี','ไม่มี','ไม่แน่ใจ','เป็นสถานีรถเมล์'], answerIndex:0},
  {id:'m-003', image:'/assets/images/pattern/kitchen.jpg', prompt:'ในภาพ ห้องครัวมีของชิ้นใด?', choices:['ไมโครเวฟ','ทีวี','โน้ตบุ๊ก','จักรยาน'], answerIndex:0},
  {id:'m-004', image:'/assets/images/pattern/office.jpg',  prompt:'ในภาพมี “เก้าอี้” กี่ตัว?', choices:['1','2','3','มากกว่า 3'], answerIndex:3},
  {id:'m-005', image:'/assets/images/pattern/park.jpg',    prompt:'ภาพสวนสาธารณะมีอะไรเด่นที่สุด?', choices:['ม้านั่ง','สไลเดอร์','ลานสเก็ต','รถเข็น'], answerIndex:0},
  {id:'m-006', image:'/assets/images/pattern/class.jpg',   prompt:'ในภาพห้องเรียน มีวัตถุใดอยู่หน้าห้อง?', choices:['กระดาน','เตียง','ตู้เย็น','พัดลมเพดาน'], answerIndex:0},
  {id:'m-007', image:'/assets/images/pattern/pets.jpg',    prompt:'ในภาพมีสัตว์ชนิดใดมากที่สุด?', choices:['สุนัข','แมว','นก','หนูแฮมสเตอร์'], answerIndex:1},
]};
async function loadQuestions(){
  try{
    const res=await fetch('/data/questions/pattern.json',{cache:'no-store'});
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

  // show image + show progress
  UI.imageStage.hidden=false;
  UI.questionStage.hidden=true;
  if (UI.progressWrap) UI.progressWrap.hidden = false;

  setProgress(0);
  state.imageShownAt=now();

  // animate progress with RAF during the image phase
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

  // hide image and progress bar
  UI.imageStage.hidden = true;
  if (UI.progressWrap) UI.progressWrap.hidden = true;
  setProgress(0);

  // show text question
  UI.questionStage.hidden = false;
  UI.prompt.textContent = q.prompt;
  renderChoices(q);

  state.questionShownAt=now();
  state.answering=true;

  // invisible time limit (backend only)
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
  UI.imageStage.hidden = true;
  UI.questionStage.hidden = true;
  if (UI.progressWrap) UI.progressWrap.hidden = true;

  const awarded=starsToday(); const remain=Math.max(0,CONFIG.DAILY_STAR_CAP - awarded);
  const grant=Math.min(state.stars,remain); const cut=state.stars-grant;
  if(grant>0) addStars(grant,`session:${state.sessionId}`);

  addSession({
    id: state.sessionId,
    gameType: 'pattern',
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
  all.forEach(it=>{const im=new Image(); im.src=it.image;}); // preload images
  state.questions=pickUnique(all, CONFIG.QUESTIONS_PER_SESSION);
  nextQuestion();
})();
