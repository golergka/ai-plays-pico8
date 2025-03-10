/**
 * Configuration options for the PICO-8 runner
 */
export interface Pico8Config {
  /** Path to the PICO-8 executable */
  executablePath: string
  /** Optional arguments to pass to PICO-8 */
  args?: string[]
  /** Timeout in milliseconds before considering launch failed */
  launchTimeout?: number
  /** Auto-splore (automatically enter splore mode) */
  splore?: boolean
  /** Windowed mode (as opposed to fullscreen) */
  windowed?: boolean
  /** Sound volume (0-256) */
  soundVolume?: number
}

/**
 * Result of a PICO-8 process operation
 */
export interface Pico8Result {
  /** Whether the operation was successful */
  success: boolean
  /** Error message if operation failed */
  error?: string
  /** Process ID if applicable */
  pid?: number
}