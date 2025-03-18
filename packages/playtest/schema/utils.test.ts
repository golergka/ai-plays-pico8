import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { 
  combineSchemas, 
  extractActionFromDiscriminatedUnion,
  toJsonSchema
} from './utils'
import type { SchemaType } from './utils'

describe('Schema utils', () => {
  describe('combineSchemas', () => {
    it('should combine multiple schemas into a single object schema', () => {
      // Define sample schemas
      const schemas = {
        move: z.object({
          direction: z.enum(['north', 'south', 'east', 'west'])
            .describe('Direction to move')
        }),
        take: z.object({
          item: z.string()
            .describe('Item to take')
        }),
        look: z.object({})
      }

      // Combine schemas
      const combinedSchema = combineSchemas(schemas)

      // Check that it's a valid zod schema
      expect(combinedSchema).toBeTruthy()
      
      // Check for the presence of each command in the schema
      const parsedMoveAction = { move: { direction: 'north' } };
      const parsedTakeAction = { take: { item: 'key' } };
      const parsedLookAction = { look: {} };
      
      // These should validate successfully
      expect(() => combinedSchema.parse(parsedMoveAction)).not.toThrow()
      expect(() => combinedSchema.parse(parsedTakeAction)).not.toThrow()
      expect(() => combinedSchema.parse(parsedLookAction)).not.toThrow()
      
      // The schema should include description
      expect((combinedSchema as any)._def.description).toBeTruthy()
    })

    it('should handle an empty schema object by creating a placeholder', () => {
      const combinedSchema = combineSchemas({})
      
      // Check that we get a valid schema
      expect(combinedSchema).toBeTruthy()
      
      // Create an object with the placeholder property
      const nonePlaceholder = { none: {} };
      
      // This should pass validation
      expect(() => combinedSchema.parse(nonePlaceholder)).not.toThrow()
    })
    
    it('should generate a valid JSON Schema object', () => {
      // Define sample schemas
      const schemas = {
        move: z.object({
          direction: z.enum(['north', 'south', 'east', 'west'])
        }),
        take: z.object({
          item: z.string()
        })
      }

      // Combine schemas
      const combinedSchema = combineSchemas(schemas)
      
      // Convert to JSON Schema
      const jsonSchema = toJsonSchema(combinedSchema)
      
      // It should be a valid schema
      expect(jsonSchema).toBeTruthy()
      
      // Cast to any to check properties for test purposes
      const schema = jsonSchema as any
      
      // It should be an object schema
      expect(schema.type).toBe('object')
      
      // It should have properties for the commands
      expect(schema.properties).toHaveProperty('move')
      expect(schema.properties).toHaveProperty('take')
    })
  })

  describe('combineSchemas validation', () => {
    it('should validate correct data', () => {
      // Define sample schemas
      const schemas = {
        move: z.object({
          direction: z.enum(['north', 'south', 'east', 'west'])
        }),
        take: z.object({
          item: z.string()
        })
      }

      // Combine schemas
      const combinedSchema = combineSchemas(schemas)

      // Valid move data
      const moveData = {
        move: {
          direction: 'north'
        }
      }

      // Valid take data
      const takeData = {
        take: {
          item: 'key'
        }
      }

      // Test validation
      expect(() => combinedSchema.parse(moveData)).not.toThrow()
      expect(() => combinedSchema.parse(takeData)).not.toThrow()
    })

    it('should reject invalid data', () => {
      // Define sample schemas
      const schemas = {
        move: z.object({
          direction: z.enum(['north', 'south', 'east', 'west'])
        }),
        take: z.object({
          item: z.string()
        })
      }

      // Combine schemas
      const combinedSchema = combineSchemas(schemas)

      // Invalid command name
      const invalidCommand = {
        invalid: {
          direction: 'north'
        }
      }

      // Multiple commands provided
      const multipleCommands = {
        move: {
          direction: 'north'
        },
        take: {
          item: 'key'
        }
      }

      // Invalid field value
      const invalidFieldValue = {
        move: {
          direction: 'up' // not in enum
        }
      }

      // Missing required field
      const missingField = {
        move: {}
      }

      // Empty object (no command)
      const emptyObject = {}

      // Test validation failures
      expect(() => combinedSchema.parse(invalidCommand)).toThrow()
      expect(() => combinedSchema.parse(multipleCommands)).toThrow()
      expect(() => combinedSchema.parse(invalidFieldValue)).toThrow()
      expect(() => combinedSchema.parse(missingField)).toThrow()
      expect(() => combinedSchema.parse(emptyObject)).toThrow()
    })
  })

  describe('extractActionFromDiscriminatedUnion', () => {
    it('should extract action type and data', () => {
      // Sample result from combined schema
      const data = {
        move: {
          direction: 'north'
        }
      }

      // Extract action
      const [actionType, actionData] = extractActionFromDiscriminatedUnion(data)

      // Check extraction
      expect(actionType).toBe('move')
      expect(actionData).toEqual({ direction: 'north' })
    })
    
    it('should throw an error when no command is provided', () => {
      // Empty data
      const emptyData = {};
      
      // All undefined values
      const undefinedData = {
        move: undefined,
        take: undefined
      };
      
      // Test extraction failures
      expect(() => extractActionFromDiscriminatedUnion(emptyData)).toThrow()
      expect(() => extractActionFromDiscriminatedUnion(undefinedData)).toThrow()
    })
  })

  describe('Integration test', () => {
    it('should handle a complete schema flow', () => {
      // Define sample schemas
      const schemas = {
        move: z.object({
          direction: z.enum(['north', 'south', 'east', 'west'])
        }),
        take: z.object({
          item: z.string()
        }),
        look: z.object({})
      }
      
      type ActionSchemas = typeof schemas
      
      // Combine schemas
      const combinedSchema = combineSchemas(schemas)
      
      // Valid data for parser
      const moveAction = {
        move: {
          direction: 'north'
        }
      }
      
      // Parse and validate
      const parsedData = combinedSchema.parse(moveAction)
      
      // Extract action
      const [actionType, extractedData] = extractActionFromDiscriminatedUnion<ActionSchemas>(parsedData)
      
      // Validate result
      expect(actionType).toBe('move')
      expect(extractedData).toEqual({ direction: 'north' })
      
      // Validate against original schema
      const validatedActionData = schemas[actionType].parse(extractedData)
      expect(validatedActionData).toEqual({ direction: 'north' })
      
      // Get proper type
      type MoveSchema = SchemaType<typeof schemas['move']>
      const typedActionData = validatedActionData as MoveSchema
      expect(typedActionData['direction']).toBe('north')
    })
  })
})