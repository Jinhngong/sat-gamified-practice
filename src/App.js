// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ThemeToggle from "./components/ThemeToggle";
import PracticeSelection from "./components/PracticeSelection"; // keep existing
import Exam from "./Exam"; // important: matches src/Exam.js casing
import Dashboard from "./components/Dashboard"; // keep existing
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />; // fallback to home if no user
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div
            className="min-h-screen"
            style={{
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          >
            <header className="p-4 flex justify-between items-center bg-[var(--color-surface)]">
              <h1 className="text-xl font-bold">SAT Gamified Practice</h1>
              <ThemeToggle />
            </header>

            <main className="p-4">
              <Routes>
                <Route path="/" element={<PracticeSelection />} />
                <Route
                  path="/exam"
                  element={
                    <ProtectedRoute>
                      <Exam />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
