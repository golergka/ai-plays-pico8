import { describe, test, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'
import { LLMPlayer, type LLMPlayerEvent } from './llm-player'
import { Chat } from '@vercel/ai'

// Mock Vercel AI Chat
vi.mock('@vercel/ai', () => {
  return {
    Chat: vi.fn().mockImplementation(() => {
      return {
        send: vi.fn().mockImplementation(async () => {
          const response = mockResponses.shift() || '{"function": "unknown", "args": {}}'
          return response
        })
      }
    })
  }
})

// Mock responses for the AI model
let mockResponses: string[] = []

describe('LLMPlayer', () => {
  let player: LLMPlayer
  let events: LLMPlayerEvent[] = []
  
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
    // Reset mock responses
    mockResponses = []
    
    // Reset captured events
    events = []
    
    // Create LLM player with event capture
    player = new LLMPlayer({
      maxRetries: 3,
      timeout: 1000,
      onEvent: (event) => {
        events.push(event)
      }
    })
  })
  
  test('should process valid function call response', async () => {
    // Set up LLM response
    mockResponses = [
      '{"function": "move", "args": {"direction": "north"}}'
    ]
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
    
    // Check events
    expect(events.some(e => e.type === 'response')).toBe(true)
    expect(events.some(e => e.type === 'action')).toBe(true)
  })
  
  test('should handle thinking aloud before valid response', async () => {
    // Set up LLM responses - first is thinking aloud, second is valid
    mockResponses = [
      'Let me think about this. I should probably go north because...',
      '{"function": "move", "args": {"direction": "north"}}'
    ]
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
    
    // Check events
    expect(events.some(e => e.type === 'thinking')).toBe(true)
  })
  
  test('should handle invalid function structure', async () => {
    // Set up LLM responses - first has invalid structure, second is valid
    mockResponses = [
      '{"command": "move", "params": {"direction": "north"}}', // Wrong structure
      '{"function": "move", "args": {"direction": "north"}}' // Correct structure
    ]
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
    
    // Check events
    expect(events.some(e => e.type === 'thinking')).toBe(true)
  })
  
  test('should handle invalid function name', async () => {
    // Set up LLM responses - first has invalid function name, second is valid
    mockResponses = [
      '{"function": "walk", "args": {"direction": "north"}}', // Invalid function name
      '{"function": "move", "args": {"direction": "north"}}' // Correct function name
    ]
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
    
    // Check events
    expect(events.some(e => e.type === 'error')).toBe(true)
  })
  
  test('should handle invalid args', async () => {
    // Set up LLM responses - first has invalid args, second is valid
    mockResponses = [
      '{"function": "move", "args": {"direction": "upstairs"}}', // Invalid direction
      '{"function": "move", "args": {"direction": "north"}}' // Valid direction
    ]
    
    // Call getAction
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
    
    // Check events
    expect(events.some(e => e.type === 'error')).toBe(true)
  })
  
  test('should fail after max retries', async () => {
    // Set up 3 invalid responses (same as maxRetries)
    mockResponses = [
      'Just thinking aloud...',
      'More thinking...',
      'Even more thinking...'
    ]
    
    // Call getAction and expect it to fail
    await expect(player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )).rejects.toThrow('Failed to get valid action after 3 retries')
    
    // Check events
    expect(events.filter(e => e.type === 'thinking').length).toBe(3)
  })
  
  test('should handle timeout', async () => {
    // Mock Chat.send to be slow
    vi.mocked(Chat).mockImplementation(() => {
      return {
        send: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds
          return '{"function": "move", "args": {"direction": "north"}}'
        })
      }
    })
    
    // Create player with short timeout
    const timeoutPlayer = new LLMPlayer({
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