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
 * Core interface for all games
 */
export interface Game {
  /**
   * Initialize the game
   */
  initialize(): Promise<void>
  
  /**
   * Run the game with the provided AI player
   * 
   * @param aiPlayer The AI player that will provide actions
   * @returns Promise resolving when game ends
   */
  run(aiPlayer: any): Promise<GameResult>
  
  /**
   * Clean up resources when game ends
   */
  cleanup(): Promise<void>
}