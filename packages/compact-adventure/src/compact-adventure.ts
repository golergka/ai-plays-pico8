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
  async initialize(): Promise<void> {
    await super.initialize()
    // Add compact-specific initialization
    this.lastCommand = ''
  }
  
  /**
   * Start the game with compact-specific configuration
   */
  async start(): Promise<GameState> {
    // We'll override the parent class behavior for simplicity
    const actionSchema = z.object({
      command: z.string().describe('The command to execute (e.g., "go north", "look", "take key")')
    }).describe('Execute a text adventure command')
    
    return {
      output: `# Compact Adventure
      
Welcome to the compact text adventure game. Type simple commands to interact with the world.

You are in a small room with a door to the north.`,
      actions: {
        execute: actionSchema
      }
    }
  }
  
  /**
   * Process a game step with simplified command parsing
   */
  async step(action: [string, unknown]): Promise<StepResult> {
    const [actionType, actionData] = action
    
    // Define our action schema for the next step
    const actionSchema = z.object({
      command: z.string().describe('The command to execute (e.g., "go north", "look", "take key")')
    }).describe('Execute a text adventure command')
    
    // Simple command processing
    if (actionType === 'execute') {
      const { command } = actionData as { command: string }
      const lowerCommand = command.toLowerCase()
      
      // Store the last command
      this.lastCommand = command
      
      if (lowerCommand.includes('look')) {
        return {
          type: 'state',
          state: {
            output: `You look around the compact room. It's small but cozy.`,
            actions: {
              execute: actionSchema
            }
          }
        }
      }
      
      if (lowerCommand.includes('go') || lowerCommand.includes('move') || lowerCommand.includes('north')) {
        return {
          type: 'state',
          state: {
            output: `You move north into a small corridor.`,
            actions: {
              execute: actionSchema
            }
          }
        }
      }
      
      // Default response for unrecognized commands
      return {
        type: 'state',
        state: {
          output: `I don't understand "${command}". Try simple commands like "look" or "go north".`,
          actions: {
            execute: actionSchema
          }
        }
      }
    }
    
    // Fallback response
    return {
      type: 'state',
      state: {
        output: `Command not recognized. Please try again.`,
        actions: {
          execute: actionSchema
        }
      }
    }
  }
  
  /**
   * Override getSaveData to include compact-specific state
   * @returns Enhanced save data that includes compact-specific state
   */
  getSaveData(): ReturnType<TextAdventure['getSaveData']> & { lastCommand: string, gameType: 'compact' } {
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