import { z } from 'zod'
import { createFunctionSchema, toJsonSchema } from './utils'

/**
 * Example of a basic action schema using Zod
 */
export const ExampleActionSchema = z.discriminatedUnion('type', [
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
 * Example of function schema for LLM function calling
 */
export const exampleFunctionSchema = createFunctionSchema(
  'performAction',
  'Perform an action in the game world',
  ExampleActionSchema
)

/**
 * Type inference example
 */
export type ExampleAction = z.infer<typeof ExampleActionSchema>

/**
 * Simple validation example
 */
export function validateExampleAction(data: unknown): ExampleAction | null {
  try {
    return ExampleActionSchema.parse(data)
  } catch (error) {
    console.error('Invalid action:', error)
    return null
  }
}

/**
 * Example of converting to JSON Schema
 */
export const exampleJsonSchema = toJsonSchema(
  ExampleActionSchema,
  'GameAction',
  'An action to perform in the game'
)