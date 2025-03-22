/**
 * Script to let Claude play a game using save files rather than interactive prompts
 */
import path from 'path'
import { TerminalUI } from '@ai-gamedev/playtest'
import { TextAdventure } from '@ai-gamedev/text-adventure'
import { CompactTextAdventure } from '@ai-gamedev/compact-adventure'
import type { SaveableGame } from '@ai-gamedev/playtest'
import chalk from 'chalk'
import { ClaudeSavePlayer } from './claude-save-player'

async function main() {
  const args = process.argv.slice(2)
  const gameType = args[0] || 'text-adventure'
  const saveDir = args[1] || path.join(process.cwd(), 'saves')
  
  // Create a terminal UI for displaying messages
  const ui = new TerminalUI()

  // Display usage instructions
  ui.displayHeader('Claude Save Player')
  ui.display(`Usage: bun run play:claude [game-type] [save-dir]`)
  ui.display(`  game-type: Game to play (default: text-adventure)`)
  ui.display(`            Options: text-adventure, compact-adventure`)
  ui.display(`  save-dir: Directory to store save files (default: ./saves)`)
  ui.display(``)
  ui.display(`Current settings:`)
  ui.display(`  Game: ${gameType}`)
  ui.display(`  Save directory: ${saveDir}`)
  ui.display(``)

  const game = await initializeGame(gameType)
  try {
    // Initialize the appropriate game
    if (!game) {
      ui.displayError(`Unknown game type: ${gameType}`)
      process.exit(1)
    }

    // Create the Claude Save Player
    const player = new ClaudeSavePlayer({
      gameId: gameType,
      saveDir
    })

    // Check if we have a save file or need to start a new game
    const saveLoaded = await player.loadSaveOrCreateNew(game)
    
    let gameState
    if (saveLoaded) {
      // If save was loaded, just get the current state
      ui.display('Loading saved game...')
      gameState = await game.start()
    } else {
      // Otherwise, start a new game
      ui.display('No save file found. Starting new game...')
      gameState = await game.start()
      // Save the initial state
      await player.saveGame(game)
    }

    // Display current game state
    ui.displayHeader('Current Game State')
    ui.display(gameState.output)

    // Get action from the command line
    try {
      // Get the action from the command line (processed by player.getAction)
      const [actionType, actionData] = await player.getAction(
        gameState.output,
        gameState.actions
      )
      
      // Display the action being taken
      ui.displayHeader('Action')
      ui.display(chalk.yellow(`${actionType} ${JSON.stringify(actionData)}`))

      // Process the step
      const stepResult = await game.step([actionType as string, actionData])
      
      // Save the updated game state
      await player.saveGame(game)
      
      // Display the result
      if (stepResult.type === 'result') {
        // Game is complete
        ui.displayHeader('Game Finished')
        ui.display(`Result: ${stepResult.result.success ? chalk.green('Victory!') : chalk.red('Defeat')}`)
        if (stepResult.result.score !== undefined) {
          ui.display(`Score: ${stepResult.result.score}`)
        }
        ui.display(`Actions taken: ${stepResult.result.actionCount}`)
        
        // Display metadata
        if (stepResult.result.metadata) {
          ui.displayHeader('Game Statistics')
          const visitedRooms = stepResult.result.metadata['visitedRooms'] as string[] || []
          const inventoryItems = stepResult.result.metadata['inventoryItems'] as string[] || []
          ui.display(`Visited rooms: ${visitedRooms.join(', ') || 'none'}`)
          ui.display(`Final inventory: ${inventoryItems.join(', ') || 'empty'}`)
        }
      } else {
        // Game continues
        ui.displayHeader('Updated Game State')
        ui.display(stepResult.state.output)
        
        // Display available actions for the next step
        ui.displayHeader('Available Actions')
        const actionNames = Object.keys(stepResult.state.actions)
        ui.display(`Actions: ${actionNames.join(', ')}`)
      }
    } catch (error) {
      ui.displayHeader('Error')
      ui.display(chalk.red(`Error processing action: ${error instanceof Error ? error.message : String(error)}`))
    }
  } catch (error) {
    ui.displayError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  } finally {
    // Clean up game resources
    if (game) {
      await game.cleanup()
    }
    ui.cleanup()
  }
}

/**
 * Initialize a game of the specified type
 * 
 * @param gameType Type of game to initialize
 * @returns Initialized game instance or null if game type not found
 */
async function initializeGame(gameType: string): Promise<SaveableGame | null> {
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
