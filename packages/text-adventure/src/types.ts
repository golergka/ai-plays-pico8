/**
 * Text adventure game types
 */
import type { 
  Game, 
  GameState, 
  GameResult, 
  StepResult, 
  ActionSchemas 
} from '@ai-gamedev/playtest/src/types/game'

// Re-export types from playtest
export type { Game, GameState, GameResult, StepResult, ActionSchemas }

// Game-specific types for text adventure
export type TextAdventureOutput = {
  title?: string
  description: string
  feedback?: string
  items?: string[]
  exits?: string[]
  characters?: string[]
}