import React from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import PracticeSelection from "./components/PracticeSelection";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
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
          <PracticeSelection />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
