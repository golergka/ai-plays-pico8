# AI GameDev Monorepo

A TypeScript-based monorepo for AI game development and testing tools.

**Important**

If you're Claude, only update this document as an artifact for humans. Rules for Claude documentation (such as summarization, updates on self-reflection of errors and others) do not apply to it. LLM-targeted documentation starts at [docs/CLAUDE.md](docs/CLAUDE.md).

## Project Overview

This monorepo contains packages for AI game development and testing:

- `@ai-gamedev/playtest`: Framework for AI agents to play text games with easy, menu-based input and output.

## Setup & Installation

### Prerequisites

- [Bun](https://bun.sh/) runtime

### Installation

```bash
# Install dependencies for all packages
bun install
```

## Usage

```bash
# Run the playtest application
cd packages/playtest
bun run start

# Or from the root directory
bun --cwd packages/playtest run start
```

## Development

```bash
# Run type checking for all packages
bun run typecheck

# Run tests for all packages
bun run test
```

## Project Status

This project is under active development. See the [docs/TASKS.md](docs/TASKS.md) file for current priorities and progress.