/**
 * Main entry point for the AI Plays Text Game project
 */
import { HumanPlayer } from './src/cli/human-player'
import { TextAdventure } from './src/games/text-adventure'
import { TerminalUI } from './src/cli/terminal-ui'
import type { GameResult } from './src/types'

async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'help'
  const gameType = args[1] || 'text-adventure'

  // Handle help command
  if (mode === 'help') {
    console.log('AI Plays Text Game')
    console.log('Usage: bun start [mode] [game-type]')
    console.log('\nModes:')
    console.log('  human    - Play a game with human input')
    console.log('  ai       - Play a game with AI input (coming soon)')
    console.log('  help     - Show this help message')
    console.log('\nGame Types:')
    console.log('  text-adventure - Simple text adventure game')
    console.log('\nExamples:')
    console.log('  bun start human text-adventure - Play text adventure as human')
    console.log('\nRun tests with: bun run test')
    return
  }

  // Create a terminal UI for displaying messages
  const ui = new TerminalUI()

  // Initialize the appropriate game
  const game = await initializeGame(gameType)
  if (!game) {
    ui.displayError(`Unknown game type: ${gameType}`)
    process.exit(1)
  }

  // Run the game with the appropriate player
  try {
    let result
    if (mode === 'human') {
      const player = new HumanPlayer({ terminalUI: ui })
      ui.displayHeader(`Starting ${gameType} in human mode...`)
      
      // Get initial state
      const initialState = await game.start()
      let gameState = initialState
      
      // Main game loop
      while (true) {
        // Get action from player
        const [actionType, actionData] = await player.getAction(
          gameState.output,
          gameState.actions
        )
        
        // Process step
        const stepResult = await game.step([actionType as string, actionData])
        
        // If game is over, return result
        if (stepResult.type === 'result') {
          result = stepResult.result
          break
        }
        
        // Otherwise, update game state
        gameState = stepResult.state
      }
      
      await player.cleanup()
    } else if (mode === 'ai') {
      ui.displayError('AI mode is not yet implemented')
      process.exit(1)
    } else {
      ui.displayError(`Unknown mode: ${mode}`)
      process.exit(1)
    }

    // Display game result
    if (result) {
      ui.displayHeader('Game Finished')
      ui.display(`Result: ${result.success ? 'Victory!' : 'Defeat'}`)
      if (result.score !== undefined) {
        ui.display(`Score: ${result.score}`)
      }
      ui.display(`Actions taken: ${result.actionCount}`)
    }
  } finally {
    // Clean up game resources
    await game.cleanup()
    ui.cleanup()
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
  }
  
  return null
}

// Start the application
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})