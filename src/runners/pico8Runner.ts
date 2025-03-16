import { spawn, exec, type ChildProcess } from 'node:child_process'
import { setTimeout as setTimeoutPromise } from 'node:timers/promises'
import { setTimeout } from 'node:timers'
import { promisify } from 'node:util'
import { type Pico8Config, type Pico8Result } from '../types/pico8'
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
    this.logger.debug(`Close called with force=${force}, timeout=${timeout}ms`)
    
    if (!this.process) {
      this.logger.debug('No PICO-8 process is running')
      return {
        success: false,
        error: 'No PICO-8 process is running'
      }
    }
    
    try {
      const pid = this.process.pid
      if (!pid) {
        this.logger.debug('PICO-8 process has no valid PID')
        this.process = null
        return {
          success: false,
          error: 'PICO-8 process has no valid PID'
        }
      }
      
      this.logger.info(`Terminating PICO-8 process (PID: ${pid})...`)
      
      // Store reference to process and keep the reference until we confirm termination
      const processRef = this.process
      
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
      
      // Step 1: Try standard Node.js process termination
      // ----------------------------------------------------
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
          }
        } catch (err) {
          this.logger.warn('Error checking process state, assuming still running:', err)
          processRef.kill('SIGKILL')
          await setTimeoutPromise(500)
        }
      }
      
      // Verification 1: Check if process is still running after standard Node termination
      let isStillRunning = await this.isProcessRunning(pid)
      if (!isStillRunning) {
        this.logger.info('PICO-8 process terminated successfully with standard Node.js methods')
        this.process = null
        return {
          success: true,
          pid: pid
        }
      }
      
      // Step 2: OS-specific termination with stronger methods
      // ----------------------------------------------------
      this.logger.warn(`PICO-8 process (PID: ${pid}) still running after standard termination. Using OS-specific methods...`)
      
      // Platform-specific termination strategies
      if (process.platform === 'darwin') {
        // macOS: Try multiple approaches
        
        // First try kill -9
        this.logger.debug(`Using macOS kill -9 command on PID ${pid}...`)
        try {
          await execAsync(`kill -9 ${pid} || true`);
          await setTimeoutPromise(300);
          
          isStillRunning = await this.isProcessRunning(pid);
          if (!isStillRunning) {
            this.logger.debug(`Successfully terminated process with kill -9`);
          } else {
            // If still running, try pkill with both uppercase and lowercase names
            this.logger.debug('Process still running, trying pkill commands on process name...');
            
            // Try multiple variants of the process name to ensure we catch it
            try {
              await execAsync('pkill -9 -x "PICO-8" || true');
              await execAsync('pkill -9 -x "pico8" || true');
              await execAsync('pkill -9 -x "pico-8" || true');
              await setTimeoutPromise(300);
            } catch (pkillError) {
              this.logger.error('Error using pkill command:', pkillError);
            }
          }
        } catch (killError) {
          this.logger.error('Error using kill -9 command:', killError);
        }
      } else if (process.platform === 'win32') {
        // Windows: Use taskkill with force option
        this.logger.debug(`Using Windows taskkill /F /PID ${pid}...`);
        try {
          await execAsync(`taskkill /F /PID ${pid}`);
          await setTimeoutPromise(300);
          
          // If still having issues, try by image name
          isStillRunning = await this.isProcessRunning(pid);
          if (isStillRunning) {
            this.logger.debug('Process still running, trying taskkill by image name...');
            // Try multiple possible image names
            await execAsync('taskkill /F /IM "pico8.exe" 2>nul || echo Not found');
            await execAsync('taskkill /F /IM "PICO-8.exe" 2>nul || echo Not found');
            await setTimeoutPromise(300);
          }
        } catch (taskkillError) {
          this.logger.error('Error using taskkill command:', taskkillError);
        }
      } else if (process.platform === 'linux') {
        // Linux: Use kill -9 and then pkill as fallback
        this.logger.debug(`Using Linux kill -9 command on PID ${pid}...`);
        try {
          await execAsync(`kill -9 ${pid} || true`);
          await setTimeoutPromise(300);
          
          isStillRunning = await this.isProcessRunning(pid);
          if (isStillRunning) {
            this.logger.debug('Process still running, trying pkill commands...');
            await execAsync('pkill -9 -x "pico8" || true');
            await execAsync('pkill -9 -x "PICO-8" || true');
            await execAsync('pkill -9 -x "pico-8" || true');
            await setTimeoutPromise(300);
          }
        } catch (linuxKillError) {
          this.logger.error('Error using Linux kill commands:', linuxKillError);
        }
      }
      
      // Verification 2: Check again after OS-specific methods
      isStillRunning = await this.isProcessRunning(pid);
      if (!isStillRunning) {
        this.logger.info('PICO-8 process terminated successfully with OS-specific methods');
        this.process = null;
        return {
          success: true,
          pid: pid
        };
      }
      
      // Step 3: Last resort - emergency termination
      // ----------------------------------------------------
      this.logger.error(`CRITICAL: PICO-8 process (PID: ${pid}) still running after multiple termination attempts!`);
      this.logger.debug('Attempting emergency termination procedures...');
      
      // For macOS, try a more aggressive approach with multiple commands
      if (process.platform === 'darwin') {
        try {
          // Try a sequence of increasingly aggressive commands
          await execAsync(`killall -KILL "PICO-8" 2>/dev/null || true`);
          await execAsync(`killall -KILL "pico8" 2>/dev/null || true`);
          await execAsync(`kill -9 ${pid} 2>/dev/null || true`);
          await execAsync(`sudo kill -9 ${pid} 2>/dev/null || true`);
          await setTimeoutPromise(500);
        } catch (macosEmergencyError) {
          this.logger.error('macOS emergency termination failed:', macosEmergencyError);
        }
      } else if (process.platform === 'win32') {
        try {
          // On Windows, try these more aggressive commands
          await execAsync(`taskkill /F /T /PID ${pid} 2>nul || echo Failed`);
          await execAsync(`wmic process where ProcessId=${pid} delete 2>nul || echo Failed`);
          await setTimeoutPromise(500);
        } catch (windowsEmergencyError) {
          this.logger.error('Windows emergency termination failed:', windowsEmergencyError);
        }
      } else if (process.platform === 'linux') {
        try {
          // On Linux, try these more aggressive commands
          await execAsync(`kill -9 -${processRef.pid} 2>/dev/null || true`); // Kill process group
          await execAsync(`killall -9 pico8 2>/dev/null || true`);
          await execAsync(`sudo kill -9 ${pid} 2>/dev/null || true`);
          await setTimeoutPromise(500);
        } catch (linuxEmergencyError) {
          this.logger.error('Linux emergency termination failed:', linuxEmergencyError);
        }
      }
      
      // Final verification
      isStillRunning = await this.isProcessRunning(pid);
      
      // Always clear our process reference regardless of termination success
      this.process = null;
      
      this.logger.info('PICO-8 termination process complete');
      
      if (isStillRunning) {
        this.logger.error(`CRITICAL: PICO-8 process (PID: ${pid}) could not be terminated despite all attempts`);
        this.logger.error(`You may need to manually terminate this process`);
        return {
          success: false,
          error: 'Process could not be fully terminated despite emergency measures',
          pid: pid
        };
      } else {
        this.logger.info(`PICO-8 process (PID: ${pid}) successfully terminated`);
        return {
          success: true,
          pid: pid
        };
      }
    } catch (error) {
      this.logger.error(`Error during PICO-8 termination: ${error instanceof Error ? error.message : String(error)}`);
      
      // Even in case of error, make maximum effort to kill the process
      if (this.process && this.process.pid) {
        const pid = this.process.pid;
        
        try {
          this.logger.debug('Error occurred during regular termination, attempting desperate emergency kill...');
          
          // Platform-specific desperate emergency kill attempts with all possible methods
          if (process.platform === 'darwin') {
            await Promise.allSettled([
              execAsync(`kill -9 ${pid} || true`),
              execAsync('pkill -9 -x "PICO-8" || true'),
              execAsync('pkill -9 -x "pico8" || true'),
              execAsync('killall -9 "PICO-8" || true'),
              execAsync('killall -9 "pico8" || true')
            ]);
          } else if (process.platform === 'win32') {
            await Promise.allSettled([
              execAsync(`taskkill /F /PID ${pid}`),
              execAsync('taskkill /F /IM "pico8.exe"'),
              execAsync('taskkill /F /IM "PICO-8.exe"')
            ]);
          } else if (process.platform === 'linux') {
            await Promise.allSettled([
              execAsync(`kill -9 ${pid} || true`),
              execAsync('pkill -9 -x "pico8" || true'),
              execAsync('pkill -9 -x "PICO-8" || true'),
              execAsync('killall -9 pico8 || true')
            ]);
          }
          
          // Final emergency wait
          await setTimeoutPromise(1000);
        } catch (finalKillError) {
          this.logger.error('Emergency kill procedures failed completely:', finalKillError);
        }
      }
      
      // Always clear reference at the end
      this.process = null;
      
      return {
        success: false,
        error: `Failed to close PICO-8: ${error instanceof Error ? error.message : String(error)}`
      };
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