# Game Play Package

This package provides CLI tools and functionality to play text adventure games with either human or AI players.

## Features

- Command-line interface for playing games
- Support for both human and AI players
- Compatible with multiple game types
- Configurable AI parameters

## Usage

### Command Line

```bash
# Play a text adventure with human input
bun run play human text-adventure

# Play a compact adventure with AI
bun run play ai compact-adventure gpt-4 3 15
```

### Programmatic Usage

```typescript
import { playAiGame, playHumanGame } from '@ai-gamedev/play'

// Play with AI
await playAiGame({
  gameType: 'compact-adventure',
  model: 'gpt-4',
  maxRetries: 3,
  maxSteps: 15
})

// Play with human
await playHumanGame({
  gameType: 'text-adventure'
})
```