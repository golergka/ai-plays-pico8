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
  Entity,
} from "./types";
import { ItemIds, RoomIds } from "./map";
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
  use: z
    .object({
      item: z.string().describe("Item to use"),
      target: z.string().describe("Target to use item on"),
    })
    .describe("Use an item on something"),
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
  private get hasTorch(): boolean {
    return ItemIds.torch in this.inventory;
  }

  private gameOver(reason: string): StepResult {
    return {
      type: "result",
      result: {
        description: `Game Over: ${reason}\n\nFinal score: ${this.score}`,
        metadata: {
          score: this.score,
          inventory: this.inventory,
          gameOver: true
        },
      },
    };
  }

  private getCurrentRoom(): Room {
    const currentRoom = this.gameMap.rooms[this.currentRoomId];
    if (!currentRoom) {
      throw new Error("Current room not found");
    }
    return currentRoom;
  }

  private createAmbiguousState(target: string, matches: Array<{entity: Entity}>, context: string): StepResult {
    // Filter matches to only include entities that actually match the target name
    const relevantMatches = matches.filter(m => 
      m.entity.name.toLowerCase().includes(target.toLowerCase()) ||
      m.entity.tags.some(tag => tag.toLowerCase().includes(target.toLowerCase()))
    );

    return {
      type: "state",
      state: {
        gameState: this.formatGameState(),
        feedback: `Which ${target} do you mean? ${context}: ${relevantMatches
          .map((m) => m.entity.name)
          .join(", ")}`,
        actions,
      },
    };
  }

  private createNotFoundState(target: string): StepResult {
    return {
      type: "state",
      state: {
        gameState: this.formatGameState(),
        feedback: `You don't see any ${target} here.`,
        actions,
      },
    };
  }

  private findEntityWithFeedback<T extends Entity>(
    target: string,
    entities: Record<string, T> | undefined,
    context: string,
    handler: (entity: T) => StepResult
  ): StepResult | null {
    if (!entities) {
      return null;
    }

    const result = findEntity(target, entities);
    
    switch (result.type) {
      case "found":
        return handler(result.entity);
      case "ambiguous":
        return this.createAmbiguousState(target, result.matches, context);
      case "notFound":
        return null;
    }
  }

  private addScore(points: number, reason: string): string {
    this.score += points;
    return `(+${points} points: ${reason})`;
  }

  private handleLook(actionData: unknown): StepResult {
    const { target } = actions.look.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    // Looking at the room/around/surroundings
    if (target === "room" || target === "around" || target === "surroundings") {
      let description = currentRoom.description;
      
      if (currentRoom.items && Object.keys(currentRoom.items).length > 0) {
        description += "\n\nYou can see: " + 
          Object.values(currentRoom.items)
            .map(item => item.name)
            .join(", ");
      }

      if (currentRoom.features && Object.keys(currentRoom.features).length > 0) {
        description += "\n\nNotable features: " + 
          Object.values(currentRoom.features)
            .map(feature => feature.name)
            .join(", ");
      }

      return {
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: description,
          actions,
        },
      };
    }

    // Looking at exits
    if (target === "exits") {
      if (!currentRoom.exits || Object.keys(currentRoom.exits).length === 0) {
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: "There are no visible exits.",
            actions,
          },
        };
      }

      const exitDescriptions = Object.entries(currentRoom.exits)
        .map(([direction, exit]) => `${direction}: ${exit.description}`)
        .join("\n");

      return {
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: "Available exits:\n" + exitDescriptions,
          actions,
        },
      };
    }

    // Check features
    const featureResult = this.findEntityWithFeedback(
      target,
      currentRoom.features,
      "Features here",
      (feature) => ({
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: feature.description,
          actions,
        },
      })
    );
    if (featureResult) return featureResult;

    // Check inventory
    const inventoryResult = this.findEntityWithFeedback(
      target,
      this.inventory,
      "In your inventory",
      (item) => ({
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: `${item.description} (In your inventory)`,
          actions,
        },
      })
    );
    if (inventoryResult) return inventoryResult;

    // Check room items
    const itemResult = this.findEntityWithFeedback(
      target,
      currentRoom.items,
      "In the room",
      (item) => ({
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: `${item.description} (In this room)`,
          actions,
        },
      })
    );
    if (itemResult) return itemResult;

    // Check characters
    const characterResult = this.findEntityWithFeedback(
      target,
      currentRoom.characters,
      "Characters here",
      (character) => ({
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: character.description,
          actions,
        },
      })
    );
    if (characterResult) return characterResult;

    return this.createNotFoundState(target);
  }

  private handleTake(actionData: unknown): StepResult {
    const { item: targetItem } = actions.take.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    // First check if item is already in inventory
    const inventoryResult = this.findEntityWithFeedback(
      targetItem,
      this.inventory,
      "In inventory",
      (item) => ({
        type: "state",
        state: {
          gameState: this.formatGameState(),
          feedback: `You already have the ${item.name} in your inventory.`,
          actions,
        },
      })
    );
    if (inventoryResult) return inventoryResult;

    // Then check room items
    return this.findEntityWithFeedback(
      targetItem,
      currentRoom.items,
      "In room",
      (item) => {
        if (!item.takeable) {
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: `You can't take the ${item.name}.`,
              actions,
            },
          };
        }

        // Remove from room items
        const { [item.id]: _, ...remainingItems } = currentRoom.items!;
        currentRoom.items = remainingItems;
        let scoreMessage = "";

        // Handle special items
        switch (item.id) {
          case ItemIds.oldCoin:
            if (!this.inventory[ItemIds.sacredGem]?.id) {
              return {
                type: "state",
                state: {
                  gameState: this.formatGameState(),
                  feedback: "The coin's dark symbols pulse ominously. Perhaps you need some protection against dark magic before touching it.",
                  actions,
                },
              };
            }
            scoreMessage = this.addScore(15, "safely retrieved the cursed coin");
            break;

          case ItemIds.goldenChalice:
            if (!this.inventory[ItemIds.guardBadge]?.id || !this.inventory[ItemIds.oldCoin]?.id) {
              return this.gameOver(
                "As you reach for the chalice, ancient wards flare to life. " +
                "Without both a guard's authority and the temple's sacred coin, " +
                "the magical defenses reduce you to ash."
              );
            }
            scoreMessage = this.addScore(50, "claimed the legendary Golden Chalice");
            return {
              type: "result",
              result: {
                description: 
                  "The guard's badge glows in recognition of your authority, " +
                  "while the ancient coin resonates with the temple's magic. " +
                  "The wards surrounding the chalice fade, allowing you to claim your prize.\n\n" +
                  `Congratulations! You've won the game! Final score: ${this.score}`,
                metadata: {
                  score: this.score,
                  inventory: this.inventory,
                  gameOver: true
                },
              },
            };

          case ItemIds.sacredGem:
            scoreMessage = this.addScore(20, "found a rare sacred gem");
            break;

          default:
            scoreMessage = this.addScore(5, "collected a treasure");
        }

        // Add to inventory and return success message
        this.inventory[item.id] = item;
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: `You carefully take the ${item.name}. ${scoreMessage}`,
            actions,
          },
        };
      }
    ) ?? this.createNotFoundState(targetItem);
  }

  private handleUse(actionData: unknown): StepResult {
    const { item: itemName, target: targetName } = actions.use.parse(actionData);
    const currentRoom = this.getCurrentRoom();
    
    // Check if item is in inventory
    const itemResult = this.findEntityWithFeedback(
      itemName,
      this.inventory,
      "In inventory",
      (item) => {
        // Check if target exists in inventory
        const inventoryTargetResult = this.findEntityWithFeedback(
          targetName,
          this.inventory,
          "In inventory",
          (target) => this.handleItemUse(item, target)
        );
        if (inventoryTargetResult) return inventoryTargetResult;

        // Check if target exists in room items
        const roomItemTargetResult = this.findEntityWithFeedback(
          targetName,
          currentRoom.items,
          "In room",
          (target) => this.handleItemUse(item, target)
        );
        if (roomItemTargetResult) return roomItemTargetResult;

        // Check if target exists in room features
        const featureTargetResult = this.findEntityWithFeedback(
          targetName,
          currentRoom.features,
          "Features here",
          (target) => this.handleItemUse(item, target)
        );
        if (featureTargetResult) return featureTargetResult;

        // Target not found
        return this.createNotFoundState(targetName);
      }
    );
    
    return itemResult ?? {
      type: "state",
      state: {
        gameState: this.formatGameState(),
        feedback: `You don't have a ${itemName} to use.`,
        actions,
      },
    };
  }

  private handleItemUse(item: Entity, target: Entity): StepResult {
    // Handle specific item uses
    switch (item.id) {
      case ItemIds.guardBadge:
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: "The guard badge is a symbol of authority, but it has no magical properties. It might be useful for proving your right to access certain areas.",
            actions,
          },
        };

      case ItemIds.crystalShard:
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: "The crystal shard pulses with protective energy. It seems designed to shield against specific magical threats in the temple.",
            actions,
          },
        };
    }

    // Handle coin-specific interactions
    if (target.id === ItemIds.oldCoin) {
      switch (item.id) {
        case ItemIds.sacredGem:
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The sacred gem glows brightly, its protective aura ready to shield you from dark magic. This seems like the right approach to handling the cursed coin.",
              actions,
            },
          };
        case ItemIds.ancientScroll:
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The scroll contains warnings about dark artifacts, but merely reading about protection won't help. You need something with actual protective power.",
              actions,
            },
          };
        case ItemIds.torch:
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The eternal flame makes the coin's symbols glow brighter, but light alone won't protect you from its curse.",
              actions,
            },
          };
      }
    }
    
    return {
      type: "state",
      state: {
        gameState: this.formatGameState(),
        feedback: `You can't figure out how to use the ${item.name} on the ${target.name}.`,
        actions,
      },
    };
  }

  private handleMove(actionData: unknown): StepResult {
    const { direction } = actions.move.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    const exit = currentRoom.exits?.[direction];
    if (exit) {
      // Check if player has light before allowing movement
      if (!this.hasTorch && 
          this.currentRoomId === RoomIds.entrance && 
          direction === "north") {
        return this.gameOver(
          "You stumble in the dark and fall into a deep pit. " +
          "Perhaps you should find a light source before venturing deeper into the temple."
        );
      }
      
      // Check for trap in meditation room
      if (this.currentRoomId === RoomIds.meditation && 
          direction === "west" &&
          !this.inventory[ItemIds.crystalShard]?.id) {
        return this.gameOver(
          "As you step into the corridor, ancient magic detects your presence. " +
          "Without the crystal's protective aura, the temple's defenses activate, " +
          "and magical energy reduces you to ash."
        );
      }

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
        
      case "use":
        return this.handleUse(actionData);

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
