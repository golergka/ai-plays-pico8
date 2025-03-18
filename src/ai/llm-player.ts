import type { GamePlayer, ActionSchemas } from '../types'
import type { Schema } from '../schema/utils'
import { combineSchemas, extractAction } from '../schema/utils'
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
  private model = openai('gpt-4o', { structuredOutputs: true })
  
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
      
      // Use combineSchemas to create a proper discriminated union schema
      // This creates a schema with a "type" field for discriminating between actions
      const combinedSchema = combineSchemas(actionSchemas)
      
      // Create the action tool using our dynamic schema
      const actionTool = tool({
        description: 'Tool for selecting a game action to perform.',
        parameters: combinedSchema,
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
        toolChoice: 'required',
        maxSteps: 5,
        system: this.options.systemPrompt + '\nYou MUST select an action with the action tool after reflecting. ALWAYS pick an action.',
        prompt: gameOutput
      })
      
      // Get all tool calls to analyze
      const reflectCalls = toolCalls.filter(call => call.toolName === 'reflect')
      const actionCalls = toolCalls.filter(call => call.toolName === 'action')
      
      // For debugging
      this.emitEvent('response', `Got ${toolCalls.length} tool calls: ${actionCalls.length} actions, ${reflectCalls.length} reflections`)
      
      // Get the last action call
      const actionCall = actionCalls.length > 0 ? actionCalls[actionCalls.length - 1] : null
      
      // If we don't have an action, we'll try again with forced action tool
      if (!actionCall) {
        this.emitEvent('response', 'No action selected, forcing action tool choice...')
        
        // Call the AI again but force it to use the action tool
        const retryResult = await generateText({
          model: this.model,
          temperature: 0.2,
          tools: {
            action: actionTool
          },
          // Force the AI to use the action tool
          toolChoice: { type: 'tool', toolName: 'action' },
          system: this.options.systemPrompt + '\nYou MUST select an appropriate action based on the game state.',
          prompt: gameOutput
        })
        
        // We should always get a result when forcing tool choice
        if (retryResult.toolCalls.length === 0) {
          throw new Error('Failed to get an action from the LLM even with forced tool choice')
        }
        
        // The toolCalls array should not be empty at this point
        const forcedActionCall = retryResult.toolCalls[0]
        
        // And the toolName should be 'action' since we forced it
        if (!forcedActionCall || forcedActionCall.toolName !== 'action') {
          throw new Error(`Expected action tool but got ${forcedActionCall?.toolName || 'undefined'}`)
        }
        
        this.emitEvent('response', 'Successfully forced action tool')
        
        // Use the forced action call
        return this.processActionCall({
          toolName: 'action',
          args: forcedActionCall.args || {}
        }, actionSchemas)
      }
      
      // Process the action call
      return this.processActionCall({
        toolName: actionCall.toolName,
        args: actionCall.args
      }, actionSchemas)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.emitEvent('error', `Error selecting action: ${errorMessage}`)
      throw error
    }
  }
  
  /**
   * Process a tool call and extract action data
   * 
   * @param actionCall The tool call to process
   * @param actionSchemas Map of action schemas
   * @returns Tuple of action name and validated parameters
   */
  private processActionCall<T extends ActionSchemas>(
    actionCall: { toolName: string, args: Record<string, any> },
    actionSchemas: T
  ): [keyof T, T[keyof T] extends Schema<infer U> ? U : never] {
    // Process the arguments through our combined schema
    const combinedSchema = combineSchemas(actionSchemas)
    const validatedData = combinedSchema.parse(actionCall.args)
    
    // Extract the action type and parameters
    const [actionType, actionParams] = extractAction<T>(validatedData)
    
    // Get the schema for this action type
    const schema = actionSchemas[actionType]
    
    if (!schema) {
      throw new Error(`Schema not found for action type: ${String(actionType)}`)
    }
    
    // Validate the parameters against the original schema
    const validatedParams = schema.parse(actionParams)
    
    this.emitEvent('action', `Selected action: ${String(actionType)}`, 
      { command: String(actionType), data: validatedParams })
    
    return [actionType, validatedParams as T[keyof T] extends Schema<infer U> ? U : never]
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