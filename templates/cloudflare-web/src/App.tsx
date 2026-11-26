import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '../functions/_lib/types.ts';
import { AppShell } from './components/AppShell.tsx';
import { SignIn } from './components/SignIn.tsx';

type SessionState =
  | { status: 'checking' }
  | { status: 'error'; message: string }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AuthUser };

// The application asks the server who is signed in (GET /api/auth/me) and shows the sign-in, the shell, or
// what went wrong with a way to try again: never a blank page.
export function App() {
  const [session, setSession] = useState<SessionState>({ status: 'checking' });

  const checkSession = useCallback(async () => {
    setSession({ status: 'checking' });
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (response.status === 401) return setSession({ status: 'signed-out' });
      if (!response.ok) return setSession({ status: 'error', message: 'Your session cannot be checked right now.' });
      const data = (await response.json()) as { user?: AuthUser };
      setSession(data.user ? { status: 'signed-in', user: data.user } : { status: 'signed-out' });
    } catch {
      setSession({ status: 'error', message: 'The server cannot be reached. Check that it is running.' });
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  async function signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (error) {
      // Even when the network fails, the page forgets the user and asks to sign in again; the server's
      // session then ends on its own when it expires.
      console.warn('The server could not be told about the sign-out.', error);
    }
    setSession({ status: 'signed-out' });
  }

  if (session.status === 'checking') {
    return (
      <div aria-busy="true" className="flex min-h-screen items-center justify-center bg-background p-6 text-muted-foreground">
        Checking your session...
      </div>
    );
  }

  if (session.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <section role="alert" className="flex max-w-md flex-col gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
          <h1 className="text-lg font-bold">Connection problem</h1>
          <p className="text-sm text-muted-foreground">{session.message}</p>
          <div>
            <button
              type="button"
              onClick={() => void checkSession()}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Try again
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (session.status === 'signed-out') {
    return <SignIn onSignedIn={(user) => setSession({ status: 'signed-in', user })} />;
  }

  return (
    <AppShell user={session.user} onSignOut={signOut}>
      <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
      <p className="text-muted-foreground">You are signed in. The project's first screens will appear here.</p>
    </AppShell>
  );
}
