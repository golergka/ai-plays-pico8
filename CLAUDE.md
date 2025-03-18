# AI GameDev Monorepo Guidelines

This is a monorepo with multiple packages. Each package has its own documentation and workflows.

* When you work on a particular package, you can run monorepo-wide scripts for your workflows.
* When you work on a particular package, ONLY MODIFY THE FILES IN THAT PACKAGE, unless you change shared types — in which case you should modify other package's code as little as possible.
* Different packages have their own workflows and task lists. If you realise some significant changes are needed in another package, do not modify it directly but add a new task to it's TASKS.md.

For package-specific work, please refer to the respective package's docs/CLAUDE.md file:

- For `@ai-gamedev/playtest`: See `packages/playtest/docs/CLAUDE.md`

When working on a specific package, follow the workflows defined in that package's CLAUDE.md file.