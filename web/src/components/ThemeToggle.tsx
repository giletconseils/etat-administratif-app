"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // Always start with the SSR default to avoid hydration mismatch
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // On mount, read stored preference and sync DOM attribute
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("theme") : null;
    const initial = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  // Persist and reflect changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const handleToggle = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  return (
    <button
      onClick={handleToggle}
      className="btn-cursor btn-cursor-secondary h-9 px-4 text-sm"
      aria-label="Basculer le thème"
      aria-pressed={theme === "dark"}
    >
      <div className="flex items-center gap-2">
        {theme === "light" ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        <span className="hidden sm:inline">
          {theme === "light" ? "Sombre" : "Clair"}
        </span>
      </div>
    </button>
  );
}


