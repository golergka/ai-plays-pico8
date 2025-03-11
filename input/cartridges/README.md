# Test Cartridges for AI-Plays-PICO8

This directory contains PICO-8 cartridges that are used for testing the AI framework.

## test_game.p8

A simple game designed specifically for testing the AI framework's capabilities:

### Game Features

- **Player Character**: Blue square that can be moved with arrow keys
- **Target Objects**: Red circles that can be collected
- **Scoring System**: Each target collected gives 10 points
- **Timer**: 30-second countdown
- **Game Over State**: Appears when time runs out
- **Restart Functionality**: Press X (❎) to restart the game

### Testing Purposes

This cartridge is ideal for testing:

1. **Screen Capture**: 
   - Clear, distinct visual elements (player, targets, score, timer)
   - Text elements for OCR testing
   - Game state changes (normal gameplay → game over screen)

2. **Input Commands**:
   - Basic directional controls (arrow keys)
   - Action button (X button for restart)
   - Tests responsiveness of input system

3. **Game State Detection**:
   - Score tracking (displayed at top left)
   - Timer countdown (displayed at top right)
   - Game over condition

### How to Use for Testing

1. Load the cartridge in PICO-8 manually or through the AI-Plays-PICO8 framework
2. For input command testing:
   - Test directional movement (arrow keys)
   - Test collecting targets (move player to target)
   - Test restart functionality (press X after game over)

3. For screen capture testing:
   - Capture frames during regular gameplay
   - Capture frames during game over screen
   - Verify text elements are readable

4. For game state detection:
   - Track score changes when targets are collected
   - Monitor timer countdown
   - Detect transition to game over state

### Visual Element Reference

- **Player**: Blue square (sprite 1)
- **Target**: Red circle (sprite 2)
- **Border**: White rectangle around play area
- **Score**: White text at top left
- **Timer**: White text at top right
- **Game Over Screen**: White-bordered black box with white/yellow text