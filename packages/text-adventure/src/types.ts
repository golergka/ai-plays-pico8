/**
 * Text adventure game types and schemas
 */
import type {
  Game,
  GameState,
  ActionSchemas,
  SaveableGame
} from '@ai-gamedev/playtest'
import { z } from 'zod'

// Re-export types from playtest
export type { Game, GameState, ActionSchemas, SaveableGame }

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

// Extend EntitySchema for specific types
export const ItemSchema = EntitySchema.extend({
  takeable: z.boolean().optional(),
  usableWith: z.array(z.string()).optional()
})

export const CharacterSchema = EntitySchema.extend({
  dialogue: z.record(z.string(), z.string()).optional()
})

export const ExitSchema = EntitySchema.extend({
  targetRoom: z.string()
})

export const FeatureSchema = EntitySchema

// Define EntityMap types for each collection
export const ItemMapSchema = z.record(z.string(), ItemSchema)
export const CharacterMapSchema = z.record(z.string(), CharacterSchema)
export const ExitMapSchema = z.record(z.string(), ExitSchema)
export const FeatureMapSchema = z.record(z.string(), FeatureSchema)

// Update RoomSchema to use EntityMaps
export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  items: ItemMapSchema.optional(),
  exits: ExitMapSchema.optional(),
  characters: CharacterMapSchema.optional(),
  features: FeatureMapSchema.optional(),
})

export const GameMapSchema = z.object({
  title: z.string(),
  description: z.string(),
  startRoom: z.string(),
  rooms: z.record(z.string(), RoomSchema),
})

export const TextAdventureSaveSchema = z.object({
  currentRoomId: z.string(),
  inventory: z.record(z.string(), ItemSchema),
  visitedRooms: z.array(z.string()),
  gameMap: GameMapSchema
})

export type Direction = z.infer<typeof DirectionSchema>
export type Room = z.infer<typeof RoomSchema>
export type Item = z.infer<typeof ItemSchema>
export type Character = z.infer<typeof CharacterSchema>
export type Exit = z.infer<typeof ExitSchema>
export type Feature = z.infer<typeof FeatureSchema>
export type ItemMap = z.infer<typeof ItemMapSchema>
export type CharacterMap = z.infer<typeof CharacterMapSchema>
export type ExitMap = z.infer<typeof ExitMapSchema>
export type FeatureMap = z.infer<typeof FeatureMapSchema>
export type GameMap = z.infer<typeof GameMapSchema>
export type TextAdventureSaveData = z.infer<typeof TextAdventureSaveSchema>
export type Entity = z.infer<typeof EntitySchema>
