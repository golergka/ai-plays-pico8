/**
 * Utility functions for compact text adventure games
 */
import { z } from 'zod'
import { CompactTextAdventure } from './compact-adventure'
import { TextAdventureSaveSchema } from '@ai-gamedev/text-adventure'

/**
 * Extended schema for compact adventure save data
 */
const CompactAdventureSaveSchema = TextAdventureSaveSchema.extend({
  lastCommand: z.string(),
  gameType: z.literal('compact')
})

// Type for compact adventure save data
export type CompactAdventureSaveData = z.infer<typeof CompactAdventureSaveSchema>

/**
 * Create a CompactTextAdventure instance from save data
 * 
 * @param saveData The save data to load (must match CompactAdventureSaveSchema)
 * @returns A new CompactTextAdventure instance initialized with the save data
 */
export async function createCompactAdventureFromSave(saveData: unknown): Promise<CompactTextAdventure> {
  // Validate the save data against the schema
  const validatedData = CompactAdventureSaveSchema.parse(saveData)
  
  // Create a new CompactTextAdventure instance
  const game = new CompactTextAdventure()
  
  // Initialize the game
  await game.initialize()
  
  // Apply the save data to the game instance (using private property access)
  Object.assign(game, {
    currentRoomId: validatedData.currentRoomId,
    inventory: [...validatedData.inventory],
    visitedRooms: new Set(validatedData.visitedRooms),
    gameMap: validatedData.gameMap,
    lastCommand: validatedData.lastCommand
  })
  
  return game
}