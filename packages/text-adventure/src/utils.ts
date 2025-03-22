/**
 * Utility functions for text adventure games
 */
import { TextAdventure } from './text-adventure'
import { TextAdventureSaveSchema } from './types'

/**
 * Create a TextAdventure instance from save data
 * 
 * @param saveData The save data to load (must match TextAdventureSaveSchema)
 * @returns A new TextAdventure instance initialized with the save data
 */
export async function createTextAdventureFromSave(saveData: unknown): Promise<TextAdventure> {
  // Validate the save data against the schema
  const validatedData = TextAdventureSaveSchema.parse(saveData)
  
  // Create a new TextAdventure instance
  const game = new TextAdventure()
  
  // Initialize the game
  await game.initialize()
  
  // Apply the save data to the game instance (using private property access)
  Object.assign(game, {
    currentRoomId: validatedData.currentRoomId,
    inventory: [...validatedData.inventory],
    visitedRooms: new Set(validatedData.visitedRooms),
    gameMap: validatedData.gameMap
  })
  
  return game
}