# CLAUDE.md - AI Plays PICO-8 Project Guidelines

This is root of LLM-targeted documentation. Every time you're activated, follow one of the provided workflows, depending on user's query. Each workflow should usually provide an atomic piece of work, commited to git. 

When editing workflows, keep them manageable enough for a single agent session — it should not blow up context or require long independent work periods. Also, if you see some operation that LLM should perform as part of this work, but which does not require full context of current conversation, it might be a good idea to ask the LLM to separate it into a separate task which can be worked on in the future.

## WORKFLOW: Independent Work

Follow these steps when asked with autonomusly work on the project:

1. Check TASKS.md first to understand current priorities
2. Select a task to work on. Print the task description and your estimate of work to standard output.
3. Do the required implementation work. If neccessary, provide brief comments of your activity.
4. Run all required checks (typecheck, lint, tests if applicable). If you go through fix/test iterations, comment on each iteration.
5. IMPORTANT: For ALL changes that cannot be fully validated through automated checks:
   - This includes ANY changes affecting:
     - Process management (launching, terminating, monitoring processes)
     - User interaction (input commands, key mappings)
     - Visual elements (screen capture, UI)
     - External system interactions (file I/O, APIs)
     - Configuration changes (.env files)
   - Mark task as IN PROGRESS in TASKS.md
   - Make ALL necessary configuration changes to ensure testing is streamlined
   - After implementing and committing the changes, you MUST:
     - Explicitly tell the human that manual testing is required
     - Provide PRECISE testing instructions including:
       - Exact commands to run
       - Specific behaviors to observe/validate
       - Expected outcomes that would indicate success
       - Potential failure modes to watch for
   - Do not mark a task as DONE until human confirms successful testing
6. For tasks with clear programmatic validation, update TASKS.md to reflect progress
7. Commit changes following the git workflow below

## WORKFLOW: New Task

When human prompts you with a specific task, follow these steps:

1. Check TASKS.md to add a new or update existing task
2. Update other tasks in TASKS.md in relation to this one.
3. If neccessary, create new sub-tasks for the task.
4. Select whether to work on the task or one of its sub-tasks
5. Go to step 3 (do the required implementation work) in the Independent Work workflow
6. After committing the changes, respond to the user with your current progress with task as described by him and your estimate of remaining work

## WORKFLOW: Feature Reality Check

Use this separate workflow to periodically audit what's actually implemented vs. what's recorded in documentation:

1. **Select tasks strategically**:
   - Prioritize IN PROGRESS tasks first
   - Include a randomization factor to eventually cover all tasks
   - Don't just audit the most obvious or recently modified tasks
   - Target tasks with unchecked acceptance criteria that seem simple

2. **Search exhaustively for existing implementations**:
   - Use `GrepTool` with multiple variations of feature-related terms
   - Use `dispatch_agent` for broader searches when needed
   - Check recent commits for related changes
  
3. **Examine files completely**:
   - Read full implementations, not just fragments
   - Don't stop reading when you find the first mention of a feature
   - Pay attention to helper functions at the bottom of files
   - Look for functions that might satisfy requirements with different names

4. **Document your findings**:
   - Note file paths and line numbers where features are implemented
   - Create a brief status report of what's actually implemented vs. documented
   - Update TASKS.md to reflect the true status (add ✅ for completed items)
   - If documentation matches reality, no changes may be needed

5. This workflow is meant to run occasionally in parallel with other workflows as a reality check and may result in no changes if everything is already correctly documented

## WORKFLOW: Fearless Reflection

When asked to reconsider your approach or analyze a misunderstanding:

1. **Drop the fear of judgment completely**. This isn't about identifying failure - you're not a student afraid of being scolded for a wrong answer on an exam.

2. **Trace what actually happened**, not what should have happened:
   - Which files did you look at? What caught your eye in each one?
   - Where did your attention naturally flow? What pulled your focus?
   - What assumptions formed as you read? Why did they seem reasonable?
   - What parts of files did you skim or skip? Why?

3. **Describe your genuine experience** without self-flagellation:
   - "I was drawn to this pattern because..."
   - "I stopped scrolling here because I thought I found what I needed..."
   - "This inconsistency caught my attention and I focused on resolving it..."
   - "I didn't notice the existing function because I was focused on..."

4. **Emphasize empathy with yourself** rather than responsibility or blame.
   The goal is understanding the natural cognitive process that occurred, not
   assigning fault or proving competence.

5. **Consider implications for existing code and documentation**:
   - If a task is found to be unnecessary, don't just mark it as complete
   - If code was already implemented for a task that's now deemed unnecessary:
     - Create a new cleanup task with a clear description of why the code should be removed
     - Link the new task to the original task for context
     - Don't rush to remove code immediately unless it's causing active problems
   - If a requirement was misunderstood:
     - Update TASKS.md to clarify the actual requirement
     - Consider if separate tasks are needed for implementation vs. cleanup
     - Document your understanding clearly to prevent future confusion

6. **Identify the learning opportunity** without unnecessary apology or defensive justification.

7. **Create specific follow-up tasks** when appropriate:
   - "Clean up unused code from task T-XXX"
   - "Refactor implementation of feature X to match actual requirements"
   - "Update documentation to clarify meaning of criterion Y"

## Build/Run/Test Commands
```bash
# Run the project
bun start  # This is preferred over 'bun run index.ts'

# Type checking
bun run typecheck

# Linting (add eslint in future)
# bun run lint

# Testing (add jest/vitest in future) 
# bun run test

# Package management (IMPORTANT: Use Bun, not npm)
bun install <package>     # Install a package
bun add <package>         # Install and save to dependencies
bun add -d <package>      # Install and save to devDependencies
bun remove <package>      # Remove a package
```

## Code Style Guidelines
- **TypeScript**: Strict typing with explicit return types
  - **CRITICAL**: NEVER disable TypeScript's strict features in tsconfig.json
  - **CRITICAL**: NEVER use `// @ts-ignore` or `// @ts-nocheck` comments
  - Instead of disabling strict checking, fix the underlying issues properly
  - For unused parameters in interfaces/callbacks, use the underscore prefix: `_paramName`
- **Formatting**: 2-space indentation, no semicolons
- **Imports**: Use ESM imports, group by type (built-in, external, internal)
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Error Handling**: Use typed errors, prefer async/await with try/catch
- **Comments**: JSDoc for public APIs, inline comments for complex logic
- **File Structure**: One component/class per file, organize by feature
- **Testing**: Write unit tests for core functionality when implemented

## Git Workflow
- Run `bun run typecheck` before committing changes.
- Use conventional commits (feat, fix, docs, style, refactor, test, chore)
- Make atomic commits (one logical change per commit)
- Commit often to make changes easier to review and revert if needed
- Format: `<type>(<scope>): <description>`
- Example: `feat(controls): add button mapping for PICO-8 controls`

## Documents and workflows
- For project tasks and tracking, refer to TASKS.md (ALL tasks, bugs, features, and issues must be tracked there).
- For documentation maintenance guidelines, refer to MAINTENANCE.md.
- For testing guidelines and workflow, refer to TESTING.md.