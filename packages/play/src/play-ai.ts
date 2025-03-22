/**
 * Script to let an LLM play a text adventure game
 */
import { LLMPlayer, LLMPlayerEvent, TerminalUI } from '@ai-gamedev/playtest'
import chalk from 'chalk'
import { playGame } from './play-game'

export async function playAiGame(options: {
  gameType?: string
  model?: string
  maxRetries?: number
  maxSteps?: number
}) {
  const gameType = options.gameType || 'text-adventure'
  const model = options.model || 'gpt-4'
  const maxRetries = options.maxRetries || 3
  const maxSteps = options.maxSteps || 10

  // Create a terminal UI for displaying messages
  const ui = new TerminalUI()

  // Display usage instructions
  ui.displayHeader('LLM Player Demo')
  ui.display(`Game settings:`)
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
