/**
 * Text Adventure game implementation
 */
import { z } from "zod";
import type { SaveableGame, GameState, StepResult, TextAdventureSaveData } from "./types";
import { DirectionSchema, type GameMap, TextAdventureSaveSchema } from "./types";
import { gameMap } from "./map";

const actions = {
  look: z
    .object({
      target: z.string().describe("What to look at"),
    })
    .describe("Look at something in the environment"),
  move: z
    .object({
      direction: DirectionSchema.describe("Direction to move"),
    })
    .describe("Move in a direction"),
  take: z
    .object({
      item: z.string().describe("Item to pick up"),
    })
    .describe("Take an item"),
} as const;

/**
 * Game that implements the Text Adventure mechanics with save/load functionality
 */
export class TextAdventure implements SaveableGame {
  private gameMap: GameMap = gameMap;
  private currentRoomId: string = "";
  private inventory: string[] = [];
  private visitedRooms: Set<string> = new Set();
  private score: number = 0;

  private addScore(points: number, reason: string): string {
    this.score += points;
    return `(+${points} points: ${reason})`;
  }

  /**
   * Initialize the game
   */
  async initialize(): Promise<void> {
    this.currentRoomId = this.gameMap.startRoom;
    this.inventory = [];
    this.visitedRooms = new Set([this.currentRoomId]);
  }

  private formatGameState(): string {
    const currentRoom = this.gameMap!.rooms[this.currentRoomId];
    if (!currentRoom) {
      throw new Error("Current room not found");
    }

    const parts: string[] = [];

    parts.push(`# ${currentRoom.name}`);
    parts.push(currentRoom.description);

    if (currentRoom.items && currentRoom.items.length > 0) {
      parts.push(`You see: ${currentRoom.items.join(", ")}`);
    }

    if (currentRoom.exits) {
      parts.push(`Visible exits: ${Object.keys(currentRoom.exits).join(", ")}`);
    }

    if (currentRoom.characters && currentRoom.characters.length > 0) {
      parts.push(`Characters present: ${currentRoom.characters.join(", ")}`);
    }

    if (this.inventory.length > 0) {
      parts.push(`You are carrying: ${this.inventory.join(", ")}`);
    }

    parts.push(`Score: ${this.score}`);

    return parts.join("\n\n");
  }

  /**
   * Start the game
   */
  async start(): Promise<GameState> {
    if (!this.gameMap) throw new Error("Game not initialized");

    const currentRoom = this.gameMap.rooms[this.currentRoomId];
    if (!currentRoom) {
      throw new Error("Current room not found");
    }

    return {
      gameState: this.formatGameState(),
      feedback: "Welcome to the Ancient Maze Temple. Your adventure begins...",
      actions
    };
  }

  /**
   * Process a game step
   */
  async step(action: [string, unknown]): Promise<StepResult> {
    const [actionType, actionData] = action;
    let currentRoom = this.gameMap!.rooms[this.currentRoomId];
    
    if (!currentRoom) {
      throw new Error("Current room not found");
    }

    if (actionType === "look") {
      return {
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: "You see nothing special.",
          actions
        }
      };
    } else if (actionType === "take") {
      const { item } = actions.take.parse(actionData);
      const itemIndex = currentRoom.items?.indexOf(item) ?? -1;

      if (itemIndex === -1) {
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: `You search for the ${item}, but it's not here.`,
            actions
          }
        };
      }

      // Remove item from room and add to inventory
      currentRoom.items = currentRoom.items?.filter((i) => i !== item);
      this.inventory.push(item);

      // Score based on item value
      let scoreMessage = "";
      if (item === "golden_chalice") {
        scoreMessage = this.addScore(50, "found the legendary Golden Chalice");
        return {
          type: "result",
          result: {
            description: `Congratulations! You've found the Golden Chalice and won the game! Final score: ${this.score}`,
            metadata: {
              score: this.score,
              inventory: this.inventory,
            }
          }
        };
      } else if (item === "sacred_gem") {
        scoreMessage = this.addScore(20, "found a rare sacred gem");
      } else {
        scoreMessage = this.addScore(5, "collected a treasure");
      }

      return {
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: `You carefully take the ${item}. ${scoreMessage}`,
          actions
        }
      };
    } else if (actionType === "move") {
      const { direction } = actions.move.parse(actionData);

      if (currentRoom.exits?.[direction]) {
        const newRoomId = currentRoom.exits[direction];
        if (!newRoomId) {
          throw new Error("New room not found");
        }
        this.currentRoomId = newRoomId;
        this.visitedRooms.add(newRoomId);

        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: `You move ${direction}.`,
            actions
          }
        };
      } else {
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: `You cannot move ${direction} from here.`,
            actions
          }
        };
      }
    }

    // Default return for unrecognized actions
    return {
      type: "state",
      state: {
        gameState: this.formatGameState(),
        feedback: "Action not recognized. Please try a different action.",
        actions
      }
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clean up any resources
  }

  /**
   * Get the schema for this game's save data
   * This schema defines the structure of data returned by getSaveData
   *
   * @returns Zod schema describing the save data structure
   */
  getSchema(): z.ZodType<TextAdventureSaveData> {
    return TextAdventureSaveSchema;
  }

  /**
   * Get serializable save data representing the current game state
   * This data conforms to the schema returned by getSchema
   *
   * @returns Serializable data representing the current game state
   */
  getSaveData(): TextAdventureSaveData {
    return {
      currentRoomId: this.currentRoomId,
      inventory: [...this.inventory],
      visitedRooms: [...this.visitedRooms],
      gameMap: this.gameMap || {
        title: "Empty Game",
        description: "No game loaded",
        startRoom: "",
        rooms: {},
      },
    };
  }
}
