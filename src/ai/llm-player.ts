import type { GamePlayer } from '../types'
import type { Schema, SchemaType } from '../schema/utils'
import { generateText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import 'dotenv/config'

/**
 * Event emitted during LLM player operation
 */
export interface LLMPlayerEvent {
  type: 'thinking' | 'response' | 'error' | 'action'
  content: string
  data?: Record<string, unknown> | undefined
}

/**
 * Event handler for LLM player events
 */
export type LLMPlayerEventHandler = (event: LLMPlayerEvent) => void

/**
 * Options for the LLM player
 */
export interface LLMPlayerOptions {
  /**
   * Maximum number of retries for getting a valid action
   */
  maxRetries?: number
  
  /**
   * System prompt for the LLM
   */
  systemPrompt?: string

  /**
   * Event handler for LLM player events
   */
  onEvent?: LLMPlayerEventHandler
}

export class LLMPlayer implements GamePlayer {
  private chatHistory: string[] = []
  private options: Required<LLMPlayerOptions>
  private onEvent: LLMPlayerEventHandler
  private model = openai('gpt-4o', { structuredOutputs: true })
  
  constructor(options: LLMPlayerOptions) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      systemPrompt: options.systemPrompt || 'You are playing a text-based game. Analyze the game state and take the most appropriate action.',
      onEvent: options.onEvent || (() => {})
    }
    
    this.onEvent = this.options.onEvent
  }
  
  /**
   * Get an action from the LLM player based on game output and action schemas
   * 
   * @param gameOutput Text description of current game state
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Promise resolving with a tuple of action name and the corresponding action data
   */
  async getAction<T extends Record<string, Schema<unknown>>>(
    gameOutput: string,
    actionSchemas: T
  ): Promise<[keyof T, SchemaType<T[keyof T]>]> {
    this.chatHistory.push(gameOutput)
    
    this.emitEvent('thinking', 'Analyzing game state and choosing action...')
    
    try {
      // Create the reflection tool for providing feedback
      const reflectTool = tool({
        description: 'Tool for reflecting on the current game state and your plan.',
        parameters: z.object({
          thoughts: z.string().describe('Your analysis of the current game state and reasoning about what to do next')
        }),
        execute: async ({ thoughts }: { thoughts: string }) => {
          this.emitEvent('thinking', thoughts)
          return 'Analysis received. Now choose an action to take.'
        }
      })
      
      // Create a combined action schema that contains a command field
      // and individual parameter fields for each action
      const commandEnum = z.enum(Object.keys(actionSchemas) as [string, ...string[]]);
      
      // Create a specific parameter schema with one field for each action
      const parameterSchemas: Record<string, z.ZodType<unknown>> = {};
      Object.keys(actionSchemas).forEach(key => {
        parameterSchemas[key] = actionSchemas[key];
      });
      
      // Let's completely simplify - use a known working pattern
      const combinedActionSchema = z.object({
        command: commandEnum.describe('The action command to execute'),
        // Create a simple primitive parameter
        text: z.string().describe('Additional information for the command')
      })
      
      // Create the action tool using the combined schema
      // We need an execute function to satisfy TypeScript
      const actionTool = tool({
        description: 'Tool for selecting a game action to perform.',
        parameters: combinedActionSchema,
        execute: async () => "Action selected"
      })
      
      // Call the AI to generate a response
      const { toolCalls } = await generateText({
        model: this.model,
        temperature: 0.2,
        tools: {
          reflect: reflectTool,
          action: actionTool
        },
        toolChoice: { type: 'tool', tool: 'action' }, // Force the action tool
        maxSteps: 5,
        system: this.options.systemPrompt,
        prompt: gameOutput
      })
      
      // Log the tool calls for debugging
      console.log("Tool calls:", JSON.stringify(toolCalls, null, 2))
      
      // Get the last tool call that is an action (not a reflection)
      const actionCall = toolCalls.find(call => call.toolName === 'action')
      
      if (!actionCall) {
        throw new Error('No valid action was selected by the LLM')
      }
      
      // Extract the command and parameters
      const { command, text } = actionCall.args
      
      // Validate the parameters against the corresponding schema
      const selectedSchema = actionSchemas[command as keyof T]
      if (!selectedSchema) {
        throw new Error(`Unknown action command: ${command}`)
      }
      
      // For a simple implementation, use the text as the parameter
      // The real implementation should parse the text into a more structured format
      const params = { text }
      const validatedParams = selectedSchema.parse(params)
      
      this.emitEvent('action', `Selected action: ${command}`, { command, data: validatedParams })
      
      return [command as keyof T, validatedParams as SchemaType<T[keyof T]>]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.emitEvent('error', `Error selecting action: ${errorMessage}`)
      throw error
    }
  }
  
  /**
   * Get the chat history
   */
  getChatHistory(): string[] {
    return [...this.chatHistory]
  }
  
  /**
   * Emit an event to the registered handler
   */
  private emitEvent(type: LLMPlayerEvent['type'], content: string, data?: Record<string, unknown>): void {
    this.onEvent({ type, content, data })
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clear the chat history
    this.chatHistory = []
  }
}