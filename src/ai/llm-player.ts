import type { GamePlayer, ActionSchemas } from '../types'
import type { Schema } from '../schema/utils'
// Comment out unused imports for debugging
// import { combineSchemas, extractAction } from '../schema/utils'
// import { generateText } from 'ai'
// import { openai } from '@ai-sdk/openai'
import { callOpenAI } from './api'
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
  private chatHistory: string[] = []
  private options: Required<LLMPlayerOptions>
  private onEvent: LLMPlayerEventHandler
  // private model = openai('gpt-4o', { structuredOutputs: true })
  
  constructor(options: LLMPlayerOptions) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      systemPrompt: options.systemPrompt || 'You are playing a game. Analyze the game state and take the most appropriate action.',
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
  async getAction<T extends ActionSchemas>(
    gameOutput: string,
    actionSchemas: T
  ): Promise<[keyof T, T[keyof T] extends Schema<infer U> ? U : never]> {
    // DEBUGGING: Create a schema where each command is a property
    // Don't use the provided actionSchemas at all
    
    try {
      console.log("DEBUG: Creating direct schema object for OpenAI function calling")
      
      // Create a simple schema with command properties
      const directSchema = {
        type: "object",
        properties: {
          move: {
            type: "object",
            properties: {
              direction: {
                type: "string",
                enum: ["north", "south", "east", "west"],
                description: "Direction to move"
              }
            },
            required: ["direction"],
            description: "Move in a direction"
          },
          look: {
            type: "object",
            properties: {},
            description: "Look around the current area"
          },
          take: {
            type: "object",
            properties: {
              item: {
                type: "string",
                description: "Item to take"
              }
            },
            required: ["item"],
            description: "Take an item"
          }
        },
        required: ["move", "look", "take"]
      }
      
      console.log("DEBUG: Direct schema:", JSON.stringify(directSchema, null, 2))
      
      // Create a simpler schema for testing
      const simpleSchema = {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["look"],
            description: "Action to perform"
          }
        },
        required: ["action"]
      }
      
      console.log("DEBUG: Simple schema:", JSON.stringify(simpleSchema, null, 2))
      
      // Call the OpenAI API using our abstracted function
      try {
        const requestBody = {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are playing a game. Select an action to perform."
            },
            {
              role: "user",
              content: gameOutput + '\n\nChoose the "look" action to examine your surroundings.'
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "action",
                description: "Tool for selecting a game action to perform.",
                parameters: simpleSchema
              }
            }
          ],
          tool_choice: {
            type: "function",
            function: {
              name: "action"
            }
          }
        };
        
        const responseData = await callOpenAI(requestBody);
        console.log("DEBUG: OpenAI API direct response:", JSON.stringify(responseData, null, 2));
        
        // Check if there's a tool call in the response
        if (responseData?.choices?.[0]?.message?.tool_calls?.[0]) {
          const toolCall = responseData.choices[0].message.tool_calls[0];
          console.log("DEBUG: Tool call function:", JSON.stringify(toolCall.function, null, 2));
          
          // Parse the arguments
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.log("DEBUG: Parsed arguments:", JSON.stringify(args, null, 2));
          } catch (e) {
            console.log("DEBUG: Error parsing arguments:", e);
          }
        }
        
        // Exit after printing the response
        process.exit(0);
      } catch (e) {
        console.log("DEBUG: Direct API call error:", e);
      }
      
      // We should never reach here because process.exit(0) is called
      console.log("DEBUG: Execution continued past OpenAI API call")
      
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
  
  // For debugging only - this method is not used in the current implementation
  
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