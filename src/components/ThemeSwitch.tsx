import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeSwitch: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const activeDark = stored === 'dark' || (!stored && prefersDark) || document.documentElement.classList.contains('dark');
      setIsDark(activeDark);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = !isDark;
    setIsDark(next);
    try {
      if (next) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {}
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-100 px-3 py-1.5 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="text-sm hidden sm:inline">{isDark ? 'Claro' : 'Oscuro'}</span>
      <span
        aria-hidden
        className={`ml-1 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : 'translate-x-1'}`}
        />
      </span>
    </button>
  );
};

export default ThemeSwitch;
