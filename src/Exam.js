// src/Exam.js
import React from "react";
import { useAuth } from "./contexts/AuthContext";

const Exam = () => {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Exam Mode</h2>
      <p className="mb-4">User: <strong>{user?.name ?? "Guest"}</strong></p>

      <div className="rounded p-4 bg-[var(--color-surface)]">
        <p>This is a placeholder for your exam UI. Replace with your real Exam component later.</p>
        <p className="mt-3 text-sm text-muted">If you already have a full Exam component elsewhere, move it to <code>src/Exam.js</code> or update imports to match its location/casing.</p>
      </div>
    </div>
  );
};

export default Exam;
