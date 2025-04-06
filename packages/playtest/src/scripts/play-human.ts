/**
 * Script to play a game with human input
 */
import { HumanPlayer } from '../cli/human-player'
import { TerminalUI } from '../cli/terminal-ui'
import { playGame } from './play-game'

async function main() {
  const args = process.argv.slice(2)
  const gameType = args[0] || 'text-adventure'

  // Create a terminal UI for displaying messages
  const ui = new TerminalUI()

  // Display usage instructions
  ui.displayHeader('Human Player Mode')
  ui.display(`Usage: bun run play:human [game-type]`)
  ui.display(`  game-type: Game to play (default: text-adventure)`)
  ui.display(`            Options: text-adventure, compact-adventure`)
  ui.display(``)
  ui.display(`Current settings:`)
  ui.display(`  Game: ${gameType}`)
  ui.display(``)

  try {
    // Create human player
    const player = new HumanPlayer({ terminalUI: ui })
    
    // Play the game with the human player
    await playGame(player, {
      gameType
    })
  } catch (error) {
    ui.displayError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  } finally {
    ui.cleanup()
  }
}

// Start the application
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
