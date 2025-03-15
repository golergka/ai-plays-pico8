import { Pico8Runner } from './src/runners/pico8Runner'
import { ScreenCapture } from './src/capture/screenCapture'
import { InputCommands, InputEvent } from './src/input/inputCommands'
import { Pico8Button } from './src/types/input'
import { getConfig } from './src/config/env'
import { existsSync } from 'node:fs'
import { CaptureEvent } from './src/types/capture'
import type { CaptureEventData } from './src/types/capture'
import { setTimeout } from 'node:timers/promises'
import type { InputEventData } from './src/input/inputCommands'
import { VisionFeedbackSystem } from './src/llm/visionFeedback'

/**
 * Example usage of the PICO-8 Game Runner with Screen Capture and Input Commands
 */
async function main() {
  console.log('AI Plays PICO-8')
  
  let runner: Pico8Runner | null = null
  let capture: ScreenCapture | null = null
  let input: InputCommands | null = null
  let visionSystem: VisionFeedbackSystem | null = null
  
  try {
    // Get configuration from environment variables
    const config = getConfig()
    
    // Create PICO-8 runner with environment configuration
    runner = new Pico8Runner({
      executablePath: config.PICO8_PATH,
      windowed: config.PICO8_WINDOWED === true,
      soundVolume: config.PICO8_VOLUME !== undefined ? config.PICO8_VOLUME : 128
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
        CAPTURE_QUALITY: config.CAPTURE_QUALITY,
        OPENAI_API_KEY: config.OPENAI_API_KEY ? 'Set' : 'Not set',
        OPENAI_MODEL: config.OPENAI_MODEL,
        OPENAI_MAX_TOKENS: config.OPENAI_MAX_TOKENS,
        OPENAI_TEMPERATURE: config.OPENAI_TEMPERATURE,
        LLM_CAPTURE_INTERVAL: config.LLM_CAPTURE_INTERVAL
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
          interval: config.CAPTURE_INTERVAL !== undefined ? config.CAPTURE_INTERVAL : 1000,
          saveToDisk: config.CAPTURE_SAVE_TO_DISK === true,
          outputDir: config.CAPTURE_OUTPUT_DIR || './captures',
          imageFormat: (config.CAPTURE_FORMAT || 'png') as 'png' | 'jpg' | 'webp',
          imageQuality: config.CAPTURE_QUALITY || 90,
          windowTitle: 'PICO-8', // Explicitly set to capture PICO-8 window
          autoStopOnWindowClose: true, // Auto-stop when PICO-8 is closed
          debug: config.APP_DEBUG === true // Enable debug logging when in debug mode
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
        debug: config.APP_DEBUG === true
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
      
      // Check if we're running the key test demo
      const runKeyTest = process.argv.includes('--key-test')
      
      if (runKeyTest && input) {
        // Run a key mapping test sequence using the test cartridge
        await runKeyMappingTest(input)
        
        // Exit after key test
        console.log('Key mapping test completed, shutting down...')
        
        // Force kill PICO-8 to ensure termination
        if (runner && runner.isRunning()) {
          console.log('Force killing PICO-8 process...')
          await runner.close(true, 5000) // Force kill with 5-second timeout
        }
        
        console.log('Shutdown complete, exiting application.')
        process.exit(0)
      } else {
        /**
         * Vision Feedback System Demo
         * 
         * This section starts the vision feedback system that:
         * 1. Captures screenshots of the PICO-8 window
         * 2. Sends them to an LLM for analysis
         * 3. Receives text feedback and suggested commands
         * 4. Executes the commands to control the game
         * 5. Runs for 60 seconds before gracefully shutting down
         */
        console.log('Starting vision feedback system...')
      
        try {
          // Ensure we have the OpenAI API key
          if (!config.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required for vision feedback')
          }
          
          // Make sure screen capture is enabled
          if (!config.CAPTURE_ENABLED || !capture) {
            throw new Error('Screen capture must be enabled for vision feedback system')
          }
          
          // Initialize the vision feedback system
          console.log('Initializing vision feedback system...')
          visionSystem = new VisionFeedbackSystem()
          
          // Wait briefly for PICO-8 window to fully initialize
          console.log('Waiting briefly for PICO-8 to initialize...')
          await setTimeout(3000)
          
          // Start the vision feedback system
          console.log('Starting vision feedback loop for 60 seconds...')
          
          // Start the vision feedback system
          visionSystem.start().catch(error => {
            console.error('Error in vision feedback system:', error)
          })
          
          // Run for 60 seconds then stop
          const demoTime = 60000 // 60 seconds
          console.log(`Vision feedback system will run for ${demoTime/1000} seconds...`)
          
          // Wait for the specified demo time
          await setTimeout(demoTime)
          
          // Stop the vision feedback system
          if (visionSystem) {
            console.log('Stopping vision feedback system...')
            visionSystem.stop()
          }
          
          // Wait for vision system to finish processing
          await setTimeout(1000)
          
          console.log('Vision feedback system demo completed')
        } catch (error) {
          console.error('Error during vision feedback demo:', error)
        }
        
        // Set up graceful shutdown handler
        setupGracefulShutdown(runner, capture, input, visionSystem)
        
        // Demo is complete, now kill PICO-8 with force
        console.log('Vision feedback demo completed, forcefully shutting down PICO-8...')
        
        // First make sure vision feedback system is stopped
        if (visionSystem) {
          console.log('Stopping vision feedback system...')
          visionSystem.stop()
        }
        
        // Make sure screen capture is stopped
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
      }
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
  input: InputCommands | null,
  visionSystem: VisionFeedbackSystem | null = null
): void {
  // Handle Ctrl+C and other termination signals
  process.on('SIGINT', async () => {
    console.log('\nShutting down...')
    await gracefulShutdown(runner, capture, input, visionSystem)
  })
  
  process.on('SIGTERM', async () => {
    console.log('\nReceived termination signal. Shutting down...')
    await gracefulShutdown(runner, capture, input, visionSystem)
  })
}

/**
 * Gracefully shuts down all processes
 * 
 * This function ensures that all resources are properly cleaned up:
 * 1. Stops the vision feedback system if it's active
 * 2. Stops the screen capture if it's active
 * 3. Terminates the PICO-8 process, using force if necessary
 * 4. Exits the application with a success code
 */
async function gracefulShutdown(
  runner: Pico8Runner, 
  capture: ScreenCapture | null,
  _input: InputCommands | null,
  visionSystem: VisionFeedbackSystem | null = null
): Promise<void> {
  try {
    // Stop vision feedback system if running
    if (visionSystem) {
      console.log('Stopping vision feedback system...')
      visionSystem.stop()
    }
    
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

/**
 * Run a comprehensive key mapping test
 * This will test all PICO-8 buttons to ensure they are working correctly
 * @param input The InputCommands instance to use
 */
async function runKeyMappingTest(input: InputCommands): Promise<void> {
  console.log('Running key mapping test sequence...')
  console.log('This will test all PICO-8 buttons with visual feedback')
  
  try {
    // First wait a moment to ensure PICO-8 is fully loaded
    console.log('Waiting for PICO-8 to fully load...')
    await setTimeout(2000)
    
    // Press each arrow key to move the character
    console.log('Testing arrow keys...')
    
    // Up arrow
    console.log('Testing UP arrow')
    await input.tapButton(Pico8Button.Up)
    await setTimeout(500)
    
    // Down arrow
    console.log('Testing DOWN arrow')
    await input.tapButton(Pico8Button.Down)
    await setTimeout(500)
    
    // Left arrow
    console.log('Testing LEFT arrow')
    await input.tapButton(Pico8Button.Left)
    await setTimeout(500)
    
    // Right arrow
    console.log('Testing RIGHT arrow')
    await input.tapButton(Pico8Button.Right)
    await setTimeout(500)
    
    // Test holding keys for movement
    console.log('Testing key hold for RIGHT arrow (2 seconds)')
    await input.pressButton(Pico8Button.Right)
    await setTimeout(2000)
    await input.releaseButton(Pico8Button.Right)
    await setTimeout(500)
    
    // Test action buttons
    console.log('Testing X and Z buttons...')
    
    // X button (O in PICO-8)
    console.log('Testing X button')
    await input.tapButton(Pico8Button.X)
    await setTimeout(500)
    
    // Z button (X in PICO-8)
    console.log('Testing Z button')
    await input.tapButton(Pico8Button.Z)
    await setTimeout(500)
    
    // Test diagonal movement (combination of keys)
    console.log('Testing diagonal movement (UP+RIGHT)')
    await input.pressButton(Pico8Button.Up)
    await setTimeout(100)
    await input.pressButton(Pico8Button.Right)
    await setTimeout(1000)
    await input.releaseButton(Pico8Button.Right)
    await setTimeout(100)
    await input.releaseButton(Pico8Button.Up)
    await setTimeout(500)
    
    // Test button sequences
    console.log('Testing button sequence...')
    await input.sendButtonSequence([
      Pico8Button.Up,
      Pico8Button.Down,
      Pico8Button.Left,
      Pico8Button.Right,
      Pico8Button.X,
      Pico8Button.Z
    ], 200, 300)
    
    // Final pause to observe results
    console.log('Key mapping test completed. Waiting 3 seconds before exit...')
    await setTimeout(3000)
    
  } catch (error) {
    console.error('Error during key mapping test:', error)
  }
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error in main:', error)
  process.exit(1)
})