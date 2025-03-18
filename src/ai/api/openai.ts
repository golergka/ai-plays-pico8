import 'dotenv/config'
import { z } from 'zod'
import { toJsonSchema } from '../../schema/utils'
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
 * Tool definition with Zod schema
 */
export interface ToolDefinition<T extends z.ZodType> {
  name: string
  description: string
  schema: T
}

/**
 * Tool choice for OpenAI API (internal format)
 * 
 * @internal This is the format expected by the OpenAI API, not to be used directly
 */
export type OpenAIToolChoice = 
  | 'auto' 
  | 'none' 
  | { type: 'function'; function: { name: string } }

/**
 * Input parameters for OpenAI API call
 */
export interface OpenAICallParams<T extends Record<string, z.ZodType>> {
  model: string
  messages: Message[]
  tools: {
    definitions: ToolDefinition<z.ZodType>[]
    schemas: T
    choice?: 'auto' | 'none' | keyof T
  }
  temperature?: number
  maxTokens?: number
}

// ======== Output Types ========

/**
 * Base schema for OpenAI tool calls
 */
const BaseToolCallSchema = z.object({
  id: z.string(),
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    arguments: z.string()
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
      tool_calls: z.array(BaseToolCallSchema).optional()
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
 * Simplified OpenAI response for easier consumption
 */
export interface OpenAIResult<T = unknown> {
  // Text content of the response, if any
  content: string | null
  
  // Tool call, if any (at most one allowed)
  toolCall: T | null
  
  // Tool name that was called
  toolName: string | null
  
  // Usage statistics
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Create a tool object for OpenAI API from a ToolDefinition
 * 
 * @param toolDef The tool definition with Zod schema
 * @returns Tool object formatted for OpenAI API
 */
function createOpenAITool(toolDef: ToolDefinition<z.ZodType>): { type: 'function'; function: { name: string; description: string; parameters: JsonSchema7Type } } {
  return {
    type: 'function',
    function: {
      name: toolDef.name,
      description: toolDef.description,
      parameters: toJsonSchema(toolDef.schema)
    }
  }
}

/**
 * Create a discriminated union schema from tool definitions
 * 
 * @param toolSchemas Record of tool schemas by name
 * @returns Zod schema that can parse any of the tools
 */
function createToolCallSchema<T extends Record<string, z.ZodType>>(
  toolSchemas: T
): z.ZodType<{ name: keyof T } & { arguments: z.infer<T[keyof T]> }> {
  // Create an array of schemas, one for each tool
  const schemaArray = Object.entries(toolSchemas).map(([name, schema]) => {
    return z.object({
      name: z.literal(name),
      arguments: schema
    })
  })
  
  // Union them together
  // Handle the case when there are 0 or 1 schemas
  if (schemaArray.length === 0) {
    // Make a dummy schema that will never actually match but satisfies the type
    return z.object({
      name: z.literal('__never__'),
      arguments: z.object({})
    }) as any
  } else if (schemaArray.length === 1) {
    return schemaArray[0] as any
  }
  
  // Cast to unknown first to avoid TS error with the array spread
  return z.union(schemaArray as unknown as [z.ZodType, z.ZodType, ...z.ZodType[]])
}

/**
 * Call the OpenAI API with structured parameters
 * 
 * @param params Structured parameters for the API call
 * @returns A simplified response object with extracted and typed tool call
 */
export async function callOpenAI<T extends Record<string, z.ZodType>>(
  params: OpenAICallParams<T>
): Promise<OpenAIResult<z.infer<T[keyof T]>>> {
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
  
  // Add tools if specified
  let toolCallSchema: z.ZodType | null = null
  
  // Convert tools to OpenAI format
  body['tools'] = params.tools.definitions.map(createOpenAITool)
    
  // Add tool_choice if specified
  if (params.tools.choice) {
    if (params.tools.choice === 'auto' || params.tools.choice === 'none') {
      body['tool_choice'] = params.tools.choice
    } else {
      // Convert string tool name to OpenAI tool choice format
      body['tool_choice'] = {
        type: 'function',
        function: {
          name: params.tools.choice as string
        }
      }
    }
    
    // Create tool parsing schema from the provided schemas
    toolCallSchema = createToolCallSchema(params.tools.schemas)
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
  
  // Parse and validate the response structure with Zod
  let parsedResponse: RawOpenAIResponse
  
  try {
    parsedResponse = OpenAIResponseSchema.parse(rawResponse)
  } catch (error) {
    // Error will be thrown with a clear message
    throw new Error(`Invalid response from OpenAI API: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  // Extract the content and tool calls from the response
  const message = parsedResponse.choices[0]?.message
  
  // Create the simplified result object
  const result: OpenAIResult<z.infer<T[keyof T]>> = {
    content: message?.content ?? null,
    toolCall: null,
    toolName: null
  }
  
  // Add usage if available
  if (parsedResponse.usage) {
    result.usage = {
      promptTokens: parsedResponse.usage.prompt_tokens,
      completionTokens: parsedResponse.usage.completion_tokens,
      totalTokens: parsedResponse.usage.total_tokens
    }
  }
  
  // Extract tool call if present
  if (message?.tool_calls && message.tool_calls.length > 0) {
    if (message.tool_calls.length > 1) {
      console.warn(`OpenAI returned ${message.tool_calls.length} tool calls, but we only support one. Using the first.`)
    }
    
    const toolCall = message.tool_calls[0]
    
    // Safety check - this should never happen due to the array check above
    if (!toolCall) {
      console.warn("Tool call was undefined when it shouldn't be")
      return result
    }
    
    result.toolName = toolCall.function.name
    
    // Parse arguments if schema is available
    if (toolCallSchema && params.tools?.schemas) {
      try {
        const parsedArgs = JSON.parse(toolCall.function.arguments)
        
        // Check if the tool exists in our schemas
        const toolName = toolCall.function.name
        if (Object.keys(params.tools.schemas).includes(toolName)) {
          const schema = params.tools.schemas[toolName]
          
          // Safety check - this should never happen due to the includes check above
          if (!schema) {
            throw new Error(`Schema for tool ${toolName} is undefined`)
          }
          
          // Parse the args with the specific schema
          try {
            const validArgs = schema.parse(parsedArgs)
            result.toolCall = validArgs
          } catch (error) {
            // Error will be thrown with details
            throw new Error(`Invalid tool arguments: ${error instanceof Error ? error.message : String(error)}`)
          }
        } else {
          throw new Error(`Unknown tool called: ${toolName}`)
        }
      } catch (error) {
        // Error will be thrown with details
        throw new Error(`Invalid tool call arguments: ${error instanceof Error ? error.message : String(error)}`)
      }
    } else {
      // No schema available, just parse the JSON
      try {
        result.toolCall = JSON.parse(toolCall.function.arguments) as any
      } catch (error) {
        // Error will be thrown with details
        throw new Error(`Invalid tool call arguments: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
  
  return result
}