'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_COOKIE = 'vibrana-theme';
const COOKIE_DOMAIN = '.vibrana.ai';

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const domain = location.hostname === 'vibrana.ai' || location.hostname.endsWith('.vibrana.ai')
    ? `; Domain=${COOKIE_DOMAIN}`
    : '';
  document.cookie = `${THEME_COOKIE}=${theme}${domain}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}

export function ThemeToggle() {
  const [darkEnabled, setDarkEnabled] = useState(false);

  useEffect(() => {
    const savedTheme = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${THEME_COOKIE}=`))
      ?.split('=')[1];
    const theme = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    setDarkEnabled(theme === 'dark');
  }, []);

  function toggleTheme() {
    const nextTheme = darkEnabled ? 'light' : 'dark';
    applyTheme(nextTheme);
    setDarkEnabled(nextTheme === 'dark');
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={darkEnabled ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={darkEnabled}
      title={darkEnabled ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-subtle text-ink-secondary transition-colors hover:bg-surface-card-hover hover:text-ink"
    >
      {darkEnabled ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  );
}
