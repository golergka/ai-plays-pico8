/**
 * Process Termination Tests
 * 
 * Tests for the process termination architecture in the Pico8Runner class.
 * This focuses specifically on the refactored termination code (T-119).
 */

import { Pico8Runner } from '../runners/pico8Runner'
import { getConfig } from '../config/env'
import { TestMode } from './testRunner'
import type { TestScenario, TestContext } from './testRunner'
import { setTimeout } from 'node:timers/promises'
import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import { TerminationStrategy } from '../types/pico8'

// Promisify exec for async usage
const execAsync = promisify(exec)

/**
 * Check if a process with the given PID exists
 * @param pid Process ID to check
 * @returns true if the process exists, false otherwise
 */
async function checkIfProcessExists(pid: number | null): Promise<boolean> {
  if (!pid) return false
  
  try {
    // Use platform-specific command to check if process exists
    if (process.platform === 'darwin' || process.platform === 'linux') {
      const { stdout } = await execAsync(`ps -p ${pid} -o pid=`)
      return stdout.trim() !== ''
    } else if (process.platform === 'win32') {
      const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /NH`)
      return stdout.includes(pid.toString())
    }
    
    return false
  } catch (error) {
    // If command fails, assume process doesn't exist
    return false
  }
}

/**
 * Forcefully kill a process by PID using OS-specific commands
 * @param pid Process ID to kill
 */
async function killProcessForcefully(pid: number): Promise<void> {
  console.log(`Forcefully killing process ${pid} with OS commands...`)
  
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      // First try a normal SIGKILL
      await execAsync(`kill -9 ${pid} || true`)
      
      // Double-check if process is gone
      if (await checkIfProcessExists(pid)) {
        // Try more aggressive methods if still running
        await execAsync(`pkill -9 -P ${pid} || true`)  // Kill children
        await execAsync(`kill -9 ${pid} || true`)      // Try again
      }
    } else if (process.platform === 'win32') {
      // Use taskkill with force option
      await execAsync(`taskkill /F /PID ${pid} /T`)
    }
    
    // Verify the process is gone
    if (await checkIfProcessExists(pid)) {
      console.warn(`Warning: Process ${pid} still exists after forced kill commands`)
    } else {
      console.log(`Process ${pid} successfully terminated`)
    }
  } catch (e) {
    console.error('Error during forced process kill:', e)
    throw e
  }
}

// Test scenarios for process termination
export const terminationTestScenarios: TestScenario[] = [
  {
    name: 'termination-standard',
    description: 'Tests standard process termination strategy',
    run: runStandardTerminationTest,
    requiresUserInteraction: false,
    platforms: ['darwin', 'win32', 'linux'],
  },
  {
    name: 'termination-force',
    description: 'Tests forced process termination',
    run: runForcedTerminationTest,
    requiresUserInteraction: false,
    platforms: ['darwin', 'win32', 'linux'],
  },
  {
    name: 'termination-emergency',
    description: 'Tests emergency process termination',
    run: runEmergencyTerminationTest,
    requiresUserInteraction: false,
    platforms: ['darwin', 'win32', 'linux'],
  },
]

/**
 * Run the termination tests
 * @param context Test context
 */
export async function runTerminationTests(context: TestContext): Promise<void> {
  // Run all termination test scenarios
  for (const scenario of terminationTestScenarios) {
    // Skip tests not applicable to this platform
    if (scenario.platforms && !scenario.platforms.includes(process.platform)) {
      console.log(`Skipping ${scenario.name} test (not supported on ${process.platform})`)
      continue
    }
    
    if (context.mode === TestMode.SELF_TEST) {
      console.log(`Running ${scenario.name} test...`)
      await scenario.run(context)
    } else {
      console.log(`Skipping ${scenario.name} test in interactive mode (not implemented)`)
    }
  }
}

/**
 * Base process termination test function
 * @param options Test context
 * @param terminationOptions Options for process termination
 * @returns 
 */
async function runBaseTerminationTest(
  _options: TestContext | undefined,
  terminationOptions: {
    force?: boolean,
    timeout?: number,
    startStrategy?: TerminationStrategy,
    description: string
  }
): Promise<void> {
  // Initialize environment config
  const config = getConfig()
  
  // Create PICO-8 runner
  const runner = new Pico8Runner({
    executablePath: config.PICO8_PATH,
    windowed: true,
    soundVolume: 0, // Mute sound for testing
    debug: true     // Enable debug logging
  })
  
  let pid: number | null = null
  
  try {
    // Launch PICO-8
    console.log('Launching PICO-8...')
    const result = await runner.launch(config.PICO8_DEFAULT_CARTRIDGE)
    
    if (!result.success) {
      throw new Error(`Failed to launch PICO-8: ${result.error}`)
    }
    
    console.log(`PICO-8 launched successfully with PID: ${result.pid}`)
    
    // Store the PID for later verification
    pid = result.pid
    
    // Wait briefly for PICO-8 to start
    console.log('Waiting briefly for PICO-8 to initialize...')
    await setTimeout(3000)
    
    // Verify process is running
    const isRunning = runner.isRunning()
    console.log(`PICO-8 is running: ${isRunning}`)
    
    if (!isRunning) {
      throw new Error('PICO-8 process exited unexpectedly')
    }
    
    // Test termination with provided options
    console.log(`Terminating PICO-8 with ${terminationOptions.description}...`)
    console.log(`Options: force=${terminationOptions.force}, timeout=${terminationOptions.timeout}ms` +
      (terminationOptions.startStrategy !== undefined ? `, strategy=${TerminationStrategy[terminationOptions.startStrategy]}` : ''))
    
    // Prepare termination options with correct types
    const closeOptions: {
      force?: boolean,
      timeout?: number,
      startStrategy?: TerminationStrategy
    } = {};
    
    if (typeof terminationOptions.force === 'boolean') {
      closeOptions.force = terminationOptions.force;
    }
    
    if (typeof terminationOptions.timeout === 'number') {
      closeOptions.timeout = terminationOptions.timeout;
    }
    
    if (typeof terminationOptions.startStrategy === 'number') {
      closeOptions.startStrategy = terminationOptions.startStrategy;
    }
    
    const termResult = await runner.close(closeOptions)
    
    // Check termination result
    if (!termResult.success) {
      console.error(`Termination failed: ${termResult.error}`)
      throw new Error(`${terminationOptions.description} termination failed`)
    }
    
    // Verify process is truly gone
    // Wait a moment for OS to fully release resources
    await setTimeout(1000)
    
    // Check if process still exists in the OS
    let processExists = await checkIfProcessExists(pid)
    
    // Final verification
    console.log(`Process exists check: ${processExists}`)
    console.log(`runner.isRunning(): ${runner.isRunning()}`)
    
    const success = !processExists && !runner.isRunning()
    
    if (success) {
      console.log(`✅ ${terminationOptions.description} termination test passed!`)
    } else {
      console.error(`❌ ${terminationOptions.description} termination test failed!`)
      
      // If process still exists, forcefully kill it
      if (processExists && pid) {
        await killProcessForcefully(pid)
      }
      
      throw new Error('Process termination test failed - process was not properly terminated')
    }
  } catch (error) {
    console.error('Error in termination test:', error)
    
    // Always ensure process is killed if we have a PID
    if (pid) {
      try {
        console.log(`Ensuring process ${pid} is terminated due to test error...`)
        await killProcessForcefully(pid)
      } catch (e) {
        console.error('Error during forced cleanup after test error:', e)
      }
    }
    
    throw error
  } finally {
    // Extra cleanup - make absolutely sure no processes are left
    if (runner.isRunning()) {
      console.log('Cleaning up with emergency termination...')
      try {
        // Use explicitly typed options to avoid TypeScript errors
        const emergencyOptions = {
          force: true,
          startStrategy: TerminationStrategy.EMERGENCY,
          timeout: 1000
        };
        await runner.close(emergencyOptions)
      } catch (e) {
        console.error('Error during emergency cleanup:', e)
      }
      
      // If we still have a PID, use OS commands as a last resort
      if (pid) {
        try {
          await killProcessForcefully(pid)
        } catch (e) {
          console.error('Fatal error: Failed to kill PICO-8 process in cleanup:', e)
        }
      }
    }
  }
}

/**
 * Test standard process termination
 * @param options Test context
 */
async function runStandardTerminationTest(options?: TestContext): Promise<void> {
  return runBaseTerminationTest(options, {
    force: false,
    timeout: 5000,
    description: 'standard'
  })
}

/**
 * Test forced process termination
 * @param options Test context
 */
async function runForcedTerminationTest(options?: TestContext): Promise<void> {
  return runBaseTerminationTest(options, {
    force: true,
    timeout: 3000,
    description: 'forced'
  })
}

/**
 * Test emergency process termination
 * @param options Test context
 */
async function runEmergencyTerminationTest(options?: TestContext): Promise<void> {
  return runBaseTerminationTest(options, {
    force: true,
    timeout: 2000,
    startStrategy: TerminationStrategy.EMERGENCY,
    description: 'emergency'
  })
}