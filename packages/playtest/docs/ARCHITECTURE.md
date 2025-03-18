# Architecture

This document describes the overall architecture of the AI Plays Text Game project.

## Core Concepts

The project is designed as a "sandwich" architecture with three main layers:

1. **Bottom Layer: Game Launcher**
   - Main executable of the package
   - Responsible for launching and managing games from templates
   - Entry point for running a game with AI
   - Handles the complete lifecycle of the game session

2. **Middle Layer: Game Implementation**
   - Games are implemented as templates within this project
   - Each game implements logic, state, and interaction patterns
   - Uses the top layer to get AI responses for each game state

3. **Top Layer: LLM Interaction**
   - Core class that handles communication with LLMs
   - Maintains conversation history and context
   - Transforms game output and schema into proper LLM prompts
   - Parses LLM responses into structured data based on schemas

## Core Interfaces

### LLM Interaction Interface

The main class that games will interact with:

```typescript
class AIPlayer {
  constructor(options: AIPlayerOptions);
  
  /**
   * Process game output and wait for valid AI action
   * 
   * @param gameOutput Text description of current game state
   * @param actionSchema Schema defining valid actions (will be converted to JSON Schema for function calling)
   * @returns Promise resolving with a valid action matching the schema
   */
  async getAction<T>(
    gameOutput: string, 
    actionSchema: TSchemaOf<T>
  ): Promise<TInstance<T>>;
}
```

### Game Interface

Game templates will implement this interface:

```typescript
interface Game {
  /**
   * Initialize the game
   */
  initialize(): Promise<void>;
  
  /**
   * Run the game with the provided AI player
   * 
   * @param aiPlayer The AI player that will provide actions
   * @returns Promise resolving when game ends
   */
  run(aiPlayer: AIPlayer): Promise<GameResult>;
  
  /**
   * Clean up resources when game ends
   */
  cleanup(): Promise<void>;
}
```

## Data Flow

1. User runs the launcher with parameters specifying which game template to use
2. Launcher initializes the selected game and configures the AI player
3. Game begins execution and calls `aiPlayer.getAction(output, schema)` when input is needed
4. AI player:
   - Formats prompt with game output and schema
   - Sends request to LLM with function calling
   - Waits for valid response matching schema
   - Returns structured data to game
5. Game receives action, updates state, and continues
6. Process repeats until game ends
7. Launcher handles cleanup and returns results

## Schema Handling

The project will use a schema validation library (like Zod) that can:
1. Define type-safe schemas in TypeScript
2. Generate JSON Schema for LLM function calling
3. Validate and parse LLM responses
4. Provide strong TypeScript typing

## Conversation Management

The AIPlayer class will maintain conversation history including:
- Game outputs (what the player "sees")
- AI's internal monologue (thinking process)
- Actions taken (function calls)

This history provides context for the LLM to make better decisions over time.

## Future Considerations

This architecture focuses on the current needs, where:
- Game launcher is the main executable
- All games are templates within this project

Future extensions might include:
- Supporting external game implementations
- Creating a proper library that can be imported into other projects
- Separating the launcher and core functionality
- Adding multiplayer or streaming capabilities