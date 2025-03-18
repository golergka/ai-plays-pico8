import 'dotenv/config'
import { z } from 'zod'

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
 * Typed version of OpenAI API response
 */
export type OpenAIToolCall = z.infer<typeof ToolCallSchema>

/**
 * Typed version of OpenAI API response
 */
export type OpenAIResponse = z.infer<typeof OpenAIResponseSchema>

/**
 * Simple function to call OpenAI API
 * Just extracts the fetch call that's working in LLMPlayer
 * 
 * @param body The request body to send to OpenAI
 * @returns The parsed and validated response from OpenAI
 */
export async function callOpenAI(body: Record<string, any>): Promise<OpenAIResponse> {
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
  try {
    return OpenAIResponseSchema.parse(rawResponse)
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error)
    console.error("Raw response:", JSON.stringify(rawResponse, null, 2))
    throw new Error(`Invalid response from OpenAI API: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Extract tool calls from OpenAI response
 * 
 * @param response The OpenAI response
 * @returns Array of tool calls with parsed arguments
 */
export function extractToolCalls(response: OpenAIResponse): OpenAIToolCall[] {
  if (!response.choices?.[0]?.message?.tool_calls) {
    return []
  }
  
  return response.choices[0].message.tool_calls
}