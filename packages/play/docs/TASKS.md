# Tasks - Play Package

## Project Task Prefix: PLAY

## Current Task ID Counter: PLAY-000

This counter tracks the highest task ID used so far. When creating a new task, use PLAY-001 as the next available ID.

## Current Priorities
1. Setup basic Play package structure
2. Design core interfaces for game playing
3. Implement basic game controller logic

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

### [PLAY-001] Setup Play Package Structure [TODO]
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

### [PLAY-002] Design Game Controller Interface [TODO]
**Dependencies**: PLAY-001
**Description**: Design a core interface for game controllers that can be implemented by various game-specific controllers.
**Acceptance Criteria**:
- Interface definition for game controllers
- Documentation of interface methods and properties
- Unit tests for interface validation
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/interfaces/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/interfaces/game-controller.ts

## Low-level tasks

### [PLAY-003] Create Core Directory Structure [TODO]
**Dependencies**: None
**Description**: Create the initial directory structure for the Play package based on architecture requirements.
**Acceptance Criteria**:
- Create src/ directory with appropriate subdirectories
- Set up structure for core components
- Ensure proper separation of concerns
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/interfaces/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/controllers/
- /Users/maxyankov/Projects/ai-plays-pico8/packages/play/src/utils/