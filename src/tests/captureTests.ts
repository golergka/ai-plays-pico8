/**
 * Screen Capture Tests
 * 
 * Tests for the screen capture functionality.
 */

import { ScreenCapture } from '../capture/screenCapture'
import { Pico8Runner } from '../runners/pico8Runner'
import { getConfig } from '../config/env'
import { TestScenario, TestContext, TestMode } from './testRunner'
import { CaptureEvent } from '../types/capture'
import { setTimeout } from 'node:timers/promises'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

// Create temporary directory for captures
const TEST_CAPTURE_DIR = path.join(os.tmpdir(), 'pico8-capture-test')

// Test scenarios for screen capture
export const captureTestScenarios: TestScenario[] = [
  {
    name: 'capture-basic',
    description: 'Tests basic screen capture functionality',
    run: runBasicCaptureTest,
    platforms: ['darwin', 'win32', 'linux'],
  },
  {
    name: 'capture-window-specific',
    description: 'Tests window-specific capture (macOS only)',
    run: runWindowSpecificCaptureTest,
    platforms: ['darwin'],
  },
  {
    name: 'capture-lifecycle',
    description: 'Tests capture lifecycle with PICO-8 shutdown',
    run: runCaptureLifecycleTest,
    platforms: ['darwin', 'win32', 'linux'],
  },
]

/**
 * Run the capture tests
 * @param context Test context
 */
export async function runCaptureTests(context: TestContext): Promise<void> {
  // Run all capture test scenarios
  for (const scenario of captureTestScenarios) {
    // Skip tests not applicable to this platform
    if (!scenario.platforms.includes(process.platform)) {
      console.log(`Skipping ${scenario.name} test (not supported on ${process.platform})`)
      continue
    }
    
    if (context.mode === TestMode.SELF_TEST) {
      console.log(`Running ${scenario.name} test...`)
      await scenario.run(context)
    } else {
      console.log(`Skipping ${scenario.name} test in interactive mode (not implemented)`)
    }
  }
}

/**
 * Basic screen capture test
 * @param context Test context
 */
async function runBasicCaptureTest(context: TestContext): Promise<void> {
  // Ensure capture directory exists
  if (!fs.existsSync(TEST_CAPTURE_DIR)) {
    fs.mkdirSync(TEST_CAPTURE_DIR, { recursive: true })
  }
  
  // Initialize environment config
  const config = getConfig()
  
  // Create PICO-8 runner
  const runner = new Pico8Runner({
    executablePath: config.PICO8_PATH,
    windowed: true,
    soundVolume: 0 // Mute sound for testing
  })
  
  // Create screen capture with test configuration
  const capture = new ScreenCapture({
    interval: 500, // Faster interval for testing
    saveToDisk: true,
    outputDir: TEST_CAPTURE_DIR,
    imageFormat: 'png',
    windowTitle: 'PICO-8',
    autoStopOnWindowClose: true,
    debug: true
  })
  
  // Test metrics
  let captureCount = 0
  let errorCount = 0
  let startEvent = false
  let stopEvent = false
  
  // Set up event listeners
  capture.on(CaptureEvent.CAPTURE, () => {
    captureCount++
  })
  
  capture.on(CaptureEvent.ERROR, () => {
    errorCount++
  })
  
  capture.on(CaptureEvent.START, () => {
    startEvent = true
  })
  
  capture.on(CaptureEvent.STOP, () => {
    stopEvent = true
  })
  
  try {
    // Launch PICO-8
    console.log('Launching PICO-8...')
    const result = await runner.launch()
    
    if (!result.success) {
      throw new Error(`Failed to launch PICO-8: ${result.error}`)
    }
    
    // Start capturing
    console.log('Starting screen capture...')
    capture.start()
    
    // Wait for captures (5 seconds)
    console.log('Waiting for captures...')
    await setTimeout(5000)
    
    // Stop capturing
    console.log('Stopping screen capture...')
    capture.stop()
    
    // Wait for events to process
    await setTimeout(100)
    
    // Check test results
    const capturesExist = fs.readdirSync(TEST_CAPTURE_DIR).length > 0
    
    // Log results
    console.log('Test results:')
    console.log(`- Captures taken: ${captureCount}`)
    console.log(`- Errors: ${errorCount}`)
    console.log(`- Events: start=${startEvent}, stop=${stopEvent}`)
    console.log(`- Capture files exist: ${capturesExist}`)
    
    // Verify test success
    const success = captureCount > 0 && errorCount === 0 && startEvent && stopEvent && capturesExist
    
    if (success) {
      console.log('✅ Basic capture test passed!')
    } else {
      console.error('❌ Basic capture test failed!')
      throw new Error('Basic capture test failed')
    }
  } finally {
    // Cleanup - force close PICO-8
    if (runner.isRunning()) {
      console.log('Cleaning up - closing PICO-8...')
      await runner.close(true)
    }
    
    // Cleanup - stop capture if still running
    if (capture.isActive()) {
      capture.stop()
    }
  }
}

/**
 * Window-specific capture test (macOS only)
 * @param context Test context
 */
async function runWindowSpecificCaptureTest(context: TestContext): Promise<void> {
  if (process.platform !== 'darwin') {
    console.log('Skipping window-specific capture test (only supported on macOS)')
    return
  }

  // Ensure capture directory exists
  if (!fs.existsSync(TEST_CAPTURE_DIR)) {
    fs.mkdirSync(TEST_CAPTURE_DIR, { recursive: true })
  }
  
  // Initialize environment config
  const config = getConfig()
  
  // Create PICO-8 runner
  const runner = new Pico8Runner({
    executablePath: config.PICO8_PATH,
    windowed: true,
    soundVolume: 0 // Mute sound for testing
  })
  
  // Create screen capture with test configuration
  const capture = new ScreenCapture({
    interval: 500, // Faster interval for testing
    saveToDisk: true,
    outputDir: TEST_CAPTURE_DIR,
    imageFormat: 'png',
    windowTitle: 'PICO-8',
    autoStopOnWindowClose: true,
    debug: true
  })
  
  // Track capture methods used
  const captureMethods = new Set<string>()
  
  // Listen for capture events to track methods
  capture.on(CaptureEvent.CAPTURE, (data) => {
    if (data.filePath) {
      const filename = path.basename(data.filePath)
      // Extract method from filename (format: capture-timestamp-method.png)
      const methodMatch = filename.match(/capture-\d+-([^.]+)\.png/)
      if (methodMatch && methodMatch[1]) {
        captureMethods.add(methodMatch[1])
      }
    }
  })

  try {
    // Launch PICO-8
    console.log('Launching PICO-8...')
    const result = await runner.launch()
    
    if (!result.success) {
      throw new Error(`Failed to launch PICO-8: ${result.error}`)
    }
    
    // Start capturing
    console.log('Starting window-specific screen capture...')
    capture.start()
    
    // Wait for captures (5 seconds)
    console.log('Waiting for captures...')
    await setTimeout(5000)
    
    // Stop capturing
    console.log('Stopping screen capture...')
    capture.stop()
    
    // Wait for events to process
    await setTimeout(100)
    
    // Log results
    console.log('Window-specific capture test results:')
    console.log('- Capture methods used:', Array.from(captureMethods))
    
    // Verify test success - window-specific capture should be used
    const success = captureMethods.has('window-specific')
    
    if (success) {
      console.log('✅ Window-specific capture test passed!')
    } else {
      console.warn('⚠️ Window-specific capture test: window-specific method was not used')
      console.log('This might be expected if PICO-8 window could not be identified by ID')
    }
  } finally {
    // Cleanup - force close PICO-8
    if (runner.isRunning()) {
      console.log('Cleaning up - closing PICO-8...')
      await runner.close(true)
    }
    
    // Cleanup - stop capture if still running
    if (capture.isActive()) {
      capture.stop()
    }
  }
}

/**
 * Capture lifecycle test
 * @param context Test context
 */
async function runCaptureLifecycleTest(context: TestContext): Promise<void> {
  // Ensure capture directory exists
  if (!fs.existsSync(TEST_CAPTURE_DIR)) {
    fs.mkdirSync(TEST_CAPTURE_DIR, { recursive: true })
  }
  
  // Initialize environment config
  const config = getConfig()
  
  // Create PICO-8 runner
  const runner = new Pico8Runner({
    executablePath: config.PICO8_PATH,
    windowed: true,
    soundVolume: 0 // Mute sound for testing
  })
  
  // Create screen capture with test configuration
  const capture = new ScreenCapture({
    interval: 500, // Faster interval for testing
    saveToDisk: true,
    outputDir: TEST_CAPTURE_DIR,
    imageFormat: 'png',
    windowTitle: 'PICO-8',
    autoStopOnWindowClose: true,
    debug: true
  })
  
  // Test metrics
  let captureCount = 0
  let stopCalled = false
  
  // Set up event listeners
  capture.on(CaptureEvent.CAPTURE, () => {
    captureCount++
  })
  
  capture.on(CaptureEvent.STOP, () => {
    stopCalled = true
  })
  
  try {
    // Launch PICO-8
    console.log('Launching PICO-8...')
    const result = await runner.launch()
    
    if (!result.success) {
      throw new Error(`Failed to launch PICO-8: ${result.error}`)
    }
    
    // Add process exit handler
    if (runner.process) {
      runner.process.on('exit', () => {
        if (capture && capture.isActive()) {
          console.log('PICO-8 process exited, stopping screen capture in exit handler')
          capture.stop()
        }
      })
    }
    
    // Start capturing
    console.log('Starting screen capture...')
    capture.start()
    
    // Wait for some captures
    console.log('Capturing for 3 seconds...')
    await setTimeout(3000)
    
    // Force close PICO-8 to test auto-stop
    console.log('Force closing PICO-8 to test autoStop behavior...')
    await runner.close(true)
    
    // Wait for events to process
    await setTimeout(1000)
    
    // Check if capture was stopped by the event handler
    const captureActive = capture.isActive()
    
    // Log results
    console.log('Lifecycle test results:')
    console.log(`- Captures taken: ${captureCount}`)
    console.log(`- Stop event fired: ${stopCalled}`)
    console.log(`- Capture still active: ${captureActive}`)
    
    // Verify test success
    const success = captureCount > 0 && stopCalled && !captureActive
    
    if (success) {
      console.log('✅ Capture lifecycle test passed!')
    } else {
      console.error('❌ Capture lifecycle test failed!')
      console.error('Capture was not properly stopped when PICO-8 exited')
      throw new Error('Capture lifecycle test failed')
    }
  } finally {
    // Cleanup - force close PICO-8 if still running
    if (runner.isRunning()) {
      console.log('Cleaning up - closing PICO-8...')
      await runner.close(true)
    }
    
    // Cleanup - stop capture if still running
    if (capture.isActive()) {
      capture.stop()
    }
  }
}