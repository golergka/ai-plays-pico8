/**
 * Common game runner for both AI and human players
 */
import { TextAdventure } from "@ai-gamedev/text-adventure";
import { CompactTextAdventure } from "@ai-gamedev/compact-adventure";
import { StrategyGame } from "@ai-gamedev/strategy-game";
import type { Game, InputOutput } from "../types";
import { z } from "zod";

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
  const gameType = options.gameType || "compact-adventure";
  const maxSteps = options.maxSteps || Infinity;

  // Initialize the appropriate game
  let game = await initializeGame(gameType);
  if (!game) {
    throw new Error(`Unknown game type: ${gameType}`);
  }

  // Run the game with the provided player
  try {
    let gameState = await game.start();

    for (let stepCount = 0; stepCount < maxSteps; stepCount++) {
      // Check and add quit action
      if ("quit" in gameState.actions) {
        throw new Error("Game already has a quit action defined");
      }

      const actionsWithQuit = {
        ...gameState.actions,
        quit: z.object({}).describe("Quit the current game"),
      };

      // Get action from player
      const [actionType, actionData] = await io.askForAction(
        gameState.gameState,
        gameState.feedback,
        actionsWithQuit
      );

      // Handle quit action
      if (actionType === "quit") {
        io.outputResult("Game ended by player");
        return;
      }

      // Process step
      const stepResult = await game.step([actionType as string, actionData]);

      if (stepResult.type === "result") {
        io.outputResult(`Game completed: ${stepResult.result.description}`);
        game = await initializeGame(gameType);
        if (!game) {
          throw new Error(`Unknown game type: ${gameType}`);
        }
        gameState = await game.start();
      } else {
        gameState = stepResult.state;
      }
    }

    io.outputResult(
      `Maximum number of LLM play-through steps (${maxSteps}) reached`
    );
  } catch (error) {
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
export async function initializeGame(gameType: string): Promise<Game | null> {
  switch (gameType) {
    case "text-adventure": {
      const game = new TextAdventure();
      await game.initialize();
      return game;
    }
    case "compact-adventure": {
      const game = new CompactTextAdventure();
      await game.initialize();
      return game;
    }
    case "strategy-game": {
      const game = new StrategyGame();
      await game.initialize();
      return game;
    }
  }

  throw new Error(`Unknown game type: ${gameType}`);
}
