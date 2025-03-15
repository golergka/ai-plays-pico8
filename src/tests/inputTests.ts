/**
 * Input Tests - Test scenarios for keyboard input functionality
 * 
 * These tests verify that keyboard inputs are correctly sent to PICO-8
 * and that the application handles input events properly.
 */

import { Pico8Runner } from '../runners/pico8Runner'
import { InputCommands } from '../input/inputCommands'
import { Pico8Button } from '../types/input'
import { setTimeout } from 'node:timers/promises'
import type { TestScenario } from './testRunner'
// TestMode is only used within the main test runner
import { Logger, LogLevel } from '../utils/logger'
import { existsSync } from 'node:fs'
import { getConfig } from '../config/env'

// Constants for key press durations are directly used in the test methods

/**
 * Self-test for key inputs (developer-focused, fast)
 * 
 * This test quickly verifies all key inputs by sending commands and checking
 * for errors. It does not require visual verification and runs much faster
 * than the interactive tests.
 */
export const selfTestKeyInput: TestScenario = {
  name: 'self-test-key-input',
  description: 'Fast self-test of key input functionality (no user interaction)',
  requiresUserInteraction: false,
  async run(_options = {}): Promise<void> {
    const logger = new Logger({
      prefix: 'SelfTestKeys',
      minLevel: LogLevel.INFO
    })
    
    // Self-test is always fast, regardless of mode
    const keyHoldDuration = 100
    const pauseDuration = 100
    
    // Get configuration
    const config = getConfig()
    const cartridgePath = config.PICO8_DEFAULT_CARTRIDGE || './input/cartridges/key_test.p8'
    
    // Verify the test cartridge exists
    if (!existsSync(cartridgePath)) {
      throw new Error(`Test cartridge not found at: ${cartridgePath}`)
    }
    
    let runner: Pico8Runner | null = null
    let input: InputCommands | null = null
    
    try {
      logger.info('Starting key input self-test')
      
      // Create PICO-8 runner
      runner = new Pico8Runner({
        executablePath: config.PICO8_PATH,
        windowed: true,
        soundVolume: 0 // Mute sound for self-test
      })
      
      // Launch PICO-8 with test cartridge
      logger.info(`Launching PICO-8 with cartridge: ${cartridgePath}`)
      const result = await runner.launch(cartridgePath)
      
      if (!result.success || !result.pid) {
        throw new Error(`Failed to launch PICO-8: ${result.success ? 'No PID returned' : result.error}`)
      }
      
      logger.info(`PICO-8 launched successfully (PID: ${result.pid})`)
      
      // Wait for PICO-8 to load (shorter time for self-test)
      logger.info('Waiting for PICO-8 to load...')
      await setTimeout(3000)
      
      // Initialize input commands
      input = new InputCommands({
        windowTitle: 'PICO-8',
        delayBetweenKeys: 50, // Faster for self-test
        debug: false
      })
      
      // Test each key briefly
      const buttons = [
        Pico8Button.Up,
        Pico8Button.Down,
        Pico8Button.Left,
        Pico8Button.Right,
        Pico8Button.Z,
        Pico8Button.X
      ]
      
      // Test each button individually with minimal delays
      for (const button of buttons) {
        logger.info(`Testing ${button} button`)
        
        // Press the button
        await input.pressButton(button)
        await setTimeout(keyHoldDuration)
        await input.releaseButton(button)
        await setTimeout(pauseDuration)
      }
      
      // Test button sequence (faster)
      logger.info('Testing button sequence')
      await input.sendButtonSequence(buttons, 50, 100)
      
      logger.info('Key input self-test completed successfully')
      
    } catch (error) {
      logger.error(`Error during key input self-test: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    } finally {
      // Always close PICO-8
      if (runner && runner.isRunning()) {
        logger.info('Closing PICO-8...')
        await runner.close(true)
      }
    }
  }
}

/**
 * Interactive comprehensive key test (user-focused, detailed)
 * 
 * This test is repurposed from the original runKeyMappingTest function 
 * in index.ts. It provides detailed visual feedback for each key press,
 * with clear headers and instructions for the user.
 */
export const interactiveKeyTest: TestScenario = {
  name: 'interactive-key-test',
  description: 'Interactive test of key mapping with visual verification',
  requiresUserInteraction: true,
  async run(_options = {}): Promise<void> {
    const logger = new Logger({
      prefix: 'KeyTest',
      minLevel: LogLevel.INFO
    })
    
    // Get configuration
    const config = getConfig()
    const cartridgePath = config.PICO8_DEFAULT_CARTRIDGE || './input/cartridges/key_test.p8'
    
    // Verify the test cartridge exists
    if (!existsSync(cartridgePath)) {
      throw new Error(`Test cartridge not found at: ${cartridgePath}`)
    }
    
    let runner: Pico8Runner | null = null
    let input: InputCommands | null = null
    
    // Helper function to print visually distinct messages
    const printTestHeader = (message: string) => {
      const border = '='.repeat(message.length + 8);
      console.log('\n\n');
      console.log('\x1b[36m%s\x1b[0m', border);  // Cyan color
      console.log('\x1b[36m%s\x1b[0m', `    ${message}    `);  
      console.log('\x1b[36m%s\x1b[0m', border);
      console.log('\n');
    };
    
    try {
      printTestHeader('PICO-8 KEY TEST STARTING');
      console.log('This interactive test will help verify all PICO-8 controls');
      console.log('Watch the PICO-8 window for visual feedback after each key press');
      console.log('Each key will be kept pressed for 3 seconds for visibility\n');
      
      // Create PICO-8 runner
      runner = new Pico8Runner({
        executablePath: config.PICO8_PATH,
        windowed: true,
        soundVolume: 0
      })
      
      // Launch PICO-8 with test cartridge
      printTestHeader('LAUNCHING PICO-8');
      console.log(`Using test cartridge: ${cartridgePath}`);
      
      const result = await runner.launch(cartridgePath)
      
      if (!result.success || !result.pid) {
        throw new Error(`Failed to launch PICO-8: ${result.success ? 'No PID returned' : result.error}`)
      }
      
      console.log(`PICO-8 launched successfully (PID: ${result.pid})`);
      
      // Wait for PICO-8 to fully load
      printTestHeader('WAITING FOR PICO-8 TO LOAD');
      console.log('Please wait while PICO-8 initializes...');
      await setTimeout(5000);  // Longer wait to ensure cartridge is loaded
      
      // Initialize input commands
      input = new InputCommands({
        windowTitle: 'PICO-8',
        delayBetweenKeys: 150,
        debug: false
      })
      
      // Test UP arrow with repeated presses
      printTestHeader('TESTING UP ARROW KEY');
      console.log('The heart should move UP');
      console.log('UP indicator should turn bright red and show "PRESSED"');
      
      // Press 3 times with clear pauses between
      for (let i = 0; i < 3; i++) {
        console.log(`UP ARROW - Press ${i+1} of 3`);
        await input.pressButton(Pico8Button.Up);
        await setTimeout(1000);  // Hold for 1 second for visibility
        await input.releaseButton(Pico8Button.Up);
        await setTimeout(1000);  // Clear pause between presses
      }
      
      await setTimeout(2000);  // Pause between tests
      
      // Test DOWN arrow with repeated presses
      printTestHeader('TESTING DOWN ARROW KEY');
      console.log('The heart should move DOWN');
      console.log('DOWN indicator should turn bright red and show "PRESSED"');
      
      // Press 3 times with clear pauses between
      for (let i = 0; i < 3; i++) {
        console.log(`DOWN ARROW - Press ${i+1} of 3`);
        await input.pressButton(Pico8Button.Down);
        await setTimeout(1000);  // Hold for 1 second for visibility
        await input.releaseButton(Pico8Button.Down);
        await setTimeout(1000);  // Clear pause between presses
      }
      
      await setTimeout(2000);
      
      // Test LEFT arrow
      printTestHeader('TESTING LEFT ARROW KEY');
      console.log('The heart should move LEFT');
      console.log('LEFT indicator should turn bright red and show "PRESSED"');
      await input.pressButton(Pico8Button.Left);
      await setTimeout(3000);
      await input.releaseButton(Pico8Button.Left);
      await setTimeout(2000);
      
      // Test RIGHT arrow
      printTestHeader('TESTING RIGHT ARROW KEY');
      console.log('The heart should move RIGHT');
      console.log('RIGHT indicator should turn bright red and show "PRESSED"');
      await input.pressButton(Pico8Button.Right);
      await setTimeout(3000);
      await input.releaseButton(Pico8Button.Right);
      await setTimeout(2000);
      
      // Test Z button (X in PICO-8)
      printTestHeader('TESTING Z BUTTON (X in PICO-8)');
      console.log('Z/O indicator should turn bright red and show "PRESSED"');
      await input.pressButton(Pico8Button.Z);
      await setTimeout(3000);
      await input.releaseButton(Pico8Button.Z);
      await setTimeout(2000);
      
      // Test X button (O in PICO-8)
      printTestHeader('TESTING X BUTTON (O in PICO-8)');
      console.log('X/X indicator should turn bright red and show "PRESSED"');
      await input.pressButton(Pico8Button.X);
      await setTimeout(3000);
      await input.releaseButton(Pico8Button.X);
      await setTimeout(2000);
      
      // Test diagonal movement
      printTestHeader('TESTING DIAGONAL MOVEMENT (UP+RIGHT)');
      console.log('The heart should move diagonally UP and RIGHT');
      console.log('Both UP and RIGHT indicators should show "PRESSED"');
      await input.pressButton(Pico8Button.Up);
      await input.pressButton(Pico8Button.Right);
      await setTimeout(3000);
      await input.releaseButton(Pico8Button.Right);
      await input.releaseButton(Pico8Button.Up);
      await setTimeout(2000);
      
      // Optional hold test - allow user to observe sustained input
      printTestHeader('TESTING SUSTAINED INPUT (UP+RIGHT)');
      console.log('The heart should move diagonally UP-RIGHT for 5 seconds');
      console.log('Both UP and RIGHT indicators should remain lit the entire time');
      console.log('This tests if key input is maintained properly over time');
      
      // Press both keys and hold them
      await input.pressButton(Pico8Button.Up);
      await setTimeout(100);  // Small delay between keys
      await input.pressButton(Pico8Button.Right);
      
      // Hold for 5 seconds
      console.log('Holding keys for 5 seconds...');
      await setTimeout(5000);
      
      // Release both keys
      await input.releaseButton(Pico8Button.Right);
      await setTimeout(100);  // Small delay between releases
      await input.releaseButton(Pico8Button.Up);
      
      // Additional pause 
      await setTimeout(2000);
      
      // Test complete
      printTestHeader('KEY TEST COMPLETE');
      console.log('All keys have been tested.');
      console.log('The test will exit in 5 seconds...');
      await setTimeout(5000);
      
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', 'ERROR DURING KEY TEST:'); // Red color
      console.error(error);
      throw error;
    } finally {
      // Always close PICO-8
      if (runner && runner.isRunning()) {
        logger.info('Closing PICO-8...');
        await runner.close(true);
      }
    }
  }
}

// Export all test scenarios
export const inputTestScenarios: TestScenario[] = [
  selfTestKeyInput,
  interactiveKeyTest
]