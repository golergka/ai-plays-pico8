import { Pico8Runner } from './src/runners/pico8Runner'
import { ScreenCapture } from './src/capture/screenCapture'
import { InputCommands, InputEvent } from './src/input/inputCommands'
import { getConfig } from './src/config/env'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CaptureEvent } from './src/types/capture'
import type { CaptureEventData } from './src/types/capture'
import { setTimeout } from 'node:timers/promises'
import type { InputEventData } from './src/input/inputCommands'
import { Pico8Button } from './src/types/input'

/**
 * Example usage of the PICO-8 Game Runner with Screen Capture and Input Commands
 */
async function main() {
  console.log('AI Plays PICO-8')
  
  let runner: Pico8Runner | null = null
  let capture: ScreenCapture | null = null
  let input: InputCommands | null = null
  
  try {
    // Get configuration from environment variables
    const config = getConfig()
    
    // Create PICO-8 runner with environment configuration
    runner = new Pico8Runner({
      executablePath: config.PICO8_PATH,
      windowed: config.PICO8_WINDOWED,
      soundVolume: config.PICO8_VOLUME
    })
    
    console.log('PICO-8 runner initialized successfully')
    
    // Variable to track if we have a valid cartridge to launch
    let cartridgePath: string | undefined
    
    // Check for default cartridge if specified
    if (config.PICO8_DEFAULT_CARTRIDGE && config.PICO8_DEFAULT_CARTRIDGE !== '') {
      cartridgePath = config.PICO8_DEFAULT_CARTRIDGE
      if (existsSync(cartridgePath)) {
        console.log(`Default cartridge found: ${cartridgePath}`)
      } else {
        console.warn(`Warning: Default cartridge not found at ${cartridgePath}`)
        cartridgePath = undefined
      }
    } else {
      console.log('No default cartridge specified, launching PICO-8 without a cartridge')
    }
    
    // Log debug information if enabled
    if (config.APP_DEBUG) {
      console.log('Debug mode enabled')
      console.log('Configuration:', {
        PICO8_PATH: config.PICO8_PATH,
        PICO8_WINDOWED: config.PICO8_WINDOWED,
        PICO8_VOLUME: config.PICO8_VOLUME,
        PICO8_DEFAULT_CARTRIDGE: config.PICO8_DEFAULT_CARTRIDGE || 'Not specified',
        CAPTURE_ENABLED: config.CAPTURE_ENABLED,
        CAPTURE_INTERVAL: config.CAPTURE_INTERVAL,
        CAPTURE_SAVE_TO_DISK: config.CAPTURE_SAVE_TO_DISK,
        CAPTURE_OUTPUT_DIR: config.CAPTURE_OUTPUT_DIR,
        CAPTURE_FORMAT: config.CAPTURE_FORMAT,
        CAPTURE_QUALITY: config.CAPTURE_QUALITY
      })
    }
    
    // Launch PICO-8 with cartridge if specified
    console.log('Launching PICO-8...')
    const result = await runner.launch(cartridgePath)
    
    if (result.success) {
      console.log(`PICO-8 launched successfully (PID: ${result.pid})`)
      
      // Setup a process exit handler to ensure app exits when PICO-8 exits
      if (runner.process) {
        runner.process.on('exit', (code) => {
          console.log(`PICO-8 process exited with code ${code}, shutting down application...`)
          // Make sure we exit the application
          process.exit(0)
        })
      }
      
      // Initialize screen capture if enabled
      if (config.CAPTURE_ENABLED) {
        console.log('Initializing screen capture...')
        
        capture = new ScreenCapture({
          interval: config.CAPTURE_INTERVAL || 1000,
          saveToDisk: config.CAPTURE_SAVE_TO_DISK,
          outputDir: config.CAPTURE_OUTPUT_DIR,
          imageFormat: (config.CAPTURE_FORMAT || 'png') as 'png' | 'jpg' | 'webp',
          imageQuality: config.CAPTURE_QUALITY || 90,
          windowTitle: 'PICO-8', // Explicitly set to capture PICO-8 window
          autoStopOnWindowClose: true, // Auto-stop when PICO-8 is closed
          debug: config.APP_DEBUG // Enable debug logging when in debug mode
        })
        
        // Set up capture event listeners
        capture.on(CaptureEvent.CAPTURE, (data: CaptureEventData) => {
          if (config.APP_DEBUG) {
            console.log(`Capture taken at ${new Date(data.timestamp).toISOString()}`)
            if (data.filePath) {
              console.log(`Saved to: ${data.filePath}`)
            }
          }
        })
        
        capture.on(CaptureEvent.ERROR, (data: CaptureEventData) => {
          console.error(`Capture error: ${data.error}`)
        })
        
        capture.on(CaptureEvent.STOP, () => {
          console.log('Screen capture stopped')
        })
        
        // Start capturing
        capture.start()
        console.log('Screen capture started')
        
        // Connect PICO-8 process exit to screen capture (also handled in global exit handler)
        if (runner.process) {
          runner.process.on('exit', () => {
            console.log('PICO-8 process exited, stopping screen capture')
            if (capture && capture.isActive()) {
              capture.stop()
            }
          })
        }
      }
      
      // Initialize input commands module
      console.log('Initializing input commands...')
      input = new InputCommands({
        windowTitle: 'PICO-8',
        delayBetweenKeys: 150,
        debug: config.APP_DEBUG
      })
      
      // Set up input event listeners
      input.on(InputEvent.BUTTON_PRESS, (data: InputEventData) => {
        if (config.APP_DEBUG) {
          console.log(`Button pressed: ${data.button} at ${new Date(data.timestamp).toISOString()}`)
        }
      })
      
      input.on(InputEvent.BUTTON_RELEASE, (data: InputEventData) => {
        if (config.APP_DEBUG) {
          console.log(`Button released: ${data.button} at ${new Date(data.timestamp).toISOString()}`)
        }
      })
      
      input.on(InputEvent.ERROR, (data: InputEventData) => {
        console.error(`Input error: ${data.error}`)
      })
      
      // Wait for PICO-8 to partially initialize
      // Note: We don't wait for the cartridge to fully load as that would require game-specific detection
      // Instead, we'll start sending inputs continuously which will work whether the cartridge is loaded or not
      console.log('Waiting briefly for PICO-8 window to appear...')
      await setTimeout(3000)
      
      /**
       * Continuous Input Demo
       * 
       * This section runs a continuous input demonstration that:
       * 1. Works during cartridge loading AND after loading completes
       * 2. Sends directions continuously for 30 seconds to ensure visibility
       * 3. Shows clear logging of which inputs are being sent
       * 4. Automatically terminates PICO-8 after the demo completes
       * 
       * Implementation notes:
       * - Does not rely on knowing when cartridge is loaded
       * - Will show inputs visibly whether in menu or gameplay
       * - Cycles through all directions repeatedly
       * - Occasionally sends special input patterns
       */
      console.log('Starting continuous input demo...')
      console.log('Pressing directional buttons to ensure input works during and after cartridge loading')
      
      // Our key_test cartridge provides immediate visual feedback for key presses
      try {
        // This demo runs for exactly 10 seconds with constantly changing inputs to maximize visibility
        // Even if cartridge is still loading or showing a menu, these inputs should be visible
        console.log('Starting 10-second continuous input test...')
        
        // Cycle through directions continuously for exactly 10 seconds
        const startTime = Date.now()
        const endTime = startTime + 10000 // 10 seconds of continuous input
        
        const directions = [
          Pico8Button.Right,
          Pico8Button.Down,
          Pico8Button.Left,
          Pico8Button.Up
        ]
        
        // Keep sending inputs until the end time
        while (Date.now() < endTime) {
          // Get time elapsed and calculate which phase we're in
          const elapsed = Date.now() - startTime
          const phaseIndex = Math.floor((elapsed / 1500) % directions.length)
          const currentDirection = directions[phaseIndex]
          
          // Log current direction every 1.5 seconds
          if (elapsed % 1500 < 50) {
            console.log(`Moving ${currentDirection.toUpperCase()} (${Math.floor(elapsed/1000)}s elapsed)`)
          }
          
          // Press current direction
          await input.pressButton(currentDirection)
          await setTimeout(300)
          await input.releaseButton(currentDirection)
          
          // Short pause between presses
          await setTimeout(50)
          
          // Every 5 seconds, try a special pattern
          if (Math.floor(elapsed / 5000) !== Math.floor((elapsed - 100) / 5000)) {
            console.log('Sending special button sequence...')
            // Try rapid directional changes to collect targets
            await input.sendButtonSequence([
              Pico8Button.Right, Pico8Button.Down, 
              Pico8Button.Left, Pico8Button.Up
            ], 100, 200)
          }
        }
        
        console.log('Continuous input test completed')
      } catch (error) {
        console.error('Error during input test:', error)
      }
      
      // Set up graceful shutdown handler
      setupGracefulShutdown(runner, capture, input)
      
      // Demo is complete, now kill PICO-8 with force
      console.log('Continuous input demo completed, forcefully shutting down PICO-8...')
      
      // First make sure screen capture is stopped
      if (capture && capture.isActive()) {
        console.log('Stopping screen capture...')
        capture.stop()
      }
      
      // Force kill PICO-8 to ensure termination
      if (runner && runner.isRunning()) {
        console.log('Force killing PICO-8 process...')
        await runner.close(true, 5000) // Force kill with 5-second timeout
      }
      
      console.log('Shutdown complete, exiting application.')
      process.exit(0)
    } else {
      console.error(`Failed to launch PICO-8: ${result.error}`)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Configuration error:', errorMessage)
    console.log('\nPlease create a .env file with the required configuration.')
    console.log('See .env.example for reference.')
  }
}

/**
 * Sets up graceful shutdown handlers for the application
 */
function setupGracefulShutdown(
  runner: Pico8Runner, 
  capture: ScreenCapture | null,
  input: InputCommands | null
): void {
  // Handle Ctrl+C and other termination signals
  process.on('SIGINT', async () => {
    console.log('\nShutting down...')
    await gracefulShutdown(runner, capture, input)
  })
  
  process.on('SIGTERM', async () => {
    console.log('\nReceived termination signal. Shutting down...')
    await gracefulShutdown(runner, capture, input)
  })
}

/**
 * Gracefully shuts down all processes
 * 
 * This function ensures that all resources are properly cleaned up:
 * 1. Stops the screen capture if it's active
 * 2. Terminates the PICO-8 process, using force if necessary
 * 3. Exits the application with a success code
 */
async function gracefulShutdown(
  runner: Pico8Runner, 
  capture: ScreenCapture | null,
  input: InputCommands | null
): Promise<void> {
  try {
    // Stop screen capture if running
    if (capture && capture.isActive()) {
      console.log('Stopping screen capture...')
      capture.stop()
    }
    
    // Close PICO-8 if running - with more robust termination
    if (runner && runner.isRunning()) {
      console.log('Closing PICO-8...')
      
      // First attempt graceful shutdown with 3 second timeout
      const result = await runner.close(false, 3000)
      
      if (result.success) {
        console.log('PICO-8 closed successfully')
      } else {
        console.error(`Failed to close PICO-8: ${result.error}`)
        console.log('Attempting force close...')
        
        // Force kill with SIGKILL if graceful shutdown failed
        const forceResult = await runner.close(true)
        
        if (forceResult.success) {
          console.log('PICO-8 force closed successfully')
        } else {
          console.error(`Failed to force close PICO-8: ${forceResult.error}`)
          // We'll still exit but log the failure
        }
      }
      
      // Double-check process is truly gone
      if (runner.isRunning()) {
        console.error('WARNING: PICO-8 process may still be running despite termination attempts')
      } else {
        console.log('Confirmed PICO-8 process is terminated')
      }
    }
  } catch (error) {
    console.error('Error during shutdown:', error)
  } finally {
    console.log('Exiting application...')
    // Always exit the process
    process.exit(0)
  }
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error in main:', error)
  process.exit(1)
})