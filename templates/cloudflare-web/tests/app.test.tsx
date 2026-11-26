import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';

const ADMIN = { id: 'usr-admin', email: 'admin@example.com', name: 'Sample Administrator', role: 'admin' };
const READER = { id: 'usr-reader', email: 'reader@example.com', name: 'Sample Reader', role: 'readonly' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// A fake server: GET /api/auth/me answers `me`, the sign-in accepts the administrator's sample password.
function fakeServer(me: Response | (() => Response)) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === '/api/auth/me') return typeof me === 'function' ? me() : me;
    if (url === '/api/auth/login') {
      const body = JSON.parse(String(init?.body)) as { password: string };
      return body.password === 'local-admin-2026' ? json({ user: ADMIN }) : json({ error: 'The email or the password is not correct.' }, 401);
    }
    if (url === '/api/auth/logout') return json({ ok: true });
    return json({ error: 'Not found' }, 404);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('the application', () => {
  it('asks to sign in, signs in, and signs out', async () => {
    const fetchMock = fakeServer(json({ error: 'There is no active session.' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'local-admin-2026');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Welcome, Sample Administrator' })).toBeInTheDocument();
    expect(screen.getByText('Can change data')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
  });

  it('says what is missing next to each empty field and keeps what was typed after a wrong password', async () => {
    vi.stubGlobal('fetch', fakeServer(json({ error: 'There is no active session.' }, 401)));
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The email or the password is not correct.');
    expect(screen.getByLabelText('Email')).toHaveValue('admin@example.com');
  });

  it('tells a read-only account that it can only read', async () => {
    vi.stubGlobal('fetch', fakeServer(json({ user: READER })));
    render(<App />);
    expect(await screen.findByRole('status')).toHaveTextContent('Your account can read, but not create, change or delete.');
    expect(screen.getByText('Read only')).toBeInTheDocument();
  });

  it('shows what went wrong when the server cannot be reached, and tries again on demand', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) throw new TypeError('Failed to fetch');
        return json({ user: ADMIN });
      }),
    );
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The server cannot be reached.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Welcome, Sample Administrator' })).toBeInTheDocument();
  });

  it('switches between light and dark and remembers the choice', async () => {
    vi.stubGlobal('fetch', fakeServer(json({ error: 'There is no active session.' }, 401)));
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme-mode')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });
});
