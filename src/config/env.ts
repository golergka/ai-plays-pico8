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
    PICO8_PATH: getEnv('PICO8_PATH'),
    PICO8_WINDOWED: getEnv('PICO8_WINDOWED', true),
    PICO8_VOLUME: getEnv('PICO8_VOLUME', 128),
    APP_DEBUG: getEnv('APP_DEBUG', false),
    PICO8_DEFAULT_CARTRIDGE: getEnv('PICO8_DEFAULT_CARTRIDGE', '') as string,
  }
}