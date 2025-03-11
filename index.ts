import { Pico8Runner } from './src/runners/pico8Runner'
import { getConfig } from './src/config/env'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Example usage of the PICO-8 Game Runner
 */
async function main() {
  console.log('AI Plays PICO-8 - Runner Example')
  
  try {
    // Get configuration from environment variables
    const config = getConfig()
    
    // Create PICO-8 runner with environment configuration
    const runner = new Pico8Runner({
      executablePath: config.PICO8_PATH,
      windowed: config.PICO8_WINDOWED,
      soundVolume: config.PICO8_VOLUME
    })
    
    console.log('PICO-8 runner initialized successfully')
    
    // Check for default cartridge if specified
    if (config.PICO8_DEFAULT_CARTRIDGE && config.PICO8_DEFAULT_CARTRIDGE !== '') {
      const cartPath = config.PICO8_DEFAULT_CARTRIDGE
      if (existsSync(cartPath)) {
        console.log(`Default cartridge found: ${cartPath}`)
        console.log('Ready to launch PICO-8 with the cartridge')
      } else {
        console.warn(`Warning: Default cartridge not found at ${cartPath}`)
      }
    } else {
      console.log('No default cartridge specified')
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
    
    console.log('Runner ready. Implementation of launch functionality coming in future tasks.')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Configuration error:', errorMessage)
    console.log('\nPlease create a .env file with the required configuration.')
    console.log('See .env.example for reference.')
  }
}

// Run the main function
main().catch(console.error)