import 'dotenv/config'
import { z } from 'zod'
import { toJsonSchema } from '../../schema/utils'
import type { JsonSchema7Type } from 'zod-to-json-schema'
import OpenAI from 'openai';


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

export type Message = OpenAI.ChatCompletionMessageParam

/**
 * Input parameters for OpenAI API call
 */
export interface OpenAICallParams<T extends Record<string, z.ZodType>> {
  model: string
  messages: OpenAI.ChatCompletionMessageParam[]
  tools: {
    definitions: ToolDefinition<z.ZodType>[]
    schemas: T
    choice?: 'auto' | 'none' | keyof T
  }
  temperature?: number
}

/**
 * Simplified OpenAI response for easier consumption
 */
export interface OpenAIResult<T = unknown> {
  message: Message
  toolUse?: {
    callId: string;
    call: T
    name: string
  };
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

function outputMessageToInputMessage(
  message: OpenAI.Chat.Completions.ChatCompletionMessage
): Message {
  return {
    name: 'player',
    ...message,
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
  // Create properly typed request parameters
  const requestParams: OpenAI.ChatCompletionCreateParamsNonStreaming = {
    model: params.model,
    messages: params.messages,
    // temperature: params.temperature ?? 0.7,
    tools: params.tools.definitions.map(createOpenAITool),
    tool_choice: params.tools.choice === "auto" || params.tools.choice === "none" 
      ? params.tools.choice
      : {
          type: "function",
          function: {
            name: params.tools.choice as string,
          },
        }
  }

  console.log("Request params:", requestParams);

  // Create tool parsing schema from the provided schemas
  const toolCallSchema = params.tools.choice 
    ? createToolCallSchema(params.tools.schemas)
    : null;

  // Initialize OpenAI client
  const client = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"],
    organization: process.env["OPENAI_ORG_ID"],
  });

  // Call the API
  const rawResponse = await client.chat.completions.create(requestParams);

  // Parse and validate the response structure with Zod
  // Extract the content and tool calls from the response
  const message = rawResponse.choices[0]?.message;

  if (!message) {
    throw new Error("No message in the response");
  }

  // Create the simplified result object
  const result: OpenAIResult<z.infer<T[keyof T]>> = {
    message: outputMessageToInputMessage(message),
  };

  // Add usage if available
  if (rawResponse.usage) {
    result.usage = {
      promptTokens: rawResponse.usage.prompt_tokens,
      completionTokens: rawResponse.usage.completion_tokens,
      totalTokens: rawResponse.usage.total_tokens,
    };
  }

  // Extract tool call if present
  if (message?.tool_calls?.[0]) {
    const toolCall = message.tool_calls[0];

    // Parse arguments if schema is available
    if (toolCallSchema && params.tools?.schemas) {
      const parsedArgs = JSON.parse(toolCall.function.arguments);

      // Check if the tool exists in our schemas
      const toolName = toolCall.function.name;
      if (!Object.keys(params.tools.schemas).includes(toolName)) {
        throw new Error(`Unknown tool called: ${toolName}`);
      }

      const schema = params.tools.schemas[toolName];

      // Safety check - this should never happen due to the includes check above
      if (!schema) {
        throw new Error(`Schema for tool ${toolName} is undefined`);
      }

      // Parse the args with the specific schema
      try {
        const validArgs = schema.parse(parsedArgs);
        result.toolUse = {
          call: validArgs,
          name: toolName,
          callId: toolCall.id,
        };
      } catch (error) {
        // Error will be thrown with details
        throw new Error(
          `Invalid tool arguments: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { cause: error, }
        );
      }
    } else {
      // No schema available, just parse the JSON
      try {
        result.toolUse = {
          call: JSON.parse(toolCall.function.arguments),
          name: toolCall.function.name,
          callId: toolCall.id,
        };
      } catch (error) {
        // Error will be thrown with details
        throw new Error(
          `Invalid tool call arguments: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }
  
  return result
}
