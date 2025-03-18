/**
 * Main entry point for the AI Plays Text Game project
 */
async function main() {
  // Default behavior if no arguments provided
  console.log('AI Plays Text Game')
  console.log('Run tests with: bun run test')
}

// Start the application
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})