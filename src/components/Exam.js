import React, {useEffect, useState} from 'react';
import { loadQuestions, recordResult, getCurrentUser } from './utils';
export default function Exam(){
  const [questions, setQuestions] = useState([]);
  const [order, setOrder] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  useEffect(()=>{ loadQuestions().then(q=>{ setQuestions(q||[]); setOrder((q||[]).map((_,i)=>i)); }); },[]);
  if(questions.length===0) return <div className="card">Loading questions...</div>;

  const q = questions[order[idx]];
  function pick(k){
    if(answers[q.id]) return;
    const correct = k===q.answer;
    setAnswers(prev=>({...prev,[q.id]:{choice:k,correct}}));
    recordResult(q, correct, getCurrentUser());
  }
  function next(){ setIdx(i=>Math.min(i+1, order.length-1)); }
  function prev(){ setIdx(i=>Math.max(i-1,0)); }
  const answeredCount = Object.keys(answers).length;
  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between'}}>
        <h3>Exam Mode</h3>
        <div className="small">Answered {answeredCount} / {order.length}</div>
      </div>
      <div style={{marginTop:12}}>
        <div className="small">{q.subject} • {q.sub} • {q.difficulty}</div>
        <div style={{fontWeight:700, marginTop:8}}>{q.question}</div>
        <div style={{marginTop:12,display:'grid',gap:8}}>
          {Object.entries(q.choices).map(([k,v])=>{
            const answered = answers[q.id];
            const isCorrect = answered && k===q.answer;
            const isWrong = answered && answered.choice===k && !answered.correct;
            return (
              <div key={k} onClick={()=>pick(k)} className={'choice ' + (isCorrect? 'correct': isWrong? 'wrong': '')}>
                <strong style={{marginRight:8}}>{k}.</strong>{v}
                {answered && isCorrect && <span style={{marginLeft:8,color:'#10b981'}}> ✓</span>}
                {answered && isWrong && <span style={{marginLeft:8,color:'#ef4444'}}> ✕</span>}
              </div>
            )
          })}
        </div>
        <div style={{marginTop:12,display:'flex',gap:8}}>
          <button onClick={prev} className="button">Prev</button>
          <button onClick={next} className="button">Next</button>
        </div>
      </div>
    </div>
  );
}