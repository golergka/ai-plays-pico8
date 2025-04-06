/**
 * Utility functions for text adventure games
 */
import { TextAdventure } from './text-adventure'
import { TextAdventureSaveSchema, type EntityMapData, type EntityLookupResult } from './types'

/**
 * Find an entity in a collection based on user input
 * Matches against entity tags and handles partial matches
 */
export function findEntity<T extends EntityMapData>(
  searchText: string,
  entities: Record<string, T>
): EntityLookupResult<T> {
  const searchWords = searchText.toLowerCase().split(/\s+/)
  
  const matches = Object.entries(entities)
    .flatMap(([id, entity]) => {
      const matchingTags = entity.tags
        .filter(tag => searchWords.some(word => tag.toLowerCase().includes(word.toLowerCase())))
        .map(matchedTag => ({ entity, matchedTag }))
      return matchingTags
    })

  if (matches.length === 0) {
    return { type: 'notFound' }
  }
  
  if (matches.length === 1) {
    return { type: 'found', ...matches[0] }
  }
  
  return { type: 'ambiguous', matches }
}

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
