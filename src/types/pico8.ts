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
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Result of a successful PICO-8 process operation
 */
export interface Pico8SuccessResult {
  /** Operation succeeded */
  success: true
  /** Process ID */
  pid: number
}

/**
 * Result of a failed PICO-8 process operation
 */
export interface Pico8ErrorResult {
  /** Operation failed */
  success: false
  /** Error message explaining the failure */
  error: string
  /** Process ID if available */
  pid?: number
}

/**
 * Result of a PICO-8 process operation (union type)
 */
export type Pico8Result = Pico8SuccessResult | Pico8ErrorResult

/**
 * Process termination level/strategy
 * Uses numeric enum for better performance and clearer progression
 * Note: This project currently only supports macOS
 */
export enum TerminationStrategy {
  /** Standard Node.js termination methods (SIGTERM, SIGKILL) */
  STANDARD = 0,
  /** macOS-specific commands (kill -9, pkill, killall) */
  OS_SPECIFIC = 1
}

/**
 * Termination options for controlling process shutdown behavior
 */
export interface TerminationOptions {
  /** Whether to force kill the process immediately */
  force?: boolean
  /** Timeout in milliseconds before escalating termination strategy */
  timeout?: number
  /** Starting termination strategy (defaults to STANDARD) */
  startStrategy?: TerminationStrategy
}