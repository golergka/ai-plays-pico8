# Compact Text Adventure Game Package

This package provides a compact version of the text adventure game that can be completed in 10-15 actions. It's ideal for testing and demonstrations where a quick game loop is needed.

## Features

- Shorter game flow for quicker completion
- Similar interface to the full text adventure game
- More guided gameplay experience
- Smaller map with fewer rooms

## Usage

```typescript
import { CompactTextAdventure } from '@ai-gamedev/compact-adventure'
import { HumanPlayer, TerminalUI } from '@ai-gamedev/playtest'

// Create game instance
const game = new CompactTextAdventure()
await game.initialize()

// Create a player and UI
const ui = new TerminalUI()
const player = new HumanPlayer({ terminalUI: ui })

// Run the game
const initialState = await game.start()
let gameState = initialState

// Game loop
while (true) {
  // Get action from player
  const [actionType, actionData] = await player.getAction(
    gameState.output,
    gameState.actions
  )
  
  // Process step
  const stepResult = await game.step([actionType, actionData])
  
  // If game is over, display result
  if (stepResult.type === 'result') {
    console.log('Game over:', stepResult.result.success ? 'Victory!' : 'Defeat')
    break
  }
  
  // Otherwise, update game state
  gameState = stepResult.state
}
```