import 'dotenv/config'
import { z } from 'zod'
import type { JsonSchema7Type } from 'zod-to-json-schema'

// ======== Input Types ========

/**
 * Valid message roles for OpenAI API
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

/**
 * Message schema for OpenAI API
 */
const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string().nullable(),
  name: z.string().optional()
})

/**
 * Message type for OpenAI API
 */
export type Message = z.infer<typeof MessageSchema>

/**
 * Function definition for OpenAI API
 */
export interface FunctionDefinition {
  name: string
  description: string
  parameters: JsonSchema7Type
}

/**
 * Tool definition for OpenAI API
 */
export interface Tool {
  type: 'function'
  function: FunctionDefinition
}

/**
 * Tool choice for OpenAI API
 */
export type ToolChoice = 
  | 'auto' 
  | 'none' 
  | { type: 'function'; function: { name: string } }

/**
 * Input parameters for OpenAI API call
 */
export interface OpenAICallParams {
  model: string
  messages: Message[]
  tools?: Tool[]
  toolChoice?: ToolChoice
  temperature?: number
  maxTokens?: number
}

// ======== Output Types ========

/**
 * Schema for OpenAI tool call
 */
const ToolCallSchema = z.object({
  id: z.string(),
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    arguments: z.string().transform((args, ctx) => {
      try {
        return JSON.parse(args)
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON in function arguments'
        })
        return {}
      }
    })
  })
})

/**
 * Schema for OpenAI response
 */
const OpenAIResponseSchema = z.object({
  id: z.string(),
  choices: z.array(z.object({
    message: z.object({
      role: z.string(),
      content: z.string().nullable(),
      tool_calls: z.array(ToolCallSchema).optional()
    })
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number()
  }).optional()
})

/**
 * Raw OpenAI response type
 */
type RawOpenAIResponse = z.infer<typeof OpenAIResponseSchema>

/**
 * Function call result from OpenAI
 */
export interface FunctionCall {
  name: string
  arguments: Record<string, any>
}

/**
 * Simplified OpenAI response for easier consumption
 */
export interface OpenAIResult {
  // Text content of the response, if any
  content: string | null
  
  // Function calls, if any
  functionCalls: FunctionCall[]
  
  // Usage statistics
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Call the OpenAI API with structured parameters
 * 
 * @param params Structured parameters for the API call
 * @returns A simplified response object with extracted function calls
 */
export async function callOpenAI(params: OpenAICallParams): Promise<OpenAIResult> {
  // Convert params to the format expected by the API
  const body: Record<string, any> = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
  }
  
  // Add max_tokens if specified
  if (params.maxTokens) {
    body['max_tokens'] = params.maxTokens
  }
  
  // Add tools and tool_choice if specified
  if (params.tools && params.tools.length > 0) {
    body['tools'] = params.tools
    if (params.toolChoice) {
      body['tool_choice'] = params.toolChoice
    }
  }
  
  // Call the API
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env['OPENAI_API_KEY']}`,
      "OpenAI-Organization": process.env['OPENAI_ORG_ID'] || ""
    },
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } })) as { error?: { message?: string } }
    throw new Error(`OpenAI API error (${response.status}): ${errorData?.error?.message || 'Unknown error'}`)
  }
  
  const rawResponse = await response.json()
  
  // Parse and validate the response with Zod
  let parsedResponse: RawOpenAIResponse
  
  try {
    parsedResponse = OpenAIResponseSchema.parse(rawResponse)
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error)
    console.error("Raw response:", JSON.stringify(rawResponse, null, 2))
    throw new Error(`Invalid response from OpenAI API: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  // Extract the content and function calls from the response
  const message = parsedResponse.choices[0]?.message
  
  // Create the simplified result object
  const result: OpenAIResult = {
    content: message?.content ?? null,
    functionCalls: []
  }
  
  // Add usage if available
  if (parsedResponse.usage) {
    result.usage = {
      promptTokens: parsedResponse.usage.prompt_tokens,
      completionTokens: parsedResponse.usage.completion_tokens,
      totalTokens: parsedResponse.usage.total_tokens
    }
  }
  
  // Extract function calls if present
  if (message?.tool_calls) {
    result.functionCalls = message.tool_calls.map(toolCall => ({
      name: toolCall.function.name,
      arguments: toolCall.function.arguments
    }))
  }
  
  return result
}