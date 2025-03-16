import OpenAI from 'openai'
import { promises as fs } from 'fs'
import { join } from 'path'
import { createLogger } from '../utils/logger'
import { getConfig } from '../config/env'
import { FUNCTION_SCHEMAS } from '../types/llm'
import type { 
  LLMCommand, 
  LLMConfig, 
  LLMVisionResponse,
  MessageContent
} from '../types/llm'
import { ScreenCapture } from '../capture/screenCapture'
// Import InputCommands directly for creating input handlers
import { InputCommands } from '../input/inputCommands'
import sharp from 'sharp'

// Create a logger for this module
const logger = createLogger('VisionFeedback')

/**
 * Class for handling vision-based LLM feedback in PICO-8 games
 */
export class VisionFeedbackSystem {
  private openai: OpenAI
  private config: LLMConfig
  private captureDir: string
  private captureCount: number = 0
  private screenCapture: ScreenCapture | null = null
  private inputCommands: InputCommands
  private runHistory: string[] = []

  /**
   * Creates a new vision feedback system
   */
  constructor() {
    const envConfig = getConfig()

    // Check for API key in environment (shell environment takes precedence)
    // Using bracket notation for process.env as required by TypeScript
    const apiKey = process.env['OPENAI_API_KEY'] || envConfig['OPENAI_API_KEY'] || ''
    
    // Ensure we have an API key
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required (either in .env file or shell environment)')
    }

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey, // Will use the API key from environment
    })

    // Set up configuration
    this.config = {
      apiKey,
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
    
    logger.info('Vision feedback system initialized')
  }

  /**
   * Process a single game screen capture and get LLM analysis
   * @param customPrompt Optional custom prompt to send with the image
   * @returns The LLM response and image path
   */
  async processGameScreen(customPrompt?: string): Promise<{
    response: LLMVisionResponse | null, 
    imagePath: string | null
  }> {
    try {
      // Take a screenshot
      const imagePath = await this.captureScreen()
      
      if (!imagePath) {
        logger.warn('Failed to capture screenshot')
        return { response: null, imagePath: null }
      }

      // Get feedback from LLM
      const feedback = await this.analyzeCapturedImage(
        imagePath, 
        customPrompt || 'Analyze this PICO-8 game screen and provide feedback.'
      )
      
      return { response: feedback, imagePath }
    } catch (error) {
      logger.error(`Error processing game screen: ${error instanceof Error ? error.message : String(error)}`)
      return { response: null, imagePath: null }
    }
  }

  /**
   * Run a simple vision feedback session with a fixed number of steps
   * @param steps Number of capture-analyze-respond steps to perform
   * @param captureDelayMs Delay between captures in milliseconds
   * @returns Summary of the session
   */
  async runSimpleSession(steps: number = 3, captureDelayMs: number = 2000): Promise<string> {
    logger.info(`Starting simple vision feedback session with ${steps} steps`)
    
    this.runHistory = []
    let sessionTimestamp = Date.now()
    let sessionSummary = `# PICO-8 Vision Feedback Session\n\nSession started: ${new Date(sessionTimestamp).toLocaleString()}\n\n`
    
    // Clear previous run markdown files
    const sessionFilePath = join(this.captureDir, `session_${sessionTimestamp}.md`)
    
    for (let i = 0; i < steps; i++) {
      logger.info(`Step ${i+1}/${steps}: Capturing and analyzing screen`)
      
      // Process game screen
      const { response, imagePath } = await this.processGameScreen()
      
      if (!response || !imagePath) {
        logger.warn(`Step ${i+1}/${steps}: Failed to process screen`)
        sessionSummary += `## Step ${i+1}: Failed\n\nUnable to capture or analyze screen.\n\n`
        continue
      }
      
      // Get relative path for markdown
      const relativeImagePath = imagePath.split('/').pop() || imagePath
      
      // Add to session summary
      sessionSummary += `## Step ${i+1}: Analysis\n\n`
      sessionSummary += `![Game Screen](${relativeImagePath})\n\n`
      sessionSummary += `### Feedback\n\n${response.feedback}\n\n`
      
      // Process commands if any
      if (response.commands && response.commands.length > 0) {
        sessionSummary += `### Commands\n\n`
        for (const command of response.commands) {
          sessionSummary += `- ${command.type} ${command.button}${command.duration ? ` for ${command.duration}ms` : ''}\n`
          
          // Execute the command
          try {
            await this.executeSingleCommand(command)
            sessionSummary += `  - ✅ Executed successfully\n`
          } catch (error) {
            sessionSummary += `  - ❌ Failed: ${error instanceof Error ? error.message : String(error)}\n`
          }
        }
        sessionSummary += '\n'
      }
      
      // Add step to history
      this.runHistory.push(sessionSummary)
      
      // Save current progress to file
      await fs.writeFile(sessionFilePath, sessionSummary)
      
      // Wait before next capture
      if (i < steps - 1) {
        await new Promise(resolve => setTimeout(resolve, captureDelayMs))
      }
    }
    
    // Final summary
    sessionSummary += `\n## Session Complete\n\nTotal steps: ${steps}\nSession ended: ${new Date().toLocaleString()}\n`
    
    // Save final result
    await fs.writeFile(sessionFilePath, sessionSummary)
    logger.info(`Session complete. Output saved to ${sessionFilePath}`)
    
    return sessionFilePath
  }

  /**
   * Analyze a captured image using the OpenAI Vision API
   * @param imagePath Path to the image file
   * @param promptText Text prompt to send with the image
   * @returns Structured response from the LLM
   */
  private async analyzeCapturedImage(
    imagePath: string, 
    promptText: string
  ): Promise<LLMVisionResponse | null> {
    try {
      // Get screenshot data as base64
      const imageData = await fs.readFile(imagePath)
      const base64Image = imageData.toString('base64')

      // Create message content with text and image
      const content: MessageContent = [
        { type: 'text', text: promptText },
        { 
          type: 'image_url', 
          image_url: { 
            url: `data:image/png;base64,${base64Image}`,
            detail: 'high'
          } 
        }
      ]
      
      // System message with the instructions
      const systemMessage = {
        role: 'system' as const,
        content: this.getSystemPrompt()
      }
      
      // User message with the content
      const userMessage = {
        role: 'user' as const,
        content
      }

      // Send request to OpenAI
      logger.info('Sending image to OpenAI for analysis')
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [systemMessage, userMessage],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        tools: [{ type: 'function', function: FUNCTION_SCHEMAS.analyzeGameState }],
      })

      // Process the response
      if (!response.choices || response.choices.length === 0) {
        logger.error('No choices returned in the response')
        return null
      }
      
      const message = response.choices[0]?.message
      
      if (!message) {
        logger.error('No message in response')
        return null
      }
      
      // Handle function calling response
      let feedback: LLMVisionResponse | null = null
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        const functionCall = message.tool_calls[0]
        
        if (functionCall && functionCall.function.name === 'analyzeGameState') {
          try {
            feedback = JSON.parse(functionCall.function.arguments) as LLMVisionResponse
          } catch (error) {
            logger.error(`Failed to parse function call arguments: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      }
      
      // If function calling didn't work, use the content as plain text
      if (!feedback && message.content) {
        feedback = {
          feedback: message.content
        }
      }

      return feedback
    } catch (error) {
      logger.error(`Error analyzing image: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  /**
   * Execute a single game command
   * @param command The command to execute
   */
  private async executeSingleCommand(command: LLMCommand): Promise<void> {
    logger.info(`Executing command: ${command.type} ${command.button}`)
    
    switch (command.type) {
      case 'press':
        await this.inputCommands.pressButton(command.button)
        break
      case 'release':
        await this.inputCommands.releaseButton(command.button)
        break
      case 'tap':
        await this.inputCommands.tapButton(command.button, command.duration)
        break
      default:
        throw new Error(`Unknown command type: ${command.type}`)
    }
  }

  /**
   * Capture a screenshot of the PICO-8 window
   * @returns Path to the captured image, or null if capture failed
   */
  private async captureScreen(): Promise<string | null> {
    try {
      // First, ensure the captures directory exists before anything else
      try {
        await fs.mkdir(this.captureDir, { recursive: true })
        logger.debug(`Ensured capture directory exists: ${this.captureDir}`)
      } catch (dirError) {
        logger.error(`Failed to create capture directory: ${dirError instanceof Error ? dirError.message : String(dirError)}`)
        // Try with an alternate location as fallback
        this.captureDir = './captures'
        await fs.mkdir(this.captureDir, { recursive: true })
        logger.info(`Using fallback capture directory: ${this.captureDir}`)
      }
      
      // Initialize screen capture if needed
      if (!this.screenCapture) {
        this.screenCapture = new ScreenCapture({
          interval: 1000, // Doesn't matter for one-time captures
          saveToDisk: true,
          outputDir: this.captureDir,
          imageFormat: 'png',
          imageQuality: 90,
          windowTitle: 'PICO-8',
          autoStopOnWindowClose: true,
          debug: false
        })
      }
      
      this.captureCount++
      const filename = `pico8_capture_${Date.now()}_${this.captureCount}.png`
      const imagePath = join(this.captureDir, filename)
      
      // Take the screenshot with protection against native module crashes
      let result;
      try {
        result = await this.screenCapture.captureScreen()
      } catch (captureError) {
        logger.error(`Screenshot capture failed with error: ${captureError instanceof Error ? captureError.message : String(captureError)}`)
        // If capture fails, try to create a blank image as a fallback
        try {
          // Create a simple 128x128 black image as fallback
          const blankBuffer = Buffer.from(
            await sharp({
              create: {
                width: 128,
                height: 128,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 }
              }
            })
            .png()
            .toBuffer()
          )
          result = { success: true, buffer: blankBuffer }
          logger.warn('Using blank image fallback due to capture failure')
        } catch (fallbackError) {
          logger.error(`Failed to create fallback image: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`)
          return null
        }
      }
      
      if (result?.success && result.buffer) {
        try {
          // Save buffer to file
          await fs.writeFile(imagePath, result.buffer)
          logger.debug(`Screenshot captured: ${imagePath}`)
          return imagePath
        } catch (writeError) {
          logger.error(`Failed to write screenshot to file: ${writeError instanceof Error ? writeError.message : String(writeError)}`)
          return null
        }
      } else {
        // Handle both success and error results
        const errorMessage = result && 'error' in result ? result.error : 'Unknown error';
        logger.error(`Failed to capture screenshot: ${errorMessage}`)
        return null
      }
    } catch (error) {
      logger.error(`Error in capture pipeline: ${error instanceof Error ? error.message : String(error)}`)
      return null
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