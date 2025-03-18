import { describe, it, expect } from 'vitest'
import { TextAdventureActionSchemas, toTextAdventureAction } from './schema'

describe('Text Adventure Schema', () => {
  describe('TextAdventureActionSchemas', () => {
    it('should have all required action schemas', () => {
      expect(TextAdventureActionSchemas).toHaveProperty('move')
      expect(TextAdventureActionSchemas).toHaveProperty('look')
      expect(TextAdventureActionSchemas).toHaveProperty('examine')
      expect(TextAdventureActionSchemas).toHaveProperty('take')
      expect(TextAdventureActionSchemas).toHaveProperty('use')
      expect(TextAdventureActionSchemas).toHaveProperty('inventory')
      expect(TextAdventureActionSchemas).toHaveProperty('help')
    })
  })

  describe('toTextAdventureAction', () => {
    it('should convert move action correctly', () => {
      const result = toTextAdventureAction('move', { direction: 'north' })
      expect(result).toEqual({ type: 'move', direction: 'north' })
    })

    it('should convert look action correctly', () => {
      const result = toTextAdventureAction('look', {})
      expect(result).toEqual({ type: 'look' })
    })

    it('should convert examine action correctly', () => {
      const result = toTextAdventureAction('examine', { target: 'door' })
      expect(result).toEqual({ type: 'examine', target: 'door' })
    })

    it('should convert take action correctly', () => {
      const result = toTextAdventureAction('take', { item: 'key' })
      expect(result).toEqual({ type: 'take', item: 'key' })
    })

    it('should convert use action correctly with target', () => {
      const result = toTextAdventureAction('use', { item: 'key', target: 'door' })
      expect(result).toEqual({ type: 'use', item: 'key', target: 'door' })
    })

    it('should convert use action correctly without target', () => {
      const result = toTextAdventureAction('use', { item: 'potion' })
      expect(result).toEqual({ type: 'use', item: 'potion', target: undefined })
    })

    it('should convert inventory action correctly', () => {
      const result = toTextAdventureAction('inventory', {})
      expect(result).toEqual({ type: 'inventory' })
    })

    it('should convert help action correctly', () => {
      const result = toTextAdventureAction('help', {})
      expect(result).toEqual({ type: 'help' })
    })

    it('should throw error for unknown action type', () => {
      expect(() => {
        // @ts-expect-error Testing invalid action type
        toTextAdventureAction('invalidAction', {})
      }).toThrow('Unknown action type: invalidAction')
    })
  })
})