"use client";

import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Login } from "@/components/Login";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    setIsAuthenticated(auth === "true");
  }, []);

  const handleLogin = () => {
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return null; // Keep it blank while checking localStorage to avoid hydration mismatch flash
  }

  return isAuthenticated ? (
    <KanbanBoard onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  );
}
