import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, expect, test, vi } from 'vitest';
import { App } from '../src/App.tsx';

// The automated half of DSN-1 (contrast) and DSN-2 (keyboard): axe runs over each rendered screen and any
// violation fails the build. jsdom has no layout engine and cannot compute colours, so axe's colour-contrast
// rule cannot run here and is turned off: contrast (DSN-1) is checked by the reviewer, on the screen.
afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.classList.remove('dark');
});

async function violations(me: unknown, status: number, waitFor: string) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(me), { status })));
  const { container } = render(<App />);
  await screen.findByRole('heading', { name: waitFor });
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
}

const user = { id: 'usr-reader', email: 'reader@example.com', name: 'Sample Reader', role: 'readonly' };

for (const mode of ['light', 'dark']) {
  test(`the sign-in has no accessibility violations in ${mode} mode`, async () => {
    if (mode === 'dark') document.documentElement.classList.add('dark');
    expect(await violations({ error: 'There is no active session.' }, 401, 'Sign in')).toEqual([]);
  });

  test(`the signed-in shell has no accessibility violations in ${mode} mode`, async () => {
    if (mode === 'dark') document.documentElement.classList.add('dark');
    expect(await violations({ user }, 200, 'Welcome, Sample Reader')).toEqual([]);
  });
}
