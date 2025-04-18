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

## Test Coverage Priorities

Not all code requires the same level of test coverage. Follow these guidelines:

1. **Core System Components (Highest Priority)**
   - Schema system, core utilities, and public APIs
   - Aim for 90%+ test coverage
   - Write comprehensive unit tests covering edge cases
   - Tests should verify both successful and error conditions

2. **Service and Integration Components (High Priority)**
   - AI interfaces, game launchers, and process management
   - Aim for 70-80% test coverage
   - Focus on testing key integration points and workflows
   - Include tests for error handling and recovery

3. **Internal Utilities (Medium Priority)**
   - Helper functions and internal utilities
   - Aim for 60-70% test coverage
   - Focus on testing core functionality and common use cases
   - Cover most significant edge cases

4. **Example/Template Code (Low Priority)**
   - Example games, templates, and demos
   - Limited test coverage is acceptable
   - Test only critical functionality needed to demonstrate the system
   - DO NOT create extensive tests for example implementations
   - Focus effort on testing core systems instead

5. **Documentation and Configuration Code (Minimal Testing)**
   - Type definitions, constants, and configuration structures
   - Minimal testing required
   - Focus on validation rather than behavioral testing

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

### Test File Structure

1. **Co-locate tests with source files**: Test files should be placed in the same directory as the source files they test
2. **Naming convention**: Use the `.test.ts` suffix for all test files
3. **Example**: For a source file `src/schema/utils.ts`, the test file should be `src/schema/utils.test.ts`
4. **NO separate test directory**: Do NOT place tests in a separate `test/` directory

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

### Protected Testing Scripts

The following rules apply when providing testing instructions to humans:

1. **NEVER** modify `run.sh` - this file is managed by project administrators
2. **NEVER** instruct users to modify `run.sh` as part of testing
3. Always use the npm scripts defined in package.json for testing:
   - For playing games: `bun run play:human [game-type]`
   - For AI demos: `bun run play:ai [game-type] [model] [timeout] [retries]`
4. Always include any needed command-line arguments in the test instructions
5. Document all test commands in TASKS.md for the specific task

## Testing Workflow

1. **Find Task-Specific Tests**: Look in TASKS.md for the specific task's testing instructions
2. **Run Automated Tests First**: Begin with all available automated tests for the specific component
3. **Fix Issues**: Address any failures in automated tests
4. **Determine Testing Boundary**:
   - **For purely code-level changes that can be fully validated with automated tests**:
     - Mark the task as DONE after all automated tests pass
     - Examples: pure refactoring, interface extraction, adding unit tests, fixing type errors
   - **For changes requiring manual verification**:
     - Continue with steps 5-7 below
     - Examples: UI changes, process management, external system integration
5. **Document Manual Tests**: Create clear manual testing instructions (ONLY for tasks requiring manual testing)
6. **Human Verification**: Request human confirmation of successful testing (ONLY for tasks requiring manual testing)
7. **Status Update**: Only mark tasks as DONE after human verification (for tasks requiring manual testing)

## Bug Verification Process

When fixing bugs, follow this strict verification process:

1. **Document Exact Reproduction Steps**:
   - Record the precise commands that trigger the bug
   - Document the exact error messages or unexpected behaviors
   - Note the environment conditions (OS, configuration) if relevant
   - Include these reproduction steps in the task description

2. **Verify Using Original Reproduction Steps**:
   - Always test bug fixes using the EXACT same reproduction steps
   - Never consider a bug fixed until it passes the original reproduction test
   - Don't rely on similar or alternative tests as substitutes

3. **Bug Fix Verification Checklist**:
   - ✓ Run the exact command or procedure that originally triggered the bug
   - ✓ Verify the error no longer occurs
   - ✓ Check that the behavior now matches expected functionality
   - ✓ Look for any new or related issues that might have been introduced
   - ✓ Run automated tests to ensure no regressions

4. **Status Update Rules**:
   - Keep bug tasks in IN PROGRESS state until verified with original steps
   - Only move to TESTING when the fix passes all verification checks
   - Only move to DONE after human confirmation of the fix
   - If verification fails, move back to IN PROGRESS and document findings

## Common Test Scenarios

When testing, consider these common scenarios for verification:

- **Normal Operation**: Does it work under ideal conditions?
- **Error Handling**: Does it gracefully handle errors?
- **Resource Cleanup**: Are all resources properly released?
- **Edge Cases**: Does it handle boundary conditions?
- **Integration**: Does it work correctly with other components?

Remember: Specific test procedures for individual features should be documented in their corresponding task entries in TASKS.md. For archived tasks, use GrepTool to search in TASK_ARCHIVE.md to find task-specific testing instructions.