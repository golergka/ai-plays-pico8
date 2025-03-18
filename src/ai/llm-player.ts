import type { GamePlayer } from '../types'
import type { Schema, SchemaType } from '../schema/utils'
import { toJsonSchema } from '../schema/utils'

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
   * Timeout in milliseconds for getting a valid action
   */
  timeout?: number
  
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
}

/**
 * Mock response for simulating LLM interactions during development
 */
const MOCK_RESPONSES = [
  'I need to think about what to do next...',
  'Let me examine the current room...',
  '{"function": "look", "args": {}}',
  'This room has a key! I should take it.',
  '{"function": "take", "args": {"item": "key"}}',
  'Now I should move north to explore further.',
  '{"function": "move", "args": {"direction": "north"}}',
  'I should check what items I have collected.',
  '{"function": "inventory", "args": {}}',
  'I need to examine the north door.',
  '{"function": "examine", "args": {"target": "north door"}}',
  'I should use the key on the north door.',
  '{"function": "use", "args": {"item": "key", "target": "north door"}}',
  'Now I can move north through the unlocked door.',
  '{"function": "move", "args": {"direction": "north"}}',
  'Let me see what\'s in this room.',
  '{"function": "look", "args": {}}',
  'I should take the treasure!',
  '{"function": "take", "args": {"item": "treasure"}}'
]

/**
 * Simple mock LLM implementation for development
 */
class MockLLM {
  private responseIndex = 0

  async send(_prompt: string): Promise<string> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return the next mock response
    const index = this.responseIndex % MOCK_RESPONSES.length
    const response = MOCK_RESPONSES[index]
    this.responseIndex++
    // We know response exists because we're using a modulo operation
    return response as string
  }
}

/**
 * LLM player implementation.
 * Maintains stateful chat history and handles LLM interaction.
 * Uses function calling pattern where the LLM responds with a JSON structure:
 * { "function": "<actionName>", "args": <json> }
 */
export class LLMPlayer implements GamePlayer {
  private chatHistory: string[] = []
  private maxRetries: number
  private timeout: number
  private systemPrompt = ""
  private onEvent: LLMPlayerEventHandler | null = null
  private mockLLM = new MockLLM()
  
  /**
   * Create a new LLM player
   * 
   * @param options Optional configuration options
   */
  constructor(options: LLMPlayerOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3
    this.timeout = options.timeout ?? 30000
    const defaultPrompt = "You are an AI playing a text adventure game. " +
      "Respond with a function call in the format: " +
      "{ \"function\": \"<actionName>\", \"args\": <json> }. " +
      "You may think through your decisions in plain text before providing the function call."
    
    this.systemPrompt = options.systemPrompt ?? defaultPrompt
    this.onEvent = options.onEvent || null
    
    // Initialize chat history with system prompt
    this.chatHistory.push(`system: ${this.systemPrompt}`)
  }
  
  /**
   * Emit an event to the event handler if one is set
   */
  private emitEvent(event: LLMPlayerEvent): void {
    // Only call the event handler if it's not null
    if (this.onEvent) {
      this.onEvent(event)
    }
  }
  
  /**
   * Convert Zod schemas to plain JSON definitions for the LLM
   * 
   * @param actionSchemas Map of action names to schemas
   * @returns JSON definitions of the schemas
   */
  private schemaToJson<T extends Record<string, Schema<any>>>(
    actionSchemas: T
  ): Record<string, any> {
    return Object.entries(actionSchemas).reduce(
      (acc, [key, schema]) => {
        acc[key] = toJsonSchema(schema)
        return acc
      },
      {} as Record<string, any>
    )
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
    // Add game state to chat history
    this.chatHistory.push(`game state: ${gameOutput}`)
    
    // Create a prompt with available actions and instructions
    const schemaDefinitions = this.schemaToJson(actionSchemas)
    const prompt = `available actions: ${JSON.stringify(schemaDefinitions)}. 
respond as a function call: {"function": "<actionName>", "args": <json>}. 
if you're thinking through your decision, just output plain text and I'll wait for your final answer.`
    
    this.chatHistory.push(`system: ${prompt}`)
    
    // Create a promise that resolves when we get a valid action
    const actionPromise = this.getActionWithRetries(actionSchemas)
    
    // Create a promise that rejects when the timeout is reached
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        this.emitEvent({
          type: 'error',
          content: `Timeout of ${this.timeout}ms exceeded waiting for LLM response`
        })
        reject(new Error(`Timeout of ${this.timeout}ms exceeded waiting for LLM response`))
      }, this.timeout)
    })
    
    // Race the two promises
    return Promise.race([actionPromise, timeoutPromise])
  }
  
  /**
   * Get an action with retries
   * 
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Promise resolving with a tuple of action name and the corresponding action data
   */
  private async getActionWithRetries<T extends Record<string, Schema<any>>>(
    actionSchemas: T
  ): Promise<[keyof T, SchemaType<T[keyof T]>]> {
    let retries = 0
    
    while (retries < this.maxRetries) {
      try {
        // Send the prompt to the mock LLM
        const response = await this.mockLLM.send(this.chatHistory.join('\n'))
        
        // Add the response to chat history regardless of validity
        this.chatHistory.push(`assistant: ${response}`)
        
        // Try parsing the response as a function call
        let functionCall: { function?: string; args?: any }
        
        try {
          functionCall = JSON.parse(response.trim())
          this.emitEvent({
            type: 'response',
            content: response,
            data: functionCall
          })
        } catch (err) {
          // Not valid JSON, treat as thinking aloud and continue
          this.emitEvent({
            type: 'thinking',
            content: response
          })
          retries++
          continue
        }
        
        // Check if the function call structure is valid
        if (!functionCall.function || typeof functionCall.args === "undefined") {
          this.emitEvent({
            type: 'thinking',
            content: "LLM thinking aloud, waiting for valid function call..."
          })
          retries++
          continue
        }
        
        // Check if the function name exists in action schemas
        const actionName = functionCall.function as keyof T
        const schema = actionSchemas[actionName]
        
        if (!schema) {
          this.emitEvent({
            type: 'error',
            content: `Function name "${String(actionName)}" not found in action schemas, retrying...`
          })
          retries++
          continue
        }
        
        // Parse and validate the arguments
        const parseResult = schema.safeParse(functionCall.args)
        
        if (!parseResult.success) {
          this.emitEvent({
            type: 'error',
            content: `Invalid function arguments: ${parseResult.error}`
          })
          retries++
          continue
        }
        
        // Emit the successful action
        this.emitEvent({
          type: 'action',
          content: `Taking action: ${String(actionName)}`,
          data: {
            action: actionName,
            args: parseResult.data
          }
        })
        
        // Return the valid action
        return [actionName, parseResult.data]
      } catch (error) {
        this.emitEvent({
          type: 'error',
          content: `Error getting action from LLM: ${error}`
        })
        retries++
      }
    }
    
    throw new Error(`Failed to get valid action after ${this.maxRetries} retries`)
  }
  
  /**
   * Get the chat history
   */
  getChatHistory(): string[] {
    return [...this.chatHistory]
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // No resources to cleanup
  }
}