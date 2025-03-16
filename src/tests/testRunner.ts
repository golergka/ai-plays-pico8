/**
 * Test Runner - Central system for running various test scenarios
 * 
 * This module provides a structured way to run different test scenarios
 * with standardized output formatting and error handling.
 */

import { setTimeout } from 'node:timers/promises'
import { Logger, LogLevel } from '../utils/logger'

/**
 * Test context object passed to test functions
 */
export interface TestContext {
  /** Test mode (self-test, interactive, etc.) */
  mode: TestMode
  /** Additional options passed to the test */
  [key: string]: any
}

/**
 * Test scenario configuration
 */
export interface TestScenario {
  /** Unique name of the test scenario */
  name: string
  /** Description of what the test verifies */
  description: string
  /** Function that actually runs the test */
  run: (options?: TestContext) => Promise<void>
  /** Whether this test requires user interaction to validate */
  requiresUserInteraction: boolean
  /** Optional additional configuration options */
  options?: Record<string, any>
  /** Platforms where this test can run (if not specified, all platforms are supported) */
  platforms?: string[]
}

/**
 * Test mode configuration
 */
export enum TestMode {
  /** Self-test mode (no user interaction, just verifies no errors) */
  SELF_TEST = 'self-test',
  /** Interactive test mode (requires user to observe and validate) */
  INTERACTIVE = 'interactive',
  /** Stress test mode (rapid repeated inputs) */
  STRESS_TEST = 'stress-test'
}

/**
 * Test runner configuration
 */
export interface TestRunnerConfig {
  /** Log level for test output */
  logLevel?: LogLevel
  /** Whether to exit the process when tests complete */
  exitOnComplete?: boolean
  /** Optional timeout for tests in milliseconds */
  timeout?: number
}

/**
 * Test runner class for managing test execution
 */
export class TestRunner {
  private logger: Logger
  private scenarios: Map<string, TestScenario> = new Map()
  private config: TestRunnerConfig
  
  /**
   * Creates a new test runner
   * @param config Test runner configuration
   */
  constructor(config: TestRunnerConfig = {}) {
    this.config = {
      logLevel: LogLevel.INFO,
      exitOnComplete: false,
      timeout: 60000, // 1 minute default timeout
      ...config
    }
    
    this.logger = new Logger({
      prefix: 'TestRunner',
      minLevel: this.config.logLevel || LogLevel.INFO
    })
  }
  
  /**
   * Register a test scenario with the runner
   * @param scenario The test scenario to register
   */
  registerScenario(scenario: TestScenario): void {
    if (this.scenarios.has(scenario.name)) {
      this.logger.warn(`Test scenario with name "${scenario.name}" is already registered. Overwriting.`)
    }
    
    this.scenarios.set(scenario.name, scenario)
    this.logger.debug(`Registered test scenario: ${scenario.name}`)
  }
  
  /**
   * Register multiple test scenarios at once
   * @param scenarios Array of test scenarios to register
   */
  registerScenarios(scenarios: TestScenario[]): void {
    for (const scenario of scenarios) {
      this.registerScenario(scenario)
    }
  }
  
  /**
   * Run a specific test scenario by name
   * @param name Name of the scenario to run
   * @param mode Test mode to run in
   * @param options Additional options to pass to the test
   */
  async runScenario(name: string, mode: TestMode, options?: any): Promise<void> {
    const scenario = this.scenarios.get(name)
    
    if (!scenario) {
      this.logger.error(`Test scenario "${name}" not found`)
      return
    }
    
    // Skip interactive tests in self-test mode
    if (mode === TestMode.SELF_TEST && scenario.requiresUserInteraction) {
      this.logger.info(`Skipping interactive test "${name}" in self-test mode`)
      return
    }
    
    try {
      this.printTestHeader(`RUNNING TEST: ${scenario.name}`)
      this.logger.info(`Description: ${scenario.description}`)
      this.logger.info(`Mode: ${mode}`)
      
      if (mode === TestMode.INTERACTIVE && scenario.requiresUserInteraction) {
        this.logger.info('\n==== INTERACTIVE TEST ====')
        this.logger.info('This test requires you to observe the results visually')
        this.logger.info('Please watch the PICO-8 window for visual feedback\n')
      }
      
      // Run the test with combined options
      const mergedOptions = {
        ...scenario.options,
        ...options,
        mode
      }
      
      // Create a timeout promise
      const timeoutMs = this.config.timeout || 60000
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(timeoutMs).then(() => {
          reject(new Error(`Test "${name}" timed out after ${timeoutMs}ms`))
        })
      })
      
      // Race the test execution against the timeout
      await Promise.race([
        scenario.run(mergedOptions),
        timeoutPromise
      ])
      
      this.logger.info(`Test "${name}" completed successfully`)
    } catch (error) {
      this.logger.error(`Error in test "${name}": ${error instanceof Error ? error.message : String(error)}`)
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Stack trace: ${error.stack}`)
      }
      
      // If this is a timeout error, attempt forced cleanup
      if (error instanceof Error && error.message.includes('timed out')) {
        this.logger.warn('Test timeout detected, attempting forced cleanup')
        // Force process exit if cleanup is enabled
        if (this.config.exitOnComplete) {
          process.exit(1)
        }
      }
    }
  }
  
  /**
   * Run all registered test scenarios
   * @param mode Test mode to run in
   * @param options Additional options to pass to the tests
   */
  async runAllScenarios(mode: TestMode, options?: any): Promise<void> {
    this.printTestHeader('RUNNING ALL TEST SCENARIOS')
    this.logger.info(`Mode: ${mode}`)
    this.logger.info(`Total scenarios: ${this.scenarios.size}`)
    
    let completed = 0
    let failed = 0
    let timedOut = 0
    
    for (const [name, scenario] of this.scenarios) {
      try {
        // Skip interactive tests in self-test mode
        if (mode === TestMode.SELF_TEST && scenario.requiresUserInteraction) {
          this.logger.info(`Skipping interactive test "${name}" in self-test mode`)
          continue
        }
        
        this.logger.info(`\nRunning test: ${name}`)
        
        // Run the test with combined options
        const mergedOptions = {
          ...scenario.options,
          ...options,
          mode
        }
        
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timeoutMs = this.config.timeout || 60000
          setTimeout(timeoutMs).then(() => {
            reject(new Error(`Test "${name}" timed out after ${timeoutMs}ms`))
          })
        })
        
        // Race the test execution against the timeout
        await Promise.race([
          scenario.run(mergedOptions),
          timeoutPromise
        ])
        
        this.logger.info(`Test "${name}" completed successfully`)
        completed++
      } catch (error) {
        this.logger.error(`Error in test "${name}": ${error instanceof Error ? error.message : String(error)}`)
        if (error instanceof Error && error.stack) {
          this.logger.debug(`Stack trace: ${error.stack}`)
        }
        
        // Check if this is a timeout error
        if (error instanceof Error && error.message.includes('timed out')) {
          this.logger.warn(`Test "${name}" timed out, attempting to continue with next test`)
          timedOut++
        }
        
        failed++
      }
      
      // Add a small delay between tests
      await setTimeout(1000)
    }
    
    this.printTestHeader('TEST SUMMARY')
    this.logger.info(`Total: ${this.scenarios.size}`)
    this.logger.info(`Completed: ${completed}`)
    this.logger.info(`Failed: ${failed}`)
    this.logger.info(`Timed Out: ${timedOut}`)
    this.logger.info(`Skipped: ${this.scenarios.size - completed - failed}`)
    
    if (this.config.exitOnComplete) {
      this.logger.info('Exiting...')
      process.exit(failed > 0 ? 1 : 0)
    }
  }
  
  /**
   * Print a visually distinct test header
   * @param message The header message to print
   */
  private printTestHeader(message: string): void {
    const border = '='.repeat(message.length + 8)
    console.log('\n\n')
    console.log('\x1b[36m%s\x1b[0m', border)  // Cyan color
    console.log('\x1b[36m%s\x1b[0m', `    ${message}    `)
    console.log('\x1b[36m%s\x1b[0m', border)
    console.log('\n')
  }
}