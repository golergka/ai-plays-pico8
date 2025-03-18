import { testSchemaSystem } from './src/schema'

/**
 * Main entry point for the AI Plays Text Game project
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--test-schema')) {
    testSchemaSystem()
    return
  }
  
  // Default behavior if no arguments provided
  console.log('AI Plays Text Game')
  console.log('Run with --test-schema to test the schema system')
}

// Start the application
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})