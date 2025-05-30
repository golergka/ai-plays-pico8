# AI GameDev Monorepo

A TypeScript-based monorepo for AI game development and testing tools.

**Important**

If you're Claude, only update this document as an artifact for humans. Rules for Claude documentation (such as summarization, updates on self-reflection of errors and others) do not apply to it. LLM-targeted documentation starts at [docs/CLAUDE.md](docs/CLAUDE.md).

## Project Overview

This monorepo contains packages for AI game development and testing:

- `@ai-gamedev/playtest`: Framework for AI agents to play text games with easy, menu-based input and output
- `@ai-gamedev/text-adventure`: Implementation of a text adventure game
- `@ai-gamedev/play`: CLI tools for playing games with human or AI players

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
# Play a text adventure with human input
bun run play human text-adventure

# Show help
bun run play help
```

## Development

```bash
# Run type checking for all packages
bun run typecheck

# Run tests for all packages
bun run test
```

## Project Status

This project is under active development. See the [TASKS.md](TASKS.md) file for current priorities and progress.
