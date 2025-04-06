/**
 * Text adventure game schema
 */

import { z } from 'zod'

export const DirectionSchema = z.enum([
  'north',
  'south',
  'east',
  'west',
]);

// Room schema
export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  items: z.array(z.string()).optional(),
  exits: z.record(DirectionSchema, z.string()).optional(),
  characters: z.array(z.string()).optional()
})

// Item schema
export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  takeable: z.boolean().optional(),
  usableWith: z.array(z.string()).optional()
})

// Character schema
export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  dialogue: z.record(z.string(), z.string()).optional()
})

// Game map schema
export const GameMapSchema = z.object({
  title: z.string(),
  description: z.string(),
  startRoom: z.string(),
  rooms: z.record(z.string(), RoomSchema),
  items: z.record(z.string(), ItemSchema).optional(),
  characters: z.record(z.string(), CharacterSchema).optional()
})

export type Direction = z.infer<typeof DirectionSchema>
export type Room = z.infer<typeof RoomSchema>
export type Item = z.infer<typeof ItemSchema>
export type Character = z.infer<typeof CharacterSchema>
export type GameMap = z.infer<typeof GameMapSchema>