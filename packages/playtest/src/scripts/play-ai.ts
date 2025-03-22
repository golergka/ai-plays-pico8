/**
 * Script to let an LLM play a text adventure game
 */
import chalk from 'chalk'
import { TerminalUI } from '../cli/terminal-ui'
import { LLMPlayer, type LLMPlayerEvent } from '../ai'
import { playGame } from './play-game'

async function main() {
  const args = process.argv.slice(2)
  const gameType = args[0] || 'text-adventure'
  const model = args[1] || 'gpt-4'
  const maxRetries = parseInt(args[2] || '3', 10)
  const maxSteps = parseInt(args[3] || '10', 10)

  // Create a terminal UI for displaying messages
  const ui = new TerminalUI()

  // Display usage instructions
  ui.displayHeader('LLM Player Demo')
  ui.display(`Usage: bun run play:ai [game-type] [model] [max-retries] [max-steps]`)
  ui.display(`  game-type: Game to play (default: text-adventure)`)
  ui.display(`            Options: text-adventure, compact-adventure`)
  ui.display(`  model: LLM model to use (default: gpt-4)`)
  ui.display(`  max-retries: Maximum retries for invalid actions (default: 3)`)
  ui.display(`  max-steps: Maximum steps to run (default: 10)`)
  ui.display(``)
  ui.display(`Current settings:`)
  ui.display(`  Game: ${gameType}`)
  ui.display(`  Model: ${model}`)
  ui.display(`  Max retries: ${maxRetries}`)
  ui.display(`  Max steps: ${maxSteps}`)
  ui.display(``)

  try {
    // Create LLM player with event handler
    const player = new LLMPlayer({
      maxRetries,
      model,
      onEvent: handleLLMEvent(ui)
    })

    // Play the game with the LLM player
    await playGame(player, {
      gameType,
      maxSteps,
      ui
    })
  } catch (error) {
    ui.displayError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  } finally {
    ui.cleanup()
  }
}

/**
 * Create an event handler for LLM player events
 */
function handleLLMEvent(ui: TerminalUI): (event: LLMPlayerEvent) => void {
  return (event: LLMPlayerEvent) => {
    switch (event.type) {
      case 'thinking':
        ui.displayHeader('LLM Thinking')
        ui.display(chalk.blue(event.content))
        break
      case 'response':
        ui.displayHeader('LLM Response')
        ui.display(chalk.green(event.content))
        break
      case 'error':
        ui.displayHeader('Error')
        ui.display(chalk.red(event.content))
        break
      case 'action':
        ui.displayHeader('Action')
        ui.display(chalk.yellow(event.content))
        if (event.data) {
          const { action, args } = event.data
          ui.display(`  Function: ${chalk.bold(String(action))}`)
          ui.display(`  Arguments: ${JSON.stringify(args, null, 2)}`)
        }
        break
    }
  }
}

// Start the application
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
