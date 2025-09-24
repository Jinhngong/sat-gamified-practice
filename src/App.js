import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Practice from './components/Practice';
import Exam from './exam'; // Keep your existing exam component
import Dashboard from './components/Dashboard';
import Auth from './auth'; // Keep your existing auth component
// Import Supabase client if it exists, otherwise use localStorage
let supabase = null;
try {
  supabase = require('./supabaseClient').supabase;
} catch (e) {
  console.log('Supabase not configured, using localStorage');
}

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    if (supabase) {
      // Use Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProgress(session.user.id);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            loadUserProgress(session.user.id);
          } else {
            setUserProgress(null);
          }
        }
      );

      setLoading(false);
      return () => subscription.unsubscribe();
    } else {
      // Use localStorage fallback
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = { id: currentUser, email: currentUser };
        setUser(userData);
        loadLocalProgress(currentUser);
      }
      setLoading(false);
    }
  };

  const loadUserProgress = async (userId) => {
    if (!supabase) {
      loadLocalProgress(userId);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading progress:', error);
        return;
      }

      if (data) {
        setUserProgress(data);
      } else {
        const initialProgress = {
          user_id: userId,
          points: 0,
          streak: 0,
          skill_stats: {}
        };

        const { data: newProgress, error: insertError } = await supabase
          .from('progress')
          .insert([initialProgress])
          .select()
          .single();

        if (!insertError) {
          setUserProgress(newProgress);
        }
      }
    } catch (error) {
      console.error('Error in loadUserProgress:', error);
      loadLocalProgress(userId);
    }
  };

  const loadLocalProgress = (userId) => {
    const progressKey = `sat_progress_${userId}`;
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    } else {
      const initialProgress = {
        user_id: userId,
        points: 0,
        streak: 0,
        skill_stats: {}
      };
      setUserProgress(initialProgress);
      localStorage.setItem(progressKey, JSON.stringify(initialProgress));
    }
  };

  const updateProgress = async (updates) => {
    if (!user) return;

    if (supabase && userProgress) {
      try {
        const { data, error } = await supabase
          .from('progress')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();

        if (!error && data) {
          setUserProgress(data);
        }
      } catch (error) {
        console.error('Error updating progress:', error);
        updateLocalProgress(updates);
      }
    } else {
      updateLocalProgress(updates);
    }
  };

  const updateLocalProgress = (updates) => {
    const progressKey = `sat_progress_${user.id}`;
    const updatedProgress = { ...userProgress, ...updates };
    setUserProgress(updatedProgress);
    localStorage.setItem(progressKey, JSON.stringify(updatedProgress));
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#64748b' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {user && <Header user={user} userProgress={userProgress} />}
        
        <Routes>
          <Route path="/auth" element={
            user ? <Navigate to="/" replace /> : <Auth />
          } />
          
          <Route path="/" element={
            !user ? <Navigate to="/auth" replace /> : 
            <Home userProgress={userProgress} />
          } />
          
          <Route path="/practice" element={
            !user ? <Navigate to="/auth" replace /> : 
            <Practice 
              user={user} 
              userProgress={userProgress} 
              updateProgress={updateProgress} 
            />
          } />
          
          <Route path="/exam" element={
            !user ? <Navigate to="/auth" replace /> : 
            <Exam 
              user={user} 
              userProgress={userProgress} 
              updateProgress={updateProgress} 
            />
          } />
          
          <Route path="/dashboard" element={
            !user ? <Navigate to="/auth" replace /> : 
            <Dashboard user={user} userProgress={userProgress} />
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
