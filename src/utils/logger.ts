/**
 * Logger utility for consistent logging across the application
 * Can be easily replaced with a more sophisticated logging system in the future
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LoggerOptions {
  /** Minimum log level to display */
  minLevel: LogLevel
  /** Whether to include timestamps in log messages */
  timestamp: boolean
  /** Optional prefix for all log messages */
  prefix?: string
}

/**
 * Logger class for standardized logging
 */
export class Logger {
  private options: LoggerOptions
  
  /**
   * Creates a new Logger instance
   * @param options Configuration options for the logger
   */
  constructor(options?: Partial<LoggerOptions>) {
    this.options = {
      minLevel: LogLevel.INFO,
      timestamp: true,
      ...options
    }
  }
  
  /**
   * Formats a log message with optional timestamp and prefix
   * @param level The log level
   * @param message The message to log
   * @returns Formatted message
   */
  private format(level: LogLevel, message: string): string {
    const parts: string[] = []
    
    // Add timestamp if enabled
    if (this.options.timestamp) {
      parts.push(`[${new Date().toISOString()}]`)
    }
    
    // Add log level
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    parts.push(`[${levelNames[level]}]`)
    
    // Add prefix if specified
    if (this.options.prefix) {
      parts.push(`[${this.options.prefix}]`)
    }
    
    // Add message
    parts.push(message)
    
    return parts.join(' ')
  }
  
  /**
   * Logs a debug message
   * @param message The message to log
   * @param data Additional data to log
   */
  debug(message: string, data?: unknown): void {
    if (this.options.minLevel <= LogLevel.DEBUG) {
      const formattedMessage = this.format(LogLevel.DEBUG, message)
      console.debug(formattedMessage)
      if (data !== undefined) {
        console.debug(data)
      }
    }
  }
  
  /**
   * Logs an info message
   * @param message The message to log
   * @param data Additional data to log
   */
  info(message: string, data?: unknown): void {
    if (this.options.minLevel <= LogLevel.INFO) {
      const formattedMessage = this.format(LogLevel.INFO, message)
      console.info(formattedMessage)
      if (data !== undefined) {
        console.info(data)
      }
    }
  }
  
  /**
   * Logs a warning message
   * @param message The message to log
   * @param data Additional data to log
   */
  warn(message: string, data?: unknown): void {
    if (this.options.minLevel <= LogLevel.WARN) {
      const formattedMessage = this.format(LogLevel.WARN, message)
      console.warn(formattedMessage)
      if (data !== undefined) {
        console.warn(data)
      }
    }
  }
  
  /**
   * Logs an error message
   * @param message The message to log
   * @param data Additional data to log
   */
  error(message: string, data?: unknown): void {
    if (this.options.minLevel <= LogLevel.ERROR) {
      const formattedMessage = this.format(LogLevel.ERROR, message)
      console.error(formattedMessage)
      if (data !== undefined) {
        console.error(data)
      }
    }
  }
  
  /**
   * Creates a child logger with a specific prefix
   * @param prefix Prefix for the child logger
   * @returns New logger instance with the specified prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.options,
      prefix: this.options.prefix 
        ? `${this.options.prefix}:${prefix}` 
        : prefix
    })
  }
  
  /**
   * Sets the minimum log level
   * @param level The new minimum log level
   */
  setLevel(level: LogLevel): void {
    this.options.minLevel = level
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger()

/**
 * Create a module-specific logger
 * @param module Name of the module
 * @returns Logger instance for the module
 */
export function createLogger(module: string): Logger {
  return logger.child(module)
}