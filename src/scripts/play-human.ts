/**
 * Script to play a game with human input
 */
import { HumanPlayer } from '../cli/human-player'
import { TextAdventure } from '../games/text-adventure'
import { TerminalUI } from '../cli/terminal-ui'

async function main() {
  const args = process.argv.slice(2)
  const gameType = args[0] || 'text-adventure'

  // Create a terminal UI for displaying messages
  const ui = new TerminalUI()

  // Initialize the appropriate game
  const game = await initializeGame(gameType)
  if (!game) {
    ui.displayError(`Unknown game type: ${gameType}`)
    process.exit(1)
  }

  // Run the game with the human player
  try {
    const player = new HumanPlayer({ terminalUI: ui })
    ui.displayHeader(`Starting ${gameType} in human mode...`)
    const result = await game.run(player)
    await player.cleanup()

    // Display game result
    ui.displayHeader('Game Finished')
    ui.display(`Result: ${result.success ? 'Victory!' : 'Defeat'}`)
    if (result.score !== undefined) {
      ui.display(`Score: ${result.score}`)
    }
    ui.display(`Actions taken: ${result.actionCount}`)
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