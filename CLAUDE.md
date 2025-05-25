# AI GameDev Monorepo Guidelines

This repository now keeps documentation in a single place. All old package docs and task lists were removed.

* Tasks for the whole project live in [TASKS.md](TASKS.md). Check it first when deciding what to work on.
* Keep changes scoped to the package you are working on. Modify shared code only when necessary.
* Before committing any change run the common checks:
  - `bun run typecheck`
  - `bun run lint` (if available)
  - `bun run test`
* See individual package `README.md` files for usage information.
