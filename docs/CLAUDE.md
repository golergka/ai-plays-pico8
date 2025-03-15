# CLAUDE.md - AI Plays PICO-8 Project Guidelines

This is root of LLM-targeted documentation. Every time you're activated, follow one of the provided workflows, depending on user's query.

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

## Build/Run/Test Commands
```bash
# Run the project
bun run index.ts

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
- For project tasks and tracking, refer to TASKS.md.
- For documentation maintenance guidelines, refer to MAINTENANCE.md.

## Important Implementation Notes

### Manual Testing Requirements
Remember that almost ALL changes to this project require manual testing by the human. This is especially true for:
1. Process management (PICO-8 launching, termination)
2. Input systems (keyboard control)
3. Screen capture
4. Any integration between components

After implementing such changes, you MUST provide testing instructions and not consider the task complete until the human confirms successful testing. Do not skip the manual testing step!