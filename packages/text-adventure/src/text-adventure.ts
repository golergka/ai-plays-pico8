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
import { FeatureIds, ItemIds, RoomIds } from "./map";
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

  private findAcrossEntities<T extends Entity>(
    target: string,
    entitySets: Array<Record<string, T> | undefined>
  ): { type: "found"; entity: T; context?: string } | 
     { type: "ambiguous"; matches: Array<{entity: T}> } | 
     { type: "notFound" } {
    
    const allMatches: Array<{entity: T}> = [];
    
    for (const entities of entitySets) {
      if (entities) {
        const result = findEntity(target, entities);
        if (result.type === "found") {
          return result; // Return immediately if exact match found
        } else if (result.type === "ambiguous") {
          allMatches.push(...result.matches);
        }
      }
    }

    const [firstMatch, ...restMatches] = allMatches;
    if (restMatches.length > 0) {
      return { type: "ambiguous", matches: allMatches };
    } else if (firstMatch) {
      return { type: "found", entity: firstMatch.entity };
    } else {
      return { type: "notFound" };
    }
  }

  private handleLook(actionData: unknown): StepResult {
    const { target } = actions.look.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    // Looking at the room/around/surroundings or room name
    if (target === "room" || target === "around" || target === "surroundings" || 
        target.toLowerCase() === currentRoom.name.toLowerCase()) {
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

    // Search across all relevant entity sets
    const result = this.findAcrossEntities(target, [
      currentRoom.features,
      currentRoom.items,
      this.inventory,
      currentRoom.characters
    ]);

    switch (result.type) {
      case "found": {
        const entity = result.entity;
        let context = "";
        if (currentRoom.items && Object.values(currentRoom.items).includes(entity)) {
          context = "(In this room)";
        } else if (Object.values(this.inventory).includes(entity)) {
          context = "(In your inventory)";
        }
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: `${entity.description} ${context}`.trim(),
            actions,
          },
        };
      }
      case "ambiguous":
        return this.createAmbiguousState(target, result.matches, "Found multiple matches");
      case "notFound":
        return this.createNotFoundState(target);
    }
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

        // Handle special items first to check if taking is allowed
        let scoreMessage = "";
        switch (item.id) {
          case ItemIds.oldCoin:
            if (!this.inventory[ItemIds.sacredGem]?.id) {
              return this.gameOver(
                "As you reach for the cursed coin, its dark runes flare with deadly power. " +
                "Without magical protection, their ancient curse reduces you to ash."
              );
            }
            // Remove from room and add to inventory
            const { [item.id]: _coin, ...remainingCoinItems } = currentRoom.items!;
            currentRoom.items = remainingCoinItems;
            this.inventory[item.id] = item;
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
            // Remove from room and add to inventory
            const { [item.id]: _gem, ...remainingGemItems } = currentRoom.items!;
            currentRoom.items = remainingGemItems;
            this.inventory[item.id] = item;
            scoreMessage = this.addScore(20, "found a rare sacred gem");
            break;

          default:
            // Remove from room and add to inventory
            const { [item.id]: _default, ...remainingDefaultItems } = currentRoom.items!;
            currentRoom.items = remainingDefaultItems;
            this.inventory[item.id] = item;
            scoreMessage = this.addScore(5, "collected a treasure");
        }
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
        // First try exact matches in room
        const exactRoomMatch = Object.values(currentRoom.items || {}).find(
          target => target.name.toLowerCase() === targetName.toLowerCase()
        );
        if (exactRoomMatch) {
          return this.handleItemUse(item, exactRoomMatch);
        }

        // Then try exact matches in features
        const exactFeatureMatch = Object.values(currentRoom.features || {}).find(
          target => target.name.toLowerCase() === targetName.toLowerCase()
        );
        if (exactFeatureMatch) {
          return this.handleItemUse(item, exactFeatureMatch);
        }

        // If no exact matches, try partial matches
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
        if (target.id === ItemIds.crystalShard) {
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The crystal shard resonates with the wall crystals, creating a harmonious hum. While beautiful, this seems more like a natural resonance than a useful interaction.",
              actions,
            },
          };
        }
        return {
          type: "state",
          state: {
            gameState: this.formatGameState(),
            feedback: "The crystal shard pulses with protective energy. It seems designed to shield against specific magical threats in the temple.",
            actions,
          },
        };

      case ItemIds.sacredGem:
        if (target.id === ItemIds.crystalShard) {
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The sacred gem and wall crystals pulse in alternating patterns. The effect is mesmerizing but doesn't seem to serve any practical purpose.",
              actions,
            },
          };
        }
        if (target.id === ItemIds.oldCoin) {
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The sacred gem glows brightly, its protective aura ready to shield you from dark magic. This seems like the right approach to handling the cursed coin.",
              actions,
            },
          };
        }
        break;

      case ItemIds.rustySword:
        if (target.id === ItemIds.crystalShard) {
          // Remove both items from inventory as they break
          const { [ItemIds.rustySword]: _sword, ...remainingItems } = this.inventory;
          this.inventory = remainingItems;

          // Update target crystal shard description to show damage
          target.description += " The crystal has been chipped by the sword strike.";
          
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "You strike the crystal shard with the rusty sword. Both items shatter in a burst of magical energy! Perhaps attacking a magical crystal with a mundane weapon wasn't the best idea...",
              actions,
            },
          };
        }
        if (target.id === ItemIds.oldCoin) {
          // Remove the sword from inventory as it breaks
          const { [ItemIds.rustySword]: _, ...remainingItems } = this.inventory;
          this.inventory = remainingItems;
          
          // Mark the target coin as chipped
          target.description += " A chip in the edge has weakened some of the dark runes.";
          
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "You strike the coin with the rusty sword. The blade shatters on impact, but manages to chip the coin's edge, weakening some of its dark runes. Perhaps with proper magical protection, you could now handle it...",
              actions,
            },
          };
        }
        break;

      case ItemIds.torch:
        if (target.id === FeatureIds.crystalLights) {
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The eternal flame causes interesting reflections in the crystal lights, but nothing more happens.",
              actions,
            },
          };
        }
        if (target.id === ItemIds.oldCoin) {
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The eternal flame makes the coin's symbols glow brighter, but light alone won't protect you from its curse.",
              actions,
            },
          };
        }
        break;

      case ItemIds.ancientScroll:
        if (target.id === ItemIds.oldCoin) {
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The scroll contains warnings about dark artifacts, but merely reading about protection won't help. You need something with actual protective power.",
              actions,
            },
          };
        }
        if (target.id === ItemIds.crystalShard) {
          return {
            type: "state",
            state: {
              gameState: this.formatGameState(),
              feedback: "The scroll mentions crystal shards as tools of protection, but suggests they work best when empowered by sacred artifacts.",
              actions,
            },
          };
        }
        break;
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
