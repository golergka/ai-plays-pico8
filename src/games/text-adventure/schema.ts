import { z } from 'zod'
import { createFunctionSchema } from '../../schema'
import type { TextAdventureAction } from './types'

/**
 * Zod schemas for text adventure actions
 */
export const TextAdventureActionSchemas = {
  move: z.object({
    direction: z.enum(['north', 'south', 'east', 'west'])
      .describe('Direction to move (north, south, east, west)'),
  }),
  
  look: z.object({}),
  
  examine: z.object({
    target: z.string()
      .describe('Object or item to examine'),
  }),
  
  take: z.object({
    item: z.string()
      .describe('Item to take'),
  }),
  
  use: z.object({
    item: z.string()
      .describe('Item to use'),
    target: z.string().optional()
      .describe('Target to use the item on (optional)'),
  }),
  
  inventory: z.object({}),
  
  help: z.object({}),
}

/**
 * Function schemas for LLM function calling
 */
export const TextAdventureFunctionSchemas = {
  move: createFunctionSchema(
    'move',
    'Move in a direction (north, south, east, west)',
    TextAdventureActionSchemas.move
  ),
  
  look: createFunctionSchema(
    'look',
    'Look around to see the current room description',
    TextAdventureActionSchemas.look
  ),
  
  examine: createFunctionSchema(
    'examine',
    'Examine an object or item to get more details about it',
    TextAdventureActionSchemas.examine
  ),
  
  take: createFunctionSchema(
    'take',
    'Take an item and add it to your inventory',
    TextAdventureActionSchemas.take
  ),
  
  use: createFunctionSchema(
    'use',
    'Use an item from your inventory, optionally with a target',
    TextAdventureActionSchemas.use
  ),
  
  inventory: createFunctionSchema(
    'inventory',
    'Check the items in your inventory',
    TextAdventureActionSchemas.inventory
  ),
  
  help: createFunctionSchema(
    'help',
    'Get help about how to play the game',
    TextAdventureActionSchemas.help
  )
}

/**
 * Convert action schemas to TextAdventureAction
 * This helper is used to convert the result of GamePlayer.getAction() to the legacy TextAdventureAction format
 */
export function toTextAdventureAction(
  actionType: keyof typeof TextAdventureActionSchemas,
  actionData: any
): TextAdventureAction {
  switch (actionType) {
    case 'move':
      return { type: 'move', direction: actionData.direction }
    case 'look':
      return { type: 'look' }
    case 'examine':
      return { type: 'examine', target: actionData.target }
    case 'take':
      return { type: 'take', item: actionData.item }
    case 'use':
      return { type: 'use', item: actionData.item, target: actionData.target }
    case 'inventory':
      return { type: 'inventory' }
    case 'help':
      return { type: 'help' }
    default:
      throw new Error(`Unknown action type: ${actionType}`)
  }
}