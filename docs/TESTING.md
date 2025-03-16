# Testing Guidelines

This document provides high-level guidance for testing the AI-Plays-PICO8 project. It describes the general approach to testing rather than specific test procedures for individual features.

## IMPORTANT - TEST SELECTION POLICY

1. **ALWAYS use test instructions from TASKS.md for the specific task you're working on**
2. **NEVER use generic commands like `bun start` when component-specific tests exist**
3. **All component-specific test commands are documented ONLY in their respective task entries in TASKS.md**
4. **This file contains ONLY general principles and main test suite commands**
5. **For archived tasks, use GrepTool to search in TASK_ARCHIVE.md to find task-specific testing instructions**

## Test Status Labels

All tests must include status labels to clearly indicate their expected behavior. This helps identify when test behavior changes unexpectedly.

### Status Label Types

1. **Tests expected to fail**
   - Format: `(shouldn't work until T-XXX)`
   - Example: `Test verifies window-specific capture (shouldn't work until T-111)`
   - Use when: The test checks functionality not yet implemented

2. **Tests unexpectedly passing**
   - Format: `(seems like T-XXX is implemented now — you should change my labels)`
   - Example: `Test verifies process termination (seems like T-119 is implemented now — you should change my labels)`
   - Use when: A test that was expected to fail is now passing

3. **Tests that should pass**
   - Format: `(expected to work — do not commit before fixing)`
   - Example: `Test verifies basic input commands (expected to work — do not commit before fixing)`
   - Use when: The test checks core functionality that should never break

### Implementation Guidelines

1. **Add labels to all test descriptions**
   - Place the label at the end of the test description string
   - Keep the status label format consistent

2. **Review status labels during test runs**
   - Update labels when functionality is implemented
   - Investigate unexpected failures in tests labeled as "should pass"
   - Update labels when unexpected successes occur

3. **Highlight status in test output**
   - Format test output to make status labels clearly visible
   - Use color coding to distinguish between different status types

## Environment Setup

### Environment Configuration

Always ensure proper environment configuration before testing:

1. **Create or verify the .env file**:
   - NEVER assume environment variables are already set
   - ALWAYS create or verify the .env file exists before suggesting tests
   - Use the Edit tool to create or modify .env files directly

2. **Required .env settings for testing**:
   ```
   PICO8_PATH=/Applications/pico-8/PICO-8.app/Contents/MacOS/pico8
   PICO8_DEFAULT_CARTRIDGE=input/cartridges/key_test.p8
   CAPTURE_ENABLED=true
   CAPTURE_SAVE_TO_DISK=true
   APP_DEBUG=true
   ```

3. **Prerequisites**:
   - Ensure PICO-8 is installed at the configured path
   - Run `bun install` to ensure all dependencies are installed
   - Verify the project builds with `bun run typecheck`

## Testing Principles

1. **Dual Testing Strategy**: All features require both automated and manual testing
2. **Task-Specific Instructions**: Detailed testing procedures for each feature should be included in the corresponding task in TASKS.md
3. **No Exceptions**: Never mark a task as DONE without confirming successful testing with a human
4. **Verification First**: Always run automated tests before presenting manual test procedures

## Automated Testing

### When to Use Automated Tests

- **First Line of Defense**: Always run automated tests first
- **Regression Prevention**: Use to verify that new changes don't break existing functionality
- **Basic Validation**: Confirm core functionality works before human testing

### Main Test Suite Commands

```bash
# Type checking - ALWAYS run this first
bun run typecheck

# Run all tests
bun run test

# Run all self-tests (non-interactive, fast)
bun run test:self
```

### Automated Test Interpretation

1. Typecheck failures must be fixed before proceeding
2. Self-tests provide basic validation but are not sufficient for full verification
3. Component tests verify isolated functionality but not integration points

## Manual Testing

### When Manual Testing is Required

Manual testing by a human is **REQUIRED** for features involving:

- Process management (starting, stopping, monitoring)
- User interface and interaction
- Visual elements (screen captures, windows)
- Cross-platform compatibility
- Timing-dependent behaviors
- External system integration

**IMPORTANT**: "Manual testing" ALWAYS refers to testing performed by the human user - AI cannot perform manual testing itself. When manual testing is needed, the AI must explicitly ask the human to test the functionality and provide clear testing instructions.

### Manual Test Design Guidelines

When designing manual tests:

1. **Be Specific**: 
   - Provide exact task-specific test commands from the TASKS.md file
   - Include specific steps to reproduce the behavior
   - NEVER use generic commands like `bun start` when specialized test commands exist

2. **Be Concise**: 
   - Keep test procedures as short as possible
   - Use short timeouts (5-10 seconds) for testing basic functionality

3. **Be Clear**: 
   - Define precise success criteria
   - Be specific about what success looks like
   - Provide clear steps to verify fixes

4. **Be Comprehensive**: 
   - Test both happy paths and edge cases
   - List specific failure modes to watch for

5. **Be Efficient**: 
   - Minimize required human effort
   - Design tests that can be completed quickly

### Manual Test Documentation

For each task requiring manual testing:
1. Document test procedures in the task's section in TASKS.md
2. Include clear steps to reproduce the behavior
3. Define explicit success criteria
4. Identify potential failure modes to watch for
5. Provide cleanup steps if necessary

## Testing Workflow

1. **Find Task-Specific Tests**: Look in TASKS.md for the specific task's testing instructions
2. **Run Automated Tests First**: Begin with all available automated tests for the specific component
3. **Fix Issues**: Address any failures in automated tests
4. **Document Manual Tests**: Create clear manual testing instructions
5. **Human Verification**: Request human confirmation of successful testing
6. **Status Update**: Only mark tasks as DONE after human verification

## Common Test Scenarios

When testing, consider these common scenarios for verification:

- **Normal Operation**: Does it work under ideal conditions?
- **Error Handling**: Does it gracefully handle errors?
- **Resource Cleanup**: Are all resources properly released?
- **Edge Cases**: Does it handle boundary conditions?
- **Integration**: Does it work correctly with other components?

Remember: Specific test procedures for individual features should be documented in their corresponding task entries in TASKS.md. For archived tasks, use GrepTool to search in TASK_ARCHIVE.md to find task-specific testing instructions.