/**
 * Text adventure game package
 */

// Re-export types and schemas
export * from './src/types'
export * from './src/schema'

// Copy the TextAdventure class from playtest
export { TextAdventure } from '@ai-gamedev/playtest/src/games/text-adventure'