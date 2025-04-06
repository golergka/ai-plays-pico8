import type { InputOutput } from '../types'
import type { Schema } from '../schema/utils'
import type { ITerminalUI } from './i-terminal-ui'
import { TerminalUI } from './terminal-ui'
import { toJsonSchema } from '../schema/utils'

/**
 * Options for the human player
 */
export interface HumanPlayerOptions {
  /**
   * Custom terminal UI instance (creates a new one if not provided)
   */
  terminalUI?: ITerminalUI
  
  /**
   * Whether to show detailed help for actions
   */
  showHelp?: boolean
}

/**
 * Human player implementation that allows playing games from the terminal
 */
export class HumanPlayer implements InputOutput {
  private terminalUI: ITerminalUI
  private showHelp: boolean
  
  /**
   * Create a new human player
   * 
   * @param options Optional configuration options
   */
  constructor(options: HumanPlayerOptions = {}) {
    this.terminalUI = options.terminalUI || new TerminalUI()
    this.showHelp = options.showHelp !== undefined ? options.showHelp : true
  }

  /**
   * Get an action from the human player based on game output and action schemas
   * 
   * @param gameOutput Text description of current game state
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Promise resolving with a tuple of action name and the corresponding action data
   */
  async askForAction<T extends Record<string, Schema<any>>>(
    gameState: string,
    feedback: string,
    actionSchemas: T
  ): Promise<[keyof T, T[keyof T] extends Schema<infer U> ? U : never]> {
    const gameOutput = `${gameState}\n\n${feedback}`
    this.terminalUI.displayHeader('Game State')

    // Display game output
    this.terminalUI.display(gameOutput)
    
    // Generate help text for available actions
    const actionDescriptions = this.generateActionHelp(actionSchemas)
    
    // Get player input
    let validAction = false
    let actionName: keyof T | null = null
    let actionData: any = null
    
    while (!validAction) {
      try {
        // Get input from the player
        const input = await this.terminalUI.prompt('Enter action:')
        
        // Handle help command
        if (input.toLowerCase() === 'help') {
          this.terminalUI.displayHelp(actionDescriptions)
          continue
        }
        
        // Parse the input to get action name and arguments
        const parts = input.split(' ')
        const inputActionName = parts[0]
        const args = parts.slice(1)
        
        // Check if the action exists
        if (!inputActionName || !(inputActionName in actionSchemas)) {
          this.terminalUI.displayError(`Unknown action: ${inputActionName || ''}`)
          if (this.showHelp) {
            this.terminalUI.displayHelp(actionDescriptions)
          }
          continue
        }
        
        // Set the action name
        actionName = inputActionName as keyof T
        
        // Parse the arguments based on the schema
        const schema = actionSchemas[actionName]
        if (!schema) {
          throw new Error(`Schema not found for action: ${String(actionName)}`)
        }
        actionData = await this.parseActionArguments(args, schema)
        
        validAction = true
      } catch (error) {
        this.terminalUI.displayError((error as Error).message)
        if (this.showHelp) {
          this.terminalUI.displayHelp(actionDescriptions)
        }
      }
    }
    
    if (actionName === null || actionData === null) {
      throw new Error('Failed to get valid action')
    }
    
    return [actionName, actionData]
  }
  
  outputResult(text: string): void {
    this.terminalUI.displayHeader('Game Finished');
    this.terminalUI.display(text)
  }
  
  /**
   * Parse action arguments based on the schema
   * 
   * @param args Arguments from the command line
   * @param schema Schema for the action
   * @returns Parsed and validated action data
   */
  private async parseActionArguments(
    args: string[],
    schema: Schema<any>
  ): Promise<any> {
    // Get the schema definition
    const jsonSchema = toJsonSchema(schema) as any
    
    // Extract properties and required fields, handling potential undefined values
    const properties = jsonSchema.properties as Record<string, any> || {}
    const requiredProps = (jsonSchema.required as string[]) || []
    
    // If the schema is empty (has no properties), return an empty object
    if (Object.keys(properties).length === 0) {
      return {}
    }
    
    // For simple actions with just one required property, use the entire args array as the value
    if (requiredProps.length === 1 && args.length > 0) {
      const propName = requiredProps[0]
      if (typeof propName === 'string') {
        return { [propName]: args.join(' ') }
      }
    }
    
    // For more complex actions, try to parse the arguments as a JSON string
    if (args.length === 1 && args[0] && args[0].startsWith('{') && args[0].endsWith('}')) {
      try {
        return JSON.parse(args[0])
      } catch (e) {
        throw new Error(`Invalid JSON: ${args[0]}`)
      }
    }
    
    // If simple parsing fails, interactively ask for each required property
    const result: Record<string, any> = {}
    
    // For each required property, prompt the user for a value
    for (const propName of requiredProps) {
      const propSchema = properties[propName] || { type: 'string' }
      const propType = propSchema.type || 'string'
      const propPrompt = `Enter ${propName} (${propType}):` 
      
      // Get the value from the user
      const value = await this.terminalUI.prompt(propPrompt)
      
      // Parse the value based on the type
      if (propType === 'number') {
        result[propName] = Number(value)
      } else if (propType === 'boolean') {
        result[propName] = value.toLowerCase() === 'true'
      } else {
        result[propName] = value
      }
    }
    
    return result
  }
  
  /**
   * Generate help text for available actions
   * 
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Record of action names to descriptions
   */
  private generateActionHelp<T extends Record<string, Schema<any>>>(
    actionSchemas: T
  ): Record<string, string> {
    const actionDescriptions: Record<string, string> = {
      help: 'Show available commands'
    }
    
    // Generate help text for each action
    for (const [name, schema] of Object.entries(actionSchemas)) {
      const jsonSchema = toJsonSchema(schema) as any
      const properties = jsonSchema.properties as Record<string, any> || {}
      const required = (jsonSchema.required as string[]) || []
      
      // Generate help text based on the schema
      let description = ''
      
      if (Object.keys(properties).length === 0) {
        description = `${name} - No arguments needed`
      } else {
        const args = Object.entries(properties)
          .map(([propName]) => {
            const isRequired = required.includes(propName)
            return `${propName}${isRequired ? '' : ' (optional)'}`
          })
          .join(', ')
        
        description = `${name} ${args}`
      }
      
      actionDescriptions[name] = description
    }
    
    return actionDescriptions
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.terminalUI.cleanup()
  }
}