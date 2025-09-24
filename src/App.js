import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Practice from './components/Practice';
import Exam from './components/Exam';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import { supabase } from '.components/supabaseClient';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState(null);

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
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
  }, []);

  const loadUserProgress = async (userId) => {
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
        // Create initial progress record
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
    }
  };

  const updateProgress = async (updates) => {
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
  };

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

  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
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
