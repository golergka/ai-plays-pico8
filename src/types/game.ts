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
 * Core interface for all games
 */
export interface Game {
  /**
   * Initialize the game
   */
  initialize(): Promise<void>
  
  /**
   * Run the game with the provided player
   * 
   * @param player The player that will provide actions
   * @returns Promise resolving when game ends
   */
  run(player: GamePlayer): Promise<GameResult>
  
  /**
   * Clean up resources when game ends
   */
  cleanup(): Promise<void>
}