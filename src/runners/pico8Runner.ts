import { spawn, exec, type ChildProcess } from 'node:child_process'
import { setTimeout as setTimeoutPromise } from 'node:timers/promises'
import { setTimeout } from 'node:timers'
import { promisify } from 'node:util'
import { type Pico8Config, type Pico8Result } from '../types/pico8'

// Promisify exec for async usage
const execAsync = promisify(exec)

/**
 * PICO-8 Game Runner
 * Handles launching and closing PICO-8 games programmatically
 */
export class Pico8Runner {
  process: ChildProcess | null = null
  private config: Pico8Config
  
  /**
   * Creates a new PICO-8 Runner
   * @param config Configuration for the PICO-8 runner
   */
  constructor(config: Pico8Config) {
    this.config = {
      launchTimeout: 5000, // 5 seconds default timeout
      ...config
    }
  }

  /**
   * Launches PICO-8 with the specified cartridge
   * @param cartridgePath Path to the .p8 or .p8.png cartridge file
   * @returns Result of the launch operation
   */
  async launch(cartridgePath?: string): Promise<Pico8Result> {
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
   * @param force If true, forcefully kills the process with SIGKILL
   * @param timeout Timeout in milliseconds to wait for process to exit before force killing
   * @returns Result of the close operation
   */
  async close(force = false, timeout = 3000): Promise<Pico8Result> {
    if (!this.process) {
      return {
        success: false,
        error: 'No PICO-8 process is running'
      }
    }
    
    try {
      const pid = this.process.pid
      console.log(`Terminating PICO-8 process (PID: ${pid})...`)
      
      // Create a promise that resolves when the process exits
      const exitPromise = new Promise<void>((resolve) => {
        if (!this.process) return resolve()
        
        this.process.once('exit', () => {
          console.log('Process exit event received')
          resolve()
        })
      })
      
      // Create a timeout promise
      const timeoutPromise = new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          console.log(`Timeout reached after ${timeout}ms waiting for PICO-8 to exit`)
          resolve()
        }, timeout)
        // Avoid keeping the Node.js event loop active
        if (timer.unref) timer.unref()
      })
      
      // Store reference before nulling it
      const processRef = this.process
      
      if (force) {
        // Force kill the process immediately
        console.log('Force killing PICO-8 process with SIGKILL...')
        processRef.kill('SIGKILL')
      } else {
        // Gracefully terminate the process
        console.log('Sending SIGTERM to PICO-8...')
        processRef.kill('SIGTERM')
        
        // Wait for process to exit or timeout
        await Promise.race([exitPromise, timeoutPromise])
        
        // If process is still running after timeout, force kill
        try {
          // Check if process is still running by sending signal 0
          // This will throw an error if process doesn't exist
          const killed = processRef.kill(0)
          if (!killed) {
            console.log('Process still exists, force killing with SIGKILL...')
            processRef.kill('SIGKILL')
            
            // Wait a bit to ensure kill takes effect
            await setTimeoutPromise(1000)
          }
        } catch (err) {
          // Error means process is already gone, which is good
          console.log('Process already terminated')
        }
      }
      
      // Clear our reference
      this.process = null
      
      // Use external process command as last resort to ensure termination
      try {
        // On macOS, use kill command to ensure termination
        if (process.platform === 'darwin' && pid) {
          console.log(`Using system kill command as final check (PID: ${pid})...`)
          // Force kill with signal 9 (SIGKILL)
          await execAsync(`kill -9 ${pid} || true`).catch(() => {
            // Ignore errors from kill command
            console.log('System kill command returned error (process likely already gone)')
          })
        }
      } catch (externalKillError) {
        console.log('External kill process error (can be ignored):', externalKillError)
      }
      
      console.log('PICO-8 termination process complete')
      // We know pid is valid by this point, otherwise we would have returned earlier
      return {
        success: true,
        pid: pid || 0 // Provide default value to satisfy type system
      }
    } catch (error) {
      console.error(`Error during PICO-8 termination: ${error instanceof Error ? error.message : String(error)}`)
      
      // In case of error, still try to force kill to ensure cleanup
      if (this.process) {
        const processRef = this.process
        this.process = null
        
        try {
          console.log('Error occurred during regular termination, attempting emergency kill...')
          processRef.kill('SIGKILL')
          
          // Also try system kill command as last resort
          if (process.platform === 'darwin' && processRef.pid) {
            await execAsync(`kill -9 ${processRef.pid} || true`).catch(() => {})
          }
        } catch (killError) {
          console.error('Emergency kill also failed:', killError)
        }
      }
      
      return {
        success: false,
        error: `Failed to close PICO-8: ${error instanceof Error ? error.message : String(error)}`
      }
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
}