"use client";

import { useState } from "react";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "user" && password === "password") {
      onLogin();
    } else {
      setError("Invalid credentials (hint: user / password)");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80 border border-gray-200 dark:border-gray-700 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Kanban Studio
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to access your workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800 animate-pulse text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-shadow"
              placeholder="user"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-shadow"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 dark:text-gray-500 empty:hidden">
          Dummy credentials: user / password
        </div>
      </div>
    </div>
  );
}
