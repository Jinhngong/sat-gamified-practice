import React, {useEffect, useState, useRef} from 'react';
import { loadQuestions, recordResult, loadProgress, pickAdaptiveQuestion, getCurrentUser } from './utils';
export default function Practice(){
  const [questions, setQuestions] = useState([]);
  const [qcur, setQcur] = useState(null);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [timePerQ, setTimePerQ] = useState(30);
  const [timer, setTimer] = useState(timePerQ);
  const timerRef = useRef(null);
  const [progress, setProgress] = useState(loadProgress(getCurrentUser()));

  useEffect(()=>{ loadQuestions().then(q=>setQuestions(q || [])); },[]);

  useEffect(()=>{
    if(!questions.length) return;
    setQcur(pickAdaptiveQuestion(questions, getCurrentUser()));
  },[questions]);

  useEffect(()=>{
    clearInterval(timerRef.current);
    setTimer(timePerQ);
    timerRef.current = setInterval(()=>{
      setTimer(t=>{
        if(t<=1){
          handleReveal(null);
          return timePerQ;
        }
        return t-1;
      });
    },1000);
    return ()=> clearInterval(timerRef.current);
  },[qcur, timePerQ]);

  if(!questions.length) return <div className="card">Loading questions...</div>;
  if(!qcur) return <div className="card">Preparing question...</div>;

  function pick(choice){
    if(revealed) return;
    setSelected(choice);
    handleReveal(choice);
  }
  function handleReveal(choice){
    const correct = choice === qcur.answer;
    setRevealed(true);
    const newProgress = recordResult(qcur, correct, getCurrentUser());
    setProgress(newProgress);
    setTimeout(()=>{
      setRevealed(false);
      setSelected(null);
      setQcur(pickAdaptiveQuestion(questions, getCurrentUser()));
    }, 800);
  }

  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3>Practice Rush (Adaptive)</h3>
        <div className="small">Points: {progress.points} • Streak: {progress.streak}</div>
      </div>

      <div style={{marginTop:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><strong>{qcur.subject} — {qcur.sub} • {qcur.skill} • {qcur.difficulty}</strong></div>
          <div className="small">Timer: <span className="badge">{timer}s</span></div>
        </div>
        <div style={{marginTop:10,fontWeight:600}}>{qcur.question}</div>

        <div style={{marginTop:12,display:'grid',gap:8}}>
          {Object.entries(qcur.choices).map(([k,v])=>{
            const isCorrect = revealed && k===qcur.answer;
            const isWrong = revealed && selected===k && k!==qcur.answer;
            return (
              <div key={k}
                onClick={()=>pick(k)}
                className={'choice ' + (isCorrect? 'correct': isWrong? 'wrong': '')}>
                <strong style={{marginRight:8}}>{k}.</strong>{v}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
