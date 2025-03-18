# Tasks

## Current Task ID Counter: T-011

This counter tracks the highest task ID used so far. When creating a new task, use T-012 as the next available ID.

## Current Priorities
1. [T-001] Setup Project Structure
2. [T-002] Implement Core Schema System
3. [T-003] Create AI Player Interface
4. [T-004] Build Game Launcher

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

### [T-003] Create AI Player Interface [TODO]
**Dependencies**: T-002
**Description**: Implement the core AI Player class that handles LLM interaction, maintains conversation history, and processes game outputs.
**Acceptance Criteria**:
- AIPlayer class implementation
- Methods for processing game output
- Conversation history management
- LLM integration with function calling
- Configuration options for different LLMs
- Error handling and retry mechanisms
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/ai/
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/
- /Users/maxyankov/Projects/ai-plays-pico8/src/config/

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

### [T-010] Implement Human Player Interface [IN PROGRESS]
**Dependencies**: T-005
**Description**: Create a generic human player interface for playing games in the terminal, allowing users to test any game directly without AI assistance. The interface should be game-agnostic and not require any game-specific code or subclassing.
**Acceptance Criteria**:
- Command-line interface for human input
- Display game output in terminal
- Generic input handling system that can be adapted to different game schemas
- Proper help text and command suggestions
- Interface that respects the Game interface contract
- Game-agnostic design that doesn't require game-specific implementations
- Ability to run any game with the human player interface
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/human-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/cli/terminal-ui.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-011] [URGENT] Fix Action Schema System [TODO]
**Dependencies**: T-002, T-007
**Description**: The current action schema system needs to be reworked. It should be a map of action names to action schemas, rather than a single schema. This will allow for better type safety and more flexible action handling.
**Acceptance Criteria**:
- Refactor schema system to use a map of action names to schemas
- Update type definitions to ensure type safety across the system
- Ensure schema system generates correct JSON schema for function calling
- Update existing game implementations to use the new schema system
- Add proper typings to infer action types from schema definitions
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/utils.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/schema/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/games/text-adventure/schema.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/game.ts