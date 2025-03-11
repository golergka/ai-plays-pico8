import { config } from 'dotenv'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

// Load .env file if it exists
const envPath = join(process.cwd(), '.env')
if (existsSync(envPath)) {
  config({ path: envPath })
}

/**
 * Configuration type definitions
 */
export interface EnvConfig {
  // PICO-8 Configuration
  PICO8_PATH: string
  PICO8_WINDOWED?: boolean
  PICO8_VOLUME?: number
  PICO8_DEFAULT_CARTRIDGE?: string
  
  // Capture Configuration
  CAPTURE_ENABLED?: boolean
  CAPTURE_INTERVAL?: number
  CAPTURE_SAVE_TO_DISK?: boolean
  CAPTURE_OUTPUT_DIR?: string
  CAPTURE_FORMAT?: string
  CAPTURE_QUALITY?: number
  
  // Application Configuration
  APP_DEBUG?: boolean
}

/**
 * Retrieves a configuration value from environment variables
 */
function getEnv<K extends keyof EnvConfig>(
  key: K, 
  defaultValue?: EnvConfig[K]
): EnvConfig[K] {
  const envValue = process.env[key]
  
  if (envValue !== undefined) {
    if (defaultValue === undefined) {
      return envValue as EnvConfig[K]
    }
    
    switch (typeof defaultValue) {
      case 'boolean':
        return (envValue.toLowerCase() === 'true') as EnvConfig[K]
      case 'number':
        return Number(envValue) as EnvConfig[K]
      default:
        return envValue as EnvConfig[K]
    }
  }
  
  if (defaultValue !== undefined) {
    return defaultValue
  }
  
  throw new Error(`Environment variable ${key} is not defined`)
}

/**
 * Returns a complete configuration object with all values
 */
export function getConfig(): EnvConfig {
  return {
    // PICO-8 Configuration
    PICO8_PATH: getEnv('PICO8_PATH'),
    PICO8_WINDOWED: getEnv('PICO8_WINDOWED', true),
    PICO8_VOLUME: getEnv('PICO8_VOLUME', 128),
    PICO8_DEFAULT_CARTRIDGE: getEnv('PICO8_DEFAULT_CARTRIDGE', '') as string,
    
    // Capture Configuration
    CAPTURE_ENABLED: getEnv('CAPTURE_ENABLED', false),
    CAPTURE_INTERVAL: getEnv('CAPTURE_INTERVAL', 1000),
    CAPTURE_SAVE_TO_DISK: getEnv('CAPTURE_SAVE_TO_DISK', false),
    CAPTURE_OUTPUT_DIR: getEnv('CAPTURE_OUTPUT_DIR', './captures'),
    CAPTURE_FORMAT: getEnv('CAPTURE_FORMAT', 'png'),
    CAPTURE_QUALITY: getEnv('CAPTURE_QUALITY', 90),
    
    // Application Configuration
    APP_DEBUG: getEnv('APP_DEBUG', false),
  }
}