import { describe, it, expect } from 'vitest'
import { ExampleActionSchema, exampleJsonSchema, validateExampleAction } from './examples'
import { parseSchema, safeParseSchema } from './utils'
import type { ExampleAction } from './examples'

describe('Schema System', () => {
  describe('Basic Validation', () => {
    it('should parse valid actions', () => {
      const validAction = parseSchema(ExampleActionSchema, {
        type: 'move',
        direction: 'north'
      })
      
      expect(validAction).toEqual({
        type: 'move',
        direction: 'north'
      })
    })
    
    it('should throw on invalid actions', () => {
      expect(() => {
        parseSchema(ExampleActionSchema, {
          type: 'move',
          direction: 'up' // Invalid direction
        })
      }).toThrow()
    })
  })
  
  describe('Safe Parsing', () => {
    it('should safely parse valid data', () => {
      const result = safeParseSchema(ExampleActionSchema, {
        type: 'examine',
        target: 'door'
      })
      
      expect(result).toEqual({
        type: 'examine',
        target: 'door'
      })
    })
    
    it('should return null for invalid data', () => {
      const result = safeParseSchema(ExampleActionSchema, {
        type: 'examine'
        // Missing required 'target' field
      })
      
      expect(result).toBeNull()
    })
  })
  
  describe('Helper Functions', () => {
    it('should validate actions with helper function', () => {
      const result = validateExampleAction({
        type: 'use',
        item: 'key',
        target: 'door'
      })
      
      expect(result).toEqual({
        type: 'use',
        item: 'key',
        target: 'door'
      })
    })
  })
  
  describe('JSON Schema Generation', () => {
    it('should generate valid JSON Schema', () => {
      expect(exampleJsonSchema).toHaveProperty('definitions.GameAction')
      expect(exampleJsonSchema).toHaveProperty('$schema', 'http://json-schema.org/draft-07/schema#')
      
      // Check for specific schema structure without type assertions
      expect(exampleJsonSchema).toHaveProperty(['definitions', 'GameAction', 'anyOf'])
      
      // Use proper type-safe property access with optional chaining
      if (
        typeof exampleJsonSchema === 'object' && 
        exampleJsonSchema !== null && 
        'definitions' in exampleJsonSchema && 
        typeof exampleJsonSchema.definitions === 'object' && 
        exampleJsonSchema.definitions !== null && 
        'GameAction' in exampleJsonSchema.definitions && 
        typeof exampleJsonSchema.definitions.GameAction === 'object' && 
        exampleJsonSchema.definitions.GameAction !== null && 
        'anyOf' in exampleJsonSchema.definitions.GameAction && 
        Array.isArray(exampleJsonSchema.definitions.GameAction.anyOf)
      ) {
        const anyOf = exampleJsonSchema.definitions.GameAction.anyOf
        expect(anyOf.length).toBeGreaterThan(0)
        
        // Check for move action schema using type guards
        const moveSchema = anyOf.find(s => 
          typeof s === 'object' && 
          s !== null && 
          'properties' in s && 
          typeof s.properties === 'object' && 
          s.properties !== null && 
          'type' in s.properties && 
          typeof s.properties.type === 'object' && 
          s.properties.type !== null && 
          'const' in s.properties.type && 
          s.properties.type.const === 'move'
        )
        
        expect(moveSchema).toBeDefined()
        
        // Check for the direction property in the move schema
        if (
          moveSchema && 
          typeof moveSchema === 'object' && 
          'properties' in moveSchema && 
          typeof moveSchema.properties === 'object' && 
          moveSchema.properties !== null && 
          'direction' in moveSchema.properties && 
          typeof moveSchema.properties.direction === 'object' && 
          moveSchema.properties.direction !== null && 
          'enum' in moveSchema.properties.direction && 
          Array.isArray(moveSchema.properties.direction.enum)
        ) {
          expect(moveSchema.properties.direction.enum).toContain('north')
        } else {
          // Fail the test if we can't access the expected property
          expect.fail('Move schema does not have the expected direction property')
        }
      } else {
        // Fail the test if the schema doesn't have the expected structure
        expect.fail('Schema does not have the expected structure')
      }
    })
  })
  
  describe('Type System', () => {
    it('should properly infer types', () => {
      // This is mainly a compile-time check
      const typedAction: ExampleAction = {
        type: 'inventory'
      }
      
      expect(typedAction.type).toBe('inventory')
    })
  })
})