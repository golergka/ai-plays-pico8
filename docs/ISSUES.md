# Project Issues

This document tracks known issues in the project that should be addressed.

## Active Issues

### #1: PICO-8 Process Termination Issues

**Problem**: PICO-8 processes sometimes fail to terminate properly when the application exits, requiring manual termination.

**Severity**: High (processes are left running, consuming resources)

**Reproduction Steps**:
1. Run test suite with `bun run test:capture`
2. Test fails with native module error
3. PICO-8 process remains running in the background

**Root Cause Analysis**:
- The Pico8Runner's `close()` method has several issues:
  - It's extremely long and monolithic (400+ lines) making maintenance difficult
  - Error handling branches are difficult to follow
  - Multiple termination strategies are mixed together
  - Verification checks are inconsistently applied
  - Race conditions may exist between different termination approaches

**Proposed Solutions**:
1. Refactor the `close()` method into smaller focused functions:
   - Split by platform (macOS, Windows, Linux specific termination)
   - Split by purpose (graceful termination, forced termination, emergency termination)
   - Create proper error handling for each phase
   
2. Add multiple verification points:
   - After standard process.kill() operations
   - After OS-specific termination commands
   - After emergency cleanup measures

3. Improve platform-specific termination:
   - macOS: Use better detection of process status with more accurate commands
   - Windows: Add fallbacks for task termination that address potential race conditions
   - Linux: Ensure more aggressive termination when needed

4. Create proper end-to-end tests for process lifecycle:
   - Test spawning and cleanup in different scenarios
   - Verify no zombie processes remain after tests
   - Add instrumentation to detect process leaks

**Priority**: High - should be addressed before adding more features

**Status**: Open