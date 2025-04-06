/**
 * Text adventure game types and schemas
 */
import type { 
  Game, 
  GameState, 
  GameResult, 
  StepResult, 
  ActionSchemas,
  SaveableGame
} from '@ai-gamedev/playtest'
import { z } from 'zod'

// Re-export types from playtest
export type { Game, GameState, GameResult, StepResult, ActionSchemas, SaveableGame }

export const DirectionSchema = z.enum([
  'north',
  'south',
  'east',
  'west',
]);

export const EntitySchema = z.object({
  id: z.string(),
  /** One-word descriptions of the item, to match against vague human input */
  tags: z.array(z.string()),
  /** Human-readable name of the item, usually one or two words */
  name: z.string(),
  /** Human-readable description of the item, a couple of sentences */
  description: z.string(),
})

export const EntityMapSchema = z.record(z.string(), EntitySchema)

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  items: z.array(z.string()).optional(),
  exits: z.record(DirectionSchema, z.string()).optional(),
  characters: z.array(z.string()).optional(),
  features: z.record(z.string(), z.string()).optional(), // Map of feature ID to description
})

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  takeable: z.boolean().optional(),
  usableWith: z.array(z.string()).optional()
})

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  dialogue: z.record(z.string(), z.string()).optional()
})

export const GameMapSchema = z.object({
  title: z.string(),
  description: z.string(),
  startRoom: z.string(),
  rooms: z.record(z.string(), RoomSchema),
  items: z.record(z.string(), ItemSchema).optional(),
  characters: z.record(z.string(), CharacterSchema).optional()
})

export const TextAdventureSaveSchema = z.object({
  currentRoomId: z.string(),
  inventory: z.array(z.string()),
  visitedRooms: z.array(z.string()),
  gameMap: GameMapSchema
})

export type Direction = z.infer<typeof DirectionSchema>
export type Room = z.infer<typeof RoomSchema>
export type Item = z.infer<typeof ItemSchema>
export type Character = z.infer<typeof CharacterSchema>
export type GameMap = z.infer<typeof GameMapSchema>
export type TextAdventureSaveData = z.infer<typeof TextAdventureSaveSchema>
export type Entity = z.infer<typeof EntitySchema>
export type EntityMap = z.infer<typeof EntityMapSchema>
