/**
 * Text Adventure game implementation
 */
import { z } from "zod";
import type { SaveableGame, GameState, StepResult } from "./types";
import type { TextAdventureOutput, TextAdventureSaveData } from "./types";
import { DirectionSchema, type GameMap, } from "./schema";
import { TextAdventureSaveSchema } from "./types";

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
  private readonly initialGameMap: GameMap = {
    title: "Ancient Maze Temple",
    description: "A complex temple filled with twisting corridors and hidden chambers",
    startRoom: "entrance",
    rooms: {
      entrance: {
        id: "entrance",
        name: "Temple Entrance",
        description: "A grand entranceway with weathered stone columns. Ancient inscriptions cover the walls.",
        exits: {
          north: "mainHall",
        },
        items: ["torch"],
        characters: [],
      },
      mainHall: {
        id: "mainHall",
        name: "Main Hall",
        description: "A vast ceremonial hall with high ceilings. Faded murals depict forgotten rituals.",
        exits: {
          south: "entrance",
          east: "eastWing",
          west: "westWing",
          north: "northCorridor",
        },
        items: ["old_coin"],
        characters: [],
      },
      eastWing: {
        id: "eastWing",
        name: "Eastern Wing",
        description: "A library-like chamber filled with dusty scrolls and broken pottery.",
        exits: {
          west: "mainHall",
          north: "meditation",
        },
        items: ["ancient_scroll"],
        characters: [],
      },
      westWing: {
        id: "westWing",
        name: "Western Wing",
        description: "An armory with empty weapon racks and fallen shields.",
        exits: {
          east: "mainHall",
          north: "guardRoom",
        },
        items: ["rusty_sword"],
        characters: [],
      },
      northCorridor: {
        id: "northCorridor",
        name: "North Corridor",
        description: "A long hallway with flickering magical lights. The air feels charged with energy.",
        exits: {
          south: "mainHall",
          east: "meditation",
          west: "guardRoom",
          north: "innerSanctum",
        },
        items: [],
        characters: [],
      },
      meditation: {
        id: "meditation",
        name: "Meditation Chamber",
        description: "A peaceful room with a small fountain. Crystal formations catch what little light there is.",
        exits: {
          south: "eastWing",
          west: "northCorridor",
        },
        items: ["crystal_shard"],
        characters: [],
      },
      guardRoom: {
        id: "guardRoom",
        name: "Guard's Quarters",
        description: "Once a guard post, now abandoned. Old bedrolls and equipment lie scattered about.",
        exits: {
          south: "westWing",
          east: "northCorridor",
        },
        items: ["guard_badge"],
        characters: [],
      },
      innerSanctum: {
        id: "innerSanctum",
        name: "Inner Sanctum",
        description: "A sacred chamber bathed in an otherworldly glow. Ancient treasures line ornate pedestals.",
        exits: {
          south: "northCorridor",
          east: "treasureVault",
        },
        items: ["sacred_gem"],
        characters: [],
      },
      treasureVault: {
        id: "treasureVault",
        name: "Treasure Vault",
        description: "The legendary vault of the temple. Golden artifacts catch the light of your torch.",
        exits: {
          west: "innerSanctum",
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

    if (output.feedback) {
      parts.push(output.feedback);
    }

    if (output.title) {
      parts.push(`# ${output.title}`);
    }

    parts.push(output.description);


    if (output.items && output.items.length > 0) {
      parts.push(`Items: ${output.items.join(", ")}`);
    }

    if (output.exits && output.exits.length > 0) {
      parts.push(`Exits: ${output.exits.join(", ")}`);
    }

    if (output.characters && output.characters.length > 0) {
      parts.push(`Characters: ${output.characters.join(", ")}`);
    }

    return parts.join("\n\n");
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
          actions,
        },
      };
    } else if (actionType === "take") {
      const { item } = actions.take.parse(actionData);
      const itemIndex = currentRoom.items?.indexOf(item) ?? -1;

      if (itemIndex === -1) {
        return {
          type: "state",
          state: {
            output: this.formatOutput(
              this.getGameState(`There is no ${item} here to take.`)
            ),
            actions,
          },
        };
      }

      // Remove item from room
      currentRoom.items = currentRoom.items?.filter((i) => i !== item);
      // Add to inventory
      this.inventory.push(item);

      // Check win condition
      if (item === "golden_chalice") {
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
            this.getGameState(`You take the ${item}.`)
          ),
          actions,
        },
      };
    } else if (actionType === "move") {
      const { direction } = actions.move.parse(actionData);

      if (currentRoom.exits?.[direction]) {
        const newRoomId = currentRoom.exits?.[direction];
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
              this.getGameState(`You move ${direction}.`)
            ),
            actions,
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
              feedback: `You cannot move ${direction} from here.`,
              exits,
              items: currentRoom.items ?? [],
              characters: currentRoom.characters ?? [],
            }),
            actions,
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
        actions,
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
