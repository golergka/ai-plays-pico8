import type { Schema } from '../schema/utils'
import { z } from 'zod'

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
  description: string
  
  /**
   * Any additional metadata about the game result
   */
  metadata?: Record<string, unknown>
}

/**
 * Interface for input/output handlers (AI or human)
 * Abstracts the interaction with players regardless of medium
 */
export interface InputOutput {
  /**
   * Get an action from the input source based on provided text and available actions
   * 
   * @param text Description text to display/process before getting input
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Promise resolving with a tuple of action name and the corresponding action data
   */
  askForAction<T extends ActionSchemas>(
    text: string, 
    actionSchemas: T
  ): Promise<[keyof T, T[keyof T] extends Schema<infer U> ? U : never]>
  
  outputResult(text: string): void

  /**
   * Clean up resources when done
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
  
  /**
   * Optional metadata that games can attach to the state
   * This is not used by the platform directly but can be used
   * by error handlers or reporting tools to extract game state 
   * information in case of abnormal termination
   */
  _metadata?: Record<string, unknown>
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

/**
 * Extended interface for games that support save/load functionality
 */
export interface SaveableGame extends Game {
  /**
   * Get the schema for this game's save data
   * This schema defines the structure of data returned by getSaveData
   * 
   * @returns Zod schema describing the save data structure
   */
  getSchema(): z.ZodType<unknown>
  
  /**
   * Get serializable save data representing the current game state
   * This data should conform to the schema returned by getSchema
   * 
   * @returns Serializable data representing the current game state
   */
  getSaveData(): unknown
}