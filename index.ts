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
import { TerminationStrategy } from './src/types/pico8'

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
          
          // Stop screen capture if running
          if (capture && capture.isActive()) {
            console.log('Stopping screen capture due to PICO-8 process exit')
            capture.stop()
          }
          
          // Stop vision system if running
          if (visionSystem) {
            console.log('Stopping vision feedback system due to PICO-8 process exit')
            visionSystem.stop()
          }
          
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
        
        // Screen capture exit handling is now done in the main process exit handler above
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
          try {
            // Use a shorter timeout for faster termination
            await runner.close({ force: true, timeout: 2000 })
            
            // Double-check process truly exited
            if (runner.isRunning()) {
              console.error('CRITICAL: Process still running after standard termination!')
              
              // Direct OS command as last resort
              if (runner.process && runner.process.pid) {
                const pid = runner.process.pid
                console.log(`Using direct kill command on PID ${pid}...`)
                
                // Platform-specific emergency kill
                if (process.platform === 'darwin') {
                  // On macOS, use kill -9 and pkill
                  console.log('Using kill -9 and pkill commands on macOS...')
                  require('child_process').execSync(`kill -9 ${pid} || true`)
                  require('child_process').execSync('pkill -9 -x "pico8" || true')
                } else if (process.platform === 'win32') {
                  // On Windows, use taskkill /F
                  console.log('Using taskkill /F command on Windows...')
                  require('child_process').execSync(`taskkill /F /PID ${pid}`)
                } else if (process.platform === 'linux') {
                  // On Linux, use kill -9 and pkill
                  console.log('Using kill -9 and pkill commands on Linux...')
                  require('child_process').execSync(`kill -9 ${pid} || true`)
                  require('child_process').execSync('pkill -9 -x "pico8" || true')
                }
              }
            }
          } catch (error) {
            console.error('Error during PICO-8 termination:', error)
          }
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
          
          // Run for exactly 10 seconds then stop
          const demoTime = 10000 // 10 seconds
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
        
        // Force kill PICO-8 to ensure termination with extra safety measures
        if (runner && runner.isRunning()) {
          console.log('Force killing PICO-8 process...')
          await runner.close({ force: true, timeout: 2000 }) // Force kill with shorter timeout
          
          // Extra verification - use strongest OS termination if needed
          if (runner.isRunning()) {
            console.error('CRITICAL: Process still running after close! Using OS-specific termination strategy...')
            
            // Use the OS-specific termination strategy for macOS
            try {
              await runner.close({ force: true, startStrategy: TerminationStrategy.OS_SPECIFIC, timeout: 1000 })
              
              // Wait for termination to take effect
              await setTimeout(500)
            } catch (err) {
              console.error('Error during OS-specific termination:', err)
            }
          }
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
      
      try {
        // First attempt graceful shutdown with 3 second timeout
        const result = await runner.close({ force: false, timeout: 3000 })
        
        if (result.success) {
          console.log('PICO-8 closed successfully')
        } else {
          console.error(`Failed to close PICO-8: ${result.error}`)
          console.log('Attempting force close...')
          
          // Force kill with SIGKILL if graceful shutdown failed
          const forceResult = await runner.close({ force: true, timeout: 2000 })
          
          if (forceResult.success) {
            console.log('PICO-8 force closed successfully')
          } else {
            console.error(`Failed to force close PICO-8: ${forceResult.error}`)
          }
        }
        
        // Double-check process is truly gone
        if (runner.isRunning()) {
          console.error('WARNING: PICO-8 process still running - using OS-specific measures')
          
          // Use the OS-specific termination strategy for macOS
          try {
            console.log('Using macOS-specific termination strategy...')
            await runner.close({ force: true, startStrategy: TerminationStrategy.OS_SPECIFIC, timeout: 1000 })
            
            // Wait a short time for kill to take effect
            await setTimeout(500)
          } catch (err) {
            console.error('Error during OS-specific termination:', err)
          }
          
          // Final verification
          if (runner.isRunning()) {
            console.error('CRITICAL: PICO-8 process could not be terminated - may need manual cleanup')
          } else {
            console.log('Confirmed PICO-8 process is terminated after macOS-specific measures')
          }
        } else {
          console.log('Confirmed PICO-8 process is terminated')
        }
      } catch (error) {
        console.error('Error during termination:', error)
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
 * Run an interactive key mapping test
 * This will test each PICO-8 button individually with clear visual feedback
 * @param input The InputCommands instance to use
 */
async function runKeyMappingTest(input: InputCommands): Promise<void> {
  // Helper function to print visually distinct messages
  const printTestHeader = (message: string) => {
    const border = '='.repeat(message.length + 8);
    console.log('\n\n');
    console.log('\x1b[36m%s\x1b[0m', border);  // Cyan color
    console.log('\x1b[36m%s\x1b[0m', `    ${message}    `);  
    console.log('\x1b[36m%s\x1b[0m', border);
    console.log('\n');
  };
  
  try {
    printTestHeader('PICO-8 KEY TEST STARTING');
    console.log('This interactive test will help verify all PICO-8 controls');
    console.log('Watch the PICO-8 window for visual feedback after each key press');
    console.log('Each key will be kept pressed for 3 seconds for visibility\n');
    
    // Wait for PICO-8 to fully load
    printTestHeader('WAITING FOR PICO-8 TO LOAD');
    console.log('Please wait while PICO-8 initializes...');
    await setTimeout(5000);  // Longer wait to ensure cartridge is loaded
    
    // Test UP arrow
    printTestHeader('TESTING UP ARROW KEY');
    console.log('The heart should move UP');
    console.log('UP indicator should turn bright red and show "PRESSED"');
    await input.pressButton(Pico8Button.Up);
    await setTimeout(3000);  // Hold for 3 seconds for visibility
    await input.releaseButton(Pico8Button.Up);
    await setTimeout(2000);  // Pause between tests
    
    // Test DOWN arrow
    printTestHeader('TESTING DOWN ARROW KEY');
    console.log('The heart should move DOWN');
    console.log('DOWN indicator should turn bright red and show "PRESSED"');
    await input.pressButton(Pico8Button.Down);
    await setTimeout(3000);
    await input.releaseButton(Pico8Button.Down);
    await setTimeout(2000);
    
    // Test LEFT arrow
    printTestHeader('TESTING LEFT ARROW KEY');
    console.log('The heart should move LEFT');
    console.log('LEFT indicator should turn bright red and show "PRESSED"');
    await input.pressButton(Pico8Button.Left);
    await setTimeout(3000);
    await input.releaseButton(Pico8Button.Left);
    await setTimeout(2000);
    
    // Test RIGHT arrow
    printTestHeader('TESTING RIGHT ARROW KEY');
    console.log('The heart should move RIGHT');
    console.log('RIGHT indicator should turn bright red and show "PRESSED"');
    await input.pressButton(Pico8Button.Right);
    await setTimeout(3000);
    await input.releaseButton(Pico8Button.Right);
    await setTimeout(2000);
    
    // Test Z button (X in PICO-8)
    printTestHeader('TESTING Z BUTTON (X in PICO-8)');
    console.log('Z/O indicator should turn bright red and show "PRESSED"');
    await input.pressButton(Pico8Button.Z);
    await setTimeout(3000);
    await input.releaseButton(Pico8Button.Z);
    await setTimeout(2000);
    
    // Test X button (O in PICO-8)
    printTestHeader('TESTING X BUTTON (O in PICO-8)');
    console.log('X/X indicator should turn bright red and show "PRESSED"');
    await input.pressButton(Pico8Button.X);
    await setTimeout(3000);
    await input.releaseButton(Pico8Button.X);
    await setTimeout(2000);
    
    // Test diagonal movement
    printTestHeader('TESTING DIAGONAL MOVEMENT (UP+RIGHT)');
    console.log('The heart should move diagonally UP and RIGHT');
    console.log('Both UP and RIGHT indicators should show "PRESSED"');
    await input.pressButton(Pico8Button.Up);
    await input.pressButton(Pico8Button.Right);
    await setTimeout(3000);
    await input.releaseButton(Pico8Button.Right);
    await input.releaseButton(Pico8Button.Up);
    await setTimeout(2000);
    
    // Final test - rapid sequence
    printTestHeader('TESTING RAPID BUTTON SEQUENCE');
    console.log('All buttons will be pressed in sequence');
    console.log('Watch for visual feedback for each button');
    
    const buttons = [
      Pico8Button.Up,
      Pico8Button.Down,
      Pico8Button.Left,
      Pico8Button.Right,
      Pico8Button.X,
      Pico8Button.Z
    ];
    
    for (const button of buttons) {
      console.log(`Pressing ${button} button...`);
      await input.pressButton(button);
      await setTimeout(1000);
      await input.releaseButton(button);
      await setTimeout(500);
    }
    
    // Test complete
    printTestHeader('KEY TEST COMPLETE');
    console.log('All keys have been tested.');
    console.log('The test will exit in 5 seconds...');
    await setTimeout(5000);
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR DURING KEY TEST:'); // Red color
    console.error(error);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error in main:', error)
  process.exit(1)
})