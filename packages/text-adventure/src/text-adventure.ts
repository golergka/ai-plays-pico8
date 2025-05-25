/**
 * Text Adventure game implementation
 */
import { z } from "zod";
import type {
  SaveableGame,
  GameState,
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
import _ from "lodash";

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
export class TextAdventure implements SaveableGame<typeof actions> {
  private gameMap: GameMap = _.cloneDeep(gameMap);
  private currentRoomId: string = "";
  private inventory: Record<string, Item> = {};
  private visitedRooms: Set<string> = new Set();
  private score: number = 0;
  private gameOver: boolean = false;

  public readonly actions = actions;

  /**
   * Initialize the game
   */
  async initialize(): Promise<void> {
    this.gameMap = _.cloneDeep(gameMap);
    this.currentRoomId = this.gameMap.startRoom;
    this.inventory = {};
    this.visitedRooms = new Set([this.currentRoomId]);
    this.score = 0;
    this.gameOver = false;
  }

  public getGameState(): GameState {
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

    if (this.gameOver) {
      parts.push("Game Over");
    }

    return {
      description: parts.join("\n"),
      gameOver: this.gameOver,
    };
  }

  public callAction(
    name: keyof typeof actions,
    data: z.infer<(typeof actions)[typeof name]>,
    onResult: (result: string) => void
  ) {
    switch (name) {
      case "look":
        onResult(this.handleLook(data));
        return;
      case "move":
        onResult(this.handleMove(data));
        return;
      case "take":
        onResult(this.handleTake(data));
        return;
      case "use":
        onResult(this.handleUse(data));
        return;
      default:
        throw new Error(`Unknown action: ${name}`);
    }
  }

  private get hasTorch(): boolean {
    return ItemIds.torch in this.inventory;
  }

  private getCurrentRoom(): Room {
    const currentRoom = this.gameMap.rooms[this.currentRoomId];
    if (!currentRoom) {
      throw new Error("Current room not found");
    }
    return currentRoom;
  }

  private ambigiousFeedback(
    target: string,
    matches: Array<{ entity: Entity }>,
    context: string
  ): string {
    // Filter matches to only include entities that actually match the target name
    const relevantMatches = matches.filter(
      (m) =>
        m.entity.name.toLowerCase().includes(target.toLowerCase()) ||
        m.entity.tags.some((tag) =>
          tag.toLowerCase().includes(target.toLowerCase())
        )
    );

    return `Which ${target} do you mean? ${context}: ${relevantMatches
      .map((m) => m.entity.name)
      .join(", ")}`;
  }

  private notFoundFeedback(target: string): string {
    return `You don't see any ${target} here.`;
  }

  private findEntityWithFeedback<T extends Entity>(
    target: string,
    entities: Record<string, T> | undefined,
    context: string,
    handler: (entity: T) => string
  ): string | null {
    if (!entities) {
      return null;
    }

    const result = findEntity(target, entities);

    switch (result.type) {
      case "found":
        return handler(result.entity);
      case "ambiguous":
        return this.ambigiousFeedback(target, result.matches, context);
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
  ):
    | { type: "found"; entity: T; context?: string }
    | { type: "ambiguous"; matches: Array<{ entity: T }> }
    | { type: "notFound" } {
    const allMatches: Array<{ entity: T }> = [];

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

  private handleLook(actionData: unknown): string {
    const { target } = this.actions.look.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    // Looking at the room/around/surroundings or room name
    if (
      target === "room" ||
      target === "around" ||
      target === "surroundings" ||
      target.toLowerCase() === currentRoom.name.toLowerCase()
    ) {
      let description = currentRoom.description;

      if (currentRoom.items && Object.keys(currentRoom.items).length > 0) {
        description +=
          "\n\nYou can see: " +
          Object.values(currentRoom.items)
            .map((item) => item.name)
            .join(", ");
      }

      if (
        currentRoom.features &&
        Object.keys(currentRoom.features).length > 0
      ) {
        description +=
          "\n\nNotable features: " +
          Object.values(currentRoom.features)
            .map((feature) => feature.name)
            .join(", ");
      }

      return description;
    }

    // Looking at exits
    if (target === "exits") {
      if (!currentRoom.exits || Object.keys(currentRoom.exits).length === 0) {
        return "There are no visible exits.";
      }

      const exitDescriptions = Object.entries(currentRoom.exits)
        .map(([direction, exit]) => `${direction}: ${exit.description}`)
        .join("\n");

      return `Available exits:\n${exitDescriptions}`;
    }

    // Search across all relevant entity sets
    const result = this.findAcrossEntities(target, [
      currentRoom.features,
      currentRoom.items,
      this.inventory,
      currentRoom.characters,
    ]);

    switch (result.type) {
      case "found": {
        const entity = result.entity;
        let context = "";
        if (
          currentRoom.items &&
          Object.values(currentRoom.items).includes(entity)
        ) {
          context = "(In this room)";
        } else if (Object.values(this.inventory).includes(entity)) {
          context = "(In your inventory)";
        }

        return `${entity.description} ${context}`.trim();
      }
      case "ambiguous":
        return this.ambigiousFeedback(
          target,
          result.matches,
          "Found multiple matches"
        );
      case "notFound":
        return this.notFoundFeedback(target);
    }
  }

  private handleTake(actionData: unknown): string {
    const { item: targetItem } = this.actions.take.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    // First check if item is already in inventory
    const inventoryResult = this.findEntityWithFeedback(
      targetItem,
      this.inventory,
      "In inventory",
      (item) => `You try to take ${item.name}, but you already have it in your inventory.`
    );
    if (inventoryResult) return inventoryResult;

    // Then check room items
    return (
      this.findEntityWithFeedback(
        targetItem,
        currentRoom.items,
        "In room",
        (item) => {
          if (!item.takeable) {
            return `You can't take the ${item.name}.`;
          }

          // Handle special items first to check if taking is allowed
          let scoreMessage = "";
          switch (item.id) {
            case ItemIds.oldCoin:
              if (!this.inventory[ItemIds.sacredGem]?.id) {
                this.gameOver = true;
                return (
                  "As you reach for the cursed coin, its dark runes flare with deadly power. " +
                  "Without magical protection, their ancient curse reduces you to ash."
                );
              }
              // Remove from room and add to inventory
              const { [item.id]: _coin, ...remainingCoinItems } =
                currentRoom.items!;
              currentRoom.items = remainingCoinItems;
              this.inventory[item.id] = item;
              scoreMessage = this.addScore(
                15,
                "safely retrieved the cursed coin"
              );
              break;

            case ItemIds.goldenChalice:
              if (
                !this.inventory[ItemIds.guardBadge]?.id ||
                !this.inventory[ItemIds.oldCoin]?.id
              ) {
                this.gameOver = true;
                return (
                  "As you reach for the chalice, ancient wards flare to life. " +
                  "Without both a guard's authority and the temple's sacred coin, " +
                  "the magical defenses reduce you to ash."
                );
              }
              scoreMessage = this.addScore(
                50,
                "claimed the legendary Golden Chalice"
              );
              this.gameOver = true;

              return (
                "The guard's badge glows in recognition of your authority, " +
                "while the ancient coin resonates with the temple's magic. " +
                "The wards surrounding the chalice fade, allowing you to claim your prize.\n\n" +
                `Congratulations! You've won the game! Final score: ${this.score}`
              );

            case ItemIds.sacredGem:
              // Remove from room and add to inventory
              const { [item.id]: _gem, ...remainingGemItems } =
                currentRoom.items!;
              currentRoom.items = remainingGemItems;
              this.inventory[item.id] = item;
              scoreMessage = this.addScore(20, "found a rare sacred gem");
              break;

            default:
              // Remove from room and add to inventory
              const { [item.id]: _default, ...remainingDefaultItems } =
                currentRoom.items!;
              currentRoom.items = remainingDefaultItems;
              this.inventory[item.id] = item;
              scoreMessage = this.addScore(5, "collected a treasure");
          }
          return `You take the ${item.name}. ${scoreMessage}`;
        }
      ) ?? this.notFoundFeedback(targetItem)
    );
  }

  private handleUse(actionData: unknown): string {
    const { item: itemName, target: targetName } =
      this.actions.use.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    // Check if item is in inventory
    const itemResult = this.findEntityWithFeedback(
      itemName,
      this.inventory,
      "In inventory",
      (item) => {
        // First try exact matches in room
        const exactRoomMatch = Object.values(currentRoom.items || {}).find(
          (target) => target.name.toLowerCase() === targetName.toLowerCase()
        );
        if (exactRoomMatch) {
          return this.handleItemUse(item, exactRoomMatch);
        }

        // Then try exact matches in features
        const exactFeatureMatch = Object.values(
          currentRoom.features || {}
        ).find(
          (target) => target.name.toLowerCase() === targetName.toLowerCase()
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
        return this.notFoundFeedback(targetName);
      }
    );

    return itemResult ?? `You don't have a ${itemName} to use.`;
  }

  private handleItemUse(item: Entity, target: Entity): string {
    // Handle specific item uses
    switch (item.id) {
      case ItemIds.guardBadge:
        return "The guard badge is a symbol of authority, but it has no magical properties. It might be useful for proving your right to access certain areas.";

      case ItemIds.crystalShard:
        if (target.id === ItemIds.crystalShard) {
          return "The crystal shard resonates with the wall crystals, creating a harmonious hum. While beautiful, this seems more like a natural resonance than a useful interaction.";
        }
        return "The crystal shard pulses with protective energy. It seems designed to shield against specific magical threats in the temple.";

      case ItemIds.sacredGem:
        if (target.id === ItemIds.crystalShard) {
          return "The sacred gem and wall crystals pulse in alternating patterns. The effect is mesmerizing but doesn't seem to serve any practical purpose.";
        }
        if (target.id === ItemIds.oldCoin) {
          return "The sacred gem glows brightly, its protective aura ready to shield you from dark magic. This seems like the right approach to handling the cursed coin.";
        }
        break;

      case ItemIds.rustySword:
        if (target.id === ItemIds.crystalShard) {
          // Remove both items from inventory as they break
          const { [ItemIds.rustySword]: _sword, ...remainingItems } =
            this.inventory;
          this.inventory = remainingItems;

          // Update target crystal shard description to show damage
          target.description +=
            " The crystal has been chipped by the sword strike.";

          return "You strike the crystal shard with the rusty sword. Both items shatter in a burst of magical energy! Perhaps attacking a magical crystal with a mundane weapon wasn't the best idea...";
        }
        if (target.id === ItemIds.oldCoin) {
          // Remove the sword from inventory as it breaks
          const { [ItemIds.rustySword]: _, ...remainingItems } = this.inventory;
          this.inventory = remainingItems;

          // Mark the target coin as chipped
          target.description +=
            " A chip in the edge has weakened some of the dark runes.";

          return "You strike the coin with the rusty sword. The blade shatters on impact, but manages to chip the coin's edge, weakening some of its dark runes. Perhaps with proper magical protection, you could now handle it...";
        }
        break;

      case ItemIds.torch:
        if (target.id === FeatureIds.crystalLights) {
          return "The eternal flame causes interesting reflections in the crystal lights, but nothing more happens.";
        }
        if (target.id === ItemIds.oldCoin) {
          return "The eternal flame makes the coin's symbols glow brighter, but light alone won't protect you from its curse.";
        }
        break;

      case ItemIds.ancientScroll:
        if (target.id === ItemIds.oldCoin) {
          return "The scroll contains warnings about dark artifacts, but merely reading about protection won't help. You need something with actual protective power.";
        }
        if (target.id === ItemIds.crystalShard) {
          return "The scroll mentions crystal shards as tools of protection, but suggests they work best when empowered by sacred artifacts.";
        }
        break;
    }

    return `You can't figure out how to use the ${item.name} on the ${target.name}.`;
  }

  private handleMove(actionData: unknown): string {
    const { direction } = this.actions.move.parse(actionData);
    const currentRoom = this.getCurrentRoom();

    const exit = currentRoom.exits?.[direction];
    if (exit) {
      // Check if player has light before allowing movement
      if (
        !this.hasTorch &&
        this.currentRoomId === RoomIds.entrance &&
        direction === "north"
      ) {
        this.gameOver = true;
        return "You stumble in the dark and fall into a deep pit. " +
            "Perhaps you should find a light source before venturing deeper into the temple."
      }

      // Check for trap in meditation room
      if (
        this.currentRoomId === RoomIds.meditation &&
        direction === "west" &&
        !this.inventory[ItemIds.crystalShard]?.id
      ) {
        this.gameOver = true;
        return "As you step into the corridor, ancient magic detects your presence. " +
            "Without the crystal's protective aura, the temple's defenses activate, " +
            "and magical energy reduces you to ash."
      }

      this.currentRoomId = exit.targetRoom;
      this.visitedRooms.add(exit.targetRoom);

      return `You move ${direction}.`;
    } else {
      return `You cannot move ${direction} from here.`;
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
