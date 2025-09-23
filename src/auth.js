// src/auth.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sign up function
export const signUp = async (email, password) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

// Sign in function
export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

// Sign out function
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { message: error ? null : 'Signed out', error };
};

// Get current session
export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

// Auth state change subscription
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
