/**
 * Text Adventure game implementation
 */
import { z } from "zod";
import type {
  SaveableGame,
  GameState,
  StepResult,
  TextAdventureSaveData,
  Room,
  Item,
} from "./types";
import { findEntity } from "./utils";
import {
  DirectionSchema,
  type GameMap,
  TextAdventureSaveSchema,
} from "./types";
import { gameMap } from "./map";
import _ from 'lodash'

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
  private gameMap: GameMap = _.cloneDeep(gameMap);
  private currentRoomId: string = "";
  private inventory: Record<string, Item> = {};
  private visitedRooms: Set<string> = new Set();
  private score: number = 0;

  private getCurrentRoom(): Room {
    const currentRoom = this.gameMap.rooms[this.currentRoomId];
    if (!currentRoom) {
      throw new Error("Current room not found");
    }
    return currentRoom;
  }

  private addScore(points: number, reason: string): string {
    this.score += points;
    return `(+${points} points: ${reason})`;
  }

  private handleLook(actionData: unknown): StepResult {
    const { target } = actions.look.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    // Looking at the room/around
    if (target === "room" || target === "around") {
      return {
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: currentRoom.description,
          actions,
        },
      };
    }

    // Check features
    if (currentRoom.features) {
      const featureResult = findEntity(target, currentRoom.features);
      switch (featureResult.type) {
        case "found":
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: featureResult.entity.description,
              actions,
            },
          };
        case "ambiguous":
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: `Which ${target} do you mean? I can see: ${featureResult.matches
                .map((m) => m.entity.name)
                .join(", ")}`,
              actions,
            },
          };
      }
    }

    // Check inventory items
    const inventoryResult = findEntity(target, this.inventory);
    switch (inventoryResult.type) {
      case "found":
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: inventoryResult.entity.description,
            actions,
          },
        };
      case "ambiguous":
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: `Which ${target} do you mean? In your inventory: ${inventoryResult.matches
              .map((m) => m.entity.name)
              .join(", ")}`,
            actions,
          },
        };
    }

    // Check room items
    if (currentRoom.items) {
      const itemResult = findEntity(target, currentRoom.items);
      switch (itemResult.type) {
        case "found":
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: itemResult.entity.description,
              actions,
            },
          };
        case "ambiguous":
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: `Which ${target} do you mean? In the room: ${itemResult.matches
                .map((m) => m.entity.name)
                .join(", ")}`,
              actions,
            },
          };
      }
    }

    // Check characters
    if (currentRoom.characters) {
      const characterResult = findEntity(target, currentRoom.characters);
      switch (characterResult.type) {
        case "found":
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: characterResult.entity.description,
              actions,
            },
          };
        case "ambiguous":
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: `Which ${target} do you mean? Characters here: ${characterResult.matches
                .map((m) => m.entity.name)
                .join(", ")}`,
              actions,
            },
          };
      }
    }

    return {
      type: "state",
      state: {
        gameState: this.formatGameState(),
        feedback: `You don't see any ${target} here.`,
        actions,
      },
    };
  }

  private handleTake(actionData: unknown): StepResult {
    const { item: targetItem } = actions.take.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    if (!currentRoom.items) {
      return {
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: `You don't see any ${targetItem} here.`,
          actions,
        },
      };
    }

    const itemResult = findEntity(targetItem, currentRoom.items);
    switch (itemResult.type) {
      case "notFound":
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: `You don't see any ${targetItem} here.`,
            actions,
          },
        };

      case "ambiguous":
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: `Which ${targetItem} do you mean? Available: ${itemResult.matches
              .map((m) => m.entity.name)
              .join(", ")}`,
            actions,
          },
        };

      case "found": {
        const takenItem = itemResult.entity;

        if (!takenItem.takeable) {
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: `You can't take the ${takenItem.name}.`,
              actions,
            },
          };
        }

        // Remove from room items
        const { [takenItem.id]: _, ...remainingItems } = currentRoom.items;
        currentRoom.items = remainingItems;

        // Add to inventory
        this.inventory[takenItem.id] = takenItem;

        // Score based on item value
        let scoreMessage = "";
        if (takenItem.id === "golden_chalice") {
          scoreMessage = this.addScore(
            50,
            "found the legendary Golden Chalice"
          );
          return {
            type: "result",
            result: {
              description: `Congratulations! You've found the Golden Chalice and won the game! Final score: ${this.score}`,
              metadata: {
                score: this.score,
                inventory: this.inventory,
              },
            },
          };
        } else if (takenItem.id === "sacred_gem") {
          scoreMessage = this.addScore(20, "found a rare sacred gem");
        } else {
          scoreMessage = this.addScore(5, "collected a treasure");
        }

        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: `You carefully take the ${takenItem.name}. ${scoreMessage}`,
            actions,
          },
        };
      }
    }
  }

  private handleMove(actionData: unknown): StepResult {
    const { direction } = actions.move.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    const exit = currentRoom.exits?.[direction];
    if (exit) {
      this.currentRoomId = exit.targetRoom;
      this.visitedRooms.add(exit.targetRoom);

      return {
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: `You move ${direction}.`,
          actions,
        },
      };
    } else {
      return {
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: `You cannot move ${direction} from here.`,
          actions,
        },
      };
    }
  }

  /**
   * Initialize the game
   */
  async initialize(): Promise<void> {
    this.currentRoomId = this.gameMap.startRoom;
    this.inventory = {};
    this.visitedRooms = new Set([this.currentRoomId]);
  }

  private formatGameState(): string {
    const currentRoom = this.getCurrentRoom();
    const parts: string[] = [];

    parts.push(`# ${currentRoom.name}`);
    parts.push(currentRoom.description);

    if (currentRoom.items) {
      const itemNames = Object.values(currentRoom.items).map(
        (item) => item.name
      );
      if (itemNames.length > 0) {
        parts.push(`You see: ${itemNames.join(", ")}`);
      }
    }

    if (currentRoom.exits) {
      const exitDirections = Object.keys(currentRoom.exits);
      if (exitDirections.length > 0) {
        parts.push(`Visible exits: ${exitDirections.join(", ")}`);
      }
    }

    if (currentRoom.characters) {
      const characterNames = Object.values(currentRoom.characters).map(
        (char) => char.name
      );
      if (characterNames.length > 0) {
        parts.push(`Characters present: ${characterNames.join(", ")}`);
      }
    }

    const inventoryItems = Object.values(this.inventory).map(
      (item) => item.name
    );
    if (inventoryItems.length > 0) {
      parts.push(`You are carrying: ${inventoryItems.join(", ")}`);
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
      actions,
    };
  }

  /**
   * Process a game step
   */
  async step(action: [string, unknown]): Promise<StepResult> {
    const [actionType, actionData] = action;
    this.getCurrentRoom(); // Validate current room exists before proceeding

    switch (actionType) {
      case "look":
        return this.handleLook(actionData);

      case "take":
        return this.handleTake(actionData);

      case "move":
        return this.handleMove(actionData);

      default:
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: "Action not recognized. Please try a different action.",
            actions,
          },
        };
    }
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
      inventory: Object.fromEntries(Object.entries(this.inventory)),
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
