import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// findBy* and waitFor wait this long for the screen to change after render (TST-2): generous, so a slow
// machine or a busy CI agent does not fail a test that is right. Kept below the test timeout in vite.config.ts.
configure({ asyncUtilTimeout: 5000 })

afterEach(() => {
  cleanup()
})
