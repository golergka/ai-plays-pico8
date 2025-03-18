# Tasks - Playtest

## Project Task Prefix: T

## Current Task ID Counter: T-027

This counter tracks the highest task ID used so far. When creating a new task, use T-028 as the next available ID.

## Current Priorities
1. [T-026] Implement Save/Load Functionality in Text Adventure Games [TODO]
2. [T-027] Add Save File Support to Game CLI [TODO]
3. [T-020] Adjust Game Logic for Completion [TODO]
4. [T-024] Fix Game State Handling Issues [TODO] 
5. [T-021] Clean Up OpenAI Wrapper and LLM Player [TODO]
6. [T-001] Setup Project Structure [IN PROGRESS]
7. [T-002] Implement Core Schema System [TODO]
8. [T-004] Build Game Launcher [TODO]

## Moved to Play Package
The following tasks have been moved to the Play package:
- [T-010] ➡️ [PLAY-002] Implement Human Player Interface
- [T-019] ➡️ [PLAY-003] Add Game Playtime Limit
- [T-025] ➡️ [PLAY-004] Implement Game State Display in AI Player

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
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/docs/ARCHITECTURE.md
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/tsconfig.json
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/package.json
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/README.md
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/

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
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/schema/

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
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/launcher/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/index.ts

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
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/types.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/schema.ts

## Low-level tasks

### [T-006] Setup Core Directory Structure [IN PROGRESS]
**Dependencies**: None
**Description**: Create the initial directory structure for the project based on architecture requirements.
**Acceptance Criteria**:
- Create src/ directory with appropriate subdirectories
- Set up structure for core components, schema, games, etc.
- Ensure proper separation of concerns
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/types/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/schema/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/ai/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/launcher/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/utils/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/config/

### [T-007] Add Zod Schema Library [IN PROGRESS]
**Dependencies**: T-006
**Description**: Add Zod (or similar) schema validation library and set up core schema types.
**Acceptance Criteria**:
- Install Zod package ✅
- Create basic schema utility functions ✅
- Set up schema type definitions ✅
- Add example schema implementation ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/package.json
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/schema/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/schema/utils.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/schema/examples.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/schema/schema.test.ts

### [T-009] Update README with Project Information [TODO]
**Dependencies**: T-006
**Description**: Update the README with project overview, setup instructions, and usage examples.
**Acceptance Criteria**:
- Add project description matching new architecture
- Include setup and installation instructions
- Add usage examples for playing text games
- Document available commands and options
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/README.md

### [T-010] Implement Human Player Interface [MOVED]
**Dependencies**: T-005
**Description**: This task has been moved to the Play package as [PLAY-002].

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
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/schema/utils.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/schema/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/schema.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/types/game.ts

### [T-012] Enhance Text Adventure With Action Feedback [TESTING]
**Dependencies**: T-005, PLAY-002
**Description**: Enhance the text adventure demo game to provide clear feedback after each action. Currently, the game shows the current state but doesn't provide explicit feedback about the result of the last action taken.
**Acceptance Criteria**:
- Modify the text adventure game to store the result of the last action ✅
- Update the game output to include a section describing what happened ✅
- Provide clear feedback for successful and failed actions ✅
- Ensure feedback is contextual and relevant to the specific action taken ✅
- Test the implementation with the human player interface ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/types.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/compact-adventure.ts

**Manual Testing Instructions**:
1. Test the action feedback in the original text adventure:
   ```
   bun run play:human text-adventure
   ```
   - Verify that each action shows a feedback message in the [Last action] section
   - Try different actions: move, look, examine, take, use, inventory, help
   - Check that error messages are shown when actions fail
   - Verify that winning/losing shows appropriate messages
   - Note: This uses the human player interface from the Play package (PLAY-002)

2. Test the action feedback in the compact adventure:
   ```
   bun run play:human compact-adventure
   ```
   - Verify the same feedback functionality works in the compact adventure
   - Try special interactions like using the torch and key
   - Check dark room behavior with/without lit torch

### [T-019] Add Platform-Level Game Playtime Limit [MOVED]
**Dependencies**: T-015, T-016
**Description**: This task has been moved to the Play package as [PLAY-003].

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
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/games/text-adventure/compact-adventure.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/games/text-adventure/schema.ts

### [T-024] Fix Game State Handling Issues [DONE]
**Dependencies**: T-023
**Description**: After implementing the step-based model, testing revealed issues with state handling in the games, particularly with the compact adventure. These issues need to be fixed to ensure games work correctly with the AI player.
**Acceptance Criteria**:
- Fix the issue where the AI tries to take the same item multiple times ✅
- Update the game state tracking to properly record visited rooms ✅
- Ensure metadata in forced termination results (step limit reached) includes proper visited rooms and inventory ✅
- Fix any game state persistence issues between steps ✅
- Make sure game state is correctly reflected in the AI's decision-making process ✅
- Test with both human and AI players to verify correct game state handling ✅
- Ensure proper error handling when game state operations fail ✅

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/games/text-adventure/compact-adventure.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/scripts/play-ai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/games/text-adventure/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/types/game.ts

**Manual Testing Instructions**:
1. Test item handling and fuzzy matching:
   ```
   bun run play:human compact-adventure
   ```
   - Try taking the same item twice - should show "already have" message
   - Test taking items using different capitalization or full names
   - Try using items with variations of their names
   - Confirm the lit torch works correctly in the dark room

2. Test with the AI player to verify step limit handling:
   ```
   bun run play:ai compact-adventure gpt-4 3 5
   ```
   - Verify that the game terminates after 5 steps
   - Check that the metadata in the game result includes visited rooms and inventory
   - Confirm that the game state is correctly tracked across actions

### [T-025] Implement Game State Display in AI Player [MOVED]
**Dependencies**: T-024
**Description**: This task has been moved to the Play package as [PLAY-004].

### [T-026] Implement Save/Load Functionality in Text Adventure Games [TODO]
**Dependencies**: PLAY-005
**Description**: Implement the save/load functionality in the text adventure game implementations to support the new Game interface methods. This task requires adapting both the basic text adventure and compact adventure games to properly serialize and deserialize their game states.
**Acceptance Criteria**:
- Implement saveState() method in TextAdventure class that serializes the complete game state
- Implement loadState() method in TextAdventure class that deserializes and restores a game state
- Implement the same functionality in CompactTextAdventure class
- Ensure all game state is properly captured and restored (rooms, inventory, game progress, etc.)
- Add optional initialState parameter to game constructor/initialize method
- Implement proper error handling for invalid or incompatible save states
- Test save/load functionality with various game states (beginning, middle, end)
- Add version information to saved states for future compatibility
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/compact-adventure.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/games/text-adventure/types.ts

**Manual Testing Instructions**:
1. Test saving and loading with the TextAdventure game:
   - Start a new game and take several actions
   - Save the game state to a file
   - Load the game state from the file
   - Verify that all game state is correctly restored (rooms, inventory, game progress)

2. Test saving and loading with the CompactTextAdventure game:
   - Repeat the same tests with the compact adventure game
   - Verify specific game state like torch lighting, door states, etc.

3. Test error handling:
   - Attempt to load an invalid or corrupted save state
   - Verify appropriate error messages are displayed
   - Check that the game handles the error gracefully

### [T-027] Add Save File Support to Game CLI [TODO]
**Dependencies**: T-026, PLAY-007
**Description**: Update the game CLI scripts to support saving and loading game states from files. This task bridges the implementation of save/load functionality in games with the new Claude Save-Based Player, ensuring the CLI provides a consistent interface for all player types.
**Acceptance Criteria**:
- Update game initialization code to support loading from a save file
- Add command-line arguments for specifying save file paths
- Implement automatic save file naming based on game type and date
- Create a dedicated saves folder in the package with proper .gitignore setup
- Support both absolute and relative paths for save files
- Add save file management commands (list, delete, etc.)
- Ensure clean error handling for save/load operations
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/scripts/play-human.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/src/scripts/play-ai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/.gitignore

**Manual Testing Instructions**:
1. Test save/load via command line:
   ```
   bun run play:human text-adventure --save-file=my-save.json
   ```
   - Verify the game state is saved to the specified file
   - Check that loading from the save file works correctly
   - Confirm save files are created in the correct location

2. Test auto-saving and default paths:
   ```
   bun run play:human text-adventure --auto-save
   ```
   - Verify that game states are automatically saved after each action
   - Check that the auto-save files follow the expected naming convention
   - Confirm that auto-saves can be loaded in a later session

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
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/ai/api/openai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/playtest/ai/api/index.ts

