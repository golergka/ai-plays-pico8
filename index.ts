import { Pico8Runner } from './src/runners/pico8Runner'
import { getConfig } from './src/config/env'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Example usage of the PICO-8 Game Runner
 */
async function main() {
  console.log('AI Plays PICO-8 - Runner Example')
  
  let runner: Pico8Runner | null = null
  
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
        PICO8_DEFAULT_CARTRIDGE: config.PICO8_DEFAULT_CARTRIDGE || 'Not specified'
      })
    }
    
    // Launch PICO-8 with cartridge if specified
    console.log('Launching PICO-8...')
    const result = await runner.launch(cartridgePath)
    
    if (result.success) {
      console.log(`PICO-8 launched successfully (PID: ${result.pid})`)
      console.log('Press Ctrl+C to exit')
      
      // Set up graceful shutdown handler
      setupGracefulShutdown(runner)
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
function setupGracefulShutdown(runner: Pico8Runner): void {
  // Handle Ctrl+C and other termination signals
  process.on('SIGINT', async () => {
    console.log('\nShutting down PICO-8...')
    await gracefulShutdown(runner)
  })
  
  process.on('SIGTERM', async () => {
    console.log('\nReceived termination signal. Shutting down PICO-8...')
    await gracefulShutdown(runner)
  })
}

/**
 * Gracefully shuts down the PICO-8 process
 */
async function gracefulShutdown(runner: Pico8Runner): Promise<void> {
  try {
    if (runner.isRunning()) {
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