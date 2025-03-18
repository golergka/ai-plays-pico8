import type { GamePlayer } from '../types'
import type { Schema, SchemaType } from '../schema/utils'
import { generateText, tool } from 'ai'
import { z } from 'zod'
import 'dotenv/config'

/**
 * Event emitted during LLM player operation
 */
export interface LLMPlayerEvent {
  type: 'thinking' | 'response' | 'error' | 'action'
  content: string
  data?: any
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
   * LLM model to use
   */
  model?: string

  /**
   * Event handler for LLM player events
   */
  onEvent?: LLMPlayerEventHandler

  /**
   * Model provider (defaults to openai)
   */
  provider?: any
}

// Create a type for the tool call, approximating the structure from the AI library
interface ToolCall {
  toolName: string;
  args: any;
}

export class LLMPlayer implements GamePlayer {
  private chatHistory: string[] = []
  private options: Required<LLMPlayerOptions>
  private onEvent: LLMPlayerEventHandler
  
  constructor(options: LLMPlayerOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      systemPrompt: options.systemPrompt || 'You are playing a text-based game. Analyze the game state and take the most appropriate action.',
      model: options.model || 'gpt-4o',
      onEvent: options.onEvent || (() => {}),
      provider: options.provider
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
  async getAction<T extends Record<string, Schema<any>>>(
    gameOutput: string,
    actionSchemas: T
  ): Promise<[keyof T, SchemaType<T[keyof T]>]> {
    this.chatHistory.push(gameOutput)
    
    this.emitEvent('thinking', 'Analyzing game state and choosing action...')
    
    try {
      // Create tools for the LLM
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
      
      // For each action schema, create a separate tool
      const actionTools: Record<string, any> = {}
      const actionTypes = Object.keys(actionSchemas)
      
      for (const actionType of actionTypes) {
        const actionSchema = actionSchemas[actionType as keyof T]
        
        // We can't directly extend the Schema<any> type, so we recreate it as a Zod schema
        // by converting it to a tool and assigning it to the tools object
        actionTools[actionType] = tool({
          description: `Execute the ${actionType} action in the game.`,
          parameters: actionSchema as any,
        })
      }
      
      // Call the AI to generate a response
      const { toolCalls } = await generateText({
        model: this.options.provider 
          ? this.options.provider(this.options.model, { structuredOutputs: true }) 
          : undefined,
        temperature: 0.2,
        tools: {
          reflect: reflectTool,
          ...actionTools
        },
        toolChoice: 'required',
        maxSteps: 5,
        system: this.options.systemPrompt,
        prompt: gameOutput
      })
      
      // Find the last non-reflect tool call
      let lastActionCall: ToolCall | null = null
      
      if (toolCalls && toolCalls.length > 0) {
        for (let i = toolCalls.length - 1; i >= 0; i--) {
          const call = toolCalls[i]
          if (call && call.toolName !== 'reflect') {
            lastActionCall = call
            break
          }
        }
      }
      
      if (!lastActionCall) {
        throw new Error('No valid action was selected by the LLM')
      }
      
      const actionType = lastActionCall.toolName
      const actionData = lastActionCall.args
      
      this.emitEvent('action', `Selected action: ${actionType}`, { action: actionType, data: actionData })
      
      return [actionType as keyof T, actionData as SchemaType<T[keyof T]>]
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
  private emitEvent(type: LLMPlayerEvent['type'], content: string, data?: any): void {
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