/**
 * Script to let Claude play a game using save files rather than interactive prompts
 */
import path from "path";
import { TerminalUI } from "@ai-gamedev/playtest";
import { TextAdventure } from "@ai-gamedev/text-adventure";
import type { SaveableGame, ActionSchemas } from "@ai-gamedev/playtest";
import { ClaudeSavePlayer } from "./claude-save-player";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jsonschema2md } from "@adobe/jsonschema2md";

async function main() {
  const args = process.argv.slice(2);
  const gameType = args[0] || "text-adventure";
  const saveDir = args[1] || path.join(process.cwd(), "saves");

  // Create a terminal UI for displaying messages (with default colors enabled)
  const ui = new TerminalUI({ useColors: true });

  // Display usage instructions
  ui.displayHeader("Claude Save Player");
  ui.display(`Usage: bun run play:claude [game-type] [save-dir]`);
  ui.display(`  game-type: Game to play (default: text-adventure)`);
  ui.display(`            Options: text-adventure`);
  ui.display(`  save-dir: Directory to store save files (default: ./saves)`);
  ui.display(``);
  ui.display(`Current settings:`);
  ui.display(`  Game: ${gameType}`);
  ui.display(`  Save directory: ${saveDir}`);
  ui.display(``);

  const game = await initializeGame(gameType);
  try {
    // Initialize the appropriate game
    if (!game) {
      ui.displayError(`Unknown game type: ${gameType}`);
      process.exit(1);
    }

    // Create the Claude Save Player
    const player = new ClaudeSavePlayer({
      gameId: gameType,
      saveDir,
    });

    // Check if we have a save file or need to start a new game
    const saveLoaded = await player.loadSaveOrCreateNew(game);

    let gameState;
    if (saveLoaded) {
      // If save was loaded, just get the current state
      ui.display("Loading saved game...");
      gameState = await game.start();
    } else {
      // Otherwise, start a new game
      ui.display("No save file found. Starting new game...");
      gameState = await game.start();
      // Save the initial state
      await player.saveGame(game);
    }

    // Display current game state
    ui.displayHeader("Current Game State");
    ui.display(gameState.output);

    // Get action from the command line
    try {
      // Get the action from the command line (processed by player.getAction)
      const [actionType, actionData] = await player.getAction(
        gameState.output,
        gameState.actions
      );

      // Display the action being taken
      ui.displayHeader("Action");
      ui.display(
        ui.color(`${actionType} ${JSON.stringify(actionData)}`, "yellow")
      );

      // Process the step
      const stepResult = await game.step([actionType as string, actionData]);

      // Save the updated game state
      await player.saveGame(game);

      // Display the result
      if (stepResult.type === "result") {
        // Game is complete
        ui.displayHeader("Game Finished");
        ui.display(stepResult.result.description);
      } else {
        ui.displayHeader("Game State");
        ui.display(stepResult.state.output);
        ui.displayHeader("Actions");
        for (const [name, schema] of Object.entries(stepResult.state.actions)) {
          ui.display(`${name}:`);
          const jsonSchema = zodToJsonSchema(schema);
          const md = jsonschema2md(jsonSchema as any, {})
            .markdown.map((m) => m.content ?? "")
            .join("\n");
          if (schema.description) {
            ui.display(md);
          }
        }
      }
    } catch (error) {
      ui.displayHeader("Error");
      ui.display(
        ui.color(
          `Error processing action: ${
            error instanceof Error ? error.message : String(error)
          }`,
          "red"
        )
      );
    }
  } catch (error) {
    ui.displayError(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  } finally {
    // Clean up game resources
    if (game) {
      await game.cleanup();
    }
    ui.cleanup();
  }
}

/**
 * Initialize a game of the specified type
 *
 * @param gameType Type of game to initialize
 * @returns Initialized game instance or null if game type not found
 */
async function initializeGame(
  gameType: string
): Promise<SaveableGame<ActionSchemas> | null> {
  if (gameType === "text-adventure") {
    const game = new TextAdventure();
    await game.initialize();
    return game;
  }

  return null;
}

// Start the application
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
