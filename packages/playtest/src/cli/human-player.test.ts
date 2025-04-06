import { describe, it, expect, beforeEach } from 'vitest'
import { HumanPlayer } from './human-player'
import { MockTerminalUI } from './mock-terminal-ui'
import { z } from '../schema/utils'

describe('HumanPlayer', () => {
  // Setup test variables
  let mockUI: MockTerminalUI
  let humanPlayer: HumanPlayer
  
  // Sample action schemas
  const actionSchemas = {
    look: z.object({
      target: z.string().optional()
    }),
    go: z.object({
      direction: z.string()
    }),
    take: z.object({
      item: z.string()
    }),
    inventory: z.object({})
  }
  
  // Reset mock UI before each test
  beforeEach(() => {
    mockUI = new MockTerminalUI()
    humanPlayer = new HumanPlayer({ terminalUI: mockUI })
  })
  
  it('displays game output to the terminal UI (expected to work — do not commit before fixing)', async () => {
    // Setup
    const gameOutput = 'You are in a dark room. There is a door to the north.'
    mockUI.queueResponses(['inventory'])
    
    // Act
    await humanPlayer.askForAction(gameOutput, actionSchemas)
    
    // Assert
    expect(mockUI.outputs).toContain(gameOutput)
  })
  
  it('handles help command correctly (expected to work — do not commit before fixing)', async () => {
    // Setup
    mockUI.queueResponses(['help', 'inventory'])
    
    // Act
    await humanPlayer.askForAction('Game state', actionSchemas)
    
    // Assert
    expect(mockUI.helpCommands.length).toBe(1)
    const helpCommands = mockUI.helpCommands[0]
    expect(helpCommands).toHaveProperty('help')
    expect(helpCommands).toHaveProperty('look')
    expect(helpCommands).toHaveProperty('go')
    expect(helpCommands).toHaveProperty('take')
    expect(helpCommands).toHaveProperty('inventory')
  })
  
  it('handles unknown actions correctly (expected to work — do not commit before fixing)', async () => {
    // Setup
    mockUI.queueResponses(['unknown', 'inventory'])
    
    // Act
    await humanPlayer.askForAction('Game state', actionSchemas)
    
    // Assert
    expect(mockUI.errors.length).toBe(1)
    expect(mockUI.errors[0]).toContain('Unknown action: unknown')
  })
  
  it('parses simple actions without parameters correctly (expected to work — do not commit before fixing)', async () => {
    // Setup
    mockUI.queueResponses(['inventory'])
    
    // Act
    const [action, data] = await humanPlayer.askForAction('Game state', actionSchemas)
    
    // Assert
    expect(action).toBe('inventory')
    expect(data).toEqual({})
  })
  
  it('parses actions with required parameters correctly (expected to work — do not commit before fixing)', async () => {
    // Setup
    mockUI.queueResponses(['go north'])
    
    // Act
    const [action, data] = await humanPlayer.askForAction('Game state', actionSchemas)
    
    // Assert
    expect(action).toBe('go')
    expect(data).toEqual({ direction: 'north' })
  })
  
  it('parses actions with multiple word parameters correctly (expected to work — do not commit before fixing)', async () => {
    // Setup
    mockUI.queueResponses(['take rusty key'])
    
    // Act
    const [action, data] = await humanPlayer.askForAction('Game state', actionSchemas)
    
    // Assert
    expect(action).toBe('take')
    expect(data).toEqual({ item: 'rusty key' })
  })
  
  it('handles invalid parameters by prompting for input (expected to work — do not commit before fixing)', async () => {
    // Setup - not providing required parameter initially
    mockUI.queueResponses(['go', 'north'])
    
    // Act
    const [action, data] = await humanPlayer.askForAction('Game state', actionSchemas)
    
    // Assert
    expect(action).toBe('go')
    expect(data).toEqual({ direction: 'north' })
    expect(mockUI.prompts.length).toBe(2) // Initial prompt + parameter prompt
    expect(mockUI.prompts[1]).toContain('direction')
  })
  
  it('handles JSON-like input as a string (expected to work — do not commit before fixing)', async () => {
    // Setup - providing input that looks like JSON but will be treated as a string
    mockUI.queueResponses(['go {"direction":"west"}'])
    
    // Act
    const [action, data] = await humanPlayer.askForAction('Game state', actionSchemas)
    
    // Assert
    expect(action).toBe('go')
    // The current implementation treats the entire string as the direction
    expect(data).toEqual({ direction: '{"direction":"west"}' })
  })
  
  it('handles incomplete input as a single string (expected to work — do not commit before fixing)', async () => {
    // Setup - providing input that is treated as a single string
    mockUI.queueResponses(['go {"direction":"east'])
    
    // Act
    const [action, data] = await humanPlayer.askForAction('Game state', actionSchemas)
    
    // Assert
    // The current implementation treats the entire text as a single string for the direction parameter
    expect(action).toBe('go')
    expect(data).toEqual({ direction: '{"direction":"east' })
    // No extra prompts since the direction parameter is already provided, even though invalid JSON
    expect(mockUI.prompts.length).toBe(1) 
  })
  
  it('cleans up resources properly (expected to work — do not commit before fixing)', async () => {
    // Setup
    mockUI.queueResponses(['inventory'])
    await humanPlayer.askForAction('Game state', actionSchemas)
    
    // Act
    await humanPlayer.cleanup()
    
    // Assert
    expect(mockUI.cleanupCalls).toBe(1)
  })
  
  it('simulates a complete game session with multiple actions (expected to work — do not commit before fixing)', async () => {
    // Setup - queue multiple actions
    mockUI.queueResponses([
      'look',
      'go north',
      'look',
      'take key',
      'go south',
      'look',
      'help',
      'inventory'
    ])
    
    // Simple game simulation with predefined outputs
    await testCompleteGameSession()
    
    // Assert UI interactions at the end
    expect(mockUI.outputs.length).toBe(7) // 7 actions (help doesn't add new output)
    expect(mockUI.helpCommands.length).toBe(1) // One help display from help command
  })
  
  // Helper function to test a complete game session
  async function testCompleteGameSession() {
    // Simulate the look action
    let result = await humanPlayer.askForAction('You are in a dark room. There is a door to the north.', actionSchemas)
    expect(result[0]).toBe('look')
    expect(result[1]).toEqual({})
    
    // Simulate the go north action
    result = await humanPlayer.askForAction('You see a door to the north.', actionSchemas)
    expect(result[0]).toBe('go')
    expect(result[1]).toEqual({ direction: 'north' })
    
    // Simulate the look action in new location
    result = await humanPlayer.askForAction('You are in a hallway. There is a key on the ground.', actionSchemas)
    expect(result[0]).toBe('look')
    expect(result[1]).toEqual({})
    
    // Simulate the take key action
    result = await humanPlayer.askForAction('You see a shiny key on the ground.', actionSchemas)
    expect(result[0]).toBe('take')
    expect(result[1]).toEqual({ item: 'key' })
    
    // Simulate the go south action
    result = await humanPlayer.askForAction('You have picked up the key.', actionSchemas)
    expect(result[0]).toBe('go')
    expect(result[1]).toEqual({ direction: 'south' })
    
    // Simulate the look action back in original location
    result = await humanPlayer.askForAction('You are back in the dark room.', actionSchemas)
    expect(result[0]).toBe('look')
    expect(result[1]).toEqual({})
    
    // Simulate the help command followed by inventory
    result = await humanPlayer.askForAction('You look around the dark room.', actionSchemas)
    expect(result[0]).toBe('inventory')
    expect(result[1]).toEqual({})
  }
})