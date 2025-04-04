/**
 * Text adventure game types
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
import { GameMapSchema } from './schema'

// Re-export types from playtest
export type { Game, GameState, GameResult, StepResult, ActionSchemas, SaveableGame }

// Game-specific types for text adventure
export type TextAdventureOutput = {
  title?: string
  description: string
  feedback?: string
  items?: string[]
  exits?: string[]
  characters?: string[]
}

// Save data schema for text adventure
export const TextAdventureSaveSchema = z.object({
  currentRoomId: z.string(),
  inventory: z.array(z.string()),
  visitedRooms: z.array(z.string()),
  gameMap: GameMapSchema
})

// Text adventure save data type derived from schema
export type TextAdventureSaveData = z.infer<typeof TextAdventureSaveSchema>