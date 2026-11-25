import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const KEY = 'theme-mode'

// The choice is a UI preference, not a secret: it is kept in localStorage. Without one, the system's decides.
function initialDark() {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored) return stored === 'dark'
  } catch {
    // storage blocked: fall back to the system preference
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function ModeToggle() {
  const [dark, setDark] = useState(() => {
    const value = initialDark()
    document.documentElement.classList.toggle('dark', value)
    return value
  })

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light')
    } catch {
      // storage blocked: the choice lasts until the page is closed
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
