import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('shows the status returned by /api/health', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
  )
  vi.stubGlobal('fetch', fetchMock)

  render(<App />)

  expect(await screen.findByText('API status: ok')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith('/api/health')
})
