import { VisionFeedbackSystem } from './visionFeedback'
import { Pico8Runner } from '../runners/pico8Runner'
import { getConfig } from '../config/env'
import { setTimeout } from 'node:timers/promises'
import { TerminationStrategy } from '../types/pico8'
import { createLogger } from '../utils/logger'

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
  // Get API key with index access notation to avoid TypeScript warnings
  const openaiKey = process.env.OPENAI_API_KEY || config['OPENAI_API_KEY'];
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
  
  try {
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
    
    // Initialize input commands
    // Only create InputCommands if needed directly
  // const input = new InputCommands({
      // windowTitle: 'PICO-8',
      // delayBetweenKeys: 150,
      // debug: config.APP_DEBUG === true
    // })
    
    // Initialize the vision feedback system
    logger.info('Initializing vision feedback system')
    visionSystem = new VisionFeedbackSystem()
    
    // Wait for PICO-8 to initialize
    logger.info('Waiting for PICO-8 to initialize...')
    await setTimeout(3000)
    
    // Run the vision feedback session
    logger.info(`Running vision feedback session with ${steps} steps`)
    sessionFilePath = await visionSystem.runSimpleSession(steps, delayBetweenSteps)
    
    logger.info(`Vision feedback session completed. Report saved to: ${sessionFilePath}`)
    
  } catch (error) {
    logger.error(`Error in vision feedback demo: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    // Clean up all resources
    logger.info('Cleaning up resources')
    
    // Stop vision system if running
    if (visionSystem) {
      logger.info('Stopping vision feedback system')
    }
    
    // No need to manually stop screen capture as it's handled by the VisionFeedbackSystem
    
    // Close PICO-8 if running
    if (runner && runner.isRunning()) {
      logger.info('Closing PICO-8')
      try {
        // First try graceful shutdown
        const closeResult = await runner.close({ force: false, timeout: 3000 })
        
        if (!closeResult.success) {
          logger.warn(`Failed to close PICO-8 gracefully: ${closeResult.error}`)
          logger.info('Attempting force close')
          
          // Try force kill
          await runner.close({ 
            force: true, 
            startStrategy: TerminationStrategy.OS_SPECIFIC, 
            timeout: 2000 
          })
        }
      } catch (error) {
        logger.error(`Error closing PICO-8: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
  
  return sessionFilePath
}