# Tasks - Play Package

## Project Task Prefix: PLAY

## Current Task ID Counter: PLAY-004

This counter tracks the highest task ID used so far. When creating a new task, use PLAY-005 as the next available ID.

## Current Priorities
1. [PLAY-001] Setup Basic Play Package Structure [TODO]
2. [PLAY-002] Implement Human Player Interface [TODO]
3. [PLAY-003] Add Platform-Level Game Playtime Limit [TODO]
4. [PLAY-004] Implement Game State Display in AI Player [TODO]

## IMPORTANT: INSTRUCTIONS FOR WORKING WITH THIS DOCUMENT

These instructions must not be summarized or removed from this document.

**Testing Requirements**: For general testing guidelines and approach, refer to [TESTING.md](TESTING.md). Each task requiring testing should include specific test procedures directly in its description.

1. **Task Structure**:
   - Each task has a unique ID (format: PLAY-XXX)
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
   - Use the archive script to move completed tasks: `./scripts/archive_task.sh PLAY-XXX`
   - NEVER use the Edit tool directly on the TASK_ARCHIVE.md file
   - The archive script will automatically extract, append, and remove the task
   - Links in tasks may refer to archived tasks - use GrepTool to find them in TASK_ARCHIVE.md
   - Break down high-level tasks into low-level tasks as work progresses
   - Do not remove these instructions
   - Reflect on different tasks and make sure that this document doesn't have self-contradictions

4. **Task Format**:
```
### [PLAY-XXX] Short descriptive title [STATE]
**Dependencies**: PLAY-YYY, PLAY-ZZZ (if any)
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

### [PLAY-001] Setup Basic Play Package Structure [TODO]
**Dependencies**: None
**Description**: Set up the basic project structure for the Play package with all necessary configs based on the architecture document.
**Acceptance Criteria**:
- Directory structure defined and created
- All necessary configs in place
- Build pipeline working
- README updated with setup instructions
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/tsconfig.json
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/package.json
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/README.md

## Low-level tasks

### [PLAY-002] Implement Human Player Interface [TODO]
**Dependencies**: PLAY-001
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
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/cli/human-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/cli/terminal-ui.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/scripts/play-human.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/package.json

### [PLAY-003] Add Platform-Level Game Playtime Limit [TODO]
**Dependencies**: PLAY-001, PLAY-002
**Description**: Add automatic game completion after a certain number of steps to prevent infinite loops and ensure that tests and demos always terminate within a reasonable timeframe. This is a platform-level feature that should be implemented in the core interfaces and infrastructure, not in specific game implementations.
**Acceptance Criteria**:
- Add a maximum steps limit to the LLM player options
- Ensure the limit is configurable with a sensible default (10 steps)
- Implement step counting in the LLM player
- Throw an error when max steps is reached
- Update the play-ai.ts script to accept and pass through a max steps parameter
- Document the feature in relevant files
- IMPORTANT: Do NOT modify specific game implementations directly - the changes should be at the platform/interface level only
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/ai/llm-player.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/scripts/play-ai.ts

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

### [PLAY-004] Implement Game State Display in AI Player [TODO]
**Dependencies**: PLAY-001, PLAY-003
**Description**: When the AI is playing a game, the current game state is not visible to the user in the terminal output. This task is to update the AI player to display the full game state after each step, similar to how it's shown to the LLM, so that users can see what information the AI is receiving.
**Acceptance Criteria**:
- Display the full game state after each AI action in the terminal
- Show the game state in a consistent format matching human player display
- Update the terminal UI to properly format and display this information
- Add a clear section header to differentiate game state from LLM thinking/responses
- Ensure this doesn't interfere with existing event display (thinking, response, action, error)
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/scripts/play-ai.ts
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/cli/terminal-ui.ts

**Manual Testing Instructions**:
1. Run the AI player with the compact adventure:
   ```
   bun run play:ai compact-adventure gpt-4 3 5
   ```
   - Verify that before each AI action, the game state is displayed in the terminal
   - Check that the display shows the same information in the same format as in the human player mode
   - Confirm that the game state includes room name, description, inventory items, and available exits

2. Verify display clarity:
   ```
   bun run play:ai text-adventure
   ```
   - Check that the game state display is properly formatted with a clear "Game State" header
   - Verify that it's easy to distinguish between game state and LLM's thinking/actions
   - Confirm the overall flow is logical and easy to follow