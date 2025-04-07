/**
 * Script to let an LLM play a text adventure game
 */
import { TerminalUI } from "../cli/terminal-ui";
import { LLMPlayer, LLMPlayerEventType, type LLMPlayerEvent } from "../ai";
import { playGame } from "./play-game";

async function main() {
  const args = process.argv.slice(2);
  const gameType = args[0] || "text-adventure";
  const model = args[1] || "openrouter/auto";
  const maxRetries = parseInt(args[2] || "3", 10);
  const maxSteps = parseInt(args[3] || "10", 10);

  // Create a terminal UI for displaying messages (with default colors enabled)
  const ui = new TerminalUI({ useColors: true });

  // Display usage instructions
  ui.displayHeader("LLM Player Demo");
  ui.display(
    `Usage: bun run play:ai [game-type] [model] [max-retries] [max-steps]`
  );
  ui.display(`  game-type: Game to play (default: text-adventure)`);
  ui.display(
    `            Options: text-adventure, strategy-game`
  );
  ui.display(`  model: LLM model to use (default: openrouter/auto)`);
  ui.display(`  max-retries: Maximum retries for invalid actions (default: 3)`);
  ui.display(`  max-steps: Maximum steps to run (default: 10)`);
  ui.display(``);
  ui.display(`Current settings:`);
  ui.display(`  Game: ${gameType}`);
  ui.display(`  Model: ${model}`);
  ui.display(`  Max retries: ${maxRetries}`);
  ui.display(`  Max steps: ${maxSteps}`);
  ui.display(``);

  try {
    // Create LLM player with event handler
    const player = new LLMPlayer({
      maxRetries,
      model,
      onEvent: handleLLMEvent(ui),
    });

    // Play the game with the LLM player
    await playGame(player, {
      gameType,
      maxSteps,
    });

    await player.askForFeedback();
  } catch (error) {
    ui.displayError(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  } finally {
    ui.cleanup();
  }
}

/**
 * Create an event handler for LLM player events
 */
function handleLLMEvent(ui: TerminalUI): (event: LLMPlayerEvent) => void {
  return (event: LLMPlayerEvent) => {
    switch (event.type) {
      case LLMPlayerEventType.gameAction:
        ui.displayHeader("Game output");
        ui.display(ui.color(event.message.content as string, "green"));
        break;

      case LLMPlayerEventType.error:
        ui.displayHeader("Error");
        ui.display(ui.color(event.message.content as string, "red"));
        break;

      case LLMPlayerEventType.playerAction:
        ui.displayHeader("LLM Player action");
        ui.display(ui.color(event.message.content as string, "yellow"));
        if (event.data) {
          const { action, args } = event.data;
          ui.display(`  Function: ${ui.color(String(action), "bold")}`);
          ui.display(`  Arguments: ${JSON.stringify(args, null, 2)}`);
        }
        break;

      case LLMPlayerEventType.prompt:
        ui.displayHeader("System prompt");
        ui.display(ui.color(event.message.content as string, "cyan"));
        if (event.data) {
          const { prompt } = event.data;
          ui.display(`  Prompt: ${ui.color(String(prompt), "bold")}`);
        }
        break;

      case LLMPlayerEventType.gameState:
        ui.displayHeader("Game state");
        ui.display(ui.color(event.message.content as string, "blue"));
        break;

      case LLMPlayerEventType.playtesterFeedback:
        ui.displayHeader("Playtester feedback");
        ui.display(ui.color(event.message.content as string, "yellow"));
        break;

      case LLMPlayerEventType.summary:
        ui.displayHeader("Summarised game log");
        ui.display(ui.color(event.message.content as string, "red"));
        break;

      default:
        ui.displayHeader("Unknown Event");
        ui.display(ui.color(`Unknown event type: ${event.type}`, "red"));
        if (event.message.content) {
          ui.display(
            `  Content: ${ui.color(event.message.content as string, "gray")}`
          );
        }
        if (event.data) {
          ui.display(`  Data: ${JSON.stringify(event.data, null, 2)}`);
        }
        break;
    }

    if (event.data) {
      ui.display(ui.color(JSON.stringify(event.data, null, 2), "gray"));
    }
  };
}

// Start the application
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
