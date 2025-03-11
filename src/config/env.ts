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
 * 
 * Using optional undefined for all properties 
 * to satisfy exactOptionalPropertyTypes
 */
export interface EnvConfig {
  // PICO-8 Configuration
  PICO8_PATH: string
  PICO8_WINDOWED: boolean | undefined
  PICO8_VOLUME: number | undefined
  PICO8_DEFAULT_CARTRIDGE: string | undefined
  
  // Capture Configuration
  CAPTURE_ENABLED: boolean | undefined
  CAPTURE_INTERVAL: number | undefined
  CAPTURE_SAVE_TO_DISK: boolean | undefined
  CAPTURE_OUTPUT_DIR: string | undefined
  CAPTURE_FORMAT: string | undefined
  CAPTURE_QUALITY: number | undefined
  
  // LLM Vision Configuration
  OPENAI_API_KEY: string | undefined
  OPENAI_MODEL: string | undefined
  OPENAI_MAX_TOKENS: number | undefined
  OPENAI_TEMPERATURE: number | undefined
  LLM_CAPTURE_INTERVAL: number | undefined
  
  // Application Configuration
  APP_DEBUG: boolean | undefined
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
  // Get values in a type-safe way
  const windowed = getEnv('PICO8_WINDOWED', true);
  const volume = getEnv('PICO8_VOLUME', 128);
  const captureEnabled = getEnv('CAPTURE_ENABLED', false);
  const captureInterval = getEnv('CAPTURE_INTERVAL', 1000);
  const captureSaveToDisk = getEnv('CAPTURE_SAVE_TO_DISK', false);
  const captureQuality = getEnv('CAPTURE_QUALITY', 90);
  const openaiMaxTokens = getEnv('OPENAI_MAX_TOKENS', 300);
  const openaiTemperature = getEnv('OPENAI_TEMPERATURE', 0.5);
  const llmCaptureInterval = getEnv('LLM_CAPTURE_INTERVAL', 2000);
  const appDebug = getEnv('APP_DEBUG', false);

  return {
    // PICO-8 Configuration
    PICO8_PATH: getEnv('PICO8_PATH'),
    PICO8_WINDOWED: windowed,
    PICO8_VOLUME: volume,
    PICO8_DEFAULT_CARTRIDGE: getEnv('PICO8_DEFAULT_CARTRIDGE', '') as string,
    
    // Capture Configuration
    CAPTURE_ENABLED: captureEnabled,
    CAPTURE_INTERVAL: captureInterval,
    CAPTURE_SAVE_TO_DISK: captureSaveToDisk,
    CAPTURE_OUTPUT_DIR: getEnv('CAPTURE_OUTPUT_DIR', './captures'),
    CAPTURE_FORMAT: getEnv('CAPTURE_FORMAT', 'png'),
    CAPTURE_QUALITY: captureQuality,
    
    // LLM Vision Configuration
    OPENAI_API_KEY: getEnv('OPENAI_API_KEY', process.env['OPENAI_API_KEY']),
    OPENAI_MODEL: getEnv('OPENAI_MODEL', 'gpt-4-vision-preview'),
    OPENAI_MAX_TOKENS: openaiMaxTokens,
    OPENAI_TEMPERATURE: openaiTemperature,
    LLM_CAPTURE_INTERVAL: llmCaptureInterval,
    
    // Application Configuration
    APP_DEBUG: appDebug,
  }
}