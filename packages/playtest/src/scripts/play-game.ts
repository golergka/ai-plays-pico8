/**
 * Common game runner for both AI and human players
 */
import { TextAdventure } from "@ai-gamedev/text-adventure";
import { CompactTextAdventure } from "@ai-gamedev/compact-adventure";
import { TerminalUI } from "../cli/terminal-ui";
import type { Game, GamePlayer, GameResult } from "../types";

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
   * Custom terminal UI instance
   */
  ui?: TerminalUI;

  /**
   * Whether to use colored output
   */
  useColors?: boolean;
}

/**
 * Play a game with the provided player
 *
 * @param player The player implementation (AI, human, etc.)
 * @param options Game configuration options
 * @returns Promise resolving with the game result
 */
export async function playGame(
  player: GamePlayer,
  options: PlayGameOptions = {}
): Promise<GameResult | null> {
  const gameType = options.gameType || "compact-adventure";
  const maxSteps = options.maxSteps || Infinity;
  const useColors = options.useColors !== undefined ? options.useColors : true;
  const ui = options.ui || new TerminalUI({ useColors });

  // Initialize the appropriate game
  const game = await initializeGame(gameType);
  if (!game) {
    ui.displayError(`Unknown game type: ${gameType}`);
    throw new Error(`Unknown game type: ${gameType}`);
  }

  // Run the game with the provided player
  try {
    // Start the game
    ui.displayHeader(`Starting ${gameType}...`);

    // Get initial state
    const initialState = await game.start();
    let gameState = initialState;
    let stepCount = 0;
    let result: GameResult | null = null;

    // Main game loop
    try {
      while (stepCount < maxSteps) {
        // Display current game state
        ui.displayHeader("Game State");
        ui.display(gameState.output);

        // Get action from player
        const [actionType, actionData] = await player.getAction(
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
          success: false,
          actionCount: stepCount,
          metadata,
        };

        throw new Error(`Maximum number of steps (${maxSteps}) reached`);
      }
    } catch (error) {
      ui.displayHeader("Error");
      ui.display(
        ui.color(
          `Game terminated: ${
            error instanceof Error ? error.message : String(error)
          }`,
          "red"
        )
      );

      // If we don't have a result yet, create one for the error case
      if (!result) {
        result = {
          success: false,
          actionCount: stepCount,
          metadata: {
            terminationReason: "Error",
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    }

    // Display game result if we have one
    if (result) {
      ui.displayHeader("Game Finished");
      ui.display(
        `Result: ${
          result.success ? ui.color("Victory!", "green") : ui.color("Defeat", "red")
        }`
      );
      if (result.score !== undefined) {
        ui.display(`Score: ${result.score}`);
      }
      ui.display(`Actions taken: ${result.actionCount}`);

      // Display metadata
      if (result.metadata) {
        ui.displayHeader("Game Statistics");
        const visitedRooms =
          (result.metadata["visitedRooms"] as string[]) || [];
        const inventoryItems =
          (result.metadata["inventoryItems"] as string[]) || [];
        ui.display(`Visited rooms: ${visitedRooms.join(", ") || "none"}`);
        ui.display(`Final inventory: ${inventoryItems.join(", ") || "empty"}`);
      }
    } else {
      ui.displayHeader("Game Terminated");
      ui.display(ui.color("The game was terminated without a result.", "red"));
    }

    return result;
  } finally {
    // Clean up resources
    await player.cleanup();
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
  if (gameType === "text-adventure") {
    const game = new TextAdventure();
    await game.initialize();
    return game;
  } else if (gameType === "compact-adventure") {
    const game = new CompactTextAdventure();
    await game.initialize();
    return game;
  }

  return null;
}
