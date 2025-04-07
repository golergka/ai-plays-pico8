/**
 * Common game runner for both AI and human players
 */
import { TextAdventure } from "@ai-gamedev/text-adventure";
import { StrategyGame } from "@ai-gamedev/strategy-game";
import type { ActionSchemas, Game, InputOutput } from "../types";

export interface PlayGameOptions {
  /**
   * Type of game to play
   */
  gameType?: string;

  /**
   * Maximum number of steps before forcing termination
   */
  maxSteps?: number;

  /**
   * Whether to use colored output
   */
  useColors?: boolean;
}

/**
 * Play a game with the provided input/output handler
 *
 * @param io The input/output implementation (AI, human, etc.)
 * @param options Game configuration options
 * @returns Promise resolving with the game result
 */
export async function playGame(
  io: InputOutput,
  options: PlayGameOptions = {}
): Promise<void> {
  const gameType = options.gameType  || "text-adventure";
  const maxSteps = options.maxSteps || Infinity;

  // Initialize the appropriate game
  const game = await initializeGame(gameType);
  game.initialize();

  // Run the game with the provided player
  try {
    for (let stepCount = 0; stepCount < maxSteps; stepCount++) {
      const gameState = game.getGameState();

      if (gameState.gameOver) {
        io.outputResult(`Game completed: ${gameState.description}`);
        game.initialize();
      }

      // Get action from player
      const actionCalls = await io.askForActions(
        gameState.description,
        game.actions,
      );

      for (const call of actionCalls) {
        game.callAction(...call);
      }
    }

    io.outputResult(
      `Maximum number of LLM play-through steps (${maxSteps}) reached`
    );
  } catch (error) {
    console.error(error);
    io.outputResult(
      `Game terminated due to an internal error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Initialize a game of the specified type
 *
 * @param gameType Type of game to initialize
 * @returns Initialized game instance or null if game type not found
 */
export async function initializeGame(gameType: string): Promise<Game<ActionSchemas>> {
  switch (gameType) {
    case "text-adventure":
      return new TextAdventure();
    case "strategy-game":
      return new StrategyGame();
    default:
      throw new Error(`Unknown game type: ${gameType}`);
  }
}
