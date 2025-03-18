import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import type { JsonSchema7Type } from 'zod-to-json-schema'

/**
 * Convert a Zod schema to JSON Schema for LLM function calling
 * 
 * @param schema Zod schema to convert
 * @param name Optional name for the schema
 * @param description Optional description for the schema
 * @returns JSON Schema compatible with LLM function calling
 */
export function toJsonSchema(
  schema: z.ZodType<unknown>,
  name?: string,
  description?: string
): JsonSchema7Type {
  return zodToJsonSchema(schema, {
    $refStrategy: 'none',
    basePath: ['components', 'schemas'],
    name,
    definitions: {},
    target: 'jsonSchema7',
    ...(description ? { description } : {})
  })
}

/**
 * Parse and validate data against a Zod schema
 * 
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Parsed and validated data
 */
export function parseSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): T {
  return schema.parse(data)
}

/**
 * Try to parse and validate data against a Zod schema
 * Returns null if validation fails
 * 
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Parsed and validated data or null if validation fails
 */
export function safeParseSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Create a function schema for LLM function calling
 * 
 * @param name Function name
 * @param description Function description
 * @param parameters Zod schema for function parameters
 * @returns Function schema for LLM function calling
 */
export function createFunctionSchema(
  name: string,
  description: string,
  parameters: z.ZodType<unknown>
): {
  name: string
  description: string
  parameters: JsonSchema7Type
} {
  return {
    name,
    description,
    parameters: toJsonSchema(parameters)
  }
}

/**
 * Combines schemas into a single object schema compatible with OpenAI's function calling API.
 * The returned schema enforces that exactly one valid command is provided.
 * 
 * @param schemas Record of schemas where the key is the action type
 * @returns Zod object schema compatible with OpenAI's function calling API
 */
export function combineSchemas<T extends Record<string, Schema<unknown>>>(
  schemas: T
): z.ZodType<any, any, any> {
  // Create an object schema where each property is a command
  const commandProperties: Record<string, z.ZodTypeAny> = {};
  
  // For each command schema, create an optional property in our object
  for (const [commandName, schema] of Object.entries(schemas)) {
    // Only one command should be provided at a time
    commandProperties[commandName] = schema.optional().describe(
      `Execute a '${commandName}' command with its required parameters. Only provide one command at a time.`
    );
  }
  
  // If no schemas provided, add a placeholder
  if (Object.keys(commandProperties).length === 0) {
    commandProperties['none'] = z.object({}).optional().describe('No available commands');
  }
  
  // Create the base object schema
  const baseSchema = z.object(commandProperties);
  
  // Enhance the schema with additional validation
  return baseSchema
    .superRefine((data, ctx) => {
      // Get the commands that have values (not undefined)
      const providedCommands = Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([key, _]) => key);
      
      // No commands provided - invalid
      if (providedCommands.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'You must provide exactly one command',
          path: []
        });
        return;
      }
      
      // Multiple commands provided - invalid
      if (providedCommands.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `You provided multiple commands (${providedCommands.join(', ')}), but must provide exactly one`,
          path: []
        });
        return;
      }
      
      // Command not in schema - invalid
      const validCommandNames = Object.keys(commandProperties);
      const commandName = providedCommands[0];
      
      if (commandName !== undefined && !validCommandNames.includes(commandName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid command: '${commandName}'. Valid commands are: ${validCommandNames.join(', ')}`,
          path: [commandName]
        });
      }
    })
    .describe('Provide exactly ONE command by setting only one of these properties with the required parameters for that command.');
}

/**
 * Extract action data from our combined object schema result
 * 
 * @param data The parsed result from the combined schema
 * @returns Tuple of [action type, extracted action data]
 */
export function extractActionFromDiscriminatedUnion<T extends Record<string, Schema<unknown>>>(
  data: Record<string, unknown>
): [keyof T, Record<string, unknown>] {
  // Find the first non-undefined property (which should be the only one provided)
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined properties
    if (value === undefined) continue;
    
    // We found the command property with value
    const commandKey = key as keyof T;
    // Return the command type and its data
    return [commandKey, value as Record<string, unknown>];
  }
  
  // If no command found, throw an error
  throw new Error('No command was provided in the action data');
}

/**
 * Export Zod for schema definitions
 */
export { z }

/**
 * Type of a Zod schema
 */
export type Schema<T> = z.ZodType<T>

/**
 * Type of an instance of a schema
 */
export type SchemaType<T extends z.ZodType<unknown>> = z.infer<T>

/**
 * Type helper to extract the action name and payload from a schema map
 */
export type ActionFromSchemas<T extends Record<string, Schema<unknown>>> = {
  [K in keyof T]: [K, SchemaType<T[K]>]
}[keyof T]