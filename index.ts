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
      
      // Wait for PICO-8 to fully initialize
      console.log('Waiting for PICO-8 to initialize...')
      await setTimeout(3000)
      
      // Run a structured demo to visually verify input commands work
      console.log('Starting input verification demo...')
      
      // Test game has a simple character that moves with arrow keys and collects targets
      try {
        // First, move in a square pattern to demonstrate directional inputs
        console.log('Moving player in a square pattern...')
        
        // Move right
        console.log('Moving RIGHT for 1 second...')
        await input.pressButton(Pico8Button.Right)
        await setTimeout(1000)
        await input.releaseButton(Pico8Button.Right)
        await setTimeout(500)
        
        // Move down
        console.log('Moving DOWN for 1 second...')
        await input.pressButton(Pico8Button.Down)
        await setTimeout(1000)
        await input.releaseButton(Pico8Button.Down)
        await setTimeout(500)
        
        // Move left
        console.log('Moving LEFT for 1 second...')
        await input.pressButton(Pico8Button.Left)
        await setTimeout(1000)
        await input.releaseButton(Pico8Button.Left)
        await setTimeout(500)
        
        // Move up
        console.log('Moving UP for 1 second...')
        await input.pressButton(Pico8Button.Up)
        await setTimeout(1000)
        await input.releaseButton(Pico8Button.Up)
        await setTimeout(500)
        
        // Now demonstrate diagonal movement
        console.log('Moving in diagonal directions...')
        
        // Up-Right
        console.log('Moving UP-RIGHT for 1 second...')
        await input.pressButton(Pico8Button.Up)
        await input.pressButton(Pico8Button.Right)
        await setTimeout(1000)
        await input.releaseButton(Pico8Button.Up)
        await input.releaseButton(Pico8Button.Right)
        await setTimeout(500)
        
        // Down-Right
        console.log('Moving DOWN-RIGHT for 1 second...')
        await input.pressButton(Pico8Button.Down)
        await input.pressButton(Pico8Button.Right)
        await setTimeout(1000)
        await input.releaseButton(Pico8Button.Down)
        await input.releaseButton(Pico8Button.Right)
        await setTimeout(500)
        
        // Now demonstrate rapid button presses to collect targets
        console.log('Demonstrating rapid direction changes to collect targets...')
        
        // Send a sequence of rapid directional changes
        await input.sendButtonSequence([
          Pico8Button.Right, Pico8Button.Down, 
          Pico8Button.Left, Pico8Button.Up,
          Pico8Button.Right, Pico8Button.Right,
          Pico8Button.Down, Pico8Button.Down
        ], 100, 300)
        
        console.log('Input verification demo completed')
      } catch (error) {
        console.error('Error during input verification:', error)
      }
      
      // Set up graceful shutdown handler
      setupGracefulShutdown(runner, capture, input)
      
      // Run for 5 more seconds, then automatically exit
      console.log('Running for 5 more seconds before automatic shutdown...')
      await setTimeout(5000)
      
      console.log('Automatic shutdown initiated...')
      await gracefulShutdown(runner, capture, input)
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
    
    // Close PICO-8 if running
    if (runner && runner.isRunning()) {
      console.log('Closing PICO-8...')
      const result = await runner.close()
      if (result.success) {
        console.log('PICO-8 closed successfully')
      } else {
        console.error(`Failed to close PICO-8: ${result.error}`)
        console.log('Attempting force close...')
        await runner.close(true)
      }
    }
  } catch (error) {
    console.error('Error during shutdown:', error)
  } finally {
    // Always exit the process
    process.exit(0)
  }
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error in main:', error)
  process.exit(1)
})