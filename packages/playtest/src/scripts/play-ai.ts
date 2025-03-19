/**
 * Script to let an LLM play a text adventure game
 */
import { LLMPlayer } from '../ai/llm-player'
import type { LLMPlayerEvent } from '../ai/llm-player'
import { TextAdventure } from '@ai-gamedev/text-adventure'
import { CompactTextAdventure } from '@ai-gamedev/compact-adventure'
import { TerminalUI } from '../cli/terminal-ui'
import chalk from 'chalk'
import type { GameResult } from '../types'

async function main() {
  const args = process.argv.slice(2)
  const gameType = args[0] || 'text-adventure'
  const model = args[1] || 'gpt-4'
  const maxRetries = parseInt(args[2] || '3', 10)
  const maxSteps = parseInt(args[3] || '10', 10)

  // Create a terminal UI for displaying messages
  const ui = new TerminalUI()

  // Initialize the appropriate game
  const game = await initializeGame(gameType)
  if (!game) {
    ui.displayError(`Unknown game type: ${gameType}`)
    process.exit(1)
  }

  // Display usage instructions
  ui.displayHeader('LLM Player Demo')
  ui.display(`Usage: bun run play:ai [game-type] [model] [max-retries] [max-steps]`)
  ui.display(`  game-type   : Game to play (default: text-adventure)`)
  ui.display(`              : Options: text-adventure, compact-adventure`)
  ui.display(`  model       : Model to use (default: gpt-4)`)
  ui.display(`  max-retries : Max retries for invalid responses (default: 3)`)
  ui.display(`  max-steps   : Max steps before forced termination (default: 10)`)
  ui.display(``)
  ui.display(`Current settings:`)
  ui.display(`  Game: ${gameType}`)
  ui.display(`  Model: ${model}`)
  ui.display(`  Max retries: ${maxRetries}`)
  ui.display(`  Max steps: ${maxSteps}`)
  ui.display(``)

  // Run the game with the LLM player
  try {
    // Create LLM player with event handler
    const player = new LLMPlayer({
      maxRetries,
      model,
      onEvent: handleLLMEvent(ui)
    })

    // Start the game
    ui.displayHeader(`Starting ${gameType} with ${model}...`)
    
    // Get initial state
    const initialState = await game.start()
    let gameState = initialState
    let stepCount = 0
    let result: GameResult | null = null
    
    // Main game loop
    try {
      while (stepCount < maxSteps) {
        // Get action from player
        const [actionType, actionData] = await player.getAction(
          gameState.output,
          gameState.actions
        )
        
        // Process step
        const stepResult = await game.step([actionType as string, actionData])
        stepCount++
        
        // If game is over, return result
        if (stepResult.type === 'result') {
          result = stepResult.result
          break
        }
        
        // Otherwise, update game state
        gameState = stepResult.state
      }
      
      // Handle max steps reached
      if (stepCount >= maxSteps) {
        // Create a forced termination result
        // Include any metadata provided by the game via the GameState._metadata
        const metadata: Record<string, unknown> = {
          terminationReason: 'Max steps reached'
        };
        
        // Preserve any game-specific metadata from the last game state
        if (gameState._metadata) {
          Object.assign(metadata, gameState._metadata);
        }
        
        result = {
          success: false,
          actionCount: stepCount,
          metadata
        };
        
        throw new Error(`Maximum number of steps (${maxSteps}) reached`);
      }
    } catch (error) {
      ui.displayHeader('Error')
      ui.display(chalk.red(`Game terminated: ${error instanceof Error ? error.message : String(error)}`))
      
      // If we don't have a result yet, create one for the error case
      if (!result) {
        result = {
          success: false,
          actionCount: stepCount,
          metadata: {
            terminationReason: 'Error',
            error: error instanceof Error ? error.message : String(error)
          }
        }
      }
    } finally {
      await player.cleanup()
    }

    // Display game result if we have one
    if (result) {
      ui.displayHeader('Game Finished')
      ui.display(`Result: ${result.success ? chalk.green('Victory!') : chalk.red('Defeat')}`)
      if (result.score !== undefined) {
        ui.display(`Score: ${result.score}`)
      }
      ui.display(`Actions taken: ${result.actionCount}`)
  
      // Display metadata
      if (result.metadata) {
        ui.displayHeader('Game Statistics')
        const visitedRooms = result.metadata['visitedRooms'] as string[] || []
        const inventoryItems = result.metadata['inventoryItems'] as string[] || []
        ui.display(`Visited rooms: ${visitedRooms.join(', ') || 'none'}`)
        ui.display(`Final inventory: ${inventoryItems.join(', ') || 'empty'}`)
      }
    } else {
      ui.displayHeader('Game Terminated')
      ui.display(chalk.red('The game was terminated without a result.'))
    }
  } finally {
    // Clean up game resources
    await game.cleanup()
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

/**
 * Initialize a game of the specified type
 * 
 * @param gameType Type of game to initialize
 * @returns Initialized game instance or null if game type not found
 */
async function initializeGame(gameType: string) {
  if (gameType === 'text-adventure') {
    const game = new TextAdventure()
    await game.initialize()
    return game
  } else if (gameType === 'compact-adventure') {
    const game = new CompactTextAdventure()
    await game.initialize()
    return game
  }
  
  return null
}

// Start the application
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})