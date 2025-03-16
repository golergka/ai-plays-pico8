import { VisionFeedbackSystem } from './visionFeedback'
import { Pico8Runner } from '../runners/pico8Runner'
import { getConfig } from '../config/env'
import { setTimeout } from 'node:timers/promises'
import { TerminationStrategy } from '../types/pico8'
import { createLogger } from '../utils/logger'
import { promises as fs } from 'node:fs'

const logger = createLogger('VisionDemo')

/**
 * Simple demo of the Vision Feedback System
 * This demo:
 * 1. Launches PICO-8 with a specified cartridge
 * 2. Initializes the vision feedback system
 * 3. Runs a demo session with 3 capture-analyze-command steps
 * 4. Generates a markdown report with screenshots and LLM feedback
 * 5. Cleans up all resources
 */
export async function runVisionFeedbackDemo(options: {
  steps?: number
  delayBetweenSteps?: number
}): Promise<string> {
  const { steps = 3, delayBetweenSteps = 2000 } = options
  
  logger.info('Starting Vision Feedback Demo')
  
  // Get configuration
  const config = getConfig()
  
  // Validate configuration - API key should be in shell environment or .env
  // Using bracket notation for process.env as required by TypeScript
  const openaiKey = process.env['OPENAI_API_KEY'] || config['OPENAI_API_KEY'];
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for vision feedback (set in shell or .env)')
  }
  
  if (!config.PICO8_DEFAULT_CARTRIDGE) {
    throw new Error('PICO8_DEFAULT_CARTRIDGE environment variable is required')
  }
  
  let runner: Pico8Runner | null = null
  // We don't need to create our own screen capture or input instances
  // They are created inside the VisionFeedbackSystem
  let visionSystem: VisionFeedbackSystem | null = null
  let sessionFilePath: string = ''
  
  // Register process-level handlers to ensure cleanup on unexpected termination
  // These handlers are removed at the end of the function
  const processExitHandler = () => {
    if (runner && runner.isRunning()) {
      logger.warn('Process exit detected, force-killing PICO-8')
      try {
        // Use sync version for process exit handler
        runner.closeSync({ force: true })
      } catch (e) {
        logger.error(`Failed to kill PICO-8 on process exit: ${e}`)
      }
    }
  }
  
  // Register process exit handlers
  process.on('exit', processExitHandler)
  process.on('SIGINT', processExitHandler)
  process.on('SIGTERM', processExitHandler)
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught exception: ${err.message}`)
    processExitHandler()
    process.exit(1)
  })

  try {
    // First, ensure the captures directory exists
    try {
      const captureDir = config.CAPTURE_OUTPUT_DIR || './captures'
      await fs.mkdir(captureDir, { recursive: true })
      logger.info(`Ensured capture directory exists: ${captureDir}`)
    } catch (dirError) {
      logger.error(`Failed to create capture directory: ${dirError instanceof Error ? dirError.message : String(dirError)}`)
    }
    
    // Create PICO-8 runner
    runner = new Pico8Runner({
      executablePath: config.PICO8_PATH,
      windowed: config.PICO8_WINDOWED === true,
      soundVolume: config.PICO8_VOLUME !== undefined ? config.PICO8_VOLUME : 128
    })
    
    // Launch PICO-8 with the default cartridge
    logger.info(`Launching PICO-8 with cartridge: ${config.PICO8_DEFAULT_CARTRIDGE}`)
    const result = await runner.launch(config.PICO8_DEFAULT_CARTRIDGE)
    
    if (!result.success) {
      throw new Error(`Failed to launch PICO-8: ${result.error}`)
    }
    
    logger.info(`PICO-8 launched successfully (PID: ${result.pid})`)
    
    // Initialize the vision feedback system with additional error handling
    logger.info('Initializing vision feedback system')
    try {
      visionSystem = new VisionFeedbackSystem()
    } catch (visionInitError) {
      logger.error(`Failed to initialize vision system: ${visionInitError instanceof Error ? visionInitError.message : String(visionInitError)}`)
      throw new Error('Vision system initialization failed')
    }
    
    // Wait for PICO-8 to initialize
    logger.info('Waiting for PICO-8 to initialize...')
    await setTimeout(3000)
    
    // Run the vision feedback session with additional error handling
    logger.info(`Running vision feedback session with ${steps} steps`)
    try {
      sessionFilePath = await visionSystem.runSimpleSession(steps, delayBetweenSteps)
      logger.info(`Vision feedback session completed. Report saved to: ${sessionFilePath}`)
    } catch (sessionError) {
      logger.error(`Error during vision feedback session: ${sessionError instanceof Error ? sessionError.message : String(sessionError)}`)
      // Continue to cleanup even if session fails
    }
  } catch (error) {
    logger.error(`Error in vision feedback demo: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    // Remove process exit handlers to avoid duplicate handlers in future runs
    process.removeListener('exit', processExitHandler)
    process.removeListener('SIGINT', processExitHandler)
    process.removeListener('SIGTERM', processExitHandler)
    
    // Clean up all resources
    logger.info('Cleaning up resources')
    
    // Stop vision system if running
    if (visionSystem) {
      logger.info('Stopping vision feedback system')
    }
    
    // Close PICO-8 if running - use a more robust approach
    if (runner) {
      logger.info('Closing PICO-8')
      try {
        if (runner.isRunning()) {
          // First try graceful shutdown with shorter timeout
          const closeResult = await runner.close({ force: false, timeout: 2000 })
          
          if (!closeResult.success) {
            logger.warn(`Failed to close PICO-8 gracefully: ${closeResult.error}`)
            logger.info('Attempting force close')
            
            // Try force kill with most aggressive strategy
            await runner.close({ 
              force: true, 
              startStrategy: TerminationStrategy.OS_SPECIFIC,
              // Note: Using only supported strategies 
              timeout: 1000 
            })
          }
        } else {
          logger.info('PICO-8 is not running, no need to close')
        }
      } catch (error) {
        logger.error(`Error closing PICO-8: ${error instanceof Error ? error.message : String(error)}`)
        
        // Last resort - try sync close
        try {
          logger.warn('Attempting emergency synchronous termination')
          runner.closeSync({ force: true })
        } catch (syncError) {
          logger.error(`Emergency termination failed: ${syncError instanceof Error ? syncError.message : String(syncError)}`)
        }
      }
    }
  }
  
  return sessionFilePath
}