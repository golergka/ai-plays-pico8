/**
 * PICO-8 button configuration
 */
export enum Pico8Button {
  Left = 'left',
  Right = 'right',
  Up = 'up',
  Down = 'down',
  X = 'x', // O button in PICO-8 (primary action)
  Z = 'z', // X button in PICO-8 (secondary action)
  Enter = 'enter', // Menu button
  Escape = 'escape', // Exit
  P = 'p' // Pause
}

/**
 * Button state (pressed or released)
 */
export enum ButtonState {
  Pressed = 'pressed',
  Released = 'released'
}

/**
 * Input command configuration
 */
export interface InputConfig {
  /** Window title to target (default: "PICO-8") */
  windowTitle?: string
  /** Time to wait between keystrokes in ms (default: 100) */
  delayBetweenKeys?: number
  /** Debug mode for verbose logging */
  debug?: boolean
}

/**
 * Result of an input command operation
 */
export interface InputResult {
  /** Whether the operation was successful */
  success: boolean
  /** Error message if operation failed */
  error?: string
  /** Button that was pressed/released */
  button?: Pico8Button
  /** State of the button (pressed/released) */
  state?: ButtonState
  /** Timestamp of when the operation was performed */
  timestamp?: number
}