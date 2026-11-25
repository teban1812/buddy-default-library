import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'

// The automated half of DSN-1 (contrast) and DSN-2 (keyboard): axe runs over the rendered page and any
// violation fails the build. jsdom has no layout engine and cannot compute colours, so axe's colour-contrast
// rule cannot run here and is turned off: contrast (DSN-1) is checked by the reviewer, on the screen.
afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
})

async function violationsOfApp() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }))))
  const { container } = render(
    <QueryClientProvider client={new QueryClient()}>
      <App />
    </QueryClientProvider>,
  )
  await screen.findByText('API status: ok')
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)
}

test('the page has no accessibility violations in light mode', async () => {
  expect(await violationsOfApp()).toEqual([])
})

test('the page has no accessibility violations in dark mode', async () => {
  document.documentElement.classList.add('dark')
  expect(await violationsOfApp()).toEqual([])
})
