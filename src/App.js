// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Practice from './components/Practice';
import Exam from './components/Exam';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import { supabase } from './components/supabaseClient';
import './App.css';

function App() {
  // ------------------------------
  // ORIGINAL: state for real user session
  // const [user, setUser] = useState(null);
  // const [loading, setLoading] = useState(true);
  // ------------------------------

  // TEMPORARY: demo user to show content without authentication
  const [user, setUser] = useState({ id: 'demo', email: 'demo@test.com' });

  const [userProgress, setUserProgress] = useState(null);

  useEffect(() => {
    // ------------------------------
    // ORIGINAL: fetching session from Supabase
    /*
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

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
    return () => subscription.unsubscribe();
    */
    // ------------------------------

    // TEMPORARY: load demo progress
    const loadUserProgress = async () => {
      setUserProgress({ points: 0, streak: 0, skill_stats: {} });
    };
    loadUserProgress();
  }, []);

  const updateProgress = (updates) => {
    // ------------------------------
    // ORIGINAL: would check for user and call Supabase update
    /*
    if (!user || !userProgress) return;

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
    }
    */
    // ------------------------------

    // TEMPORARY: just update state
    setUserProgress((prev) => ({ ...prev, ...updates }));
  };

  // ------------------------------
  // ORIGINAL: loading screen
  /*
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  */
  // ------------------------------

  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        {/* Always render Header */}
        <Header user={user} userProgress={userProgress} />

        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route path="/" element={<Home userProgress={userProgress} />} />

          <Route
            path="/practice"
            element={<Practice
              user={user}
              userProgress={userProgress}
              updateProgress={updateProgress}
            />}
          />

          <Route
            path="/exam"
            element={<Exam
              user={user}
              userProgress={userProgress}
              updateProgress={updateProgress}
            />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard user={user} userProgress={userProgress} />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;