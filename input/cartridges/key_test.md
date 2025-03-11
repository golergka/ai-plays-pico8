# PICO-8 Key Test Cartridge

This is a simple PICO-8 cartridge designed specifically for testing keyboard input mapping.

## Features

- Visual indicators showing which keys are currently pressed
- Player character that moves in response to arrow keys
- Text status showing "keys detected" when any input is active
- Clean, minimalist design for easy visualization of input

## How to Use

1. Launch the cartridge in PICO-8
2. Press arrow keys to move the heart character
3. Observe the key status indicators on the left side of the screen
4. When a key is pressed, its status changes from "---" to "PRESSED" with a brighter color

## Testing Input Commands

This cartridge is ideal for testing the input command system because:

1. It provides immediate visual feedback when a key is pressed
2. It works without complex loading screens or menus
3. It shows both textual and graphical representation of input state

## Expected Behavior

- LEFT ARROW: Heart moves left, "left: PRESSED" appears
- RIGHT ARROW: Heart moves right, "right: PRESSED" appears
- UP ARROW: Heart moves up, "up: PRESSED" appears
- DOWN ARROW: Heart moves down, "down: PRESSED" appears
- Z/O BUTTON: "z/o: PRESSED" appears
- X/X BUTTON: "x/x: PRESSED" appears

The heart character can move diagonally when multiple direction keys are pressed.

## Troubleshooting

If key presses are not registering:
- Check key mapping in the input commands module
- Verify window focus detection is working correctly
- Ensure PICO-8 is the active window