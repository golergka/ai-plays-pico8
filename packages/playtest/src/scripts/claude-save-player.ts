import fs from 'fs/promises'
import path from 'path'
import type { GamePlayer, SaveableGame } from '@ai-gamedev/playtest'
import type { Schema } from '@ai-gamedev/playtest'

/**
 * Options for the Claude Save Player
 */
export interface ClaudeSavePlayerOptions {
  /**
   * Path to the save directory
   */
  saveDir?: string
  
  /**
   * Game ID for the save file (used as filename prefix)
   */
  gameId?: string
}

/**
 * Player implementation designed for Claude to interact with games via save files
 * This allows Claude to play games by:
 * 1. Loading a game state from a save file
 * 2. Processing a single action
 * 3. Saving the updated state
 * 4. Displaying the result
 */
export class ClaudeSavePlayer implements GamePlayer {
  private saveDir: string
  private gameId: string
  private saveFilePath: string
  
  /**
   * Create a new Claude Save Player
   * 
   * @param options Optional configuration options
   */
  constructor(options: ClaudeSavePlayerOptions = {}) {
    this.saveDir = options.saveDir || path.join(process.cwd(), 'saves')
    this.gameId = options.gameId || 'game'
    this.saveFilePath = path.join(this.saveDir, `${this.gameId}.json`)
  }
  
  /**
   * Get an action from the player (in this case, a pre-determined action)
   * 
   * @param gameOutput Text description of current game state
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Promise resolving with a tuple of action name and the corresponding action data
   */
  async getAction<T extends Record<string, Schema<unknown>>>(
    _: string,
    actionSchemas: T
  ): Promise<[keyof T, T[keyof T] extends Schema<infer U> ? U : never]> {
    // Check if action was provided via command line arguments
    const actionArg = process.argv.find(arg => arg.startsWith('--action='))
    
    if (!actionArg) {
      throw new Error('No action provided. Use --action="action args" to specify an action.')
    }
    
    // Parse the action from command line
    const actionString = actionArg.substring('--action='.length)
    const parts = actionString.split(' ')
    const actionType = parts[0]
    const args = parts.slice(1)
    
    // Check if action exists in schema
    if (!actionType || !(actionType in actionSchemas)) {
      throw new Error(`Unknown action: ${actionType || ''}. Available actions: ${Object.keys(actionSchemas).join(', ')}`)
    }
    
    // Basic parsing for the action data
    const actionName = actionType as keyof T
    let actionData: any
    
    if (args.length === 0) {
      // No arguments provided, use empty object
      actionData = {}
    } else if (args.length === 1 && args[0]?.startsWith('{') && args[0].endsWith('}')) {
      // JSON object provided
      try {
        actionData = JSON.parse(args[0])
      } catch (e) {
        throw new Error(`Invalid JSON argument: ${args[0]}`)
      }
    } else {
      // Simple string arguments
      // For actions with a single parameter, use the entire args as the value
      
      // For simple common actions, make assumptions about parameter names
      if (actionType === 'look') {
        actionData = { target: args.join(' ') }
      } else if (actionType === 'move') {
        actionData = { direction: args.join(' ') }
      } else if (actionType === 'take' || actionType === 'drop' || actionType === 'use') {
        actionData = { item: args.join(' ') }
      } else if (actionType === 'talk') {
        actionData = { character: args.join(' ') }
      } else if (actionType === 'execute') {
        // Special handling for compact adventure
        actionData = { command: args.join(' ') }
      } else {
        // For other actions, just use one generic parameter
        actionData = { value: args.join(' ') }
      }
    }
    
    return [actionName, actionData]
  }
  
  /**
   * Load a saved game or create a new one if no save exists
   * 
   * @param game The game instance to load state into
   * @returns True if a save was loaded, false if a new game was created
   */
  async loadSaveOrCreateNew(game: SaveableGame): Promise<boolean> {
    try {
      // Create save directory if it doesn't exist
      await fs.mkdir(this.saveDir, { recursive: true })
      
      // Try to load the save file
      const saveData = await fs.readFile(this.saveFilePath, 'utf-8')
      const parsedData = JSON.parse(saveData)
      
      // Validate the save data against the game schema
      const schema = game.getSchema()
      const validationResult = schema.safeParse(parsedData)
      
      if (!validationResult.success) {
        console.error('Save file validation failed:', validationResult.error)
        throw new Error('Invalid save file format')
      }
      
      // Load the game data (actual loading would be done by the game instance)
      return true
    } catch (error) {
      // If the file doesn't exist or is invalid, start a new game
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' || 
          (error as Error).message === 'Invalid save file format') {
        return false
      }
      
      // For other errors, rethrow
      throw error
    }
  }
  
  /**
   * Save the current game state to a file
   * 
   * @param game The game instance to save
   */
  async saveGame(game: SaveableGame): Promise<void> {
    // Get the save data from the game
    const saveData = game.getSaveData()
    
    // Create the save directory if it doesn't exist
    await fs.mkdir(this.saveDir, { recursive: true })
    
    // Write the save file
    await fs.writeFile(
      this.saveFilePath, 
      JSON.stringify(saveData, null, 2),
      'utf-8'
    )
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // No cleanup needed for this player
  }
}