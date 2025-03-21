/**
 * Configuration options for the Screen Capture module
 */
export interface CaptureConfig {
  /** Capture interval in milliseconds */
  interval: number
  /** Output directory for saved captures (if enabled) */
  outputDir?: string
  /** Whether to save captures to disk */
  saveToDisk?: boolean
  /** Format for saved images (default: 'png') */
  imageFormat?: 'png' | 'jpg' | 'webp'
  /** Image quality for compressed formats (jpg, webp) */
  imageQuality?: number
  /** Region to capture (if not specified, whole window will be captured) */
  captureRegion?: CaptureRegion
  /** Target window title (substring) to capture (PICO-8) */
  windowTitle?: string
  /** Auto-stop when target window is no longer found */
  autoStopOnWindowClose?: boolean
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Capture region specification
 */
export interface CaptureRegion {
  /** X coordinate of top-left corner */
  x: number
  /** Y coordinate of top-left corner */
  y: number
  /** Width of capture area in pixels */
  width: number
  /** Height of capture area in pixels */
  height: number
}

/**
 * Result of a successful screen capture operation
 */
export interface CaptureSuccessResult {
  /** Capture was successful */
  success: true
  /** Captured image buffer */
  buffer: Buffer
  /** File path if saved to disk (if applicable) */
  filePath?: string
  /** Timestamp of the capture */
  timestamp: number
}

/**
 * Result of a failed screen capture operation
 */
export interface CaptureErrorResult {
  /** Capture failed */
  success: false
  /** Error message explaining the failure */
  error: string
  /** Timestamp of the capture attempt */
  timestamp: number
}

/**
 * Result of a screen capture operation (union type)
 */
export type CaptureResult = CaptureSuccessResult | CaptureErrorResult

/**
 * Event names for the screen capture module
 */
export enum CaptureEvent {
  CAPTURE = 'capture',
  ERROR = 'error',
  START = 'start',
  STOP = 'stop'
}

/**
 * Capture event data for event listeners
 */
export interface CaptureEventData {
  /** Event timestamp */
  timestamp: number
  /** Captured image buffer (only for CAPTURE events) */
  buffer?: Buffer
  /** File path if saved to disk (only for CAPTURE events, if applicable) */
  filePath?: string
  /** Error information (only for ERROR events) */
  error?: string
}