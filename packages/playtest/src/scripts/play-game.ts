/**
 * Common game runner for both AI and human players
 */
import { TextAdventure } from "@ai-gamedev/text-adventure";
import { CompactTextAdventure } from "@ai-gamedev/compact-adventure";
import { StrategyGame } from "@ai-gamedev/strategy-game";
import type { Game, InputOutput, GameResult } from "../types";

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
): Promise<GameResult | null> {
  const gameType = options.gameType || "compact-adventure";
  const maxSteps = options.maxSteps || Infinity;

  // Initialize the appropriate game
  const game = await initializeGame(gameType);
  if (!game) {
    io.outputResult(`Unknown game type: ${gameType}`);
    throw new Error(`Unknown game type: ${gameType}`);
  }

  // Run the game with the provided player
  try {
    // Get initial state
    const initialState = await game.start();
    let gameState = initialState;
    let stepCount = 0;
    let result: GameResult = { description: 'Game not started' }

    // Main game loop
    try {
      while (stepCount < maxSteps) {
        // Get action from player
        const [actionType, actionData] = await io.askForAction(
          gameState.output,
          gameState.actions
        );

        // Process step
        const stepResult = await game.step([actionType as string, actionData]);
        stepCount++;

        // If game is over, return result
        if (stepResult.type === "result") {
          result = stepResult.result;
          break;
        }

        // Otherwise, update game state
        gameState = stepResult.state;
      }

      // Handle max steps reached
      if (stepCount >= maxSteps && maxSteps !== Infinity) {
        // Create a forced termination result
        // Include any metadata provided by the game via the GameState._metadata
        const metadata: Record<string, unknown> = {
          terminationReason: "Max steps reached",
        };

        // Preserve any game-specific metadata from the last game state
        if (gameState._metadata) {
          Object.assign(metadata, gameState._metadata);
        }

        result = {
          description: `Game terminated due to maximum number of steps (${maxSteps}) reached`,
          metadata,
        };
      }
    } catch (error) {
      io.outputResult(
        `Game terminated: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      // If we don't have a result yet, create one for the error case
      if (!result) {
        result = {
          description: "Game terminated with an error",
          metadata: {
            terminationReason: "Error",
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    }

    // Display game result if we have one
    if (result) {
      io.outputResult(result.description);
    } else {
      io.outputResult("Game completed without a result");
    }

    return result;
  } finally {
    // Clean up resources
    await io.cleanup();
    await game.cleanup();
  }
}

/**
 * Initialize a game of the specified type
 *
 * @param gameType Type of game to initialize
 * @returns Initialized game instance or null if game type not found
 */
export async function initializeGame(gameType: string): Promise<Game | null> {
  switch (gameType) {
    case "text-adventure": {
      const game = new TextAdventure();
      await game.initialize();
      return game;
    }
    case 'compact-adventure':
      {
        const game = new CompactTextAdventure();
        await game.initialize();
        return game;
      }
    case 'strategy-game':
      {
        const game = new StrategyGame();
        await game.initialize();
        return game;
      }
  }

  throw new Error(`Unknown game type: ${gameType}`);
}
