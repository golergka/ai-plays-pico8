/**
 * Type definitions for LLM vision feedback system
 */

import { Pico8Button } from './input'

/**
 * Configuration for LLM vision feedback
 */
export interface LLMConfig {
  /** OpenAI API key (from environment) */
  apiKey: string
  /** OpenAI model to use for vision */
  model: string
  /** Maximum tokens to generate in response */
  maxTokens: number
  /** Temperature for response generation */
  temperature: number
  /** Interval between screenshot captures (ms) */
  captureInterval: number
}

/**
 * Response from LLM vision analysis
 */
export interface LLMVisionResponse {
  /** Textual description/feedback of what's happening in the game */
  feedback: string
  /** Optional commands to send to the game */
  commands?: LLMCommand[]
}

/**
 * Command from LLM to game
 */
export interface LLMCommand {
  /** Type of command */
  type: 'press' | 'release' | 'tap'
  /** Button to activate */
  button: Pico8Button
  /** Duration in ms (for tap commands) */
  duration?: number
}

/**
 * OpenAI message content types
 */
export type TextContent = {
  type: 'text'
  text: string
}

export type ImageContent = {
  type: 'image_url'
  image_url: {
    url: string
    detail: 'low' | 'high' | 'auto'
  }
}

export type MessageContent = TextContent | ImageContent | Array<TextContent | ImageContent>

/**
 * OpenAI message types
 */
export interface SystemMessage {
  role: 'system'
  content: string
}

export interface UserMessage {
  role: 'user'
  content: string | MessageContent
}

export interface AssistantMessage {
  role: 'assistant'
  content: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
}

export type ChatMessage = SystemMessage | UserMessage | AssistantMessage

/**
 * Function calling schemas for OpenAI API
 */
export const FUNCTION_SCHEMAS = {
  /** Schema for analyzing game state */
  analyzeGameState: {
    name: 'analyzeGameState',
    description: 'Analyze the current game state from the screenshot',
    parameters: {
      type: 'object',
      properties: {
        feedback: {
          type: 'string',
          description: 'Description of what is happening in the game screen'
        },
        commands: {
          type: 'array',
          description: 'Optional commands to send to the game',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['press', 'release', 'tap'],
                description: 'Type of button action'
              },
              button: {
                type: 'string',
                enum: ['left', 'right', 'up', 'down', 'o', 'x'],
                description: 'PICO-8 button to activate'
              },
              duration: {
                type: 'number',
                description: 'Duration in ms (for tap commands)'
              }
            },
            required: ['type', 'button']
          }
        }
      },
      required: ['feedback']
    }
  }
}