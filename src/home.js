import React from 'react';
import { Link } from 'react-router-dom';
export default function Home(){
  return (
    <div className="card">
      <h2>Welcome</h2>
      <p className="small">Jump into Practice Rush for quick timed rounds or Exam mode for full-length tests. Choose English or Math, pick difficulty, and get instant feedback with gamified points, streaks, and badges.</p>

      <div style={{marginTop:12}} className="grid">
        <div className="card">
          <h3>Practice Rush</h3>
          <p className="small">30-second per question rounds. Fast, addictive, build streaks.</p>
          <Link to="/practice"><button className="button">Start Practice Rush</button></Link>
        </div>
        <div className="card">
          <h3>Exam Mode</h3>
          <p className="small">Timed sections, realistic pacing, section-level scoring.</p>
          <Link to="/exam"><button className="button">Start Exam Mode</button></Link>
        </div>
        <div className="card">
          <h3>Dashboard</h3>
          <p className="small">See your strengths and weaknesses by skill and difficulty.</p>
          <Link to="/dashboard"><button className="button">Open Dashboard</button></Link>
        </div>
      </div>
    </div>
  );
}
