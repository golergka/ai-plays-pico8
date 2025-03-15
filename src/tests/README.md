# PICO-8 Testing Framework

This directory contains a structured testing framework for testing the AI-Plays-PICO8 system components. The framework provides both:

1. **Self-tests** - Fast, non-interactive tests for developers to quickly verify functionality
2. **Interactive tests** - Detailed tests with visual verification for users

## Test Commands

Run these from the project root:

| Command | Description |
|---------|-------------|
| `bun run test` | Run all tests in interactive mode |
| `bun run test:self` | Run all self-tests (quick verification) |
| `bun run test:interactive` | Run all interactive tests (visual verification) |
| `bun run test:input` | Run interactive input test only |
| `bun run test:input:self` | Run self-test for input only |

## Test Types

### Input Tests

- **Self Test** (`self-test-key-input`): Fast test that verifies key inputs work without errors
- **Interactive Test** (`interactive-key-test`): Detailed test with visual verification for each key

## Creating New Tests

1. Create a new file for your test category (e.g., `processTests.ts`)
2. Define test scenarios following the `TestScenario` interface
3. Register your tests in the main `index.ts` file

### Test Scenario Structure

```typescript
export const myTestScenario: TestScenario = {
  name: 'my-test-name',                 // Command-line identifier
  description: 'Test description',      // Human-readable description
  requiresUserInteraction: true/false,  // Whether user needs to verify visually
  async run(options = {}): Promise<void> {
    // Test implementation
  }
}
```

## Guidelines

1. **Self-tests should be FAST**: Minimize delays and only test core functionality
2. **Interactive tests should be CLEAR**: Use headers, clear instructions, and adequate delays
3. **Keep tests independent**: Each test should set up and tear down its own resources
4. **Always clean up**: Make sure PICO-8 processes are terminated in finally blocks

## Test Runner Features

- Runs tests in different modes (self-test, interactive)
- Provides standardized output formatting
- Skips interactive tests in self-test mode
- Handles errors gracefully