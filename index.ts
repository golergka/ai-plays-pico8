import { Pico8Runner } from './src/runners/pico8Runner'
import { ScreenCapture } from './src/capture/screenCapture'
import { getConfig } from './src/config/env'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CaptureEvent } from './src/types/capture'
import type { CaptureEventData } from './src/types/capture'

/**
 * Example usage of the PICO-8 Game Runner with Screen Capture
 */
async function main() {
  console.log('AI Plays PICO-8')
  
  let runner: Pico8Runner | null = null
  let capture: ScreenCapture | null = null
  
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
          autoStopOnWindowClose: true // Auto-stop when PICO-8 is closed
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
        
        // Connect PICO-8 process exit to screen capture
        if (runner.process) {
          runner.process.on('exit', () => {
            console.log('PICO-8 process exited, stopping screen capture')
            if (capture && capture.isActive()) {
              capture.stop()
            }
          })
        }
      }
      
      console.log('Press Ctrl+C to exit')
      
      // Set up graceful shutdown handler
      setupGracefulShutdown(runner, capture)
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
function setupGracefulShutdown(runner: Pico8Runner, capture: ScreenCapture | null): void {
  // Handle Ctrl+C and other termination signals
  process.on('SIGINT', async () => {
    console.log('\nShutting down...')
    await gracefulShutdown(runner, capture)
  })
  
  process.on('SIGTERM', async () => {
    console.log('\nReceived termination signal. Shutting down...')
    await gracefulShutdown(runner, capture)
  })
}

/**
 * Gracefully shuts down all processes
 */
async function gracefulShutdown(runner: Pico8Runner, capture: ScreenCapture | null): Promise<void> {
  try {
    // Stop screen capture if running
    if (capture && capture.isActive()) {
      console.log('Stopping screen capture...')
      capture.stop()
    }
    
    // Close PICO-8 if running
    if (runner.isRunning()) {
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
    process.exit(0)
  }
}

// Run the main function
main().catch(console.error)