import { spawn, type ChildProcess } from 'node:child_process'
import { setTimeout as setTimeoutPromise } from 'node:timers/promises'
import { setTimeout } from 'node:timers'
import { type Pico8Config, type Pico8Result } from '../types/pico8'

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
        pid: this.process.pid
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
      
      // Create a promise that resolves when the process exits
      const exitPromise = new Promise<void>((resolve) => {
        if (!this.process) return resolve()
        
        this.process.once('exit', () => {
          resolve()
        })
      })
      
      // Create a timeout promise
      const timeoutPromise = new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), timeout)
        // Avoid keeping the Node.js event loop active
        if (timer.unref) timer.unref()
      })
      
      if (force) {
        // Force kill the process immediately
        console.log('Force killing PICO-8 process...')
        this.process.kill('SIGKILL')
      } else {
        // Gracefully terminate the process
        console.log('Sending terminate signal to PICO-8...')
        this.process.kill('SIGTERM')
        
        // Wait for process to exit or timeout
        const raceResult = await Promise.race([exitPromise, timeoutPromise])
        
        // If timeout occurred and process is still running, force kill
        if (raceResult === undefined && this.process && !this.process.killed) {
          console.log(`PICO-8 process did not exit within ${timeout}ms, force killing...`)
          this.process.kill('SIGKILL')
        }
      }
      
      // Make sure reference is cleared
      const processRef = this.process
      this.process = null
      
      // Ensure the process is terminated (double-check)
      if (processRef && !processRef.killed) {
        try {
          processRef.kill('SIGKILL')
        } catch (err) {
          // Ignore errors here, we're just making sure
        }
      }
      
      return {
        success: true,
        pid
      }
    } catch (error) {
      // In case of error, still try to force kill to ensure cleanup
      if (this.process) {
        try {
          this.process.kill('SIGKILL')
          this.process = null
        } catch (killError) {
          // Ignore any errors during cleanup
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