# Tasks

## IMPORTANT: INSTRUCTIONS FOR WORKING WITH THIS DOCUMENT

These instructions must not be summarized or removed from this document.

1. **Task Structure**:
   - Each task has a unique ID (format: T-XXX)
   - Tasks can have dependencies (list of task IDs)
   - Tasks must have clear acceptance criteria
   - Tasks can be high-level (epics) or low-level (implementation details)

2. **Task States**:
   - TODO: Not started
   - IN PROGRESS: Currently being worked on
   - BLOCKED: Cannot proceed due to dependencies
   - DONE: Completed
   - CANCELLED: Will not be implemented, with reason

3. **Task Maintenance**:
   - Regularly clean up completed tasks
   - Summarize completed tasks in CHANGELOG.md
   - Break down high-level tasks into low-level tasks as work progresses
   - Do not remove these instructions

4. **Task Format**:
```
### [T-XXX] Short descriptive title [STATE]
**Dependencies**: T-YYY, T-ZZZ (if any)
**Description**: Detailed description of what needs to be done
**Acceptance Criteria**:
- Criterion 1
- Criterion 2
- ...
```

---

## High-Level Tasks (Epics)

### [T-001] Setup Project Structure [TODO]
**Dependencies**: None
**Description**: Set up the basic project structure with all necessary configs.
**Acceptance Criteria**:
- Directory structure defined
- All necessary configs in place
- Build pipeline working
- README updated with setup instructions

### [T-002] PICO-8 Interface [TODO]
**Dependencies**: T-001
**Description**: Create an interface to interact with PICO-8 games.
**Acceptance Criteria**:
- Can launch PICO-8 games
- Can capture game screen
- Can send input commands
- Can reset/restart games

### [T-003] Image Processing Pipeline [TODO]
**Dependencies**: T-002
**Description**: Create pipeline to process game images for AI input.
**Acceptance Criteria**:
- Process raw game screen captures
- Extract relevant features
- Prepare data format suitable for AI consumption
- Optimized for real-time performance

### [T-004] AI Training Environment [TODO]
**Dependencies**: T-002, T-003
**Description**: Set up environment for training AI models.
**Acceptance Criteria**:
- Data collection pipeline
- Reward function framework
- Training loop implementation
- Model evaluation metrics

### [T-005] Basic AI Agent [TODO]
**Dependencies**: T-004
**Description**: Implement a basic agent that can play PICO-8 games.
**Acceptance Criteria**:
- Agent can make decisions based on game state
- Agent can learn from experience
- Agent performance metrics
- Documentation on training process

## Low-Level Tasks

### [T-101] PICO-8 Game Runner [TODO]
**Dependencies**: T-001
**Description**: Create a module to run PICO-8 games programmatically.
**Acceptance Criteria**:
- Can launch PICO-8 with a specific cartridge
- Can close PICO-8 gracefully
- Error handling for failed launches
- Configurable PICO-8 path and options

### [T-102] Screen Capture Module [TODO]
**Dependencies**: T-101
**Description**: Module to capture PICO-8 game screen.
**Acceptance Criteria**:
- Capture game screen at configurable intervals
- Minimal performance impact
- Error handling for failed captures
- Image format suitable for processing