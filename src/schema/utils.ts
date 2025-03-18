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
  schema: z.ZodType<any>,
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
  parameters: z.ZodType<any>
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
export type SchemaType<T extends z.ZodType<any>> = z.infer<T>