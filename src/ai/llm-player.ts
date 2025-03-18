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
    try {
      // Add game output to chat history
      this.chatHistory.push({
        role: 'user',
        content: gameOutput
      })
      
      this.emitEvent('thinking', 'Analyzing game state...')
      
      // Convert each action schema into a separate tool definition
      const tools: ToolDefinition<z.ZodType>[] = []
      const toolSchemas: Record<string, z.ZodType> = {}
      
      // Process each action schema into a separate tool
      for (const [actionName, schema] of Object.entries(actionSchemas)) {
        // Schema is already a Zod schema (Schema<T> is just an alias for z.ZodType<T>)
        const zodSchema = schema
        tools.push({
          name: actionName,
          description: `Tool for performing the ${actionName} action`,
          schema: zodSchema
        })
        
        toolSchemas[actionName] = zodSchema
      }
      
      // Call OpenAI with structured parameters and schemas
      try {
        console.log("DEBUG: Calling OpenAI with tools:", JSON.stringify(tools.map(t => t.name), null, 2))
        
        const result = await callOpenAI({
          model: this.options.model,
          messages: this.chatHistory,
          tools: {
            definitions: tools,
            schemas: toolSchemas,
            choice: 'auto' // Let the AI choose which action to take
          }
        })
        
        console.log("DEBUG: OpenAI API result:", JSON.stringify(result, null, 2))
        
        // Tool call is now directly available with correct typing
        if (result.toolCall && result.toolName) {
          const actionName = result.toolName as keyof T
          const actionData = result.toolCall
          
          this.emitEvent('action', `Selected action: ${String(actionName)}`, { 
            action: actionName,
            args: actionData
          })
          
          // Add assistant response to chat history
          this.chatHistory.push({
            role: 'assistant',
            content: "", // Empty string instead of null to avoid API error
            // We'd ideally include tool_calls here but our Message type doesn't support it yet
          })
          
          return [
            actionName, 
            actionData as T[keyof T] extends Schema<infer U> ? U : never
          ]
        }
        
        // No tool call, just text response - this is an error case since we expect a tool call
        if (result.content) {
          this.emitEvent('response', result.content)
          this.chatHistory.push({
            role: 'assistant',
            content: result.content
          })
          
          throw new Error(`LLM returned text response instead of selecting an action: ${result.content}`)
        }
        
        throw new Error('LLM returned empty response without selecting an action')
      } catch (e: unknown) {
        // Log detailed error information
        console.error("DEBUG: Error in getAction:", e)
        console.error("DEBUG: Error details:", JSON.stringify({
          errorName: e instanceof Error ? e.name : 'Unknown',
          errorMessage: e instanceof Error ? e.message : String(e),
          errorStack: e instanceof Error ? e.stack : 'No stack trace'
        }, null, 2))
        
        // Try again with the next retry if available
        throw e
      }
      
      // We should never reach here but return a dummy action to satisfy the type system
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