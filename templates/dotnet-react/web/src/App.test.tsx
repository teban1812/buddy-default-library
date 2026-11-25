import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

function renderApp() {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  )
}

test('shows the status returned by /api/health', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
  )
  vi.stubGlobal('fetch', fetchMock)

  renderApp()

  expect(await screen.findByText('API status: ok')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith('/api/health')
})

test('shows unreachable when /api/health fails, and checks again on demand', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 500 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  renderApp()
  expect(await screen.findByText('API status: unreachable')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Check again' }))
  expect(await screen.findByText('API status: ok')).toBeInTheDocument()
})

test('the mode switch toggles the dark class and remembers the choice', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }))))

  renderApp()
  await screen.findByText('API status: ok')
  await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

  expect(document.documentElement).toHaveClass('dark')
  expect(localStorage.getItem('theme-mode')).toBe('dark')
  expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
})
