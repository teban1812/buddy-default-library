import { useState, type ReactNode } from 'react';
import type { AuthUser } from '../../functions/_lib/types.ts';
import { ModeToggle } from './ModeToggle.tsx';

interface AppShellProps {
  user: AuthUser;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}

const ROLE_LABELS = { admin: 'Can change data', readonly: 'Read only' } as const;

// The frame every screen lives in: the application's name, who is signed in and with which role, the
// light/dark switch and the way out. The project's navigation is added here when its first screens arrive.
export function AppShell({ user, onSignOut, children }: AppShellProps) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-6 py-3 text-sidebar-foreground">
        <span className="text-lg font-semibold">buddy-app</span>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</div>
          </div>
          <ModeToggle />
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </header>

      <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
        {user.role === 'readonly' && (
          <div role="status" className="rounded-md border border-border bg-accent px-4 py-3 text-sm text-accent-foreground">
            Your account can read, but not create, change or delete.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
