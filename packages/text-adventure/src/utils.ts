/**
 * Utility functions for text adventure games
 */
import { TextAdventure } from "./text-adventure";
import {
  TextAdventureSaveSchema,
  type Entity,
} from "./types";
import _ from "lodash";

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

  // Get unique matching entities with their best matching tag
  const matches = Object.values(entities)
    .map((entity) => {
      // Check if name matches
      const nameLower = entity.name.toLowerCase();
      if (searchWords.some(word => nameLower.includes(word.toLowerCase()))) {
        return { entity, matchedTag: entity.name };
      }
      // Check if any tag matches
      const matchingTag = entity.tags.find((tag) =>
        searchWords.some((word) =>
          tag.toLowerCase().includes(word.toLowerCase())
        )
      );
      return matchingTag ? { entity, matchedTag: matchingTag } : null;
    })
    .filter((match): match is { entity: T; matchedTag: string } => match !== null);

  const [match, ...rest] = matches;

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
    inventory: _.cloneDeep(validatedData.inventory),
    visitedRooms: new Set(validatedData.visitedRooms),
    gameMap: validatedData.gameMap,
  });

  return game;
}
