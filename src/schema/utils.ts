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
 * Combines action schemas into a single object schema compatible with OpenAI's function calling API.
 * The returned schema enforces that exactly one valid action is provided.
 * 
 * @param schemas Record of schemas where the key is the action type
 * @returns Zod schema compatible with OpenAI's function calling API
 */
export function combineSchemas<T extends Record<string, Schema<unknown>>>(
  schemas: T
): z.ZodType<any, any, any> {
  // Create an object schema where each property is an action
  const actionProperties: Record<string, z.ZodTypeAny> = {};
  
  // For each action schema, create an optional property in our object
  for (const [actionType, schema] of Object.entries(schemas)) {
    // Only one action should be provided at a time
    actionProperties[actionType] = schema.optional().describe(
      `Execute a '${actionType}' action with its required parameters. Only provide one action at a time.`
    );
  }
  
  // If no schemas provided, add a placeholder
  if (Object.keys(actionProperties).length === 0) {
    actionProperties['none'] = z.object({}).optional().describe('No available actions');
  }
  
  // Create the base object schema
  const baseSchema = z.object(actionProperties);
  
  // Enhance the schema with additional validation
  return baseSchema
    .superRefine((data, ctx) => {
      // Get the actions that have values (not undefined)
      const providedActions = Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([key, _]) => key);
      
      // No actions provided - invalid
      if (providedActions.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'You must provide exactly one action',
          path: []
        });
        return;
      }
      
      // Multiple actions provided - invalid
      if (providedActions.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `You provided multiple actions (${providedActions.join(', ')}), but must provide exactly one`,
          path: []
        });
        return;
      }
      
      // Action not in schema - invalid
      const validActionTypes = Object.keys(actionProperties);
      const actionType = providedActions[0];
      
      if (actionType !== undefined && !validActionTypes.includes(actionType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid action type: '${actionType}'. Valid actions are: ${validActionTypes.join(', ')}`,
          path: [actionType]
        });
      }
    })
    .describe('Provide exactly ONE action by setting only one of these properties with the required parameters for that action.');
}

/**
 * Extract action from the combined object schema result
 * 
 * @param data The parsed result from the combined schema
 * @returns Tuple of [action type, action parameters]
 */
export function extractAction<T extends Record<string, Schema<unknown>>>(
  data: Record<string, unknown>
): [keyof T, Record<string, unknown>] {
  // Find the first non-undefined property (which should be the only one provided)
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined properties
    if (value === undefined) continue;
    
    // We found the action property with value
    const actionType = key as keyof T;
    // Return the action type and its parameters
    return [actionType, value as Record<string, unknown>];
  }
  
  // If no action found, throw an error
  throw new Error('No action was provided in the data');
}

/**
 * @deprecated Use extractAction instead
 */
export const extractActionFromDiscriminatedUnion = extractAction;

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