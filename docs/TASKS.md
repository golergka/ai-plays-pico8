# Tasks

## Current Task ID Counter: T-023

This counter tracks the highest task ID used so far. When creating a new task, use T-023 as the next available ID.

## Current Priorities
1. [T-023] Refactor Game Architecture to Use Step-Based Model [DONE]
2. [T-019] Add Game Playtime Limit [TESTING]
3. [T-020] Adjust Game Logic for Completion [TODO]
4. [T-021] Clean Up OpenAI Wrapper and LLM Player [TODO]
5. [T-022] Remove Excessive Debug Logging [DONE]
6. [T-018] Create Direct LLM API Abstraction Layer [DONE]
7. [T-017] Fix Game Schemas to Use Required Parameters Only [DONE]
8. [T-015] Implement LLM Player with proper AI package [DONE]
9. [T-016] Create Short Demo Game [DONE]
10. [T-001] Setup Project Structure [IN PROGRESS]
11. [T-002] Implement Core Schema System [TODO]
12. [T-003] Create AI Player Interface [DONE]
13. [T-014] Create LLM Player Demo Script [DONE]
14. [T-004] Build Game Launcher [TODO]

## IMPORTANT: INSTRUCTIONS FOR WORKING WITH THIS DOCUMENT

These instructions must not be summarized or removed from this document.

**Testing Requirements**: For general testing guidelines and approach, refer to [TESTING.md](TESTING.md). Each task requiring testing should include specific test procedures directly in its description.

1. **Task Structure**:
   - Each task has a unique ID (format: T-XXX)
   - Use the Task ID Counter at the top of this document to determine the next available ID
   - Increment the counter each time you create a new task
   - Tasks can have dependencies (list of task IDs)
   - Tasks must have clear acceptance criteria
   - Tasks can be high-level (epics) or low-level (implementation details)

2. **Task States** (standard sequence):
   - TODO: Not started
   - BLOCKED: Cannot proceed due to dependencies
   - IN PROGRESS: Currently being worked on
   - TESTING: Implementation complete, awaiting human verification
   - DONE: Completed and verified (all tests passing and human verified)
   - CANCELLED: Will not be implemented, with reason
   
   **Important State Transition Rules:**
   - A task should ONLY move from TESTING to DONE when ALL tests pass
   - If any tests fail during the TESTING phase, the task MUST be moved back to IN PROGRESS state
   - Human verification is required for all state transitions from TESTING to DONE
   - When "manual testing" is mentioned, it ALWAYS means asking the human user to test the functionality - AI cannot perform manual testing itself

3. **Task Maintenance**:
   - When a task is marked as DONE and has been verified, it should LATER be moved to TASK_ARCHIVE.md
   - Use the archive script to move completed tasks: `./scripts/archive_task.sh T-XXX`
   - NEVER use the Edit tool directly on the TASK_ARCHIVE.md file
   - The archive script will automatically extract, append, and remove the task
   - Links in tasks may refer to archived tasks - use GrepTool to find them in TASK_ARCHIVE.md
   - Break down high-level tasks into low-level tasks as work progresses
   - Do not remove these instructions
   - Reflect on different tasks and make sure that this document doesn't have self-contradictions

4. **Task Format**:
```
### [T-XXX] Short descriptive title [STATE]
**Dependencies**: T-YYY, T-ZZZ (if any)
**Description**: Detailed description of what needs to be done
**Acceptance Criteria**:
- Criterion 1
- Criterion 2
- ...
**Relevant Files**:
- Path to relevant file 1
- Path to relevant file 2
```

5. **Task References**:
   - Each task should include a list of relevant files for implementation
   - This helps with efficient code navigation and understanding
   - Include both existing files that need to be referenced and new files to be created
   - The references should be full file paths where possible
   - When referencing directories, use trailing slash to indicate a directory

6. **Task scope**:
   - High-level tasks (Epics) are larger features or user stories
   - Low-level tasks are specific implementation details or sub-tasks
   - Leaf-level (in terms of trees) tasks should be something that can be implemented in a single session

7. **Critical Rules for Task Management**:
   - ALWAYS use this file (TASKS.md) as the SINGLE SOURCE OF TRUTH for ALL work
   - ALL bugs, issues, features, and work items MUST be tracked here
   - NEVER create separate files like ISSUES.md, BUGS.md, etc.
   - When finding bugs or issues, add them directly here as new tasks
   - Mark critical bugs and urgent fixes with [URGENT] tag
   - If a task is becoming too large or complex, break it down into smaller sub-tasks
   - Each task should be focused on a specific problem or feature
   - Create clear parent-child task relationships using dependencies
   - Completed tasks should eventually be moved to TASK_ARCHIVE.md for organizational clarity

## High-level tasks (epics)

### [T-001] Setup Project Structure [IN PROGRESS]
**Dependencies**: None
**Description**: Set up the basic project structure with all necessary configs based on the architecture document.
**Acceptance Criteria**:
- Directory structure defined and created
- All necessary configs in place
- Build pipeline working
- README updated with setup instructions
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/docs/ARCHITECTURE.md
- /Users/maxyankov/Projects/ai-plays-pico8/tsconfig.json
- /Users/maxyankov/Projects/ai-plays-pico8/package.json
- /Users/maxyankov/Projects/ai-plays-pico8/README.md
- /Users/maxyankov/Projects/ai-plays-pico8/src/

### [T-002] Implement Core Schema System [TODO]
**Dependencies**: T-001
**Description**: Create a schema system using Zod or similar library to define and validate game actions, with ability to generate JSON schema for LLM function calling.
**Acceptance Criteria**:
- Schema system implemented with type safety
- Ability to define complex action schemas
- Conversion to JSON Schema for function calling
- Validation/parsing of responses against schemas
- Basic tests demonstrating functionality
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/

### [T-003] Create AI Player Interface [DONE]
**Dependencies**: T-002
**Description**: Implement the core AI Player class that handles LLM interaction, maintains conversation history, and processes game outputs. Use a generic LLM interface for flexibility.
**Acceptance Criteria**:
- AIPlayer class implementation ✅
- Methods for processing game output ✅
- Conversation history management ✅
- LLM integration with function calling ✅
- Configuration options for different LLMs ✅
- Error handling and retry mechanisms ✅

**Testing Summary**:
The AI Player interface has been successfully implemented and tested:
- The LLMPlayer class implements the GamePlayer interface
- Successfully processes game output and selects appropriate actions
- Properly maintains conversation history
- Integrates with the OpenAI API for function calling
- Provides configuration options for model, system prompt, and retries
- Implements error handling and retry mechanisms
- Fixed issues with null content handling and event structure

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/llm-player.test.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/game.ts

### [T-004] Build Game Launcher [TODO]
**Dependencies**: T-003
**Description**: Create the main executable launcher that can run games with AI assistance.
**Acceptance Criteria**:
- Command-line interface for launcher
- Ability to select and launch games
- Configuration options for AI and games
- Game lifecycle management
- Results reporting and logging
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/launcher/
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-005] Implement Sample Text Adventure [IN PROGRESS]
**Dependencies**: T-004
**Description**: Create a simple text adventure game as a first template to demonstrate the system.
**Acceptance Criteria**:
- Basic text adventure implementation ✅
- Multiple rooms/locations ✅
- Items and inventory system ✅
- Simple puzzles for AI to solve ✅
- Clear win/lose conditions ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/types.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/schema.ts

## Low-level tasks

### [T-018] Create Direct LLM API Abstraction Layer [DONE]
**Dependencies**: T-015, T-017
**Description**: Replace the Vercel AI SDK with our own direct API implementation to have more control over the schema format and better error handling. Based on our debugging experiments, we found that directly calling the OpenAI API works better than using the Vercel SDK for our specific schema needs.
**Acceptance Criteria**:
- Create a lightweight abstraction layer for LLM APIs (starting with OpenAI) ✅
- Support function calling with proper schema conversion ✅
- Ensure all parameters in schemas are correctly marked as required ✅
- Abstract away provider-specific details behind a common interface ✅
- Handle error cases and retries appropriately ✅
- Replace Vercel AI usage in the LLMPlayer implementation ✅
- Maintain compatibility with our current GamePlayer interface ✅
- Provide clear documentation of the new abstraction layer ✅
- Ensure tools and toolChoice props are properly linked together ✅
- Allow for future expansion to other LLM providers ✅

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/api/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/api/openai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/api/types.ts (new)
- /Users/maxyankov/Projects/ai-plays-pico8/package.json

**Testing Summary**:
The implementation has been manually tested and verified to work correctly:
- OpenAI API is successfully called with proper parameters
- Tools and tool choice are correctly integrated
- Function calls are successfully processed
- Fixed issue with null content in API responses by using empty strings
- Fixed event structure in LLMPlayer to match expected format in play-ai.ts
- Type checking passes with no errors (`bun run typecheck`)

### [T-017] Fix Game Schemas to Use Required Parameters Only [DONE]
**Dependencies**: T-015
**Description**: OpenAI's function calling API requires that all parameters in a schema be marked as required, but our current game schemas include optional parameters. This needs to be fixed to make the LLM player work properly with our schemas.
**Acceptance Criteria**:
- Update all game schemas to use only required parameters ✅
- For actions with optional parameters, split them into multiple action variants ✅
- Update the text adventure schema to remove optional parameters for the `use` action ✅
- Update documentation to clearly state this requirement ✅
- Test the updated schemas with the LLM player ✅

**Testing Summary**:
The schema changes have been tested and verified:
- The game correctly provides separate useItem and useItemOn actions
- Both actions work correctly with the LLM player
- Human player testing confirmed that both commands work as expected
- Game properly processes the actions with their required parameters
- API integration is working correctly with the schema structure

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/schema.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/game.ts

### [T-015] Implement LLM Player with proper AI package [DONE]
**Dependencies**: T-018
**Description**: The current LLM Player implementation is incomplete and uses a mock LLM for development. We need to implement a proper LLM Player with direct API access instead of using the Vercel AI SDK. Our debugging found issues with how the Vercel SDK handles function calling schemas.
**Acceptance Criteria**:
- Replace Vercel AI package with our own direct API implementation ✅
- Implement the getAction method to use the custom API layer ✅
- Ensure conversation history is maintained correctly ✅
- Provide proper error handling and retry mechanisms ✅
- Ensure cleanup properly releases all resources ✅
- Add proper documentation in JSDoc comments ✅

**Testing Summary**:
The implementation has been successfully completed and tested:
- LLM player now uses our direct OpenAI API implementation
- Fixed bug with null content values causing API errors
- Fixed event data structure to match play-ai.ts expectations
- Conversation history is correctly maintained
- Type safety is ensured throughout the implementation
- Properly handles errors with type checking 
- Successfully processes tool calls from the OpenAI API

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/api/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/api/openai.ts

### [T-016] Create Short Demo Game [DONE]
**Dependencies**: T-005
**Description**: Create a shorter, faster text adventure demo game that can be completed in 10-15 actions. This will serve as a quick introduction to the system for new users, while keeping the current more extensive text adventure as a second option.
**Acceptance Criteria**:
- Create a new compact text adventure game implementation ✅
- Design a game that can be completed in 10-15 actions ✅
- Include basic game mechanics (movement, items, using items) ✅
- Ensure the game has clear win/lose conditions ✅
- Update the play-ai.ts and play-human.ts scripts to support selecting this new game ✅
- Update documentation to mention both game options ✅

**Testing Summary**:
The compact adventure game has been implemented and tested:
- The game is playable with both human and AI players
- Players can navigate between rooms, pick up items, and use them
- The game includes two win conditions (finding treasure or solving puzzle)
- Current implementation has some issues with AI completion (subject of task T-020)
- Game terminates after 20 turns if not completed (needs improvement in task T-019)
- Both game types are selectable in the play-ai.ts and play-human.ts scripts

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/compact-adventure.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/scripts/play-ai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/scripts/play-human.ts

### [T-014] Create LLM Player Demo Script [DONE]
**Dependencies**: T-003, T-005
**Description**: Create a script that allows a human to run and observe an LLM playing the text adventure game, with full visibility into the LLM's internal thought process, function calls, and game state transitions.
**Acceptance Criteria**:
- Create a script in src/scripts/play-ai.ts similar to play-human.ts ✅
- Update LLMPlayer implementation with event-based system ✅
- Implement event handlers to expose chat history and responses ✅
- Display both LLM thinking process and final actions in console ✅
- Format console output for readability (colors, sections, etc.) ✅
- Add retry/timeout configuration options via command line args ✅
- Create a bun script command in package.json ✅
- Provide usage instructions in console output ✅

**Testing Summary**:
The LLM player demo script has been implemented and tested:
- Successfully runs with `bun run play:ai` command
- Shows detailed LLM thinking process and actions in the console
- Displays colorized output with clear section headers
- Supports command-line arguments for game type, model, and max retries
- Properly handles errors and shows error information to the user
- Correctly shows game results and statistics at the end
- Fixed issues with event data structure in the LLM player interface

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/scripts/play-ai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/package.json
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/index.ts

### [T-006] Setup Core Directory Structure [IN PROGRESS]
**Dependencies**: None
**Description**: Create the initial directory structure for the project based on architecture requirements.
**Acceptance Criteria**:
- Create src/ directory with appropriate subdirectories
- Set up structure for core components, schema, games, etc.
- Ensure proper separation of concerns
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/
- /Users/maxyankov/Projects/ai-plays-pico8/src/launcher/
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/
- /Users/maxyankov/Projects/ai-plays-pico8/src/utils/
- /Users/maxyankov/Projects/ai-plays-pico8/src/config/

### [T-007] Add Zod Schema Library [IN PROGRESS]
**Dependencies**: T-006
**Description**: Add Zod (or similar) schema validation library and set up core schema types.
**Acceptance Criteria**:
- Install Zod package ✅
- Create basic schema utility functions ✅
- Set up schema type definitions ✅
- Add example schema implementation ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/package.json
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/utils.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/examples.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/test.ts

### [T-008] Define Core Game Interface [DONE]
**Dependencies**: T-006
**Description**: Define the core Game interface that all game templates will implement.
**Acceptance Criteria**:
- Create Game interface with required methods ✅
- Document proper implementation requirements ✅
- Add type definitions for game state and results ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/game.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/index.ts

### [T-009] Update README with Project Information [TODO]
**Dependencies**: T-006
**Description**: Update the README with project overview, setup instructions, and usage examples.
**Acceptance Criteria**:
- Add project description matching new architecture
- Include setup and installation instructions
- Add usage examples for playing text games
- Document available commands and options
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/README.md

### [T-010] Implement Human Player Interface [TESTING]
**Dependencies**: T-005
**Description**: Create a generic human player interface for playing games in the terminal, allowing users to test any game directly without AI assistance. The interface should be game-agnostic and not require any game-specific code or subclassing.
**Acceptance Criteria**:
- Command-line interface for human input ✅
- Display game output in terminal ✅
- Generic input handling system that can be adapted to different game schemas ✅
- Proper help text and command suggestions ✅
- Interface that respects the Game interface contract ✅
- Game-agnostic design that doesn't require game-specific implementations ✅
- Ability to run any game with the human player interface ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/human-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/terminal-ui.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/scripts/play-human.ts
- /Users/maxyankov/Projects/ai-plays-pico8/package.json

### [T-011] [URGENT] Fix Action Schema System [TESTING]
**Dependencies**: T-002, T-007
**Description**: The current action schema system needs to be reworked. It should be a map of action names to action schemas, rather than a single schema. This will allow for better type safety and more flexible action handling.
**Acceptance Criteria**:
- Refactor schema system to use a map of action names to schemas ✅
- Update type definitions to ensure type safety across the system ✅
- Ensure schema system generates correct JSON schema for function calling ✅
- Update existing game implementations to use the new schema system ✅
- Add proper typings to infer action types from schema definitions ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/utils.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/schema.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/game.ts

### [T-012] Enhance Text Adventure With Action Feedback [TESTING]
**Dependencies**: T-005, T-010
**Description**: Enhance the text adventure demo game to provide clear feedback after each action. Currently, the game shows the current state but doesn't provide explicit feedback about the result of the last action taken.
**Acceptance Criteria**:
- Modify the text adventure game to store the result of the last action ✅
- Update the game output to include a section describing what happened ✅
- Provide clear feedback for successful and failed actions ✅
- Ensure feedback is contextual and relevant to the specific action taken ✅
- Test the implementation with the human player interface ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/types.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/compact-adventure.ts

**Manual Testing Instructions**:
1. Test the action feedback in the original text adventure:
   ```
   bun run play:human text-adventure
   ```
   - Verify that each action shows a feedback message in the [Last action] section
   - Try different actions: move, look, examine, take, use, inventory, help
   - Check that error messages are shown when actions fail
   - Verify that winning/losing shows appropriate messages

2. Test the action feedback in the compact adventure:
   ```
   bun run play:human compact-adventure
   ```
   - Verify the same feedback functionality works in the compact adventure
   - Try special interactions like using the torch and key
   - Check dark room behavior with/without lit torch

### [T-013] Create Terminal UI Interface and Test Human Player [DONE]
**Dependencies**: T-010
**Description**: Extract an interface from the TerminalUI class and create unit tests for the HumanPlayer functionality with a mock UI implementation. This will improve testability and ensure the human player interface works correctly with any UI implementation.
**Acceptance Criteria**:
- Extract an ITerminalUI interface from the current TerminalUI class ✅
- Update TerminalUI to implement the new interface ✅
- Create a MockTerminalUI class that implements the interface for testing ✅
- Write unit tests for HumanPlayer that use the mock UI to simulate a play session ✅
- Tests should cover all major functionality: command parsing, help display, action execution ✅
- Include tests for both valid and invalid inputs ✅
- Simulate a complete game session with predetermined inputs and verify correct actions ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/terminal-ui.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/human-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/i-terminal-ui.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/mock-terminal-ui.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/human-player.test.ts

### [T-019] Add Platform-Level Game Playtime Limit [TESTING]
**Dependencies**: T-015, T-016
**Description**: Add automatic game completion after a certain number of steps to prevent infinite loops and ensure that tests and demos always terminate within a reasonable timeframe. This is a platform-level feature that should be implemented in the core interfaces and infrastructure, not in specific game implementations.
**Acceptance Criteria**:
- Add a maximum steps limit to the LLM player options ✅
- Ensure the limit is configurable with a sensible default (10 steps) ✅
- Implement step counting in the LLM player ✅
- Throw an error when max steps is reached ✅
- Update the play-ai.ts script to accept and pass through a max steps parameter ✅
- Document the feature in relevant files ✅
- IMPORTANT: Do NOT modify specific game implementations directly - the changes should be at the platform/interface level only ✅

**Manual Testing Instructions**:
1. Run the AI player with a limited number of steps:
   ```
   bun run play:ai compact-adventure gpt-4 3 5
   ```
   - Verify that the game terminates with an error after exactly 5 steps
   - Check that the error message shows "Maximum number of steps (5) reached"
   - Confirm that the step counter works correctly

2. Try with a different step limit:
   ```
   bun run play:ai compact-adventure gpt-4 3 3
   ```
   - Verify that the game terminates after exactly 3 steps
   - Confirm that the step limit works consistently

3. Test with the default step limit:
   ```
   bun run play:ai compact-adventure
   ```
   - Verify that the game defaults to 10 steps as specified in the code

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/scripts/play-ai.ts

### [T-020] Adjust Specific Game Logic for Completion [TODO]
**Dependencies**: T-016
**Description**: The current compact adventure game has some logic issues that make it difficult for the AI to complete. Adjust the game-specific logic to ensure the AI can reasonably complete the game. This task is specifically about modifying the compact-adventure.ts game implementation, not the platform code.
**Acceptance Criteria**:
- Identify and fix issues with item usage and interactions in the compact adventure game
- Ensure clear and logical progression through the game
- Make sure the AI can light the torch and use it in the dark room
- Balance the game to be completable within 15-20 steps by the AI
- Test with both human and AI players to verify completability
- Document any special interaction patterns in comments
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/compact-adventure.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/schema.ts

### [T-023] Refactor Game Architecture to Use Step-Based Model [DONE]
**Dependencies**: T-019, T-015
**Description**: Refactor the Game interface and implementations to use a step-based model instead of a single run method with a player parameter. This will allow for more control over the game flow, better handling of steps/turns, and a clearer separation between game logic and player logic.
**Acceptance Criteria**:
- Add a `step` method to the Game interface that takes no player parameters and returns either game state or game result (in a discriminated union) ✅
- Remove the player parameter from the `run` method, making players the responsibility of the caller ✅
- Implement proper state handling for the first step (no user input) ✅
- Move step limiting from LLMPlayer to the play-ai.ts script ✅
- Update all game implementations to match the new interface ✅
- Update play-ai.ts and play-human.ts to implement the game loop with the new architecture ✅
- Ensure typechecking and tests continue to pass ✅
- Document the new architecture pattern ✅

**Testing Summary**:
The refactoring has been completed and tested:
- Completely removed the `run` method from the Game interface
- Added new interfaces: GameState and StepResult for the step-based model
- Added a `start` method to initialize game state without player input
- Implemented step-based game loop in play-ai.ts and play-human.ts
- Moved step limiting from LLMPlayer to play-ai.ts
- Fixed all typechecking errors and verified that tests still pass
- Both games work correctly with the new architecture
- Manual testing with human player confirms the step-based approach works

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/game.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/compact-adventure.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/scripts/play-ai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/scripts/play-human.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-021] Clean Up Platform-Level OpenAI Wrapper and LLM Player [TODO]
**Dependencies**: T-018
**Description**: Now that the OpenAI wrapper and LLM player are working correctly, clean up this platform-level code, improve error handling, and add better documentation. This task focuses on the core AI platform components, not specific game implementations.
**Acceptance Criteria**:
- Refactor the OpenAI wrapper for clarity and consistency
- Improve error handling with more specific error types
- Remove redundant code and simplify complex logic
- Add comprehensive JSDoc comments to all public methods and interfaces
- Ensure all code paths are properly typed and exception-safe
- Update tests to cover the improved implementation
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/api/openai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/api/index.ts

### [T-022] Remove Excessive Debug Logging from Platform Code [DONE]
**Dependencies**: T-021, T-019, T-020
**Description**: After all the platform functionality is stable and tests are passing, remove the excessive debug logging from the platform code to clean up the output. This task focuses on improving the core platform components, not specific game implementations.
**Acceptance Criteria**:
- Remove all "DEBUG:" console.log statements from platform code ✅
- Replace with structured, level-based logging if needed ✅
- Keep only essential error logging for production use ✅
- Ensure clean output in normal operation ✅
- Verify all features still work correctly after removing logs ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/api/openai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/scripts/play-ai.ts

**Testing Summary**:
All debug logging has been removed from the platform code, specifically targeting:
- Removed all "DEBUG:" console.log statements from llm-player.ts
- Removed detailed error logging that exposed implementation details
- Replaced console.error calls with proper error handling
- Verified that the code still typechecks correctly
- Kept clean error messages for production use while removing excessive details