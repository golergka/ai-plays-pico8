# AI Plays PICO-8

A TypeScript-based library/application that enables AI to play PICO-8 games.

**Important**

If you're Claude, only update this document as an artifact for humans. Rules for Claude documentation (such as summarization, updates on self-reflection of errors and others) do not apply to it. LLM-targeted documentation starts at [docs/CLAUDE.md](docs/CLAUDE.md).

## Project Overview

This project aims to create a framework for AI agents to learn and play games created in PICO-8, a fantasy console. The system captures game screens, processes them for AI input, and enables the AI to control the game through simulated keyboard inputs.

## Setup & Installation

### Prerequisites

- [PICO-8](https://www.lexaloffle.com/pico-8.php) (purchased separately)
- [Bun](https://bun.sh/) runtime

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-plays-pico8.git
   cd ai-plays-pico8
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables:
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Edit the `.env` file with your PICO-8 executable path and other settings

## Usage

```bash
# Run the application
bun run start
```

### Using Test Cartridges

The project includes a test cartridge for development and testing:

```bash
# Run with the test cartridge
bun run start

# The test cartridge is located at:
# input/cartridges/test_game.p8
```

See [input/cartridges/README.md](input/cartridges/README.md) for details on the test cartridge.

## Environment Configuration

The application uses environment variables for configuration. You can set these in a `.env` file or directly in your environment.

### Required Variables:

- `PICO8_PATH` - Path to your PICO-8 executable

### Optional Variables:

- `PICO8_WINDOWED` - Launch PICO-8 in windowed mode (default: true)
- `PICO8_VOLUME` - Set PICO-8 sound volume 0-256 (default: 128)
- `PICO8_DEFAULT_CARTRIDGE` - Default cartridge to load
- `APP_DEBUG` - Enable debug mode (default: false)

## Development

```bash
# Run type checking
bun run typecheck
```

## Project Status

This project is under active development. See the [docs/TASKS.md](docs/TASKS.md) file for current priorities and progress.