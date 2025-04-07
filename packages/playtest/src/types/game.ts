import type { Schema } from "../schema/utils";
import { z } from "zod";

/**
 * Map of action names to their schemas
 *
 * IMPORTANT: All parameters in each schema should be marked as REQUIRED,
 * not optional. OpenAI's function calling API expects all schema properties
 * to be required. If a parameter is truly optional, you must split the action
 * into multiple variations or use default values.
 */
export type ActionSchemas = Record<string, Schema<unknown>>;

export type ActionCall<T extends ActionSchemas> = [
  name: keyof T,
  data: T[keyof T] extends Schema<infer U> ? U : never,
  onResult: (result: string) => void
];

/**
 * Interface for input/output handlers (AI or human)
 * Abstracts the interaction with players regardless of medium
 */
export interface InputOutput {
  /**
   * Get an action from the input source based on provided text and available actions
   *
   * @param gameState description of the current game state, fully
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Promise resolving with a list of action calls
   */
  askForActions<T extends ActionSchemas>(
    gameState: string,
    actionSchemas: T
  ): Promise<ActionCall<T>[]>;

  outputResult(text: string): void;

  /**
   * Clean up resources when done
   */
  cleanup(): Promise<void>;
}

/**
 * Represents the current state of a game during execution
 */
export interface GameState {
  /** Description of the current game state */
  description: string;

  /** True if game has bee completed */
  gameOver: boolean;
}

/**
 * Core interface for all games
 */
export interface Game<T extends ActionSchemas> {
  initialize(): Promise<void>;
  getGameState(): GameState;
  actions: T;
  callAction(...call: ActionCall<T>): void;
}

/**
 * Extended interface for games that support save/load functionality
 */
export interface SaveableGame<T extends ActionSchemas> extends Game<T> {
  /**
   * Get the schema for this game's save data
   * This schema defines the structure of data returned by getSaveData
   *
   * @returns Zod schema describing the save data structure
   */
  getSchema(): z.ZodType<unknown>;

  /**
   * Get serializable save data representing the current game state
   * This data should conform to the schema returned by getSchema
   *
   * @returns Serializable data representing the current game state
   */
  getSaveData(): unknown;
}
