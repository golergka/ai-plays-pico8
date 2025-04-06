/**
 * Utility functions for text adventure games
 */
import { TextAdventure } from "./text-adventure";
import {
  TextAdventureSaveSchema,
  type Entity,
} from "./types";

export type EntityLookupResult<T extends Entity> = 
  | { type: 'found'; entity: T; matchedTag: string }
  | { type: 'ambiguous'; matches: Array<{ entity: T; matchedTag: string }> }
  | { type: 'notFound' };

/**
 * Find an entity in a collection based on user input
 * Matches against entity tags and handles partial matches
 */
export function findEntity<T extends Entity>(
  searchText: string,
  entities: Record<string, T>
): EntityLookupResult<T> {
  const searchWords = searchText.toLowerCase().split(/\s+/);

  const [match, ...rest] = Object.values(entities).flatMap((entity) => {
    const matchingTags = entity.tags
      .filter((tag) =>
        searchWords.some((word) =>
          tag.toLowerCase().includes(word.toLowerCase())
        )
      )
      .map((matchedTag) => ({ entity, matchedTag }));
    return matchingTags;
  });

  if (!match) {
    return { type: "notFound" };
  }

  if (rest.length > 0) {
    return {
      type: "ambiguous",
      matches: [match, ...rest],
    };
  }

  return {
    type: "found",
    entity: match.entity,
    matchedTag: match.matchedTag,
  };
}

/**
 * Create a TextAdventure instance from save data
 *
 * @param saveData The save data to load (must match TextAdventureSaveSchema)
 * @returns A new TextAdventure instance initialized with the save data
 */
export async function createTextAdventureFromSave(
  saveData: unknown
): Promise<TextAdventure> {
  // Validate the save data against the schema
  const validatedData = TextAdventureSaveSchema.parse(saveData);

  // Create a new TextAdventure instance
  const game = new TextAdventure();

  // Initialize the game
  await game.initialize();

  // Apply the save data to the game instance (using private property access)
  Object.assign(game, {
    currentRoomId: validatedData.currentRoomId,
    inventory: [...validatedData.inventory],
    visitedRooms: new Set(validatedData.visitedRooms),
    gameMap: validatedData.gameMap,
  });

  return game;
}
