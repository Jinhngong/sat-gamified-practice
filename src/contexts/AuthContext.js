import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try Supabase session first (if you enable Supabase later)
    // const session = await supabase.auth.getSession();
    // if (session?.user) { setUser(session.user); return; }

    // Otherwise, load demo user
    const saved = localStorage.getItem("demo_user");
    if (saved) {
      setUser(JSON.parse(saved));
    } else {
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
