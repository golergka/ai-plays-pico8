/**
 * Compact text adventure game package
 */

// Re-export types from text-adventure package
export * from '@ai-gamedev/text-adventure'

// Export the compact game class and utilities
export { CompactTextAdventure } from './src/compact-adventure'
export { createCompactAdventureFromSave } from './src/utils'