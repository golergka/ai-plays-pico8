# Testing Guidelines

This document provides high-level guidance for testing the AI-Plays-PICO8 project. It describes the general approach to testing rather than specific test procedures for individual features.

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

### Available Automated Test Commands

```bash
# Type checking - ALWAYS run this first
bun run typecheck

# Self-tests (non-interactive, fast)
bun run test:self

# Component-specific tests
bun run test:input:self    # Input system tests
bun run test:capture       # Screen capture tests

# Key mapping tests (partially automated)
bun run test:keys
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

### Manual Test Design Guidelines

When designing manual tests:

1. **Be Specific**: 
   - Provide exact commands to run
   - Include specific steps to reproduce the behavior

2. **Be Concise**: 
   - Keep test procedures as short as possible
   - Use short timeouts (5-10 seconds) for testing basic functionality
   - Use `bun start` instead of longer commands when possible

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

1. **Automated First**: Begin with all available automated tests
2. **Fix Issues**: Address any failures in automated tests
3. **Document Manual Tests**: Create clear manual testing instructions
4. **Human Verification**: Request human confirmation of successful testing
5. **Status Update**: Only mark tasks as DONE after human verification

## Common Test Scenarios

When testing, consider these common scenarios for verification:

- **Normal Operation**: Does it work under ideal conditions?
- **Error Handling**: Does it gracefully handle errors?
- **Resource Cleanup**: Are all resources properly released?
- **Edge Cases**: Does it handle boundary conditions?
- **Integration**: Does it work correctly with other components?

Remember: Specific test procedures for individual features should be documented in their corresponding task entries in TASKS.md.