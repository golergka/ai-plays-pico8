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
      if (!pid) {
        this.process = null
        return {
          success: false,
          error: 'PICO-8 process has no valid PID'
        }
      }
      
      console.log(`Terminating PICO-8 process (PID: ${pid})...`)
      
      // Store reference to process and keep the reference until we confirm termination
      const processRef = this.process
      
      // Create a promise that resolves when the process exits
      const exitPromise = new Promise<void>((resolve) => {
        processRef.once('exit', () => {
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
      
      // First termination attempt
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
        
        // Check if process is still running
        try {
          // isProcessRunning will return true if process still exists
          const isStillRunning = await this.isProcessRunning(pid)
          
          if (isStillRunning) {
            console.log('Process still exists after SIGTERM, force killing with SIGKILL...')
            processRef.kill('SIGKILL')
            
            // Wait a bit to ensure kill takes effect
            await setTimeoutPromise(1000)
          } else {
            console.log('Process already terminated after SIGTERM')
          }
        } catch (err) {
          console.log('Error checking process state, assuming still running:', err)
          // Assume process is still running, try SIGKILL
          processRef.kill('SIGKILL')
          await setTimeoutPromise(1000)
        }
      }
      
      // OS-specific termination as a stronger approach
      if (process.platform === 'darwin') {
        // On macOS, use kill command to ensure termination
        try {
          // First, check if process is still running
          const isStillRunning = await this.isProcessRunning(pid)
          
          if (isStillRunning) {
            console.log(`Process still running after kill attempts, using system kill command (PID: ${pid})...`)
            // Force kill with signal 9 (SIGKILL)
            await execAsync(`kill -9 ${pid} || true`)
            
            // Wait a bit to ensure kill takes effect
            await setTimeoutPromise(500)
            
            // Final verification check
            const finalCheck = await this.isProcessRunning(pid)
            if (finalCheck) {
              console.log(`WARNING: Process with PID ${pid} is still running after all termination attempts!`)
            } else {
              console.log(`Confirmed process with PID ${pid} is terminated via system commands`)
            }
          } else {
            console.log(`Confirmed process with PID ${pid} is already terminated`)
          }
        } catch (externalKillError) {
          console.error('Error using system kill command:', externalKillError)
          // Last resort - try killing by process name (macOS specific)
          try {
            await execAsync('pkill -9 -x "PICO-8" || true')
            console.log('Attempted to kill all PICO-8 processes by name')
          } catch (pkillError) {
            console.error('Error using pkill command:', pkillError)
          }
        }
      } else if (process.platform === 'win32') {
        // Windows-specific termination check and force kill if needed
        try {
          const isStillRunning = await this.isProcessRunning(pid)
          
          if (isStillRunning) {
            console.log(`Process still running, using Windows taskkill (PID: ${pid})...`)
            await execAsync(`taskkill /F /PID ${pid}`)
          }
        } catch (winKillError) {
          console.error('Error using taskkill command:', winKillError)
        }
      } else if (process.platform === 'linux') {
        // Linux-specific termination check
        try {
          const isStillRunning = await this.isProcessRunning(pid)
          
          if (isStillRunning) {
            console.log(`Process still running, using Linux kill command (PID: ${pid})...`)
            await execAsync(`kill -9 ${pid} || true`)
            
            // Additional attempt by name if needed
            await execAsync('pkill -9 -x "pico8" || true')
          }
        } catch (linuxKillError) {
          console.error('Error using Linux kill commands:', linuxKillError)
        }
      }
      
      // Final verification check
      const finalRunningState = await this.isProcessRunning(pid)
      if (finalRunningState) {
        console.error(`WARNING: PICO-8 process (PID: ${pid}) could not be terminated after multiple attempts`)
      } else {
        console.log(`PICO-8 process (PID: ${pid}) successfully terminated`)
      }
      
      // Only clear our reference after all termination attempts
      this.process = null
      
      console.log('PICO-8 termination process complete')
      
      // Return appropriate result object based on termination success
      if (finalRunningState) {
        return {
          success: false,
          error: 'Process could not be fully terminated',
          pid: pid
        }
      } else {
        return {
          success: true,
          pid: pid
        }
      }
    } catch (error) {
      console.error(`Error during PICO-8 termination: ${error instanceof Error ? error.message : String(error)}`)
      
      // In case of error, still try to force kill to ensure cleanup
      if (this.process && this.process.pid) {
        const processRef = this.process
        const pid = processRef.pid
        
        try {
          console.log('Error occurred during regular termination, attempting emergency kill...')
          processRef.kill('SIGKILL')
          
          // Platform-specific emergency kill
          if (process.platform === 'darwin') {
            await execAsync(`kill -9 ${pid} || true`).catch(() => {})
            await execAsync('pkill -9 -x "PICO-8" || true').catch(() => {})
          } else if (process.platform === 'win32') {
            await execAsync(`taskkill /F /PID ${pid}`).catch(() => {})
          } else if (process.platform === 'linux') {
            await execAsync(`kill -9 ${pid} || true`).catch(() => {})
            await execAsync('pkill -9 -x "pico8" || true').catch(() => {})
          }
          
          // Wait a bit to ensure kill takes effect
          await setTimeoutPromise(1000)
        } catch (killError) {
          console.error('Emergency kill also failed:', killError)
        }
      }
      
      // Clear reference after all attempts
      this.process = null
      
      return {
        success: false,
        error: `Failed to close PICO-8: ${error instanceof Error ? error.message : String(error)}`
      }
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
      if (process.platform === 'darwin' || process.platform === 'linux') {
        // On macOS and Linux, we can use ps command
        const { stdout } = await execAsync(`ps -p ${pid} -o pid=`)
        // If the process exists, stdout will contain the PID
        return stdout.trim() !== ''
      } else if (process.platform === 'win32') {
        // On Windows, we can use tasklist command
        const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /NH`)
        // If the process exists, stdout will contain information about it
        return stdout.includes(pid.toString())
      } else {
        // For unsupported platforms, fall back to kill(0) method
        // This will throw an error if the process doesn't exist
        if (this.process && this.process.pid === pid) {
          return !this.process.killed && this.process.kill(0)
        }
        return false
      }
    } catch (error) {
      // If any error occurs during checking, assume the process is not running
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
}