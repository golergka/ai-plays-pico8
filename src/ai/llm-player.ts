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
      
      // Create a discriminated union schema of all action schemas
      // For each schema, add a type field with the action name
      const actionTypes = Object.keys(actionSchemas) as [string, ...string[]];
      
      // Create a discriminated union of all schemas
      const unionSchemas = actionTypes.map(actionType => {
        // Get the original schema
        const originalSchema = actionSchemas[actionType];
        
        // Create a new schema that extends the original with a type field
        return z.object({
          type: z.literal(actionType),
          // The rest of the properties come from the original schema
          // We'll cast the schema to handle any type as needed
          ...originalSchema.shape as Record<string, z.ZodTypeAny>,
        });
      }) as [z.ZodObject<any>, ...z.ZodObject<any>[]];
      
      // Combine them into a discriminated union
      const actionUnionSchema = z.discriminatedUnion('type', unionSchemas);
      
      // Create the action tool using the combined schema
      const actionTool = tool({
        description: 'Tool for selecting a game action to perform.',
        parameters: actionUnionSchema,
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
        maxSteps: 5,
        system: this.options.systemPrompt,
        prompt: gameOutput
      })
      
      // Get the last tool call that is an action (not a reflection)
      const actionCall = toolCalls.find(call => call.toolName === 'action')
      
      if (!actionCall) {
        throw new Error('No valid action was selected by the LLM')
      }
      
      // Extract the command type and the rest of the parameters
      const { type, ...parameters } = actionCall.args
      
      // Validate the parameters against the corresponding schema
      const selectedSchema = actionSchemas[type as keyof T]
      if (!selectedSchema) {
        throw new Error(`Unknown action command: ${type}`)
      }
      
      const validatedParams = selectedSchema.parse(parameters)
      
      this.emitEvent('action', `Selected action: ${type}`, { command: type, data: validatedParams })
      
      return [type as keyof T, validatedParams as SchemaType<T[keyof T]>]
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