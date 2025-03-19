# AI GameDev Monorepo Guidelines

* This is a monorepo with multiple packages. You, Claude, should select relevant documntation to read and use it as instructions.
* Each package has its own set of documentation at `packages/<package_name>/docs/`.
* If you were not told what package to work on, open TASKS.md of several different packages and then decide task on hand.
* When you work on a particular package, you can run monorepo-wide scripts for your workflows.
* When you work on a particular package, ONLY MODIFY THE FILES IN THAT PACKAGE, unless you change shared types — in which case you should modify other package's code as little as possible.
* Different packages have their own workflows and task lists. If you realise some significant changes are needed in another package, do not modify it directly but add a new task to it's TASKS.md.

## Package Workflows

The term "workflows" refers to markdown instructions within each package's CLAUDE.md file that you should follow step-by-step when asked to work on a specific package flow. When a user asks you to "follow a workflow" or "follow main flow", you should:

1. Immediately check the package's CLAUDE.md file for workflow instructions
2. Follow those instructions precisely in the order specified
3. Run any commands or code modification steps listed there

For package-specific work, please refer to the respective package's docs/CLAUDE.md file:

- For `@ai-gamedev/playtest`: See `packages/playtest/docs/CLAUDE.md`

When working on a specific package, follow the workflows defined in that package's CLAUDE.md file.

## Documentation Templates

Standardized documentation templates for all packages are available in `/docs/templates/`. When creating documentation for a new package, copy these templates and adapt them to the specific package:

- CLAUDE.md - Workflow instructions for AI assistance
- TASKS.md - Task tracking with package-specific prefix
- TESTING.md - Testing guidelines
- MAINTENANCE.md - Documentation maintenance guidelines
- ARCHITECTURE.md - System architecture documentation

**IMPORTANT**: When making changes to documentation that would benefit all packages, please propagate these changes to all package-specific documentation files and update the templates accordingly.