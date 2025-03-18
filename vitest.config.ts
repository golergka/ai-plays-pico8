import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Only show output on failures by default
    silent: true,
    // Include all files with .test.ts or .spec.ts in their name
    include: ['**/*.{test,spec}.ts'],
    // Exclude node_modules and other non-test files
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Format output for better readability
    reporters: ['default'],
  },
})