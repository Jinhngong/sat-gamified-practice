// Utilities for progress tracking and adaptive selection
export function loadQuestions(){
  return fetch('/questions.json').then(r=>r.json());
}

const KEY = 'sat_gamified_v1';

// Get current user (local demo). Returns object {id, username} or null
export function getCurrentUser(){
  try{
    const u = localStorage.getItem('sat_user');
    return u ? JSON.parse(u) : null;
  }catch(e){ return null; }
}

function progressKey(userId){
  return userId ? `sat_progress_${userId}` : KEY;
}

export function loadProgress(user){
  try{
    const key = progressKey(user && user.id);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {points:0,streak:0,badges:[],skillStats:{}};
  }catch(e){ return {points:0,streak:0,badges:[],skillStats:{}}; }
}

export function saveProgress(obj, user){
  const key = progressKey(user && user.id);
  localStorage.setItem(key, JSON.stringify(obj));
}

// Records a result and returns updated progress
export function recordResult(question, correct, user){
  const p = loadProgress(user);
  const value = correct ? (question.difficulty==='Hard' ? 30 : question.difficulty==='Medium' ? 20 : 10) : 0;
  p.points = (p.points||0) + value;
  p.streak = correct ? (p.streak||0)+1 : 0;
  // badges
  if(p.streak>=5 && !p.badges.includes('5-streak')) p.badges.push('5-streak');
  if(p.points>=500 && !p.badges.includes('500-points')) p.badges.push('500-points');
  // skill stats
  const key = question.skill || 'General';
  p.skillStats[key] = p.skillStats[key] || {attempts:0,correct:0};
  p.skillStats[key].attempts++;
  if(correct) p.skillStats[key].correct++;
  saveProgress(p, user);
  return p;
}

// Adaptive selection: pick question by weighted sampling towards weaker skills
export function pickAdaptiveQuestion(questions, user){
  const progress = loadProgress(user);
  const skills = {};
  // compute accuracy per skill
  Object.entries(progress.skillStats || {}).forEach(([k,v])=>{
    const acc = v.attempts ? (v.correct||0)/v.attempts : 0.5;
    skills[k] = acc;
  });
  // for skills not yet seen, set neutral acc 0.6
  questions.forEach(q=>{ if(!(q.skill in skills)) skills[q.skill||'General'] = 0.6; });
  // weight = 1 - accuracy; ensure minimum
  const skillWeights = {};
  Object.entries(skills).forEach(([k,acc])=> skillWeights[k] = Math.max(0.05, 1 - acc));
  // choose a skill randomly weighted
  const skillPool = Object.keys(skillWeights);
  const totalW = skillPool.reduce((s,k)=>s+skillWeights[k],0);
  let r = Math.random()*totalW;
  let selectedSkill = skillPool[0];
  for(const k of skillPool){
    r -= skillWeights[k];
    if(r<=0){ selectedSkill = k; break; }
  }
  // filter questions for selectedSkill
  const qPool = questions.filter(q => (q.skill||'General') === selectedSkill);
  if(qPool.length===0) return questions[Math.floor(Math.random()*questions.length)];
  return qPool[Math.floor(Math.random()*qPool.length)];
}
