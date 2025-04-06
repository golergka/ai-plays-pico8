/**
 * Text Adventure game implementation
 */
import { z } from "zod";
import type { SaveableGame, GameState, StepResult } from "./types";
import type { TextAdventureOutput, TextAdventureSaveData } from "./types";
import type { GameMap, Room } from "./schema";
import { TextAdventureSaveSchema } from "./types";

/**
 * Get available actions for the current room
 */
function getAvailableActions(room: Room) {
  const actions: Record<string, z.ZodType> = {
    look: z
      .object({
        target: z.string().describe("What to look at"),
      })
      .describe("Look at something in the environment"),
  };

  if (room.exits && Object.keys(room.exits).length > 0) {
    actions["move"] = z
      .object({
        direction: z
          .enum(Object.keys(room.exits) as [string, ...string[]])
          .describe("Direction to move"),
      })
      .describe("Move in a direction");
  }

  if (room.items && room.items.length > 0) {
    actions["take"] = z
      .object({
        item: z
          .enum(room.items as [string, ...string[]])
          .describe("Item to pick up"),
      })
      .describe("Take an item");
  }

  return actions;
}

/**
 * Game that implements the Text Adventure mechanics with save/load functionality
 */
export class TextAdventure implements SaveableGame {
  private readonly initialGameMap: GameMap = {
    title: "Simple Dungeon",
    description: "A small dungeon with three rooms",
    startRoom: "start",
    rooms: {
      start: {
        id: "start",
        name: "Entrance Chamber",
        description:
          "A dimly lit chamber with rough stone walls. Torches flicker in wall sconces.",
        exits: {
          north: "corridor",
        },
        items: [],
        characters: [],
      },
      corridor: {
        id: "corridor",
        name: "Dark Corridor",
        description:
          "A long, dark corridor stretches before you. The air is musty.",
        exits: {
          south: "start",
          east: "treasure",
        },
        items: [],
        characters: [],
      },
      treasure: {
        id: "treasure",
        name: "Treasure Chamber",
        description:
          "A grand chamber with golden decorations on the walls. Ancient treasures lie scattered about.",
        exits: {
          west: "corridor",
        },
        items: ["golden_chalice"],
        characters: [],
      },
    },
  };

  private gameMap: GameMap | null = null;
  private currentRoomId: string = "";
  private inventory: string[] = [];
  private visitedRooms: Set<string> = new Set();

  /**
   * Initialize the game
   */
  async initialize(): Promise<void> {
    this.gameMap = this.initialGameMap;
    this.currentRoomId = this.gameMap.startRoom;
    this.inventory = [];
    this.visitedRooms = new Set([this.currentRoomId]);
  }

  /**
   * Format the game state output
   */
  private formatOutput(output: TextAdventureOutput): string {
    const parts: string[] = [];

    if (output.title) {
      parts.push(`# ${output.title}`);
    }

    parts.push(output.description);

    if (output.feedback) {
      parts.push(`\n${output.feedback}`);
    }

    if (output.items && output.items.length > 0) {
      parts.push(`\nItems: ${output.items.join(", ")}`);
    }

    if (output.exits && output.exits.length > 0) {
      parts.push(`\nExits: ${output.exits.join(", ")}`);
    }

    if (output.characters && output.characters.length > 0) {
      parts.push(`\nCharacters: ${output.characters.join(", ")}`);
    }

    return parts.join("\n");
  }

  private getGameState(feedback: string): TextAdventureOutput {
    const currentRoom = this.gameMap!.rooms[this.currentRoomId];
    if (!currentRoom) {
      throw new Error("Current room not found");
    }
    return {
      title: currentRoom.name,
      description: currentRoom.description,
      feedback,
      exits: currentRoom.exits ? Object.keys(currentRoom.exits) : [],
      items: currentRoom.items ?? [],
      characters: currentRoom.characters ?? [],
    };
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
    const availableExits = currentRoom.exits
      ? Object.keys(currentRoom.exits)
      : [];

    const output: TextAdventureOutput = {
      title: currentRoom.name,
      description: currentRoom.description,
      exits: availableExits,
      items: currentRoom.items ?? [],
      characters: currentRoom.characters ?? [],
    };

    return {
      output: this.formatOutput(output),
      actions: {
        look: z
          .object({
            target: z.string().describe("What to look at"),
          })
          .describe("Look at something in the environment"),
        move: z
          .object({
            direction: z
              .enum(availableExits as [string, ...string[]])
              .describe("Direction to move"),
          })
          .describe("Move in a direction"),
        take: z
          .object({
            item: z
              .enum(currentRoom.items as [string, ...string[]])
              .describe("Item to pick up"),
          })
          .describe("Take an item"),
      },
    };
  }

  /**
   * Process a game step
   */
  async step(action: [string, unknown]): Promise<StepResult> {
    // TODO: actually process action data
    const [actionType, actionData] = action;

    let currentRoom = this.gameMap!.rooms[this.currentRoomId];

    if (!currentRoom) {
      throw new Error("Current room not found");
    }

    // Simple action handling
    if (actionType === "look") {
      return {
        type: "state",
        state: {
          output: this.formatOutput(
            this.getGameState("You see nothing special.")
          ),
          actions: getAvailableActions(currentRoom),
        },
      };
    } else if (actionType === "take") {
      const takeData = actionData as { item: string };
      const itemIndex = currentRoom.items?.indexOf(takeData.item) ?? -1;

      if (itemIndex === -1) {
        return {
          type: "state",
          state: {
            output: this.formatOutput(
              this.getGameState(`There is no ${takeData.item} here to take.`)
            ),
            actions: getAvailableActions(currentRoom),
          },
        };
      }

      // Remove item from room
      currentRoom.items = currentRoom.items?.filter((i) => i !== takeData.item);
      // Add to inventory
      this.inventory.push(takeData.item);

      // Check win condition
      if (takeData.item === "golden_chalice") {
        return {
          type: "result",
          result: {
            description:
              "Congratulations! You've found the Golden Chalice and won the game!",
            metadata: {
              score: 100,
              inventory: this.inventory,
            },
          },
        };
      }

      return {
        type: "state",
        state: {
          output: this.formatOutput(
            this.getGameState(`You take the ${takeData.item}.`)
          ),
          actions: getAvailableActions(currentRoom),
        },
      };
    } else if (actionType === "move") {
      const moveData = actionData as { direction: string };

      if (currentRoom.exits?.[moveData.direction]) {
        const newRoomId = currentRoom.exits?.[moveData.direction];
        if (!newRoomId) {
          throw new Error("New room not found");
        }
        this.currentRoomId = newRoomId;
        this.visitedRooms.add(newRoomId);

        currentRoom = this.gameMap!.rooms[this.currentRoomId];
        if (!currentRoom) {
          throw new Error("New room not found");
        }

        const result: StepResult = {
          type: "state",
          state: {
            output: this.formatOutput(
              this.getGameState(`You move ${moveData.direction}.`)
            ),
            actions: getAvailableActions(currentRoom),
          },
        };

        return result;
      } else {
        const exits = currentRoom.exits ? Object.keys(currentRoom.exits) : [];
        return {
          type: "state",
          state: {
            output: this.formatOutput({
              title: currentRoom.name,
              description: currentRoom.description,
              feedback: `You cannot move ${moveData.direction} from here.`,
              exits,
              items: currentRoom.items ?? [],
              characters: currentRoom.characters ?? [],
            }),
            actions: getAvailableActions(currentRoom),
          },
        };
      }
    }

    // Default return for unrecognized actions
    const output: TextAdventureOutput = {
      title: "Error",
      description: "Action not recognized.",
      feedback: "Please try a different action.",
    };

    return {
      type: "state",
      state: {
        output: this.formatOutput(output),
        actions: getAvailableActions(currentRoom),
      },
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
