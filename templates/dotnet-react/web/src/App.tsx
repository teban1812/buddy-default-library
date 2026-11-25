import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

async function fetchHealth() {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as { status: string }
}

function App() {
  // The pattern for server data: a query per resource. A health check reports at once, so it does not retry.
  const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth, retry: false })
  const status = health.isError ? 'unreachable' : health.isFetching ? 'checking...' : health.data?.status

  return (
    <main className="mx-auto max-w-xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">buddy-app</h1>
        <ModeToggle />
      </div>
      <p className="mt-2 text-muted-foreground">API status: {status}</p>
      <Button className="mt-4" onClick={() => void health.refetch()}>
        Check again
      </Button>
    </main>
  )
}

export default App
