import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ThemeToggle from "./components/ThemeToggle";
import PracticeSelection from "./components/PracticeSelection";
import Exam from "./exam";
import Dashboard from "./components/Dashboard";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
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
                {/* No strict login page for now — fallback demo user is always created */}
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
