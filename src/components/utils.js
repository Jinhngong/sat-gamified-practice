// Utilities for progress tracking and adaptive selection
import { supabase } from './components/supabaseClient';

export function loadQuestions() {
  return fetch('/questions.json').then(r => r.json());
}

// Get current user (from Supabase session or passed in)
export function getCurrentUser() {
  // Keep localStorage fallback if needed, or replace entirely with Supabase session
  try {
    const u = localStorage.getItem('sat_user');
    return u ? JSON.parse(u) : null;
  } catch (e) { return null; }
}

/**
 * Load progress for a specific user from Supabase
 */
export async function loadProgress(user) {
  if (!user?.id) return { points: 0, streak: 0, badges: [], skillStats: {} };

  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error loading progress:', error);
    return { points: 0, streak: 0, badges: [], skillStats: {} };
  }

  if (!data) {
    return { points: 0, streak: 0, badges: [], skillStats: {} };
  }

  return {
    points: data.points,
    streak: data.streak,
    badges: data.badges || [],
    skillStats: JSON.parse(data.skill_stats || '{}')
  };
}

/**
 * Save or update user progress to Supabase
 */
export async function saveProgress(progress, user) {
  if (!user?.id) return null;

  const payload = {
    user_id: user.id,
    points: progress.points || 0,
    streak: progress.streak || 0,
    badges: progress.badges || [],
    skill_stats: JSON.stringify(progress.skillStats || {}),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('progress')
    .upsert(payload, { onConflict: 'user_id' })
    .select();

  if (error) {
    console.error('Error saving progress:', error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Record a result (question answered) and return updated progress
 */
export async function recordResult(question, correct, user) {
  const p = await loadProgress(user);

  const value = correct
    ? (question.difficulty === 'Hard' ? 30
      : question.difficulty === 'Medium' ? 20
      : 10)
    : 0;

  p.points = (p.points || 0) + value;
  p.streak = correct ? (p.streak || 0) + 1 : 0;

  // badges
  if (p.streak >= 5 && !p.badges.includes('5-streak')) p.badges.push('5-streak');
  if (p.points >= 500 && !p.badges.includes('500-points')) p.badges.push('500-points');

  // skill stats
  const key = question.skill || 'General';
  p.skillStats[key] = p.skillStats[key] || { attempts: 0, correct: 0 };
  p.skillStats[key].attempts++;
  if (correct) p.skillStats[key].correct++;

  await saveProgress(p, user);
  return p;
}

/**
 * Adaptive question selection (unchanged)
 */
export async function pickAdaptiveQuestion(questions, user) {
  const progress = await loadProgress(user);
  const skills = {};

  Object.entries(progress.skillStats || {}).forEach(([k, v]) => {
    const acc = v.attempts ? (v.correct || 0) / v.attempts : 0.5;
    skills[k] = acc;
  });

  questions.forEach(q => {
    if (!(q.skill in skills)) skills[q.skill || 'General'] = 0.6;
  });

  const skillWeights = {};
  Object.entries(skills).forEach(([k, acc]) => skillWeights[k] = Math.max(0.05, 1 - acc));

  const skillPool = Object.keys(skillWeights);
  const totalW = skillPool.reduce((s, k) => s + skillWeights[k], 0);
  let r = Math.random() * totalW;
  let selectedSkill = skillPool[0];
  for (const k of skillPool) {
    r -= skillWeights[k];
    if (r <= 0) { selectedSkill = k; break; }
  }

  const qPool = questions.filter(q => (q.skill || 'General') === selectedSkill);
  if (qPool.length === 0) return questions[Math.floor(Math.random() * questions.length)];
  return qPool[Math.floor(Math.random() * qPool.length)];
}
