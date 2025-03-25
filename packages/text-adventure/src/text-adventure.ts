/**
 * Text Adventure game implementation
 */
import { z } from 'zod'
import type { SaveableGame, GameState, StepResult } from './types'
import type { TextAdventureOutput, TextAdventureSaveData } from './types'
import type { GameMap } from './schema'
import { TextAdventureSaveSchema } from './types'

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
        title: "Entrance Chamber",
        description: "A dimly lit chamber with rough stone walls. Torches flicker in wall sconces.",
        exits: {
          north: "corridor"
        },
        items: [],
        characters: []
      },
      corridor: {
        id: "corridor",
        title: "Dark Corridor",
        description: "A long, dark corridor stretches before you. The air is musty.",
        exits: {
          south: "start",
          east: "treasure"
        },
        items: [],
        characters: []
      },
      treasure: {
        id: "treasure",
        title: "Treasure Chamber",
        description: "A grand chamber with golden decorations on the walls. Ancient treasures lie scattered about.",
        exits: {
          west: "corridor"
        },
        items: ["golden_chalice"],
        characters: []
      }
    }
  };

  private gameMap: GameMap | null = null
  private currentRoomId: string = ''
  private inventory: string[] = []
  private visitedRooms: Set<string> = new Set()
  
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
    const parts: string[] = []
    
    if (output.title) {
      parts.push(`# ${output.title}`)
    }
    
    parts.push(output.description)
    
    if (output.feedback) {
      parts.push(`\n${output.feedback}`)
    }
    
    if (output.items && output.items.length > 0) {
      parts.push(`\nItems: ${output.items.join(', ')}`)
    }
    
    if (output.exits && output.exits.length > 0) {
      parts.push(`\nExits: ${output.exits.join(', ')}`)
    }
    
    if (output.characters && output.characters.length > 0) {
      parts.push(`\nCharacters: ${output.characters.join(', ')}`)
    }
    
    return parts.join('\n')
  }
  
  /**
   * Start the game
   */
  async start(): Promise<GameState> {
    if (!this.gameMap) throw new Error("Game not initialized");
    
    const currentRoom = this.gameMap.rooms[this.currentRoomId];
    const availableExits = Object.keys(currentRoom.exits);
    
    const output: TextAdventureOutput = {
      title: currentRoom.title,
      description: currentRoom.description,
      exits: availableExits,
      items: currentRoom.items,
      characters: currentRoom.characters
    };
    
    return {
      output: this.formatOutput(output),
      actions: {
        look: z.object({
          target: z.string().describe('What to look at')
        }).describe('Look at something in the environment'),
        move: z.object({
          direction: z.enum(availableExits as [string, ...string[]])
            .describe('Direction to move')
        }).describe('Move in a direction')
      }
    };
  }
  
  /**
   * Process a game step
   */
  async step(action: [string, unknown]): Promise<StepResult> {
    // TODO: actually process action data
    const [actionType, _actionData] = action
    
    // Define basic action schemas for next state
    const lookSchema = z.object({
      target: z.string().describe('What to look at')
    }).describe('Look at something in the environment')
    
    const moveSchema = z.object({
      direction: z.string().describe('Direction to move (north, south, east, west)')
    }).describe('Move in a direction')
    
    // Simple action handling
    if (actionType === 'look') {
      const output: TextAdventureOutput = {
        title: 'Looking',
        description: 'You see nothing special.',
        feedback: 'Try looking in a specific direction.'
      }
      
      return {
        type: 'state',
        state: {
          output: this.formatOutput(output),
          actions: {
            look: lookSchema,
            move: moveSchema
          }
        }
      }
    } else if (actionType === 'move') {
      const moveData = actionData as { direction: string };
      const currentRoom = this.gameMap!.rooms[this.currentRoomId];
      
      if (currentRoom.exits[moveData.direction]) {
        const newRoomId = currentRoom.exits[moveData.direction];
        const newRoom = this.gameMap!.rooms[newRoomId];
        this.currentRoomId = newRoomId;
        this.visitedRooms.add(newRoomId);
        
        const output: TextAdventureOutput = {
          title: newRoom.title,
          description: newRoom.description,
          feedback: `You move ${moveData.direction}.`,
          exits: Object.keys(newRoom.exits),
          items: newRoom.items,
          characters: newRoom.characters
        };
        
        return {
          type: 'state',
          state: {
            output: this.formatOutput(output),
            actions: {
              look: z.object({
                target: z.string().describe('What to look at')
              }).describe('Look at something in the environment'),
              move: z.object({
                direction: z.enum(Object.keys(newRoom.exits) as [string, ...string[]])
                  .describe('Direction to move')
              }).describe('Move in a direction')
            }
          }
        };
      } else {
        return {
          type: 'state',
          state: {
            output: this.formatOutput({
              title: currentRoom.title,
              description: currentRoom.description,
              feedback: `You cannot move ${moveData.direction} from here.`,
              exits: Object.keys(currentRoom.exits),
              items: currentRoom.items,
              characters: currentRoom.characters
            }),
            actions: {
              look: z.object({
                target: z.string().describe('What to look at')
              }).describe('Look at something in the environment'),
              move: z.object({
                direction: z.enum(Object.keys(currentRoom.exits) as [string, ...string[]])
                  .describe('Direction to move')
              }).describe('Move in a direction')
            }
          }
        };
      }
    }
    
    // Default return for unrecognized actions
    const output: TextAdventureOutput = {
      title: 'Error',
      description: 'Action not recognized.',
      feedback: 'Please try a different action.'
    }
    
    return {
      type: 'state',
      state: {
        output: this.formatOutput(output),
        actions: {
          look: lookSchema,
          move: moveSchema
        }
      }
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
    return TextAdventureSaveSchema
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
        rooms: {}
      }
    }
  }
}
