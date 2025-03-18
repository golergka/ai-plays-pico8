import { z } from 'zod'
import { createFunctionSchema, safeParseSchema, toJsonSchema } from '../../schema'
import type { TextAdventureAction } from './types'

/**
 * Zod schema for text adventure actions
 */
export const TextAdventureActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('move'),
    direction: z.enum(['north', 'south', 'east', 'west'])
      .describe('Direction to move (north, south, east, west)'),
  }),
  z.object({
    type: z.literal('look'),
  }),
  z.object({
    type: z.literal('examine'),
    target: z.string()
      .describe('Object or item to examine'),
  }),
  z.object({
    type: z.literal('take'),
    item: z.string()
      .describe('Item to take'),
  }),
  z.object({
    type: z.literal('use'),
    item: z.string()
      .describe('Item to use'),
    target: z.string().optional()
      .describe('Target to use the item on (optional)'),
  }),
  z.object({
    type: z.literal('inventory'),
  }),
  z.object({
    type: z.literal('help'),
  }),
])

/**
 * Function schema for LLM function calling
 */
export const textAdventureFunctionSchema = createFunctionSchema(
  'performGameAction',
  'Perform an action in the text adventure game',
  TextAdventureActionSchema
)

/**
 * JSON Schema for the text adventure actions
 */
export const textAdventureJsonSchema = toJsonSchema(
  TextAdventureActionSchema,
  'TextAdventureAction',
  'An action to perform in the text adventure game'
)

/**
 * Validate a text adventure action
 */
export function validateTextAdventureAction(action: unknown): TextAdventureAction | null {
  return safeParseSchema(TextAdventureActionSchema, action)
}