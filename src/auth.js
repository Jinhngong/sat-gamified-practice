import React, {useState} from 'react';

function uuid(){
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.floor(Math.random()*10000);
}

export default function Auth({onAuthChange}){
  const [mode, setMode] = useState('login'); // login | signup
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  function loadUsers(){
    try{ return JSON.parse(localStorage.getItem('sat_users')||'{}'); }catch(e){ return {}; }
  }
  function saveUsers(u){ localStorage.setItem('sat_users', JSON.stringify(u)); }

  function signup(e){
    e.preventDefault();
    const users = loadUsers();
    if(!username || !password){ setErr('Enter username and password'); return; }
    if(users[username]){ setErr('User exists — choose a different username'); return; }
    const id = uuid();
    users[username] = {id, password};
    saveUsers(users);
    localStorage.setItem('sat_user', JSON.stringify({id, username}));
    setErr('');
    if(onAuthChange) onAuthChange({id, username});
  }

  function login(e){
    e.preventDefault();
    const users = loadUsers();
    if(!users[username] || users[username].password !== password){
      setErr('Invalid username or password');
      return;
    }
    const id = users[username].id;
    localStorage.setItem('sat_user', JSON.stringify({id, username}));
    setErr('');
    if(onAuthChange) onAuthChange({id, username});
  }

  return (
    <div className="card" style={{maxWidth:480}}>
      <h3>{mode==='login' ? 'Login' : 'Sign up'}</h3>
      <form onSubmit={mode==='login'?login:signup}>
        <div style={{marginTop:8}}>
          <label className="small">Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} style={{width:'100%',padding:8,borderRadius:6,marginTop:6}} />
        </div>
        <div style={{marginTop:8}}>
          <label className="small">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:8,borderRadius:6,marginTop:6}} />
        </div>
        {err && <div style={{color:'#ef4444',marginTop:8}}>{err}</div>}
        <div style={{marginTop:12,display:'flex',gap:8}}>
          <button className="button" type="submit">{mode==='login' ? 'Login' : 'Create account'}</button>
          <button type="button" onClick={()=>setMode(mode==='login'?'signup':'login')} className="button" style={{background:'#374151'}}>Switch to {mode==='login'?'Sign up':'Login'}</button>
        </div>
      </form>
    </div>
  );
}
