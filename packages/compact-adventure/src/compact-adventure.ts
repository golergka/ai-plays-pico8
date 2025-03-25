/**
 * Compact text adventure game implementation
 */
import { TextAdventure } from '@ai-gamedev/text-adventure'
import type { GameState, StepResult, SaveableGame } from '@ai-gamedev/playtest'
import { z } from 'zod'

/**
 * A more compact version of the text adventure game with simplified mechanics
 * Inherits SaveableGame interface from TextAdventure
 */
export class CompactTextAdventure extends TextAdventure implements SaveableGame {
  // Additional state specific to compact adventure
  private lastCommand: string = ''
  
  /**
   * Initialize the game
   */
  override async initialize(): Promise<void> {
    await super.initialize()
    // Add compact-specific initialization
    this.lastCommand = ''
  }
  
  /**
   * Start the game with compact-specific configuration
   */
  override async start(): Promise<GameState> {
    // We'll override the parent class behavior for simplicity
    return {
      output: `# Compact Adventure
      
Welcome to the compact text adventure game. Type simple commands to interact with the world.

You are in a small room with a door to the north.`,
      actions: {
        look: z.object({}).describe('Look around the room'),
        go: z.object({
          direction: z.string().describe('The direction to go (e.g., "north", "south", "east", "west")')
        }).describe('Move in a direction'),
        take: z.object({
          item: z.string().describe('The item to take')
        }).describe('Take an item')
      }
    }
  }
  
  /**
   * Process a game step with simplified command parsing
   */
  override async step(action: [string, unknown]): Promise<StepResult> {
    const [actionType, actionData] = action
    
    // Store the last command
    this.lastCommand = actionType
    
    // Define the actions available for the next state
    const nextActions = {
      look: z.object({}).describe('Look around the room'),
      go: z.object({
        direction: z.string().describe('The direction to go (e.g., "north", "south", "east", "west")')
      }).describe('Move in a direction'),
      take: z.object({
        item: z.string().describe('The item to take')
      }).describe('Take an item')
    }
    
    // Process different action types
    if (actionType === 'look') {
      return {
        type: 'state',
        state: {
          output: `You look around the compact room. It's small but cozy.`,
          actions: nextActions
        }
      }
    }
    
    if (actionType === 'go') {
      const { direction } = actionData as { direction: string }
      const lowerDirection = direction.toLowerCase()
      
      if (lowerDirection === 'north') {
        return {
          type: 'state',
          state: {
            output: `You move north into a small corridor.`,
            actions: nextActions
          }
        }
      } else {
        return {
          type: 'state',
          state: {
            output: `You can't go ${direction} from here.`,
            actions: nextActions
          }
        }
      }
    }
    
    if (actionType === 'take') {
      const { item } = actionData as { item: string }
      return {
        type: 'state',
        state: {
          output: `There is no ${item} here to take.`,
          actions: nextActions
        }
      }
    }
    
    // Fallback response for unrecognized action types
    return {
      type: 'state',
      state: {
        output: `Command not recognized. Please try a valid action.`,
        actions: nextActions
      }
    }
  }
  
  /**
   * Override getSaveData to include compact-specific state
   * @returns Enhanced save data that includes compact-specific state
   */
  override getSaveData(): ReturnType<TextAdventure['getSaveData']> & { lastCommand: string, gameType: 'compact' } {
    // Get the base save data from the parent class
    const baseSaveData = super.getSaveData()
    
    // Add compact-specific data
    return {
      ...baseSaveData,
      lastCommand: this.lastCommand,
      gameType: 'compact' as const
    }
  }
}