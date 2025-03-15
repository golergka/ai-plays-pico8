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
   - Reflect on different tasks and make sure that this document doesn't have self-contraditions

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
- Full control over PICO-8 process lifecycle (autonomous operation)
- Robust error handling when interacting with PICO-8

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

### [T-006] Game Action API [TODO]
**Dependencies**: T-002
**Description**: Design a standardized API for game actions.
**Acceptance Criteria**:
- Common interface for different games
- Support for basic PICO-8 controls
- Extensible for game-specific actions
- Documentation and examples

### [T-007] Basic Reinforcement Learning Model [TODO]
**Dependencies**: T-004, T-006
**Description**: Implement simple RL model for game playing.
**Acceptance Criteria**:
- State representation from game screens
- Action selection mechanism
- Learning algorithm implementation
- Performance baseline metrics

### [T-008] Visualization Tools [TODO]
**Dependencies**: T-003, T-005
**Description**: Create tools to visualize AI gameplay and learning.
**Acceptance Criteria**:
- Real-time visualization of gameplay
- Performance metrics visualization
- Learning progress visualization
- Export options for analysis

### [T-009] MVP Demo Game Integration [TODO]
**Dependencies**: T-002, T-005, T-006
**Description**: Integrate with a simple PICO-8 game for demonstration.
**Acceptance Criteria**:
- Complete integration with one simple game
- AI can play game from start to finish
- Performance metrics for the game
- Demo documentation and setup instructions

## Low-Level Tasks

### [T-101] PICO-8 Game Runner [DONE]
**Dependencies**: T-001, T-105
**Description**: Create a module to run PICO-8 games programmatically.
**Acceptance Criteria**:
- Can launch PICO-8 with a specific cartridge
- Can close PICO-8 gracefully
- Error handling for failed launches
- Configurable PICO-8 path and options
- Use environment variables for configuration

### [T-110] Basic PICO-8 Test Cartridge [DONE]
**Dependencies**: T-101
**Description**: Create a simple PICO-8 test cartridge for development and testing purposes.
**Acceptance Criteria**:
- Simple game loop with recognizable patterns/objects
- Clear visual elements for screen capture testing
- Basic interaction via PICO-8 controls
- Stable and predictable behavior
- Documentation on how to use the cartridge for testing

### [T-102] Screen Capture Module [DONE]
**Dependencies**: T-101
**Description**: Module to capture PICO-8 game screen.
**Acceptance Criteria**:
- Capture game screen at configurable intervals
- Minimal performance impact
- Error handling for failed captures
- Image format suitable for processing
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/pico8.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/capture/screenCapture.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/capture.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/config/env.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-111] Improve Screen Capture Focus and Lifecycle [IN PROGRESS]
**Dependencies**: T-102
**Description**: Fix issues with screen capture to only capture the PICO-8 window and properly handle PICO-8 process exit.
**Acceptance Criteria**:
- Capture only the PICO-8 window rather than the full screen
- Automatically stop screen capture when PICO-8 process exits
- Add configuration options for window detection
- Update integration in main application
- Ensure capture works even when PICO-8 window is not in focus or is obscured by other windows
**Implementation Notes**:
- Consider using RobotJS (can simulate keystrokes and capture screens with window cropping)
- Alternative: nut.js (more modern and cross-platform)
- Alternative: socsieng/sendkeys-macos (GitHub, though it's archived)
- Ensure screen capture is properly linked to PICO-8 process lifecycle
- **Window Capture Issue**: Current implementation captures the entire screen when PICO-8 window is not in focus or obscured by other windows - need to find platform-specific solution to capture specific window regardless of focus state
**Testing Status**:
- User reported that when the PICO-8 window is not the topmost window, the screenshot captures the entire screen with other windows obscuring the view
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/capture/screenCapture.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/capture.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-103] Input Command Interface [IN PROGRESS]
**Dependencies**: T-101
**Description**: Module to send input commands to PICO-8.
**Acceptance Criteria**:
- Send keyboard inputs to PICO-8
- Support for all PICO-8 button combinations
- Configurable input mapping
- Input verification mechanism
**Implementation Status**:
- Initially tried robotjs for keyboard input, but encountered "missing symbol called" errors on macOS
- Current implementation uses child_process to execute AppleScript commands (osascript) for key events on macOS
- Added AppleScript commands for key press, key release, and key tap operations
- Added support for tap and sequence input patterns
- Added random button generator for testing
- Window detection via active-win package to ensure commands only sent when PICO-8 is in focus
**Testing Needed**:
- Verify that keyboard inputs are successfully sent to PICO-8
- Confirm that random button presses work as expected
- Test on macOS (current implementation)
- Consider adding support for Windows and Linux if needed
**Alternatives for Future Updates**:
1. nut.js - built on top of a C++ backend (via node-ffi-napi), more robust for system-level key events
2. node-key-sender - uses AppleScript under the hood to avoid C-level symbol issues
3. Swift binary called via child_process for more precise control on macOS
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/input.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-113] Improve PICO-8 Process Lifecycle Management [IN PROGRESS]
**Dependencies**: T-101, T-103
**Description**: Enhance control over the PICO-8 process lifecycle and improve input verification.
**Acceptance Criteria**:
- Application has full control over PICO-8 process lifecycle (launch, run, terminate)
- Automatically terminate PICO-8 when the application exits or at the end of the demo
- Ensure the demo script doesn't wait for cartridge to load specifically
- Demo should continuously send input commands for sufficient time to handle any cartridge loading delays
- Structured input patterns send specific commands with visible feedback
- Clear visual indication that keyboard inputs are working
- Improved error handling for PICO-8 process failures
**Implementation Status**:
- Added explicit process exit handler to ensure application terminates when PICO-8 exits
- Improved forced termination logic to ensure PICO-8 process is killed reliably
- Added timeout-based demo that runs for 10 seconds before terminating
- Enhanced error handling in the process termination flow
- Updated key mapping for PICO-8 input verification
- Added robust process termination with platform-specific commands and verification ✅
- Added isProcessRunning helper method to reliably check process status ✅
- Fixed force kill logic with multiple termination strategies ✅
**Current Issues to Fix**:
- ~~PICO-8 process isn't being killed (fix force kill logic)~~ ✅
- Key mapping is incorrect (test with simple key mapping test cartridge)
- Demo duration should be exactly 10 seconds
**Testing Status**:
- ~~User reported that the PICO-8 process is not being killed properly (termination fails)~~ - Fixed with improved termination logic
- User reported character movement is not visible, but menu appears/disappears (key mapping issue)
- Need to create a dedicated test cartridge for key mapping verification
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/test_game.p8

### [T-114] Create Key Mapping Test Cartridge [IN PROGRESS]
**Dependencies**: T-103
**Description**: Create a simple PICO-8 cartridge specifically for testing key mappings.
**Acceptance Criteria**:
- Create a cartridge that clearly displays which keys are being pressed
- Visual feedback should be immediate and obvious
- Test cartridge should work without complex loading screens or menus
- Include documentation on how to use the cartridge for testing
**Implementation Status**:
- Investigating key mapping issues with current implementation
- Creating a simple cartridge with immediate visual feedback
- Will update local .env to point to this new test cartridge
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/key_test.p8
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts

### [T-115] Vision-Based LLM Feedback System [DONE]
**Dependencies**: T-102, T-103
**Description**: Create a system that uses an LLM with vision capabilities to analyze PICO-8 screenshots and provide feedback/input commands.
**Acceptance Criteria**:
- Integration with OpenAI API for vision analysis (using system-wide API key) ✅
- Capture-analyze-command cycle: take screenshots, send to LLM, receive text feedback and commands ✅
- Simple function calling signature for the LLM to send key presses ✅
- Use cheapest suitable model for cost efficiency ✅
- Handle timing between screenshot captures and key presses ✅
- Proper error handling for API failures ✅
- Documentation of the LLM prompt and function schema ✅
**Implementation Status**:
- Implemented VisionFeedbackSystem class with screen capture and input command integration
- Added configuration through environment variables
- Implemented system prompt for LLM with game control instructions
- Added function calling schema for LLM to analyze game state and issue commands
- Added robust error handling and logging
- Integrated with main application flow with demo mode running for 60 seconds
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/llm/visionFeedback.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/llm.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/capture/screenCapture.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-104] Game State Detector [BLOCKED]
**Dependencies**: T-102, T-115
**Description**: Detect game state from screen captures.
**Acceptance Criteria**:
- Identify game screens (title, gameplay, game over)
- Extract game score/progress when available
- Detect success/failure conditions
- Configurable for different games
**Implementation Notes**:
- This task is now blocked by T-115 as we'll be using LLM vision capabilities for game state detection

### [T-105] Environment Configuration System [DONE]
**Dependencies**: T-001
**Description**: Create a configuration system using environment variables with .env file support.
**Acceptance Criteria**:
- Configuration via .env file for development
- Environment variables for production/CI environments
- .env file added to .gitignore
- Default values provided where appropriate
- Documentation for all required environment variables

### [T-106] Interactive Configuration Mode [CANCELLED]
**Dependencies**: T-105
**Description**: Add interactive mode for collecting configuration values from users.
**Acceptance Criteria**:
- ~~Interactive CLI prompt for missing configuration values~~
- ~~Validation of user input~~
- ~~Ability to save collected values to .env file~~
- ~~Clear error messages for invalid inputs~~
- ~~Documentation for interactive configuration workflow~~

**Cancellation Reason**: The current environment variable configuration system using .env files is sufficient for the project's needs. Decided to prioritize other core functionality instead.

### [T-107] Configuration Validation System [TODO]
**Dependencies**: T-105
**Description**: Implement validation system for configuration values.
**Acceptance Criteria**:
- Non-interactive mode with strict validation (missing values are fatal errors)
- Validation rules for each configuration type
- Appropriate error handling
- Command-line flags to control validation behavior

### [T-108] Enquirer Integration [CANCELLED]
**Dependencies**: T-106
**Description**: Integrate Enquirer library for interactive CLI prompts.
**Acceptance Criteria**:
- ~~Use Enquirer for all interactive prompts~~
- ~~Support for different prompt types (input, select, confirm)~~
- ~~Visual feedback for user actions~~
- ~~Ability to cancel configuration process~~
- ~~Proper error handling for user interactions~~

**Cancellation Reason**: Task T-106 (Interactive Configuration Mode) has been cancelled, so this dependency is no longer needed.

### [T-109] Documentation Health Monitor [DONE]
**Dependencies**: None
**Description**: Adapt the doc_health.sh script to check document sizes in the docs directory.
**Acceptance Criteria**:
- Script moved to appropriate location in project structure
- Script simplified to focus on document size checking
- Remove project-specific features not relevant to this project
- Support checking all Markdown files in docs directory
- Display clear warnings for large documents that need summarization
- Add helpful information on how to maintain documentation

### [T-112] Logger Utility [DONE]
**Dependencies**: None
**Description**: Create a logger utility for consistent logging across the application.
**Acceptance Criteria**:
- Support different log levels (DEBUG, INFO, WARN, ERROR)
- Allow module-specific loggers with prefixes
- Configurable log level filtering
- Support structured data logging
- Include timestamps in log messages
- Easily replaceable with more sophisticated logging systems in the future
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/utils/logger.ts