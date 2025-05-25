# Tasks - Root

## Project Task Prefix: ROOT

## Current Task ID Counter: ROOT-006

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
