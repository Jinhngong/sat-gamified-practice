import React, {useEffect, useState} from 'react';
import { loadProgress, getCurrentUser } from './utils';
export default function Dashboard(){
  const [p, setP] = useState(loadProgress(getCurrentUser()));
  useEffect(()=>{ const t=setInterval(()=>setP(loadProgress(getCurrentUser())),800); return ()=>clearInterval(t); },[]);
  const skills = Object.entries(p.skillStats||{}).map(([k,v])=>({k,acc: v.attempts? Math.round(100*(v.correct||0)/v.attempts):0, ...v}));
  return (
    <div className="card">
      <h3>Dashboard</h3>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <div>
          <div className="small">Points</div>
          <div style={{fontSize:22,fontWeight:700}}>{p.points||0}</div>
        </div>
        <div>
          <div className="small">Streak</div>
          <div style={{fontSize:22,fontWeight:700}}>{p.streak||0}</div>
        </div>
        <div>
          <div className="small">Badges</div>
          <div style={{display:'flex',gap:8}}>{(p.badges||[]).map(b=><div key={b} className="badge">{b}</div>)}</div>
        </div>
      </div>

      <div style={{marginTop:12}}>
        <h4>Skill breakdown</h4>
        {skills.length===0 && <div className="small">No activity yet — do some Practice Rush rounds.</div>}
        {skills.map(s=>(
          <div key={s.k} style={{marginTop:8}} className="card">
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><strong>{s.k}</strong> <div className="small">{s.correct}/{s.attempts} correct</div></div>
              <div style={{width:200}}>
                <div className="progress-bar"><i style={{width: s.acc + '%'}}></i></div>
                <div className="small" style={{textAlign:'right'}}>{s.acc}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
