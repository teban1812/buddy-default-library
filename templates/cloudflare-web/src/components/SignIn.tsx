import { useState, type FormEvent } from 'react';
import type { AuthUser } from '../../functions/_lib/types.ts';
import { ModeToggle } from './ModeToggle.tsx';

interface SignInProps {
  onSignedIn: (user: AuthUser) => void;
}

// Every field has its label; an error says what to do, next to its field, and keeps what was typed (DSN-3).
export function SignIn({ onSignedIn }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const trimmed = email.trim();
    setEmailError(trimmed ? '' : 'Enter your email.');
    setPasswordError(password ? '' : 'Enter your password.');
    if (!trimmed || !password) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: trimmed, password }),
      });
      const payload = (await response.json().catch(() => null)) as { user?: AuthUser; error?: string } | null;
      if (!response.ok || !payload?.user) {
        setFormError(payload?.error ?? 'You could not be signed in. Check your details and try again.');
        return;
      }
      onSignedIn(payload.user);
    } catch {
      setFormError('The server cannot be reached. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    'min-h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-foreground';
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <main className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Sign in</h1>
            <p className="text-sm text-muted-foreground">buddy-app</p>
          </div>
          <ModeToggle />
        </div>

        {formError && (
          <div role="alert" className="mb-4 rounded-md border border-destructive px-3.5 py-2.5 text-sm font-medium text-destructive">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sign-in-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="sign-in-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'sign-in-email-error' : undefined}
              className={field}
              required
            />
            {emailError && (
              <span id="sign-in-email-error" className="text-sm font-medium text-destructive">
                {emailError}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sign-in-password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="sign-in-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'sign-in-password-error' : undefined}
              className={field}
              required
            />
            {passwordError && (
              <span id="sign-in-password-error" className="text-sm font-medium text-destructive">
                {passwordError}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex min-h-10 w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </main>
    </div>
  );
}
