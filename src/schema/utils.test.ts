import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { 
  combineSchemas, 
  extractActionFromDiscriminatedUnion
} from './utils'
import type { SchemaType } from './utils'

describe('Schema utils', () => {
  describe('combineSchemas', () => {
    it('should combine multiple schemas into a discriminated union', () => {
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

      // Check that the schema has the expected structure
      expect(combinedSchema._def.discriminator).toBe('type')
      
      // The schema should be a discriminated union
      expect(combinedSchema._def.options.length).toBe(3)
      
      // Each option should have a 'type' field with a literal value
      const optionTypes = combinedSchema._def.options.map(
        (option: any) => option.shape.type._def.value
      )
      expect(optionTypes).toContain('move')
      expect(optionTypes).toContain('take')
      expect(optionTypes).toContain('look')
    })

    it('should handle an empty schema object by creating a placeholder', () => {
      const combinedSchema = combineSchemas({})
      
      // Check for placeholder schema
      expect(combinedSchema._def.discriminator).toBe('type')
      expect(combinedSchema._def.options.length).toBe(1)
      expect(combinedSchema._def.options[0].shape.type._def.value).toBe('none')
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
        type: 'move',
        direction: 'north'
      }

      // Valid take data
      const takeData = {
        type: 'take',
        item: 'key'
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

      // Invalid type
      const invalidType = {
        type: 'invalid',
        direction: 'north'
      }

      // Missing required field
      const missingField = {
        type: 'move'
      }

      // Invalid field value
      const invalidFieldValue = {
        type: 'move',
        direction: 'up' // not in enum
      }

      // Test validation failures
      expect(() => combinedSchema.parse(invalidType)).toThrow()
      expect(() => combinedSchema.parse(missingField)).toThrow()
      expect(() => combinedSchema.parse(invalidFieldValue)).toThrow()
    })
  })

  describe('extractActionFromDiscriminatedUnion', () => {
    it('should extract action type and data', () => {
      // Sample discriminated union result
      const data = {
        type: 'move',
        direction: 'north'
      }

      // Extract action
      const [actionType, actionData] = extractActionFromDiscriminatedUnion(data)

      // Check extraction
      expect(actionType).toBe('move')
      expect(actionData).toEqual({ direction: 'north' })
      expect(actionData).not.toHaveProperty('type')
    })
  })

  describe('Integration test', () => {
    it('should handle a complete discriminated union flow', () => {
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
        type: 'move',
        direction: 'north'
      }
      
      // Parse and validate
      const parsedData = combinedSchema.parse(moveAction)
      
      // Extract action
      const actionData = parsedData as { type: keyof ActionSchemas } & Record<string, unknown>;
      const [actionType, extractedData] = extractActionFromDiscriminatedUnion<ActionSchemas>(actionData)
      
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