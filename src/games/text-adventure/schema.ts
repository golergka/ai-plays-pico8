import type { TextAdventureAction } from './types'

/**
 * This is a placeholder for the actual schema implementation.
 * In the future, this will use the schema system (T-002) to define
 * and validate the text adventure actions.
 */
export const TextAdventureActionSchema = {
  type: 'object',
  title: 'Text Adventure Action',
  description: 'An action to perform in the text adventure game',
  oneOf: [
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['move'] },
        direction: { type: 'string', description: 'Direction to move (north, south, east, west)' }
      },
      required: ['type', 'direction']
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['look'] }
      },
      required: ['type']
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['examine'] },
        target: { type: 'string', description: 'Object or item to examine' }
      },
      required: ['type', 'target']
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['take'] },
        item: { type: 'string', description: 'Item to take' }
      },
      required: ['type', 'item']
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['use'] },
        item: { type: 'string', description: 'Item to use' },
        target: { 
          type: 'string', 
          description: 'Target to use the item on (optional)',
          nullable: true
        }
      },
      required: ['type', 'item']
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['inventory'] }
      },
      required: ['type']
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['help'] }
      },
      required: ['type']
    }
  ]
}

/**
 * Just a placeholder function to validate actions until schema system is implemented
 */
export function validateTextAdventureAction(_action: unknown): TextAdventureAction | null {
  // Placeholder for actual validation
  // Later this will use the schema system to validate and parse the action
  return _action as TextAdventureAction
}