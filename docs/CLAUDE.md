# CLAUDE.md - AI Plays PICO-8 Project Guidelines

This is root of LLM-targeted documentation. Every time you're activated, follow one of the provided workflows, depending on user's query.

## WORKFLOW: Independent Work

Follow these steps when asked with autonomusly work on the project:

1. Check TASKS.md first to understand current priorities
2. Select a task to work on
3. Do the required implementation work
4. Run all required checks (typecheck, lint, tests if applicable)
5. Update TASKS.md to reflect progress
6. Commit changes following the git workflow below

## WORKFLOW: New Task

When human prompts you with a specific task, follow these steps:

1. Check TASKS.md to add a new or update existing task
2. Update other tasks in TASKS.md in relation to this one
3. If neccessary, create new sub-tasks for the task
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