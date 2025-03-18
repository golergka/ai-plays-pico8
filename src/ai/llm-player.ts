import type { GamePlayer, ActionSchemas } from '../types'
import type { Schema } from '../schema/utils'
import { z } from 'zod'
import { callOpenAI, type Message, type ToolDefinition } from './api'
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
   * Model to use
   */
  model?: string

  /**
   * Event handler for LLM player events
   */
  onEvent?: LLMPlayerEventHandler
}

/**
 * LLM-based game player implementation
 * 
 * IMPORTANT: This class MUST remain completely game-agnostic.
 * It should NEVER contain any game-specific logic, hardcoded actions,
 * or assumptions about specific game mechanics.
 * 
 * All game-specific handling should be done at the schema level by the caller.
 */
export class LLMPlayer implements GamePlayer {
  private chatHistory: Message[] = []
  private options: Required<LLMPlayerOptions>
  private onEvent: LLMPlayerEventHandler
  
  constructor(options: LLMPlayerOptions) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      systemPrompt: options.systemPrompt || 'You are playing a game. Analyze the game state and take the most appropriate action.',
      model: options.model || 'gpt-4o',
      onEvent: options.onEvent || (() => {})
    }
    
    this.onEvent = this.options.onEvent
    
    // Initialize chat history with system message
    this.chatHistory = [
      {
        role: 'system',
        content: this.options.systemPrompt
      }
    ]
  }
  
  /**
   * Get an action from the LLM player based on game output and action schemas
   * 
   * @param gameOutput Text description of current game state
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Promise resolving with a tuple of action name and the corresponding action data
   */
  async getAction<T extends ActionSchemas>(
    gameOutput: string,
    actionSchemas: T
  ): Promise<[keyof T, T[keyof T] extends Schema<infer U> ? U : never]> {
    // DEBUGGING: Create a schema where each command is a property
    // Don't use the provided actionSchemas at all
    
    try {
      // Add game output to chat history
      this.chatHistory.push({
        role: 'user',
        content: gameOutput
      })
      
      this.emitEvent('thinking', 'Analyzing game state...')
      
      // Create a simple schema for testing
      // Later we will use the actual actionSchemas param
      const actionSchema = z.object({
        action: z.enum(['look', 'take', 'move'])
      })
      
      // Simple tool schema for testing
      const toolSchemas = {
        'action': actionSchema
      }
      
      // Define tool with schema
      const tools: ToolDefinition<typeof actionSchema>[] = [
        {
          name: 'action',
          description: 'Tool for selecting a game action to perform.',
          schema: actionSchema
        }
      ]
      
      // Call OpenAI with structured parameters and schemas
      try {
        const result = await callOpenAI({
          model: this.options.model,
          messages: this.chatHistory,
          tools,
          toolSchemas,
          toolChoice: {
            type: 'function',
            function: {
              name: 'action'
            }
          }
        })
        
        console.log("DEBUG: OpenAI API result:", JSON.stringify(result, null, 2))
        
        // Tool call is now directly available with correct typing
        if (result.toolCall && result.toolName) {
          console.log("DEBUG: Tool call:", JSON.stringify(result.toolCall, null, 2))
          
          // Add assistant response to chat history
          this.chatHistory.push({
            role: 'assistant',
            content: null,
            // In a real implementation, we would add the tool_calls here
          })
          
          // In a real implementation, we would properly handle the result
          // instead of exiting
          process.exit(0)
        }
        
        // No tool call, just text response
        if (result.content) {
          this.emitEvent('response', result.content)
          this.chatHistory.push({
            role: 'assistant',
            content: result.content
          })
        }
        
        // Exit after printing the response
        process.exit(0)
      } catch (e) {
        console.log("DEBUG: Direct API call error:", e)
        // In a real implementation, we would try a different approach
        // or return an error
        process.exit(1)
      }
      
      // We should never reach here because process.exit(0) is called
      // Return a dummy action to satisfy the type system
      const firstActionType = Object.keys(actionSchemas)[0] as keyof T
      return [
        firstActionType, 
        {} as T[keyof T] extends Schema<infer U> ? U : never
      ]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.emitEvent('error', `Error selecting action: ${errorMessage}`)
      throw error
    }
  }
  
  /**
   * Get the chat history
   */
  getChatHistory(): Message[] {
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