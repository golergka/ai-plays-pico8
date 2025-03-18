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
 * Combines schemas into a discriminated union with a 'type' field
 * This function takes a map of schemas and returns a combined schema
 * that includes a 'type' discriminator field.
 * 
 * @param schemas Record of schemas where the key is the action type
 * @returns Zod schema with discriminated union of all provided schemas
 */
export function combineSchemas<T extends Record<string, Schema<unknown>>>(
  schemas: T
): z.ZodDiscriminatedUnion<"type", [z.ZodObject<any, any, any>, ...z.ZodObject<any, any, any>[]]> {
  // Create a union array of schemas with type field
  const unionSchemas: z.ZodObject<any, any, any>[] = [];
  
  // Process each schema
  for (const [key, schema] of Object.entries(schemas)) {
    // For each schema, create a new schema with a 'type' field
    // Handle both object schemas and non-object schemas
    const schemaObj = schema instanceof z.ZodObject 
      ? schema as z.ZodObject<any, any, any>
      : z.object({});
      
    // Create a new schema object with the type field
    // We can't use extend() or merge() safely as they're not guaranteed to work
    // on all schema types, so we create a new object schema manually
    const baseShape = schemaObj.shape || {};
    
    // Create the extended schema with type field
    const extendedSchema = z.object({
      type: z.literal(key).describe(`Command type: ${key}`),
      ...baseShape
    });
    
    unionSchemas.push(extendedSchema);
  }
  
  // If there are no schemas, provide a placeholder schema to satisfy the discriminated union
  if (unionSchemas.length === 0) {
    unionSchemas.push(z.object({
      type: z.literal('none').describe('No command'),
    }));
  }
  
  // Create a tuple type with at least one element to satisfy the discriminated union
  const unionSchemasTuple = unionSchemas.length > 0 
    ? [unionSchemas[0], ...unionSchemas.slice(1)] as [z.ZodObject<any, any, any>, ...z.ZodObject<any, any, any>[]]
    : [z.object({ type: z.literal('none') })] as [z.ZodObject<any, any, any>];
  
  // Create a discriminated union based on the 'type' field
  return z.discriminatedUnion("type", unionSchemasTuple);
}

/**
 * Extract action data from a discriminated union result
 * 
 * @param data The parsed result from the discriminated union schema
 * @returns Tuple of [action type, action data without type field]
 */
export function extractActionFromDiscriminatedUnion<T extends Record<string, Schema<unknown>>>(
  data: { type: keyof T } & Record<string, unknown>
): [keyof T, Record<string, unknown>] {
  // Make a copy of the data to avoid mutating the input
  const { type, ...rest } = { ...data };
  
  // Handle symbol keys by converting to string
  const typeKey = typeof type === 'symbol' ? String(type) : type;
  
  return [typeKey as keyof T, rest];
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