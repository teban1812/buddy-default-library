import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [status, setStatus] = useState('checking...')

  const check = useCallback(() => {
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<{ status: string }>
      })
      .then((body) => setStatus(body.status))
      .catch(() => setStatus('unreachable'))
  }, [])

  useEffect(check, [check])

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">buddy-app</h1>
      <p className="mt-2 text-muted-foreground">API status: {status}</p>
      <Button className="mt-4" onClick={() => {
          setStatus('checking...')
          check()
        }}>
        Check again
      </Button>
    </main>
  )
}

export default App
