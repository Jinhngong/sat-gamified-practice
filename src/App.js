import React, {useEffect, useState} from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './home';
import Practice from './practice';
import Exam from './exam';
import Dashboard from './dashboard';
import Auth from './auth';
import { getCurrentUser } from './utils';

export default function App(){
  const [theme, setTheme] = useState(localStorage.getItem('sat_theme') || 'dark');
  const [user, setUser] = useState(getCurrentUser());

  useEffect(()=>{
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('sat_theme', theme);
  },[theme]);

  function handleLogout(){
    localStorage.removeItem('sat_user');
    setUser(null);
    window.location.href = '/';
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1 style={{margin:0}}>SAT Gamified Practice</h1>
          <div className="small">Practice Rush • Exam Mode • Adaptive Practice</div>
        </div>
        <div className="header controls">
          <nav style={{display:'flex',gap:8}}>
            <Link to="/" className="small">Home</Link>
            <Link to="/practice" className="small">Practice</Link>
            <Link to="/exam" className="small">Exam</Link>
            <Link to="/dashboard" className="small">Dashboard</Link>
          </nav>
          <div style={{display:'flex',gap:8,alignItems:'center',marginLeft:12}}>
            <div className="small">Theme</div>
            <div className="switch" style={{cursor:'pointer'}} onClick={()=> setTheme(t=> t==='dark'?'light':'dark')}>
              {theme==='dark' ? '🌙 Dark' : '☀️ Light'}
            </div>
            {user ? (
              <div style={{display:'flex',gap:8,alignItems:'center',marginLeft:8}}>
                <div className="small">Hi, <strong>{user.username}</strong></div>
                <button className="button" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <Link to="/login"><button className="button">Sign in / Up</button></Link>
            )}
          </div>
        </div>
      </header>

      <main style={{marginTop:16}}>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/practice" element={<Practice/>} />
          <Route path="/exam" element={<Exam/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/login" element={<Auth onAuthChange={(u)=> setUser(u)} />} />
        </Routes>
        <footer style={{marginTop:20,fontSize:13,color:'#94a3b8'}}>Tip: data is saved locally in your browser (localStorage). To enable real accounts, integrate Supabase and configure env vars on Vercel.</footer>
      </main>
    </div>
  );
}
