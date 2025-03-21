import { spawn, exec, type ChildProcess } from 'node:child_process'
import { setTimeout as setTimeoutPromise } from 'node:timers/promises'
import { setTimeout } from 'node:timers'
import { promisify } from 'node:util'
import { type Pico8Config, type Pico8Result, TerminationStrategy, type TerminationOptions } from '../types/pico8'
import { createLogger } from '../utils/logger'

// Promisify exec for async usage
const execAsync = promisify(exec)

/**
 * PICO-8 Game Runner
 * Handles launching and closing PICO-8 games programmatically
 */
export class Pico8Runner {
  process: ChildProcess | null = null
  private config: Pico8Config
  private logger = createLogger('Pico8Runner')
  
  /**
   * Creates a new PICO-8 Runner
   * @param config Configuration for the PICO-8 runner
   */
  constructor(config: Pico8Config) {
    this.config = {
      launchTimeout: 5000, // 5 seconds default timeout
      ...config
    }
    
    // Enable debug logging if specified
    if (this.config.debug) {
      this.logger.debug('Debug logging enabled for Pico8Runner')
    }
  }

  /**
   * Launches PICO-8 with the specified cartridge
   * @param cartridgePath Path to the .p8 or .p8.png cartridge file
   * @returns Result of the launch operation
   */
  async launch(cartridgePath: string | undefined): Promise<Pico8Result> {
    // Don't launch if already running
    if (this.process) {
      return {
        success: false,
        error: 'PICO-8 is already running',
        // Only include pid if it's available
        ...(this.process.pid ? { pid: this.process.pid } : {})
      }
    }
    
    try {
      // Build arguments
      const args: string[] = [...(this.config.args || [])]
      
      // Add configuration flags
      if (this.config.splore) args.push('-splore')
      if (this.config.windowed) args.push('-windowed', '1')
      if (this.config.soundVolume !== undefined) {
        args.push('-volume', this.config.soundVolume.toString())
      }
      
      // Add cartridge if specified
      if (cartridgePath) {
        args.push('-run', cartridgePath)
      }
      
      // Launch PICO-8
      this.process = spawn(this.config.executablePath, args, {
        detached: false // Keep process attached to parent
      })
      
      // Set up error handling
      this.process.on('error', (err) => {
        console.error('PICO-8 process error:', err)
        this.process = null
      })
      
      this.process.on('exit', (code) => {
        console.log(`PICO-8 process exited with code ${code}`)
        this.process = null
      })
      
      // Wait a bit to ensure process starts correctly
      await setTimeoutPromise(100)
      
      // Check if process is actually running
      if (!this.process || this.process.killed) {
        return {
          success: false,
          error: 'Failed to start PICO-8 process'
        }
      }
      
      // Ensure we have a valid PID
      if (!this.process.pid) {
        return {
          success: false,
          error: 'PICO-8 process started but no PID was assigned'
        }
      }
      
      return {
        success: true,
        pid: this.process.pid
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to launch PICO-8: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
  
  /**
   * Closes the running PICO-8 process
   * @param options Termination options to control the process
   * @returns Result of the close operation
   */
  async close(options: TerminationOptions = {}): Promise<Pico8Result> {
    const { force = false, timeout = 3000, startStrategy = TerminationStrategy.STANDARD } = options
    
    this.logger.debug(`Close called with force=${force}, timeout=${timeout}ms, strategy=${TerminationStrategy[startStrategy]}`)
    
    // Validate process exists
    const validationResult = this.validateProcessBeforeTermination()
    if (!validationResult.success) {
      return validationResult
    }
    
    // We know process and pid are valid at this point
    const pid = this.process!.pid!
    
    try {
      this.logger.info(`Terminating PICO-8 process (PID: ${pid})...`)
      
      // Store reference to process and keep the reference until we confirm termination
      const processRef = this.process!
      
      // Create exit and timeout promises for waiting
      const { exitPromise, timeoutPromise } = this.createProcessWaitPromises(processRef, timeout)
      
      // Apply termination strategies in sequence, starting with the specified one
      let isStillRunning = true
      
      // Strategy 1: Standard Node.js termination
      if (startStrategy <= TerminationStrategy.STANDARD) {
        isStillRunning = await this.applyStandardTermination(processRef, pid, force, exitPromise, timeoutPromise)
        
        if (!isStillRunning) {
          this.logger.info('PICO-8 process terminated successfully with standard Node.js methods')
          this.process = null
          return { success: true, pid }
        }
      }
      
      // Strategy 2: macOS-specific termination methods
      if (startStrategy <= TerminationStrategy.OS_SPECIFIC) {
        this.logger.warn(`PICO-8 process (PID: ${pid}) still running. Using macOS-specific methods...`)
        isStillRunning = await this.applyOSSpecificTermination(processRef, pid)
        
        if (!isStillRunning) {
          this.logger.info('PICO-8 process terminated successfully with macOS-specific methods')
          this.process = null
          return { success: true, pid }
        }
      }
      
      // Final result handling
      this.process = null // Always clear our process reference regardless of termination success
      this.logger.info('PICO-8 termination process complete')
      
      if (isStillRunning) {
        this.logger.error(`CRITICAL: PICO-8 process (PID: ${pid}) could not be terminated despite all attempts`)
        this.logger.error('You may need to manually terminate this process')
        return {
          success: false,
          error: 'Process could not be fully terminated despite all available methods',
          pid
        }
      } else {
        this.logger.info(`PICO-8 process (PID: ${pid}) successfully terminated`)
        return { success: true, pid }
      }
    } catch (error) {
      this.logger.error(`Error during PICO-8 termination: ${error instanceof Error ? error.message : String(error)}`)
      
      // Try the final termination method as a last resort
      await this.applyFinalTermination()
      
      // Always clear reference at the end
      this.process = null
      
      return {
        success: false,
        error: `Failed to close PICO-8: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
  
  /**
   * Validates that the process exists and has a valid PID before termination
   * @returns Result indicating if the process is valid for termination
   */
  private validateProcessBeforeTermination(): Pico8Result {
    if (!this.process) {
      this.logger.debug('No PICO-8 process is running')
      return {
        success: false,
        error: 'No PICO-8 process is running'
      }
    }
    
    if (!this.process.pid) {
      this.logger.debug('PICO-8 process has no valid PID')
      this.process = null
      return {
        success: false,
        error: 'PICO-8 process has no valid PID'
      }
    }
    
    return { success: true, pid: this.process.pid }
  }
  
  /**
   * Creates promises for waiting on process exit or timeout
   * @param processRef Reference to the child process
   * @param timeout Timeout in milliseconds
   * @returns Object containing exit and timeout promises
   */
  private createProcessWaitPromises(processRef: ChildProcess, timeout: number) {
    // Create a promise that resolves when the process exits
    const exitPromise = new Promise<void>((resolve) => {
      processRef.once('exit', () => {
        this.logger.debug('Process exit event received')
        resolve()
      })
    })
    
    // Create a timeout promise
    const timeoutPromise = new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        this.logger.debug(`Timeout reached after ${timeout}ms waiting for PICO-8 to exit`)
        resolve()
      }, timeout)
      // Avoid keeping the Node.js event loop active
      if (timer.unref) timer.unref()
    })
    
    return { exitPromise, timeoutPromise }
  }
  
  /**
   * Applies standard Node.js termination methods (SIGTERM/SIGKILL)
   * @param processRef Reference to the child process
   * @param pid Process ID
   * @param force Whether to forcefully kill immediately with SIGKILL
   * @param exitPromise Promise that resolves when process exits
   * @param timeoutPromise Promise that resolves after timeout
   * @returns Boolean indicating if the process is still running
   */
  private async applyStandardTermination(
    processRef: ChildProcess,
    pid: number,
    force: boolean,
    exitPromise: Promise<void>,
    timeoutPromise: Promise<void>
  ): Promise<boolean> {
    if (force) {
      // Force kill the process immediately
      this.logger.debug('Force killing PICO-8 process with SIGKILL...')
      processRef.kill('SIGKILL')
    } else {
      // Gracefully terminate the process
      this.logger.debug('Sending SIGTERM to PICO-8...')
      processRef.kill('SIGTERM')
      
      // Wait for process to exit or timeout
      await Promise.race([exitPromise, timeoutPromise])
      
      // Check if process is still running
      try {
        const isStillRunning = await this.isProcessRunning(pid)
        
        if (isStillRunning) {
          this.logger.debug('Process still exists after SIGTERM, force killing with SIGKILL...')
          processRef.kill('SIGKILL')
          
          // Wait a bit to ensure kill takes effect
          await setTimeoutPromise(500)
        } else {
          this.logger.debug('Process already terminated after SIGTERM')
          return false
        }
      } catch (err) {
        this.logger.warn('Error checking process state, assuming still running:', err)
        processRef.kill('SIGKILL')
        await setTimeoutPromise(500)
      }
    }
    
    // Final verification for standard termination
    return await this.isProcessRunning(pid)
  }
  
  /**
   * Applies macOS-specific termination methods
   * @param processRef Reference to the child process
   * @param pid Process ID
   * @returns Boolean indicating if the process is still running
   */
  private async applyOSSpecificTermination(_processRef: ChildProcess, pid: number): Promise<boolean> {
    try {
      // This project currently only supports macOS
      if (process.platform !== 'darwin') {
        this.logger.warn(`Platform ${process.platform} is not officially supported, only macOS is supported`)
      }
      
      await this.applyMacOSTermination(pid)
    } catch (error) {
      this.logger.error(`Error in macOS-specific termination: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // Verify if process is still running after macOS-specific termination
    return await this.isProcessRunning(pid)
  }
  
  /**
   * Applies macOS-specific termination methods
   * @param pid Process ID
   */
  private async applyMacOSTermination(pid: number): Promise<void> {
    // First try kill -9
    this.logger.debug(`Using macOS kill -9 command on PID ${pid}...`)
    try {
      await execAsync(`kill -9 ${pid} || true`)
      await setTimeoutPromise(300)
      
      const isStillRunning = await this.isProcessRunning(pid)
      if (!isStillRunning) {
        this.logger.debug('Successfully terminated process with kill -9')
        return
      }
      
      // If still running, try pkill with multiple process name variants
      this.logger.debug('Process still running, trying pkill commands on process name...')
      
      try {
        // Try killall (macOS-specific)
        await execAsync('killall -9 "PICO-8" 2>/dev/null || true')
        await execAsync('killall -9 "pico8" 2>/dev/null || true')
        await execAsync('killall -9 "pico-8" 2>/dev/null || true')
        await setTimeoutPromise(300)
        
        // If still running, try more aggressive pkill
        if (await this.isProcessRunning(pid)) {
          await execAsync('pkill -9 -x "PICO-8" || true')
          await execAsync('pkill -9 -x "pico8" || true')
          await execAsync('pkill -9 -x "pico-8" || true')
          // Try pattern matching as a last resort
          await execAsync('pkill -9 -f "PICO.*8" || true')
          await setTimeoutPromise(300)
        }
      } catch (pkillError) {
        this.logger.error('Error using pkill/killall commands:', pkillError)
      }
    } catch (killError) {
      this.logger.error('Error using kill -9 command:', killError)
    }
  }
  
  /**
   * Applies final termination as a last attempt when errors occur
   * This runs all possible macOS termination commands as a last-ditch effort
   */
  private async applyFinalTermination(): Promise<void> {
    // If we can't get a valid process or PID, there's nothing we can do
    if (!this.process || !this.process.pid) {
      return
    }
    
    const pid = this.process.pid
    try {
      this.logger.debug('Error occurred during regular termination, attempting final kill...')
      
      // Run all possible macOS termination commands in parallel
      await Promise.allSettled([
        execAsync(`kill -9 ${pid} || true`),
        execAsync('pkill -9 -x "PICO-8" || true'),
        execAsync('pkill -9 -x "pico8" || true'),
        execAsync('pkill -9 -x "pico-8" || true'),
        execAsync('killall -9 "PICO-8" || true'),
        execAsync('killall -9 "pico8" || true'),
        execAsync('killall -9 "pico-8" || true'),
        execAsync('pkill -9 -f "PICO.*8" || true')
      ])
      
      // Final wait
      await setTimeoutPromise(1000)
    } catch (finalKillError) {
      this.logger.error('Final kill procedures failed:', finalKillError)
    }
  }
  
  /**
   * Helper method to check if a process with the given PID is still running
   * @param pid Process ID to check
   * @returns true if the process is running, false otherwise
   */
  private async isProcessRunning(pid: number): Promise<boolean> {
    if (!pid) return false
    
    try {
      // First, check if our internal process reference is still valid
      // This is the most reliable method if we still have a reference
      if (this.process && this.process.pid === pid && !this.process.killed) {
        try {
          const killResult = this.process.kill(0) // Doesn't actually kill, just tests if we can send signals
          if (killResult) {
            this.logger.debug(`Process ${pid} confirmed running via internal reference`)
            return true
          }
        } catch (e) {
          // If kill(0) throws, the process is gone
          this.logger.debug(`Process ${pid} not running according to internal reference`)
          return false
        }
      }
      
      // Use macOS-specific methods
      // This project currently only supports macOS
      if (process.platform !== 'darwin') {
        this.logger.warn(`Platform ${process.platform} is not officially supported, only macOS is supported`)
      }
      
      // On macOS, we use ps command
      const { stdout } = await execAsync(`ps -p ${pid} -o pid=`)
      const isRunning = stdout.trim() !== ''
      this.logger.debug(`Process ${pid} running status via ps: ${isRunning}`)
      return isRunning
    } catch (error) {
      // If any error occurs during checking, assume the process is not running
      this.logger.debug(`Error checking if process ${pid} is running: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }
  
  /**
   * Checks if PICO-8 is currently running
   * @returns true if PICO-8 is running, false otherwise
   */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed
  }
  
  /**
   * Updates the configuration for the PICO-8 runner
   * @param config New configuration options (partial)
   */
  updateConfig(config: Partial<Pico8Config>): void {
    this.config = {
      ...this.config,
      ...config
    }
  }
  
  /**
   * Synchronously close the PICO-8 process - emergency use only
   * This method is intended for use in process exit handlers
   * @param options Termination options
   * @returns Success status
   */
  closeSync(_options: { force: boolean } = { force: true }): boolean {
    if (!this.process || !this.process.pid) {
      return false
    }
    
    try {
      const pid = this.process.pid
      
      // Use OS-specific commands for immediate termination
      if (process.platform === 'darwin') {
        // Use kill -9 on macOS (SIGKILL) which is immediate
        try {
          // Synchronous child_process.execSync for immediate execution
          require('child_process').execSync(`kill -9 ${pid} 2>/dev/null || true`)
          require('child_process').execSync('killall -9 "PICO-8" 2>/dev/null || true')
          require('child_process').execSync('killall -9 "pico8" 2>/dev/null || true')
        } catch (e) {
          // Ignore errors in sync mode
        }
      }
      
      // Kill the direct process with SIGKILL for immediate termination
      try {
        this.process.kill('SIGKILL')
      } catch (e) {
        // Ignore errors in sync mode
      }
      
      // Update process state
      this.process = null
      
      return true
    } catch (error) {
      // In synchronous mode, we can only log the error
      console.error('Failed to close PICO-8 synchronously:', error)
      return false
    }
  }
}