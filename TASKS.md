# Tasks - Root

## Project Task Prefix: ROOT

## Current Task ID Counter: ROOT-011

These tasks track remaining work after cleaning up the old documentation.

**Codex Instructions**: Delete tasks from this list once they're complete.

### [ROOT-001] Implement AI Mode in CLI [TODO]
**Dependencies**: None
**Description**: The command line interface only supports human play. Add an AI mode that uses the existing AI player modules.
**Acceptance Criteria**:
- Running `bun start ai <game>` launches the game with the AI player
- Errors are handled gracefully
- Update usage examples in README

### [ROOT-002] Add Save File Support to Game CLI [TODO]
**Dependencies**: ROOT-001
**Description**: Allow loading and saving game state through command line options.
**Acceptance Criteria**:
- `--save-file` option loads and writes saves to a specified path
- Automatic save directory created if missing
- Basic commands to list and delete saves

### [ROOT-003] Align HumanPlayer with InputOutput interface [TODO]
**Dependencies**: None
**Description**: The `askForActions` method in `packages/playtest/src/cli/human-player.ts` still expects three parameters, but `InputOutput` now defines it with two. Tests call the two‑parameter version leading to runtime errors and type failures.
**Acceptance Criteria**:
- `askForActions` matches the interface signature
- Tests in `human-player.test.ts` pass
- Related scripts such as `play-human.ts` compile

### [ROOT-004] Remove obsolete StepResult and GameResult types [TODO]
**Dependencies**: None
**Description**: Types `GameResult` and `StepResult` were removed from `playtest`, but `packages/text-adventure` still imports them and uses `StepResult` as internal return values. This prevents typechecking.
**Acceptance Criteria**:
- `packages/text-adventure/src/types.ts` no longer references the removed types
- `text-adventure.ts` refactored to return plain strings instead of `StepResult`
- Typecheck passes for this package

### [ROOT-005] Fix SaveableGame generics in save player scripts [TODO]
**Dependencies**: None
**Description**: `claude-save-player.ts` and `play-claude.ts` instantiate `SaveableGame` without generic parameters and reference a deleted `CompactTextAdventure` class.
**Acceptance Criteria**:
- `SaveableGame` uses proper type arguments
- Obsolete `CompactTextAdventure` references removed
- `bun run typecheck` succeeds

### [ROOT-006] Clean up unused imports and stale references [TODO]
**Dependencies**: None
**Description**: Minor typecheck errors come from unused imports (e.g., `Langfuse` in `openai.ts`) and outdated `GameResult` import in `index.ts`.
**Acceptance Criteria**:
- Remove or use the `Langfuse` import
- Remove `GameResult` import from `index.ts`

### [ROOT-007] Set up Biome for linting and formatting [TODO]
**Dependencies**: None
**Description**: Replace Prettier and ESLint with [Biome](https://biomejs.dev) to handle formatting and linting across the repository. Provide scripts to format and lint all packages.
**Acceptance Criteria**:
- `biome.json` or equivalent configuration exists
- `bun run format` formats the codebase
- `bun run lint` checks all packages without errors
- Documentation in `CLAUDE.md` explains how to run these commands

### [ROOT-009] Configure GitHub Actions for CI [TODO]
**Dependencies**: ROOT-007
**Description**: Automate tests and typechecking with a GitHub Actions workflow.
**Acceptance Criteria**:
- Workflow installs dependencies and runs `bun run lint`, `bun run typecheck`, and `bun run test`
- Workflow triggers on pull requests and pushes to `main`

### [ROOT-010] Consolidate CLI entrypoint into playtest package [TODO]
**Dependencies**: None
**Description**: The root `index.ts` duplicates functionality from `packages/playtest`. Move the CLI logic entirely under that package and keep the root script as a thin wrapper or remove it.
**Acceptance Criteria**:
- CLI code resides in `packages/playtest`
- `bun start` continues to launch the game
- Obsolete root files removed

### [ROOT-011] Standardize TypeScript project references [TODO]
**Dependencies**: None
**Description**: Unify all package `tsconfig.json` files using project references for faster builds.
**Acceptance Criteria**:
- Root `tsconfig.json` lists references to each package
- Packages compile with `tsc -b`
- Document the build process in `CLAUDE.md`
