# Tasks - Compact Adventure Package

## Project Task Prefix: COMPACT

## Current Task ID Counter: COMPACT-001

This counter tracks the highest task ID used so far. When creating a new task, use COMPACT-002 as the next available ID.

## Current Priorities
1. [COMPACT-001] Fix Game Actions API [TODO]

## IMPORTANT: INSTRUCTIONS FOR WORKING WITH THIS DOCUMENT

These instructions must not be summarized or removed from this document.

**Testing Requirements**: For general testing guidelines and approach, refer to [TESTING.md](TESTING.md). Each task requiring testing should include specific test procedures directly in its description.

1. **Task Structure**:
   - Each task has a unique ID (format: [PREFIX]-XXX)
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
   - Use the archive script to move completed tasks: `./scripts/archive_task.sh [PREFIX]-XXX`
   - NEVER use the Edit tool directly on the TASK_ARCHIVE.md file
   - The archive script will automatically extract, append, and remove the task
   - Links in tasks may refer to archived tasks - use GrepTool to find them in TASK_ARCHIVE.md
   - Break down high-level tasks into low-level tasks as work progresses
   - Do not remove these instructions
   - Reflect on different tasks and make sure that this document doesn't have self-contradictions

4. **Task Format**:
```
### [[PREFIX]-XXX] Short descriptive title [STATE]
**Dependencies**: [PREFIX]-YYY, [PREFIX]-ZZZ (if any)
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

## Low-level tasks

### [COMPACT-001] Fix Game Actions API [TODO]
**Dependencies**: None
**Description**: The current CompactTextAdventure implementation has a problematic API design where it only exposes a single action type "execute" that takes a command string as a parameter, instead of exposing a map of available actions that match the actual game mechanics. This makes the API less intuitive and harder to use with tools that expect a clear action schema. This task is to refactor the CompactTextAdventure implementation to expose proper action schemas that directly map to the available commands (look, move, etc.).
**Acceptance Criteria**:
- Refactor the CompactTextAdventure class to define proper action schemas for each available command (look, move, etc.)
- Replace the single "execute" action with individual actions like "look", "move", etc.
- Update the step method to properly handle these distinct action types
- Ensure backward compatibility with existing save files
- Update any examples or documentation to reflect the new API
- Verify that the game works with the Claude Save Player implementation
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/compact-adventure/src/compact-adventure.ts

**Manual Testing Instructions**:
1. Test with Claude Save Player:
   ```
   bun run play:claude compact-adventure --action="look"
   bun run play:claude compact-adventure --action="move north"
   ```
   - Verify that these commands work directly without needing to prefix with "execute"
   - Check that the game correctly processes the actions

2. Test with AI player:
   ```
   bun run play:ai compact-adventure
   ```
   - Verify that the AI model can understand and use the new action schema