# Tasks

## Current Task ID Counter: T-131

This counter tracks the highest task ID used so far. When creating a new task, use T-131 as the next available ID.

## Current Priorities
1. [T-130] Fix Native Module Crash in Vision Integration - URGENT
2. [T-127] Complete OpenAI Vision Integration - IN PROGRESS
3. [T-129] Keyboard Mapping Verification via LLM - BLOCKED by T-127, T-130

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

### [T-111] Improve Screen Capture Focus and Lifecycle [DONE]
**Dependencies**: T-102
**Description**: Fix issues with screen capture to only capture the PICO-8 window and properly handle PICO-8 process exit.
**Acceptance Criteria**:
- ✅ Capture only the PICO-8 window rather than the full screen
- ✅ Automatically stop screen capture when PICO-8 process exits
- ✅ Add configuration options for window detection
- ✅ Update integration in main application
- ✅ Ensure capture works even when PICO-8 window is not in focus or is obscured by other windows
**Implementation Notes**:
- ✅ Implemented window-specific capture using `capture-window` library on macOS (with safe fallbacks for reliability)
- ✅ Created a tiered fallback approach with multiple capture strategies:
  1. Window-specific capture (macOS only) with direct window ID targeting
  2. Region-based capture using window coordinates when direct capture fails
  3. Full-screen fallback when other methods fail
- ✅ Added improved process lifecycle management with proper cleanup
- ✅ Added window ID caching to maintain capture across focus changes
- ✅ Added advanced error handling with graceful degradation between capture methods
- ✅ Enhanced window detection with case-insensitive matching and fallback options for testing
- ✅ Improved region cropping with safe bounds checking to prevent crop failures 
- ✅ Added additional logging for test scenarios to help diagnose issues
**Additional Improvements**:
- Added special handling for test mode to improve reliability when PICO-8 window can't be found
- Enhanced window matching to detect PICO-8 by partial name, bundle ID, or related identifiers
- Improved error handling for the `capture-window` library to prevent crashes
- Added safety checks for region cropping to ensure valid dimensions
**Test Results**:
- All automated capture tests now pass successfully
- The lifecycle test confirms that capture stops when PICO-8 exits
- Full manual testing confirmed correct behavior in real-world usage
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/capture/screenCapture.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/capture.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-113] Improve PICO-8 Process Lifecycle Management [BLOCKED]
**Dependencies**: T-101, T-103, T-129
**Description**: Enhance control over the PICO-8 process lifecycle and improve input verification.
**Acceptance Criteria**:
- ✅ Application has full control over PICO-8 process lifecycle (launch, run, terminate)
- ✅ Automatically terminate PICO-8 when the application exits or at the end of the demo
- ✅ Ensure the demo script doesn't wait for cartridge to load specifically
- ✅ Use simple fixed delay for cartridge loading (see archived task T-124 for detailed findings)
- Structured input patterns send specific commands with visible feedback
- Clear visual indication that keyboard inputs are working
- ✅ Improved error handling for PICO-8 process failures
**Implementation Status**:
- ✅ Added explicit process exit handler to ensure application terminates when PICO-8 exits
- ✅ Improved forced termination logic to ensure PICO-8 process is killed reliably
- ✅ Added timeout-based demo that runs for 10 seconds before terminating
- ✅ Enhanced error handling in the process termination flow
- Partial key mapping for PICO-8 input verification using AppleScript key codes
- ✅ Added robust process termination with platform-specific commands and verification
- ✅ Added isProcessRunning helper method to reliably check process status
- ✅ Fixed force kill logic with multiple termination strategies
- ✅ Improved error handling for window focus changes during tests
- Preliminary arrow key mapping improvements using key codes instead of ASCII characters
**Implementation Notes**:
- Task now blocked by T-129 for proper key mapping verification using LLM vision feedback
**Testing Instructions**:
1. **Automated Self-Tests** (run these first):
   ```bash
   # Run basic process lifecycle tests
   bun run test:termination
   
   # Run basic input command tests
   bun run test:input
   ```

   **Expected Behavior:**
   - PICO-8 will launch and close automatically multiple times during testing
   - Tests should show clear ✅ success messages for each test
   - All tests should complete within ~30 seconds
   - No errors should be shown (especially no unhandled promise rejections)
   - The process should exit cleanly after tests finish

2. **Manual Testing**:
   
   **Test 1: Demo Termination**
   1. Run: `APP_DEBUG=true bun start`
   2. Wait for PICO-8 to fully launch (~5 seconds)
   3. You should see input commands being sent automatically
   4. After exactly 10 seconds, the application should terminate on its own
   5. Verify that both the application and PICO-8 have exited
   
   **Test 2: Manual Termination**
   1. Run: `APP_DEBUG=true bun start`
   2. Wait for PICO-8 to fully launch (~5 seconds)
   3. Press Ctrl+C in the terminal to terminate
   4. Verify that both the application and PICO-8 exit cleanly
   5. Check the terminal output for messages indicating proper shutdown
   
   **Test 3: PICO-8 Exit Detection**
   1. Run: `APP_DEBUG=true bun start`
   2. Wait for PICO-8 to fully launch (~5 seconds)
   3. Close the PICO-8 window by clicking the X button (don't use Ctrl+C)
   4. Verify that the application detects PICO-8 has closed and shuts down
   5. Check the terminal output for messages like "PICO-8 process exited"
   
   **Success Criteria:**
   - All automated tests pass successfully
   - In Test 1: The application terminates after exactly 10 seconds
   - In Test 2: Both processes terminate cleanly when Ctrl+C is pressed
   - In Test 3: The application detects when PICO-8 is closed and exits
   - No PICO-8 processes remain running after any of the tests
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/key_test.p8
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/terminationTest.ts

### [T-120] Clean Up Cross-Platform References in Termination Code [LOW PRIORITY]
**Dependencies**: T-119
**Description**: Remove unnecessary cross-platform references from termination code since we're focusing only on macOS support.
**Acceptance Criteria**:
- Remove Windows/Linux platform-specific code from termination tests
- Update documentation to clearly indicate macOS-only support
- Clean up any remaining multi-platform references in the codebase
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/pico8.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/terminationTest.ts

### [T-121] Enhance Termination Testing for Critical Scenarios [LOW PRIORITY]
**Dependencies**: T-118, T-119
**Description**: Expand the existing termination tests to cover more edge cases on macOS.
**Acceptance Criteria**:
- Add tests for application crash scenarios
- Improve verification to detect and handle zombie processes
- Create simple manual testing procedures for human verification
- Document expected behavior for all termination scenarios
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/terminationTest.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/testRunner.ts

### [T-126] Optimize Test Performance for Self-Testing [TODO]
**Dependencies**: None
**Description**: Improve the performance of automated self-tests to reduce total test execution time.
**Acceptance Criteria**:
- Reduce the total test execution time for `bun run test:self` to under 30 seconds
- Reduce wait times and timeouts in test scenarios where appropriate
- Update key test sequences to use shorter delays between key presses
- Add fast path for screen capture tests in self-test mode
- Maintain test reliability while improving speed
- Implement parallel test execution where possible
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/inputTests.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/captureTests.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/terminationTest.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/testRunner.ts

### [T-104] Game State Detector [BLOCKED]
**Dependencies**: T-102, T-115, T-128
**Description**: Detect game state from screen captures.
**Acceptance Criteria**:
- Identify game screens (title, gameplay, game over)
- Extract game score/progress when available
- Detect success/failure conditions
- Configurable for different games
**Implementation Notes**:
- This task is now blocked by T-115 and T-128 as we'll be using LLM vision capabilities for game state detection

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

### [T-127] OpenAI Vision Integration via API [IN PROGRESS]
**Dependencies**: T-111
**Description**: Implement basic OpenAI vision model integration to analyze PICO-8 screen captures.
**Acceptance Criteria**:
- ✅ Set up OpenAI Vision SDK connection 
- ✅ Create environment variables for API keys and configuration
- ✅ Implement function to send single screen capture to vision model
- ✅ Create prompt template system for game state analysis
- ✅ Return structured response from model for programmatic use
- ✅ Add basic error handling and rate limiting support
- Ensure proper directory creation and error handling (now part of T-130)
**Implementation Details**:
- ✅ Created VisionFeedbackSystem class for vision model integration
- ✅ Integrated OpenAI SDK for sending images to GPT-4 Vision
- ✅ Implemented screen capture integration with existing capture system
- ✅ Created structured prompt system for game state analysis
- ✅ Added support for function calling to receive structured data back
- ✅ Implemented markdown session reporting with screenshots and LLM feedback
- ✅ Created simple demo command for testing: `bun run vision:demo`
- ✅ Added configurable steps for multi-step analysis sessions
**Implementation Issues**:
- Initial implementation has critical bugs that cause crashes (see T-130)
- Captures directory is not properly created before use
- Native module errors in capture-window library
- PICO-8 process not terminated properly when application crashes
**Testing Status**:
- Initial manual testing revealed critical issues that need to be fixed before further testing
- See task T-130 for details on the issues and implementation plan
**Testing Instructions**: (Do not test until T-130 is completed)
1. Ensure you have an OpenAI API key set in your environment
2. Create a `.env` file based on the `.env.example` or set environment variables
3. Run the demo:
   ```bash
   # Basic demo with 3 steps
   bun run vision:demo
   
   # Demo with custom number of steps
   bun run vision:demo:steps
   ```
4. Check the generated report in the captures directory
**Note**: The system requires an OpenAI API key with access to GPT-4 Vision
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/llm/visionFeedback.ts (main system)
- /Users/maxyankov/Projects/ai-plays-pico8/src/llm/visionDemo.ts (demo runner)
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/llm.ts (type definitions)
- /Users/maxyankov/Projects/ai-plays-pico8/src/config/env.ts (configuration)

### [T-128] Game State Detection via Vision Models [TODO]
**Dependencies**: T-127
**Description**: Build exploratory testing framework using vision models to detect game state from screen captures.
**Acceptance Criteria**:
- Create testing harness for vision model feedback
- Implement basic game state detection logic
- Design structured prompts for different game detection tasks
- Document vision model response patterns
- Integrate with existing screen capture system
- Add examples for different PICO-8 game states
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/llm/visionFeedback.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/captureTests.ts
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/test_game.p8

### [T-129] Keyboard Mapping Verification via LLM [TODO]
**Dependencies**: T-127
**Description**: Use vision model to verify and fix keyboard input mapping for PICO-8.
**Acceptance Criteria**:
- Create vision prompt to detect highlighted keys in PICO-8 key_test cartridge
- Implement systematic testing of all input keys using vision feedback
- Create mapping between detected key highlights and input commands
- Fix input mapping issues in inputCommands.ts
- Document correct key mappings for all standard PICO-8 inputs
- Implement verification loop to ensure key mappings are correct
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/llm/visionFeedback.ts
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/key_test.p8
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/inputTests.ts

### [T-130] Fix Native Module Crash in Vision Integration [URGENT] [TODO]
**Dependencies**: T-127
**Description**: Fix critical crash issue in the OpenAI vision integration related to the capture-window native module.
**Acceptance Criteria**:
- Fix the native module assertion failure in the capture-window library
- Ensure proper handling of PICO-8 process termination after test completion
- Implement safer fallback mechanisms when native capture fails
- Add additional error handling for native module interactions
- Create captures directory if it doesn't exist before attempting to use it
- Verify the fix works reliably across multiple test runs
**Issue Details**:
```
Assertion failed: (napi_get_value_string_utf8(env, args[0], NULL, 0, &bundle_length) == napi_ok), function capture, file apple.m, line 140.
error: script "vision:demo" was terminated by signal SIGABRT (Abort)
```
**Additional Issues**:
- Captures folder does not exist, causing additional failures
- PICO-8 process remains running after crash
**Implementation Strategy**:
1. Fix directory creation issue to ensure captures folder exists before use
2. Investigate the specific native module failure in the capture-window library
3. Implement a safer fallback mechanism that prevents crashes
4. Improve error handling in the VisionFeedbackSystem class
5. Ensure proper cleanup of resources when crashes occur
6. Add a special testing mode that uses screenshots instead of live capture
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/llm/visionFeedback.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/llm/visionDemo.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/capture/screenCapture.ts
