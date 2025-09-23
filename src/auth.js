import React, { useState, useEffect } from 'react';
import { signUp, signIn, signOut, getSession, onAuthStateChange } from './auth';

function AuthComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const currentSession = await getSession();
      setSession(currentSession);
    };

    fetchSession();

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async () => {
    const { user, error } = await signUp(email, password);
    if (error) alert(error.message);
    else alert(`Signed up as ${user.email}`);
  };

  const handleSignIn = async () => {
    const { user, error } = await signIn(email, password);
    if (error) alert(error.message);
    else alert(`Signed in as ${user.email}`);
  };

  const handleSignOut = async () => {
    const { message, error } = await signOut();
    if (error) alert(error.message);
    else alert(message);
  };

  return (
    <div>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button onClick={handleSignUp}>Sign Up</button>
      <button onClick={handleSignIn}>Sign In</button>
      <button onClick={handleSignOut}>Sign Out</button>
      {session && <p>Welcome, {session.user.email}</p>}
    </div>
  );
}

export default AuthComponent;
