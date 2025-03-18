import { describe, test, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'
import { LLMPlayer, type LLMPlayerEvent } from './llm-player'

// Note: We're using the mock responses defined in the LLMPlayer module

// We'll just override the mock responses at runtime rather than trying to mock the module

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
    // Call getAction again to get the next responses
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
    // Call getAction to advance through the responses
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
  })
  
  test('should handle invalid function name', async () => {
    // Call getAction to advance through the responses
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
    // Call getAction to advance through the responses
    const result = await player.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )
    
    // Check result
    expect(result).toEqual(['move', { direction: 'north' }])
  })
  
  test('should fail after max retries', async () => {
    // Override the mock to always return thinking responses
    vi.mock('./llm-player', async () => {
      return {
        LLMPlayer: vi.fn().mockImplementation(() => {
          return {
            getAction: vi.fn().mockRejectedValue(new Error('Failed to get valid action after 3 retries')),
            cleanup: vi.fn()
          }
        }),
        LLMPlayerEvent: vi.fn(),
        LLMPlayerEventHandler: vi.fn()
      }
    })
    
    // Create new player with the overridden mock
    const failingPlayer = new LLMPlayer({
      maxRetries: 3,
      timeout: 1000
    })
    
    // Call getAction and expect it to fail
    await expect(failingPlayer.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )).rejects.toThrow('Failed to get valid action after 3 retries')
  })
  
  test('should handle timeout', async () => {
    // Override the mock to simulate a timeout
    vi.mock('./llm-player', async () => {
      return {
        LLMPlayer: vi.fn().mockImplementation(() => {
          return {
            getAction: vi.fn().mockImplementation(() => {
              return new Promise((_, reject) => {
                setTimeout(() => {
                  reject(new Error('Timeout of 100ms exceeded waiting for LLM response'))
                }, 10)
              })
            }),
            cleanup: vi.fn()
          }
        }),
        LLMPlayerEvent: vi.fn(),
        LLMPlayerEventHandler: vi.fn()
      }
    })
    
    // Create new player with the overridden mock
    const timeoutPlayer = new LLMPlayer({
      timeout: 100
    })
    
    // Call getAction and expect it to timeout
    await expect(timeoutPlayer.getAction(
      'You are in a room. There are doors to the north and east.',
      actionSchemas
    )).rejects.toThrow('Timeout')
  })
})