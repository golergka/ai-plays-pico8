/**
 * Text Adventure game implementation
 */
import { z } from 'zod'
import type { Game, GameState, StepResult } from './types'
import type { TextAdventureOutput } from './types'
import type { GameMap, Room } from './schema'
import { createFunctionSchema, Schema } from '@ai-gamedev/playtest/src/schema/utils'

/**
 * Game that implements the Text Adventure mechanics
 */
export class TextAdventure implements Game {
  private gameMap: GameMap | null = null
  private currentRoomId: string = ''
  private inventory: string[] = []
  private visitedRooms: Set<string> = new Set()
  
  /**
   * Initialize the game
   */
  async initialize(): Promise<void> {
    // Implementation would load a game map
    this.gameMap = null
    this.currentRoomId = ''
    this.inventory = []
    this.visitedRooms = new Set()
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
    // Define basic action schemas
    const lookSchema = z.object({
      target: z.string().describe('What to look at')
    }).describe('Look at something in the environment')
    
    const moveSchema = z.object({
      direction: z.string().describe('Direction to move (north, south, east, west)')
    }).describe('Move in a direction')
    
    // Build the game output
    const output: TextAdventureOutput = {
      title: 'Text Adventure',
      description: 'You are in a simple room with exits to the north and east.',
      feedback: 'The game has started. Look around to explore.'
    }
    
    // Return initial game state
    return {
      output: this.formatOutput(output),
      actions: {
        look: lookSchema,
        move: moveSchema
      }
    }
  }
  
  /**
   * Process a game step
   */
  async step(action: [string, unknown]): Promise<StepResult> {
    const [actionType, actionData] = action
    
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
      const output: TextAdventureOutput = {
        title: 'Moving',
        description: 'You move to a new area.',
        feedback: 'You can continue exploring.'
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
}