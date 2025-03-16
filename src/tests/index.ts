/**
 * Test CLI - Command-line interface for running tests
 * 
 * This module provides a convenient way to run tests from the command line.
 */

import { TestRunner, TestMode } from './testRunner'
import { inputTestScenarios } from './inputTests'
import { captureTestScenarios } from './captureTests'
import { terminationTestScenarios } from './terminationTest'

/**
 * Main test runner function
 * @param args Command-line arguments
 */
export async function runTests(args: string[]): Promise<void> {
  // Parse command line arguments
  const testNames = args.filter(arg => !arg.startsWith('--'))
  const mode = args.includes('--self') ? TestMode.SELF_TEST : TestMode.INTERACTIVE
  const exitOnComplete = !args.includes('--no-exit')
  
  // Create test runner
  const runner = new TestRunner({
    exitOnComplete
  })
  
  // Register test scenarios
  runner.registerScenarios(inputTestScenarios)
  runner.registerScenarios(captureTestScenarios)
  runner.registerScenarios(terminationTestScenarios)
  
  // Print test mode info
  console.log(`Running tests in ${mode} mode`)
  
  try {
    if (testNames.length > 0) {
      // Run specific tests in sequence
      for (const testName of testNames) {
        await runner.runScenario(testName, mode);
        console.log(); // Add empty line between tests
      }
    } else {
      // Run all tests
      await runner.runAllScenarios(mode);
    }
    
    // Ensure process exits after successful test completion
    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// If this module is run directly
if (typeof process !== 'undefined' && 
    process.argv[1] && 
    (process.argv[1].endsWith('tests/index.ts') || process.argv[1].endsWith('tests/index.js'))) {
  const args = process.argv.slice(2)
  
  runTests(args).catch(error => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}