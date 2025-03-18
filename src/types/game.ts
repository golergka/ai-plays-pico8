import type { Schema } from '../schema/utils'

/**
 * Map of action names to their schemas
 * 
 * IMPORTANT: All parameters in each schema should be marked as REQUIRED,
 * not optional. OpenAI's function calling API expects all schema properties
 * to be required. If a parameter is truly optional, you must split the action
 * into multiple variations or use default values.
 */
export type ActionSchemas = Record<string, Schema<unknown>>

/**
 * Result of a completed game
 */
export interface GameResult {
  /**
   * Whether the game was completed successfully
   */
  success: boolean
  
  /**
   * Final score (if applicable)
   */
  score?: number
  
  /**
   * Number of actions/turns taken
   */
  actionCount: number
  
  /**
   * Any additional metadata about the game result
   */
  metadata?: Record<string, unknown>
}

/**
 * Interface for game players (AI or human)
 * Uses our schema system for type safety
 */
export interface GamePlayer {
  /**
   * Get an action from the player based on game output and action schemas
   * 
   * @param gameOutput Text description of current game state
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Promise resolving with a tuple of action name and the corresponding action data
   */
  getAction<T extends ActionSchemas>(
    gameOutput: string, 
    actionSchemas: T
  ): Promise<[keyof T, T[keyof T] extends Schema<infer U> ? U : never]>
  
  /**
   * Clean up resources when game ends
   */
  cleanup(): Promise<void>
}

/**
 * Represents the current state of a game during execution
 */
export interface GameState {
  /**
   * Current game output text to display
   */
  output: string
  
  /**
   * Map of possible actions at this step
   */
  actions: ActionSchemas
}

/**
 * Union type for step results - either ongoing game state or final result
 */
export type StepResult = 
  | { type: 'state'; state: GameState }
  | { type: 'result'; result: GameResult }

/**
 * Core interface for all games
 */
export interface Game {
  /**
   * Initialize the game
   */
  initialize(): Promise<void>
  
  /**
   * Get the initial state of the game
   * This is called before any actions are taken
   * 
   * @returns Promise resolving with the initial game state
   */
  start(): Promise<GameState>
  
  /**
   * Process a single game step with the given action
   * 
   * @param action The player's action [actionName, actionData]
   * @returns Promise resolving with either a new game state or final result
   */
  step(action: [string, unknown]): Promise<StepResult>
  
  /**
   * Clean up resources when game ends
   */
  cleanup(): Promise<void>
}