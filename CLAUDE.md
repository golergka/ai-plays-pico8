# CLAUDE.md - AI Plays PICO-8 Project Guidelines

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
- Use conventional commits (feat, fix, docs, style, refactor, test, chore)
- Make atomic commits (one logical change per commit)
- Commit often to make changes easier to review and revert if needed
- Format: `<type>(<scope>): <description>`
- Example: `feat(controls): add button mapping for PICO-8 controls`

Run `bun run typecheck` before committing changes.