"use client";

import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Login } from "@/components/Login";
import Cookies from "js-cookie";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      setIsAuthenticated(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.sub);
      } catch (err) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (userId: number) => {
    setUserId(userId);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    Cookies.remove("token");
    setUserId(null);
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return null; // Keep it blank while checking localStorage to avoid hydration mismatch flash
  }

  return isAuthenticated ? (
    <KanbanBoard userId={userId ?? undefined} onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  );
}
