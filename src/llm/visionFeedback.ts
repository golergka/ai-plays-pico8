import OpenAI from 'openai'
import { promises as fs } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger'
import { getConfig } from '../config/env'
import { FUNCTION_SCHEMAS } from '../types/llm'
import type { 
  LLMCommand, 
  LLMConfig, 
  LLMVisionResponse
} from '../types/llm'
import { ScreenCapture } from '../capture/screenCapture'
import { InputCommands } from '../input/inputCommands'

// OpenAI-specific types for the API
type ContentPartText = {
  type: 'text'
  text: string
}

type ContentPartImage = {
  type: 'image_url'
  image_url: {
    url: string
    detail: 'high' | 'low' | 'auto'
  }
}

// Create a logger for this module
const log = logger.child('visionFeedback')

/**
 * Class for handling vision-based LLM feedback in PICO-8 games
 */
export class VisionFeedbackSystem {
  private openai: OpenAI
  private config: LLMConfig
  private isRunning: boolean = false
  private captureDir: string
  private captureCount: number = 0
  private screenCapture: ScreenCapture | null = null
  private inputCommands: InputCommands

  /**
   * Creates a new vision feedback system
   */
  constructor() {
    const envConfig = getConfig()

    // Ensure we have an API key
    if (!envConfig.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: envConfig.OPENAI_API_KEY,
    })

    // Set up configuration
    this.config = {
      apiKey: envConfig.OPENAI_API_KEY,
      model: envConfig.OPENAI_MODEL || 'gpt-4-vision-preview',
      maxTokens: envConfig.OPENAI_MAX_TOKENS || 300,
      temperature: envConfig.OPENAI_TEMPERATURE || 0.5,
      captureInterval: envConfig.LLM_CAPTURE_INTERVAL || 2000,
    }

    // Configure capture directory
    this.captureDir = envConfig.CAPTURE_OUTPUT_DIR || './captures'
    
    // Initialize input commands
    this.inputCommands = new InputCommands({
      windowTitle: 'PICO-8',
      delayBetweenKeys: 150,
      debug: envConfig.APP_DEBUG === true
    })
    
    log.info('Vision feedback system initialized')
  }

  /**
   * Start the vision feedback loop
   */
  async start(): Promise<void> {
    this.isRunning = true
    log.info('Starting vision feedback loop')

    // Create a conversation history for OpenAI
    const systemMessage = {
      role: 'system' as const,
      content: this.getSystemPrompt()
    }

    // Start the feedback loop
    while (this.isRunning) {
      try {
        // Take a screenshot
        const imagePath = await this.captureScreen()
        
        if (!imagePath) {
          log.warn('Failed to capture screenshot, waiting before retry')
          await new Promise(resolve => setTimeout(resolve, this.config.captureInterval))
          continue
        }

        // Get screenshot data as base64
        const imageData = await fs.readFile(imagePath)
        const base64Image = imageData.toString('base64')

        // Create properly typed content elements
        const textContent: ContentPartText = { 
          type: 'text', 
          text: 'Analyze this PICO-8 game screen and provide feedback. What do you see?' 
        }
        
        const imageContent: ContentPartImage = { 
          type: 'image_url', 
          image_url: { 
            url: `data:image/png;base64,${base64Image}`,
            detail: 'high'
          } 
        }
        
        // Create user message with image
        const userMessage = {
          role: 'user' as const,
          content: [textContent, imageContent]
        }

        // Get feedback from LLM
        log.info('Sending screenshot to OpenAI for analysis')
        const response = await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [systemMessage, userMessage],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          tools: [{ type: 'function', function: FUNCTION_SCHEMAS.analyzeGameState }],
        })

        // Process the response
        if (!response.choices || response.choices.length === 0) {
          log.error('No choices returned in the response')
          continue
        }
        
        const message = response.choices[0]?.message
        
        if (!message) {
          log.error('No message in response')
          continue
        }
        
        // Handle function calling response
        let feedback: LLMVisionResponse | null = null
        
        if (message.tool_calls && message.tool_calls.length > 0) {
          const functionCall = message.tool_calls[0]
          
          if (functionCall && functionCall.function.name === 'analyzeGameState') {
            try {
              feedback = JSON.parse(functionCall.function.arguments) as LLMVisionResponse
            } catch (error) {
              log.error(`Failed to parse function call arguments: ${error instanceof Error ? error.message : String(error)}`)
            }
          }
        }

        // If we got valid feedback, process it
        if (feedback) {
          // Log the feedback
          log.info(`Received LLM feedback: ${feedback.feedback}`)

          // Process any commands
          if (feedback.commands && feedback.commands.length > 0) {
            await this.processCommands(feedback.commands)
          }

        } else {
          log.warn('No valid feedback received from LLM')
        }

        // Wait for next capture
        await new Promise(resolve => setTimeout(resolve, this.config.captureInterval))
      } catch (error) {
        log.error(`Error in vision feedback loop: ${error instanceof Error ? error.message : String(error)}`)
        await new Promise(resolve => setTimeout(resolve, this.config.captureInterval))
      }
    }
  }

  /**
   * Stop the vision feedback loop
   */
  stop(): void {
    log.info('Stopping vision feedback loop')
    this.isRunning = false
  }

  /**
   * Capture a screenshot of the PICO-8 window
   */
  private async captureScreen(): Promise<string | null> {
    try {
      // Initialize screen capture if needed
      if (!this.screenCapture) {
        this.screenCapture = new ScreenCapture({
          interval: 1000, // This doesn't matter as we're using it for one-time captures
          saveToDisk: true,
          outputDir: this.captureDir,
          imageFormat: 'png' as const,
          imageQuality: 90,
          windowTitle: 'PICO-8',
          autoStopOnWindowClose: true,
          debug: false
        })
      }
      
      this.captureCount++
      const filename = `pico8_capture_${Date.now()}_${this.captureCount}.png`
      const imagePath = join(this.captureDir, filename)
      
      // Ensure the captures directory exists
      await fs.mkdir(this.captureDir, { recursive: true })
      
      // Take the screenshot using the screen capture instance
      const result = await this.screenCapture.captureScreen()
      
      if (result.success) {
        // Save buffer to file
        await fs.writeFile(imagePath, result.buffer)
        
        log.debug(`Screenshot captured: ${imagePath}`)
        return imagePath
      } else {
        log.error(`Failed to capture screenshot: ${result.error}`)
        return null
      }
    } catch (error) {
      log.error(`Failed to capture screenshot: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  /**
   * Process commands received from the LLM
   */
  private async processCommands(commands: LLMCommand[]): Promise<void> {
    for (const command of commands) {
      try {
        log.info(`Processing command: ${command.type} ${command.button}`)
        
        switch (command.type) {
          case 'press':
            await this.inputCommands.pressButton(command.button)
            break
          case 'release':
            await this.inputCommands.releaseButton(command.button)
            break
          case 'tap':
            await this.inputCommands.tapButton(command.button, command.duration || 100)
            break
          default:
            log.warn(`Unknown command type: ${command.type}`)
        }
      } catch (error) {
        log.error(`Failed to process command: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  /**
   * Get the system prompt for the LLM
   */
  private getSystemPrompt(): string {
    return `
You are a vision assistant designed to analyze PICO-8 games and provide feedback.

PICO-8 is a fantasy console with simple graphics - games typically have an 8-bit style with a 128x128 resolution and limited color palette.

Your tasks:
1. Analyze game screenshots and describe what you see happening on the screen
2. Identify game elements (characters, obstacles, UI elements)
3. Provide helpful feedback about game state and progress
4. Suggest button presses to control the game when appropriate

The PICO-8 controls are:
- Arrow keys (up, down, left, right) - for movement
- O button (Z/C on keyboard) - usually for action/confirm
- X button (X/V on keyboard) - usually for secondary action/cancel

When suggesting commands, use the analyzeGameState function with the following structure:
{
  "feedback": "Description of what you see happening in the game",
  "commands": [
    {
      "type": "press|release|tap",
      "button": "left|right|up|down|o|x",
      "duration": 100 // Only for tap type, in milliseconds
    }
  ]
}

Keep your feedback clear and concise, focusing on the most relevant information.
Be specific about what you observe in the current game screen.
`.trim()
  }
}