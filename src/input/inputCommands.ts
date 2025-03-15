import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { activeWindow } from 'active-win'
import { setTimeout } from 'node:timers/promises'
import { ButtonState, Pico8Button } from '../types/input'
import type { InputConfig, InputResult } from '../types/input'
import { EventEmitter } from 'node:events'
import { Logger, LogLevel } from '../utils/logger'

/**
 * Input command events
 */
export enum InputEvent {
  BUTTON_PRESS = 'button_press',
  BUTTON_RELEASE = 'button_release',
  ERROR = 'error'
}

/**
 * Data for input command events
 */
export interface InputEventData {
  button?: Pico8Button
  state?: ButtonState
  timestamp: number
  error?: string
}

/**
 * Input Commands module for sending keyboard inputs to PICO-8
 */
// Promisify exec for async usage
const execAsync = promisify(exec)

export class InputCommands extends EventEmitter {
  private config: InputConfig
  private activeWindowTitle: string | null = null
  private logger: Logger
  private platform: string

  /**
   * Creates a new Input Commands instance
   * @param config Configuration for the input commands
   */
  constructor(config: InputConfig = {}) {
    super()
    this.config = {
      windowTitle: 'PICO-8',
      delayBetweenKeys: 100,
      debug: false,
      ...config
    }

    this.logger = new Logger({
      prefix: 'InputCommands',
      minLevel: this.config.debug ? LogLevel.DEBUG : LogLevel.INFO
    })
    
    // Determine platform for input command implementation
    this.platform = process.platform
    this.logger.debug(`Platform detected: ${this.platform}`)
    
    if (this.platform !== 'darwin' && this.platform !== 'win32' && this.platform !== 'linux') {
      this.logger.warn(`Unsupported platform: ${this.platform}. Some input features may not work correctly.`)
    }
  }

  /**
   * Validates if PICO-8 window is in focus
   * @returns Promise that resolves to true if PICO-8 is in focus, false otherwise
   */
  private async validateWindow(): Promise<boolean> {
    try {
      const currentWindow = await activeWindow()
      
      if (!currentWindow) {
        this.logger.debug('No active window found')
        return false
      }

      this.activeWindowTitle = currentWindow.title
      
      const isPico8 = currentWindow.title.includes(this.config.windowTitle || 'PICO-8')
      
      this.logger.debug(`Active window: ${currentWindow.title} (isPico8: ${isPico8})`)
      
      return isPico8
    } catch (error) {
      this.logger.error(`Failed to get active window: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }

  /**
   * Presses a button
   * @param button The button to press
   * @returns Result of the button press operation
   */
  async pressButton(button: Pico8Button): Promise<InputResult> {
    try {
      // Validate window focus
      const isValidWindow = await this.validateWindow()
      
      if (!isValidWindow) {
        const error = `PICO-8 window not in focus. Active window: ${this.activeWindowTitle || 'None'}`
        this.logger.warn(error)
        
        this.emit(InputEvent.ERROR, {
          button,
          state: ButtonState.Pressed,
          timestamp: Date.now(),
          error
        })
        
        return {
          success: false,
          error,
          button,
          state: ButtonState.Pressed
        }
      }
      
      // Convert PICO-8 button to platform-specific key
      const key = this.mapButtonToKey(button)
      
      // Press the key using platform-specific method
      this.logger.debug(`Pressing key: ${key}`)
      
      if (this.platform === 'darwin') {
        await this.sendMacOSKeyPress(key)
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`)
      }
      
      const timestamp = Date.now()
      
      // Emit event
      this.emit(InputEvent.BUTTON_PRESS, {
        button,
        state: ButtonState.Pressed,
        timestamp
      })
      
      return {
        success: true,
        button,
        state: ButtonState.Pressed,
        timestamp
      }
    } catch (error) {
      const errorMessage = `Failed to press button ${button}: ${error instanceof Error ? error.message : String(error)}`
      this.logger.error(errorMessage)
      
      this.emit(InputEvent.ERROR, {
        button,
        state: ButtonState.Pressed,
        timestamp: Date.now(),
        error: errorMessage
      })
      
      return {
        success: false,
        error: errorMessage,
        button,
        state: ButtonState.Pressed
      }
    }
  }

  /**
   * Releases a button
   * @param button The button to release
   * @returns Result of the button release operation
   */
  async releaseButton(button: Pico8Button): Promise<InputResult> {
    try {
      // Validate window focus
      const isValidWindow = await this.validateWindow()
      
      if (!isValidWindow) {
        const error = `PICO-8 window not in focus. Active window: ${this.activeWindowTitle || 'None'}`
        this.logger.warn(error)
        
        this.emit(InputEvent.ERROR, {
          button,
          state: ButtonState.Released,
          timestamp: Date.now(),
          error
        })
        
        return {
          success: false,
          error,
          button,
          state: ButtonState.Released
        }
      }
      
      // Convert PICO-8 button to platform-specific key
      const key = this.mapButtonToKey(button)
      
      // Release the key using platform-specific method
      this.logger.debug(`Releasing key: ${key}`)
      
      if (this.platform === 'darwin') {
        await this.sendMacOSKeyRelease(key)
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`)
      }
      
      const timestamp = Date.now()
      
      // Emit event
      this.emit(InputEvent.BUTTON_RELEASE, {
        button,
        state: ButtonState.Released,
        timestamp
      })
      
      return {
        success: true,
        button,
        state: ButtonState.Released,
        timestamp
      }
    } catch (error) {
      const errorMessage = `Failed to release button ${button}: ${error instanceof Error ? error.message : String(error)}`
      this.logger.error(errorMessage)
      
      this.emit(InputEvent.ERROR, {
        button,
        state: ButtonState.Released,
        timestamp: Date.now(),
        error: errorMessage
      })
      
      return {
        success: false,
        error: errorMessage,
        button,
        state: ButtonState.Released
      }
    }
  }

  /**
   * Presses and releases a button with a specified delay between press and release
   * @param button The button to press and release
   * @param duration Duration to hold the button in milliseconds (default: config.delayBetweenKeys)
   * @returns Result of the press and release operation
   */
  async tapButton(button: Pico8Button, duration?: number): Promise<InputResult> {
    try {
      // Validate window focus
      const isValidWindow = await this.validateWindow()
      
      if (!isValidWindow) {
        const error = `PICO-8 window not in focus. Active window: ${this.activeWindowTitle || 'None'}`
        this.logger.warn(error)
        
        this.emit(InputEvent.ERROR, {
          button,
          timestamp: Date.now(),
          error
        })
        
        return {
          success: false,
          error,
          button
        }
      }
      
      // Convert PICO-8 button to platform-specific key
      const key = this.mapButtonToKey(button)
      
      this.logger.debug(`Tapping key: ${key}`)
      
      // For macOS, use the simplified tap method for better reliability
      if (this.platform === 'darwin') {
        // For macOS, use the simplified keystroke approach
        await this.sendMacOSKeyTap(key)
      } else {
        // For other platforms, do press and release with delay
        // Press the button
        const pressResult = await this.pressButton(button)
        
        if (!pressResult.success) {
          return pressResult
        }
        
        // Wait for specified duration
        const holdDuration = duration ?? this.config.delayBetweenKeys ?? 100
        await setTimeout(holdDuration)
        
        // Release the button
        const releaseResult = await this.releaseButton(button)
        
        // Return the release result (as it's the final state)
        return releaseResult
      }
      
      const timestamp = Date.now()
      
      // First emit press
      this.emit(InputEvent.BUTTON_PRESS, {
        button,
        state: ButtonState.Pressed,
        timestamp
      })
      
      // Then emit release
      this.emit(InputEvent.BUTTON_RELEASE, {
        button,
        state: ButtonState.Released,
        timestamp: timestamp + 10 // Add a tiny delay for logging purposes
      })
      
      return {
        success: true,
        button,
        state: ButtonState.Released,
        timestamp
      }
    } catch (error) {
      const errorMessage = `Failed to tap button ${button}: ${error instanceof Error ? error.message : String(error)}`
      this.logger.error(errorMessage)
      
      this.emit(InputEvent.ERROR, {
        button,
        timestamp: Date.now(),
        error: errorMessage
      })
      
      return {
        success: false,
        error: errorMessage,
        button
      }
    }
  }

  /**
   * Send a sequence of button taps with delays between each tap
   * @param buttons Array of buttons to tap in sequence
   * @param tapDuration Duration to hold each button in milliseconds (default: config.delayBetweenKeys)
   * @param delayBetweenTaps Delay between each button tap in milliseconds (default: config.delayBetweenKeys * 2)
   * @returns Array of results for each button tap
   */
  async sendButtonSequence(
    buttons: Pico8Button[],
    tapDuration?: number,
    delayBetweenTaps?: number
  ): Promise<InputResult[]> {
    const results: InputResult[] = []
    
    for (let i = 0; i < buttons.length; i++) {
      // Tap the button
      const button = buttons[i];
      if (button !== undefined) {
        const result = await this.tapButton(button, tapDuration)
        results.push(result)
        
        // Skip delay after last button
        if (i < buttons.length - 1) {
          // Wait between taps
          const delay = delayBetweenTaps ?? (this.config.delayBetweenKeys ?? 100) * 2
          await setTimeout(delay)
        }
      }
    }
    
    return results
  }

  /**
   * Send random button inputs for a specified duration
   * @param durationMs Total duration to send random inputs in milliseconds
   * @param maxButtonsPerSecond Maximum number of button presses per second (default: 2)
   * @returns Promise that resolves when the random input session is complete
   */
  async sendRandomInputs(durationMs: number, maxButtonsPerSecond = 2): Promise<void> {
    const startTime = Date.now()
    const endTime = startTime + durationMs
    
    this.logger.info(`Starting random input session for ${durationMs}ms`)
    
    // Calculate delay between button presses
    const minDelay = 1000 / maxButtonsPerSecond
    
    while (Date.now() < endTime) {
      // Select a random button
      const button = this.getRandomButton()
      
      // Tap the button
      this.logger.debug(`Sending random button: ${button}`)
      await this.tapButton(button)
      
      // Wait a random amount of time before next input
      const randomDelay = Math.max(minDelay, Math.random() * 1000)
      await setTimeout(randomDelay)
    }
    
    this.logger.info('Random input session completed')
  }

  /**
   * Maps a PICO-8 button to the appropriate key for the current platform
   * @param button The PICO-8 button to map
   * @returns The mapped key code or name
   */
  private mapButtonToKey(button: Pico8Button): string {
    // AppleScript requires specific arrow key names
    if (this.platform === 'darwin') {
      // Special mapping for arrow keys in AppleScript
      switch (button) {
        case Pico8Button.Left:
          return 'left arrow'
        case Pico8Button.Right:
          return 'right arrow'
        case Pico8Button.Up:
          return 'up arrow'
        case Pico8Button.Down:
          return 'down arrow'
        case Pico8Button.Enter:
          return 'return'
        case Pico8Button.Escape:
          return 'escape'
        case Pico8Button.Z:
          // Z is the X button in PICO-8 (secondary action)
          return 'z'
        case Pico8Button.X:
          // X is the O button in PICO-8 (primary action)
          return 'x'
        case Pico8Button.P:
          return 'p'
        // Other keys can be used directly
        default:
          this.logger.warn(`Unknown button mapping: ${button}, using lowercase value`)
          return String(button).toLowerCase()
      }
    }
    
    // Fallback for other platforms
    return String(button).toLowerCase()
  }
  
  /**
   * Sends a key press via AppleScript on macOS
   * @param key The key to press
   * @returns Promise that resolves when the key press is sent
   */
  private async sendMacOSKeyPress(key: string): Promise<void> {
    try {
      // Handle arrow keys specially using key codes instead of names
      let script: string;
      
      // Map arrow keys to their key codes in AppleScript
      if (key === 'left arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 123 down
          end tell
        end tell
        `;
      } else if (key === 'right arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 124 down
          end tell
        end tell
        `;
      } else if (key === 'up arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 126 down
          end tell
        end tell
        `;
      } else if (key === 'down arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 125 down
          end tell
        end tell
        `;
      } else {
        // For non-arrow keys, use the standard approach
        script = `
        tell application "System Events"
          tell application process "pico8"
            key down "${key}"
          end tell
        end tell
        `;
      }
      
      await execAsync(`osascript -e '${script}'`)
    } catch (error) {
      this.logger.error(`Failed to send key press via AppleScript: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
  
  /**
   * Sends a key release via AppleScript on macOS
   * @param key The key to release
   * @returns Promise that resolves when the key release is sent
   */
  private async sendMacOSKeyRelease(key: string): Promise<void> {
    try {
      // Handle arrow keys specially using key codes instead of names
      let script: string;
      
      // Map arrow keys to their key codes in AppleScript
      if (key === 'left arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 123 up
          end tell
        end tell
        `;
      } else if (key === 'right arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 124 up
          end tell
        end tell
        `;
      } else if (key === 'up arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 126 up
          end tell
        end tell
        `;
      } else if (key === 'down arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 125 up
          end tell
        end tell
        `;
      } else {
        // For non-arrow keys, use the standard approach
        script = `
        tell application "System Events"
          tell application process "pico8"
            key up "${key}"
          end tell
        end tell
        `;
      }
      
      await execAsync(`osascript -e '${script}'`)
    } catch (error) {
      this.logger.error(`Failed to send key release via AppleScript: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
  
  /**
   * Sends a keyboard tap (key down + key up) via AppleScript on macOS
   * This is a more reliable method for sending basic keystrokes
   * @param key The key to tap
   * @returns Promise that resolves when the key tap is sent
   */
  private async sendMacOSKeyTap(key: string): Promise<void> {
    try {
      let script: string;
      
      // Map arrow keys to their key codes in AppleScript
      if (key === 'left arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 123
          end tell
        end tell
        `;
      } else if (key === 'right arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 124
          end tell
        end tell
        `;
      } else if (key === 'up arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 126
          end tell
        end tell
        `;
      } else if (key === 'down arrow') {
        script = `
        tell application "System Events"
          tell application process "pico8"
            key code 125
          end tell
        end tell
        `;
      } else if (key === 'return' || key === 'escape') {
        // For return and escape, use named keys with explicit down/up
        script = `
        tell application "System Events"
          tell application process "pico8"
            key down "${key}"
            delay 0.05
            key up "${key}"
          end tell
        end tell
        `;
      } else {
        // For regular keys, use keystroke which is simpler
        script = `
        tell application "System Events"
          tell application process "pico8"
            keystroke "${key}"
          end tell
        end tell
        `;
      }
      
      await execAsync(`osascript -e '${script}'`)
    } catch (error) {
      this.logger.error(`Failed to send key tap via AppleScript: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Gets a random PICO-8 button
   * @returns A random PICO-8 button
   */
  private getRandomButton(): Pico8Button {
    const buttons = Object.values(Pico8Button)
    const randomIndex = Math.floor(Math.random() * buttons.length)
    const button = buttons[randomIndex]
    // Make sure we never return undefined
    return button ?? Pico8Button.Up
  }

  /**
   * Updates the configuration for the input commands
   * @param config New configuration options (partial)
   */
  updateConfig(config: Partial<InputConfig>): void {
    this.config = {
      ...this.config,
      ...config
    }
  }
}