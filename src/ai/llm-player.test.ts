import { describe, test, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { LLMPlayer, type LLMModel } from './llm-player'

// Mock LLM model
class MockLLMModel implements LLMModel {
  private responses: string[] = []
  
  constructor(responses: string[] = []) {
    this.responses = responses
  }
  
  setResponses(responses: string[]) {
    this.responses = responses
  }
  
  async sendChatMessage(_message: string): Promise<string> {
    const response = this.responses.shift() || '{"function": "unknown", "args": {}}'
    return response
  }
}

describe('LLMPlayer', () => {
  let model: MockLLMModel
  let player: LLMPlayer
  
  // Define test action schemas
  const actionSchemas = {
    move: z.object({
      direction: z.enum(['north', 'south', 'east', 'west'])
    }),
    take: z.object({
      item: z.string()
    }),
    use: z.object({
      item: z.string(),
      target: z.string().optional()
    })
  }
  
  beforeEach(() => {
    model = new MockLLMModel()
    player = new LLMPlayer(model, {
      maxRetries: 3,
      timeout: 1000
    })
  })
  
  test('should process valid function call response', async () => {
    // Set up LLM response
    model.setResponses([
      '{"function": "move", "args": {"direction": "north"}}'
    ])
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
  })
  
  test('should handle thinking aloud before valid response', async () => {
    // Set up LLM responses - first is thinking aloud, second is valid
    model.setResponses([
      'Let me think about this. I should probably go north because...',
      '{"function": "move", "args": {"direction": "north"}}'
    ])
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
  })
  
  test('should handle invalid function structure', async () => {
    // Set up LLM responses - first has invalid structure, second is valid
    model.setResponses([
      '{"command": "move", "params": {"direction": "north"}}', // Wrong structure
      '{"function": "move", "args": {"direction": "north"}}' // Correct structure
    ])
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
  })
  
  test('should handle invalid function name', async () => {
    // Set up LLM responses - first has invalid function name, second is valid
    model.setResponses([
      '{"function": "walk", "args": {"direction": "north"}}', // Invalid function name
      '{"function": "move", "args": {"direction": "north"}}' // Correct function name
    ])
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
  })
  
  test('should handle invalid args', async () => {
    // Set up LLM responses - first has invalid args, second is valid
    model.setResponses([
      '{"function": "move", "args": {"direction": "upstairs"}}', // Invalid direction
      '{"function": "move", "args": {"direction": "north"}}' // Valid direction
    ])
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
  })
  
  test('should fail after max retries', async () => {
    // Set up 3 invalid responses (same as maxRetries)
    model.setResponses([
      'Just thinking aloud...',
      'More thinking...',
      'Even more thinking...'
    ])
    
    // Call getAction and expect it to fail
    await expect(player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )).rejects.toThrow('Failed to get valid action after 3 retries')
  })
  
  test('should handle timeout', async () => {
    // Create a slow model that takes longer than timeout
    const slowModel: LLMModel = {
      sendChatMessage: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds
        return '{"function": "move", "args": {"direction": "north"}}'
      }
    }
    
    // Create player with short timeout
    const timeoutPlayer = new LLMPlayer(slowModel, {
      maxRetries: 3,
      timeout: 100 // 100ms timeout
    })
    
    // Call getAction and expect it to timeout
    await expect(timeoutPlayer.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )).rejects.toThrow('Timeout of 100ms exceeded')
  })
})