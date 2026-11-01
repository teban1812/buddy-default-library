import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<{ status: string }>
      })
      .then((body) => setStatus(body.status))
      .catch(() => setStatus('unreachable'))
  }, [])

  return (
    <main>
      <h1>buddy-app</h1>
      <p>API status: {status}</p>
    </main>
  )
}

export default App
