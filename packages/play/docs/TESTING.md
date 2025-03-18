# Testing Guidelines - Play Package

**NOTE: When making changes to this document that would benefit all packages, please propagate these changes to all package-specific TESTING.md files.**

## Testing Philosophy

This project follows a comprehensive testing strategy with the following principles:

1. **Write tests early**: Tests should be written alongside or before implementation code
2. **Test at appropriate levels**: Use the right combination of unit, integration, and end-to-end tests
3. **Maintain test independence**: Tests should not depend on each other
4. **Testing is a design activity**: Good tests drive better code architecture
5. **Balance coverage with value**: Aim for meaningful test coverage rather than arbitrary metrics

## Testing Stack

- **Test Framework**: Vitest
- **Mocking**: Vitest built-in mocking utilities
- **Assertions**: Chai assertions via Vitest

## Test Types

### Unit Tests

Unit tests focus on testing individual functions and components in isolation:

- Should verify the behavior of pure functions
- Interactions with external systems should be mocked
- Fast and deterministic
- Named with `.test.ts` suffix beside the implementation file

### Integration Tests

Integration tests verify that different parts of the system work together correctly:

- Test interactions between modules
- May interact with external systems like the filesystem
- Should have isolation between tests via setup/teardown
- Located in a `__tests__` directory in the relevant module

### End-to-End Tests

End-to-end tests validate the complete flow of the application:

- Test the application as a whole
- Slower but provide higher confidence
- Located in the `e2e` directory
- Used sparingly for critical workflows

## Test Commands

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests with coverage report
bun run test:coverage

# Run specific test file
bun run test src/path/to/file.test.ts

# Run tests matching a specific pattern
bun run test -- -t "pattern"
```

## Test Structure

Follow these guidelines for structuring tests:

1. Use the AAA pattern (Arrange, Act, Assert)
2. Group related tests with `describe` blocks
3. Use descriptive test names that explain expected behavior
4. Keep tests focused on one aspect of functionality

Example:

```typescript
describe('GameController', () => {
  describe('sendInput', () => {
    it('should process valid input and return success response', async () => {
      // Arrange
      const gameController = new GameController(mockInputHandler, mockStateObserver);
      const input = { type: 'button', value: 'A' };
      mockInputHandler.validateInput.mockReturnValue(true);
      
      // Act
      const result = await gameController.sendInput(input);
      
      // Assert
      expect(result.success).to.be.true;
      expect(mockInputHandler.translateInput).to.have.been.calledWith(input);
    });
    
    it('should throw InvalidInputError when input is invalid', async () => {
      // Arrange
      const gameController = new GameController(mockInputHandler, mockStateObserver);
      const input = { type: 'unknown', value: 'Z' };
      mockInputHandler.validateInput.mockReturnValue(false);
      
      // Act & Assert
      await expect(gameController.sendInput(input)).to.be.rejectedWith(InvalidInputError);
    });
  });
});
```

## Mocking

Use Vitest's built-in mocking capabilities:

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('./input-handler');

// Mock a function
const mockFn = vi.fn().mockReturnValue('mocked value');

// Spy on a method
const spy = vi.spyOn(gameController, 'getState');
```

## Test Coverage

Aim for high test coverage, especially for critical paths:

- Run coverage reports regularly: `bun run test:coverage`
- Focus on meaningful coverage rather than arbitrary percentages
- Prioritize testing business logic and error handling paths

## Manual Testing Procedures

For features that require manual testing:

1. Document clear steps in the task description
2. Specify expected outcomes
3. List any setup requirements
4. Note common failure modes to watch for

Example manual testing procedure:

```
**Manual Testing Instructions**:
1. Run the application with: `bun start`
2. Load a test game with: `bun run play:test-game`
3. Verify that the game loads successfully with a visible interface
4. Enter the command: `press A` and verify the character jumps
5. Enter the command: `move right` and verify the character moves right
6. Check that the game state updates after each action
7. Verify that error messages appear for invalid commands
```

## Debugging Tests

To debug failing tests:

1. Use `console.log` statements for quick inspection
2. Run tests with the UI: `bun run test:ui`
3. Use the `.only` modifier to focus on specific tests: `it.only('test name', ...)`
4. Check the test output for error messages and stack traces

## Continuous Integration

All tests run automatically on each PR via GitHub Actions:

- PRs cannot be merged if tests fail
- Coverage reports are generated and available in the CI workflow summary
- End-to-end tests run on scheduled intervals to catch regressions