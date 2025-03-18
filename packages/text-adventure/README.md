# Text Adventure Game Package

This package provides a simple text adventure game implementation that can be played with either a human or AI player.

## Features

- Multiple rooms with descriptions and connections
- Items that can be picked up and used
- Game state tracking (inventory, visited rooms, etc.)
- Interaction system for objects in the environment
- Win/lose conditions

## Usage

```typescript
import { TextAdventure } from '@ai-gamedev/text-adventure'
import { HumanPlayer, TerminalUI } from '@ai-gamedev/playtest'

// Create game instance
const game = new TextAdventure()
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