// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // If you later add Supabase, check Supabase session here first.
    // For now: demo user fallback so app never blocks on missing session.
    const saved = localStorage.getItem("demo_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error("Invalid demo_user in localStorage", e);
        localStorage.removeItem("demo_user");
        createDemo();
      }
    } else {
      createDemo();
    }

    function createDemo() {
      const demo = { id: "demo-123", name: "Guest User" };
      localStorage.setItem("demo_user", JSON.stringify(demo));
      setUser(demo);
    }
  }, []);

  const loginDemoUser = (name = "Guest User") => {
    const demo = { id: "demo-123", name };
    localStorage.setItem("demo_user", JSON.stringify(demo));
    setUser(demo);
  };

  const logout = () => {
    localStorage.removeItem("demo_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginDemoUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
