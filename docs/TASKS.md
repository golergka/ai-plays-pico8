# Tasks

## IMPORTANT: INSTRUCTIONS FOR WORKING WITH THIS DOCUMENT

These instructions must not be summarized or removed from this document.

**Testing Requirements**: For general testing guidelines and approach, refer to [TESTING.md](TESTING.md). Each task requiring testing should include specific test procedures directly in its description.

1. **Task Structure**:
   - Each task has a unique ID (format: T-XXX)
   - Tasks can have dependencies (list of task IDs)
   - Tasks must have clear acceptance criteria
   - Tasks can be high-level (epics) or low-level (implementation details)

2. **Task States** (standard sequence):
   - TODO: Not started
   - BLOCKED: Cannot proceed due to dependencies
   - IN PROGRESS: Currently being worked on
   - TESTING: Implementation complete, awaiting human verification
   - DONE: Completed and verified
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

7. **Critical Rules for Task Management**:
   - ALWAYS use this file (TASKS.md) as the SINGLE SOURCE OF TRUTH for ALL work
   - ALL bugs, issues, features, and work items MUST be tracked here
   - NEVER create separate files like ISSUES.md, BUGS.md, etc.
   - When finding bugs or issues, add them directly here as new tasks
   - Mark critical bugs and urgent fixes with [URGENT] tag
   - If a task is becoming too large or complex, break it down into smaller sub-tasks
   - Each task should be focused on a specific problem or feature
   - Create clear parent-child task relationships using dependencies

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
- ✅ Capture only the PICO-8 window rather than the full screen
- ✅ Automatically stop screen capture when PICO-8 process exits
- ✅ Add configuration options for window detection
- ✅ Update integration in main application
- ✅ Ensure capture works even when PICO-8 window is not in focus or is obscured by other windows
**Implementation Notes**:
- ✅ Implemented window-specific capture using `capture-window` library on macOS
- ✅ Created a tiered fallback approach with multiple capture strategies:
  1. Window-specific capture (macOS only) with direct window ID targeting
  2. Region-based capture using window coordinates when direct capture fails
  3. Full-screen fallback when other methods fail
- ✅ Added improved process lifecycle management with proper cleanup
- ✅ Added window ID caching to maintain capture across focus changes
- ✅ Added advanced error handling with graceful degradation between capture methods
**Testing Instructions**:
1. **Automated Self-Tests** (run these first):
   ```bash
   # Run basic capture and lifecycle tests
   bun run test:capture
   
   # If on macOS, test window-specific capture
   bun run test:capture:window
   ```

   **Expected Behavior:**
   - PICO-8 will launch and close automatically multiple times during testing
   - Tests should show clear ✅ success messages for each test
   - The window-specific test may show a warning if window IDs cannot be detected on your system
   - All tests should complete within ~30 seconds
   - No errors should be shown (especially no unhandled promise rejections)
   - Temporary capture files will be saved to your system temp directory
   - The process should exit cleanly after tests finish

2. **Manual Testing** (specific steps, only needed if self-tests pass):
   
   **Test 1: Window-Specific Capture**
   1. Run: `CAPTURE_SAVE_TO_DISK=true APP_DEBUG=true bun start`
   2. Wait for PICO-8 to fully launch (~5 seconds)
   3. Open another window (browser, text editor, etc.) that partially overlaps the PICO-8 window
   4. Wait 10-15 seconds for multiple captures to be taken
   5. Press Ctrl+C in your terminal to stop the application
   6. Navigate to the captures directory: `cd captures && ls -la`
   7. Open 2-3 of the most recent PNG files to verify they show ONLY the PICO-8 window, not the overlapping windows
   
   **Test 2: Process Lifecycle**
   1. Run: `APP_DEBUG=true bun start`
   2. Wait for PICO-8 to fully launch (~5 seconds)
   3. Close the PICO-8 window by clicking the X button (don't use Ctrl+C in terminal)
   4. Verify that the application detects PICO-8 has closed and automatically shuts down
   5. Check the terminal output for messages like "PICO-8 process exited, stopping screen capture"
   
   **Success Criteria:**
   - In Test 1: The PNG captures show only the PICO-8 window content, with no parts of overlapping windows
   - In Test 2: The application cleanly exits when PICO-8 is closed manually
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/capture/screenCapture.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/capture.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-103] Input Command Interface [DONE]
**Dependencies**: T-101
**Description**: Module to send input commands to PICO-8.
**Acceptance Criteria**:
- Send keyboard inputs to PICO-8 ✅
- Support for all PICO-8 button combinations ✅
- Configurable input mapping ✅
- Input verification mechanism ✅
**Implementation Status**:
- Initially tried robotjs for keyboard input, but encountered "missing symbol called" errors on macOS ✅
- Implemented using child_process to execute AppleScript commands (osascript) for key events on macOS ✅
- Added AppleScript commands for key press, key release, and key tap operations ✅
- Added support for tap and sequence input patterns ✅
- Added random button generator for testing ✅
- Window detection via active-win package to ensure commands only sent when PICO-8 is in focus ✅
- Fixed AppleScript key mapping issues using ASCII character codes (28-31) for arrow keys ✅
- Simplified AppleScript syntax to use "tell application to" format ✅
- Added improved key mapping detection for special keys ✅
- Created interactive test suite with clear visual feedback ✅
- Implemented dedicated testing framework with self-test capabilities ✅
**Testing Status**:
- All buttons confirmed working by human tester ✅
- Left, right, Z, and X buttons work perfectly ✅
- Up and down arrow keys work with improved multiple-press testing format ✅
- Self-tests run without console errors ✅
- Simplified AppleScript commands for better compatibility ✅
- Automated and manual testing scenarios clearly separated ✅
**Future Enhancements**:
1. Add support for Windows and Linux
2. Consider alternatives like nut.js (built on C++/node-ffi-napi) for cross-platform support
3. Explore native bindings for more precise control on each platform
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/input.ts
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/key_test.p8
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/key_test.md
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/inputTests.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/testRunner.ts

### [T-113] Improve PICO-8 Process Lifecycle Management [IN PROGRESS]
**Dependencies**: T-101, T-103
**Description**: Enhance control over the PICO-8 process lifecycle and improve input verification.
**Acceptance Criteria**:
- Application has full control over PICO-8 process lifecycle (launch, run, terminate) ✅
- Automatically terminate PICO-8 when the application exits or at the end of the demo ✅
- Ensure the demo script doesn't wait for cartridge to load specifically ✅
- Demo should continuously send input commands for sufficient time to handle any cartridge loading delays
- Structured input patterns send specific commands with visible feedback ✅
- Clear visual indication that keyboard inputs are working ✅
- Improved error handling for PICO-8 process failures ✅
**Implementation Status**:
- Added explicit process exit handler to ensure application terminates when PICO-8 exits ✅
- Improved forced termination logic to ensure PICO-8 process is killed reliably ✅
- Added timeout-based demo that runs for 10 seconds before terminating ✅
- Enhanced error handling in the process termination flow ✅
- Fixed key mapping for PICO-8 input verification by using AppleScript key codes ✅
- Added robust process termination with platform-specific commands and verification ✅
- Added isProcessRunning helper method to reliably check process status ✅
- Fixed force kill logic with multiple termination strategies ✅
- Improved error handling for window focus changes during tests ✅
- Fixed arrow key mapping issues by using key codes instead of ASCII characters ✅
**Current Issues to Fix**:
- ~~PICO-8 process isn't being killed (fix force kill logic)~~ ✅
- ~~Key mapping is incorrect (test with simple key mapping test cartridge)~~ ✅
- Demo duration should be exactly 10 seconds ✅
**Testing Status**:
- ~~User reported that the PICO-8 process is not being killed properly (termination fails)~~ - Fixed with improved termination logic ✅
- ~~User reported character movement is not visible, but menu appears/disappears (key mapping issue)~~ - Fixed with proper key code mapping ✅
- ~~Need to create a dedicated test cartridge for key mapping verification~~ - Completed with key_test.p8 cartridge ✅
- Self-tests for input commands now pass successfully ✅
- Interactive tests show proper visual feedback for all keys ✅
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/key_test.p8

### [T-114] Create Key Mapping Test Cartridge [DONE]
**Dependencies**: T-103
**Description**: Create a simple PICO-8 cartridge specifically for testing key mappings.
**Acceptance Criteria**:
- Create a cartridge that clearly displays which keys are being pressed ✅
- Visual feedback should be immediate and obvious ✅
- Test cartridge should work without complex loading screens or menus ✅
- Include documentation on how to use the cartridge for testing ✅
**Implementation Status**:
- Created a simple cartridge with immediate visual feedback ✅
- Fixed macOS AppleScript key mapping issues ✅
- Implemented separate key tap function for arrow keys ✅
- Added comprehensive test mode accessible via `--key-test` flag ✅
- Added detailed documentation in key_test.md ✅
**Testing Instructions**:
1. Run `bun start --key-test` with .env pointing to key_test.p8
2. Observe the visual feedback as each key is pressed
3. Verify that arrow keys correctly move the heart character
4. Verify that X and Z buttons show as "PRESSED" when activated
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/key_test.p8
- /Users/maxyankov/Projects/ai-plays-pico8/input/cartridges/key_test.md
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-117] Process Termination Improvement Epic [IN PROGRESS]
**Dependencies**: T-101, T-113
**Description**: Parent task for PICO-8 process termination improvements. PICO-8 processes frequently fail to terminate properly when the application exits, requiring manual termination. This is a critical issue that must be fixed.
**Current Issues**:
- ~~PICO-8 processes remain running in the background after application exits~~ ✅ Fixed in T-118
- ~~Automated tests leave zombie processes~~ ✅ Fixed in T-118
- Current termination logic is complex and could be more maintainable
**Progress**:
- ✅ Critical emergency fix implemented (T-118)
- 🧪 Architecture refactoring implemented and awaiting testing (T-119)
- ☐ Platform-specific strategies pending further refinement (T-120)
- ☐ Comprehensive testing framework pending (T-121)
**Epic Tasks**:
- T-118: Emergency fix for reliable PICO-8 process termination ✅ DONE
- T-119: Refactor termination logic architecture 🧪 TESTING
- T-120: Implement platform-specific termination strategies ➡️ TODO
- T-121: Create robust termination testing framework ➡️ TODO
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/pico8.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-118] Emergency Fix for PICO-8 Process Termination [DONE] [URGENT]
**Dependencies**: T-101
**Description**: Critical immediate fix to ensure PICO-8 processes are reliably terminated when the application exits or tests run.
**Reproduction Steps**:
1. Run test suite with `bun run test:capture`
2. Test fails with native module error
3. PICO-8 process remains running in the background
**Acceptance Criteria**:
- ✅ Implement more aggressive process termination in the close() method
- ✅ Add direct OS-specific termination commands (kill -9, taskkill, etc.)
- ✅ Add multiple verification checks to confirm process termination
- ✅ Update shutdown handlers in index.ts to use these more reliable methods
- ✅ Verify termination across various exit scenarios
**Implementation**:
- Refactored the process termination logic to use a tiered approach:
  1. Standard Node.js process termination (SIGTERM/SIGKILL)
  2. OS-specific commands (kill -9, taskkill, pkill)
  3. Emergency measures for stubborn processes
- Added multiple verification points throughout termination flow
- Improved error handling and logging for each termination stage
- Added platform-specific termination strategies for macOS, Windows, and Linux
- Removed duplicate termination code from test files
- Added rigorous verification to ensure processes are truly terminated
- Added comprehensive logging to trace termination problems
**Testing**:
- Verified passing TypeScript checks with strict mode enabled
- Confirmed process termination works as expected with direct testing
- Ensured no zombie processes remain after tests
- Self-tests complete successfully without leaving orphaned processes
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/captureTests.ts

### [T-119] Refactor Process Termination Architecture [TESTING]
**Dependencies**: T-118
**Description**: Refactor the process termination code architecture to be more maintainable and modular.
**Acceptance Criteria**:
- ✅ Split the monolithic `close()` method into smaller, focused helper functions
- ✅ Separate graceful and forced termination logic
- ✅ Introduce proper error handling and fallback mechanisms
- ✅ Create clear process lifecycle state management
- ✅ Add comprehensive logging throughout the termination flow
**Implementation Status**:
- ✅ Refactored the monolithic `close()` method into multiple smaller, specialized methods
- ✅ Created distinct methods for each termination strategy (standard, OS-specific, emergency)
- ✅ Added platform-specific termination methods (macOS, Windows, Linux)
- ✅ Implemented a clear validation step before termination
- ✅ Added promise-based wait utilities for better code organization
- ✅ Improved the `TerminationStrategy` enum to use numeric values for better performance
- ✅ Enhanced the process verification method with more robust checks and logging
- ✅ Added better error handling with try-catch blocks in termination methods
- ✅ Removed duplicate termination code from index.ts to use centralized runner methods
- ✅ Added more detailed debug logging throughout the process verification steps
- ✅ Updated all call sites throughout the codebase to use the new signature
**Testing Instructions**:
1. **Setup:**
   ```bash
   # Create or update .env file with these settings:
   PICO8_PATH=/Applications/pico-8/PICO-8.app/Contents/MacOS/pico8
   PICO8_DEFAULT_CARTRIDGE=input/cartridges/key_test.p8
   APP_DEBUG=true
   ```

2. **Test Standard Termination:**
   ```bash
   # Run the application
   bun start
   # Wait 5 seconds for PICO-8 to fully launch
   # Press Ctrl+C in the terminal to terminate
   ```
   - Verify in the terminal logs that "PICO-8 process terminated successfully" appears
   - Confirm no PICO-8 processes remain running with: `ps aux | grep pico`

3. **Test Forced Termination:**
   ```bash
   # Start the application again
   bun start
   # In a separate terminal window, find the process ID
   ps aux | grep node
   # Terminate the parent Node.js process with SIGTERM
   kill -TERM <parent_process_id>
   ```
   - Verify the process terminates cleanly with proper shutdown messages
   - Confirm no PICO-8 processes remain with: `ps aux | grep pico`

4. **Test Emergency Termination:**
   ```bash
   # This test might require temporarily modifying the code to force emergency termination
   # Otherwise, run the normal application and close it with Ctrl+C
   bun start
   # Quickly press Ctrl+C multiple times to potentially trigger emergency termination
   ```
   - Look for log messages about "attempting emergency procedures"
   - Verify no processes remain running after termination

**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/pico8.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/captureTests.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/inputTests.ts
- /Users/maxyankov/Projects/ai-plays-pico8/index.ts

### [T-120] Implement Platform-Specific Termination Strategies [TODO]
**Dependencies**: T-119
**Description**: Create dedicated termination strategies optimized for each supported platform.
**Acceptance Criteria**:
- Create platform-specific termination modules (macOS, Windows, Linux)
- Implement macOS-specific termination using effective commands and verification
- Implement Windows-specific termination with proper task management
- Implement Linux-specific termination with signal handling
- Add platform detection and automatic strategy selection
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/runners/pico8Runner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/types/pico8.ts

### [T-121] Create Robust Termination Testing Framework [TODO]
**Dependencies**: T-118, T-119
**Description**: Develop a comprehensive testing framework for process termination.
**Acceptance Criteria**:
- Create end-to-end tests for process lifecycle (spawn, manage, terminate)
- Add tests for various termination scenarios (graceful, forced, application crash)
- Implement verification to ensure no zombie processes remain
- Add automated test harness for termination testing
- Create manual testing procedures for human verification
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/captureTests.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/testRunner.ts

### [T-116] Create Structured Testing Framework [DONE]
**Dependencies**: T-101, T-103
**Description**: Implement a structured testing framework for different test scenarios.
**Acceptance Criteria**:
- Create a modular testing framework that supports different test types ✅
- Implement self-test mode for automated verification (no user interaction required) ✅
- Implement interactive test mode for visual verification (requiring user interaction) ✅
- Organize tests into clear scenarios with descriptive names ✅
- Add clear visual feedback during tests with obvious state changes ✅
- Reduce console errors and improve error handling ✅
- Ensure all test modes can be easily launched from the command line ✅
- Add documentation for each test scenario ✅
**Implementation Status**:
- Created a comprehensive test runner framework with TestMode and TestScenario interfaces ✅
- Implemented self-test mode that can be run internally without requiring user feedback ✅
- Created human-friendly interactive test mode with clear visual indicators ✅
- Improved display of up/down arrow tests with multiple distinct presses ✅
- Added a sustained input test that shows held keys for 5 seconds ✅
- Fixed AppleScript syntax to eliminate console errors during tests ✅
- Added npm scripts for all test modes and individual test scenarios ✅
- Created comprehensive documentation for the test framework ✅
**Testing Status**:
- Self-test mode successfully runs all tests with no errors ✅
- Interactive mode verified by human tester and improved based on feedback ✅
- Left, right, Z, and X key tests confirmed working correctly ✅
- Up and down arrow tests improved with multiple distinct presses for better visibility ✅
- Rapid sequence test replaced with more observable sustained input test ✅
**Additional Features Implemented**:
- Standardized output formatting with color-coded headers
- Error handling and reporting for test failures
- Automatic PID detection and process cleanup
- Comprehensive log messages for all test stages
**Relevant Files**:
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/testRunner.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/inputTests.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/index.ts
- /Users/maxyankov/Projects/ai-plays-pico8/src/tests/README.md
- /Users/maxyankov/Projects/ai-plays-pico8/src/input/inputCommands.ts
- /Users/maxyankov/Projects/ai-plays-pico8/package.json

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