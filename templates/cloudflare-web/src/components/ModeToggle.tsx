import { useState } from 'react';

const KEY = 'theme-mode';

// The choice is a UI preference, not a secret: it is kept in localStorage. Without one, the system's decides.
function initialDark(): boolean {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored === 'dark';
  } catch (error) {
    console.warn('The light/dark choice cannot be read; the system preference is used.', error);
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function ModeToggle() {
  const [dark, setDark] = useState(() => {
    const value = initialDark();
    document.documentElement.classList.toggle('dark', value);
    return value;
  });

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light');
    } catch (error) {
      console.warn('The light/dark choice cannot be kept; it lasts until the page is closed.', error);
    }
  }

  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
    >
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </>
        ) : (
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        )}
      </svg>
    </button>
  );
}
