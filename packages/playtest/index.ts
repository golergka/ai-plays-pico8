/**
 * Main entry point for the AI Plays Text Game project
 * Exports all types, interfaces, and utilities needed by game implementations
 */

// Core types
export * from './src/types'
export * from './src/schema/utils'

// Player implementations
export { HumanPlayer } from './src/cli/human-player'
export { LLMPlayer } from './src/ai/llm-player'
export type { LLMPlayerEvent, LLMPlayerOptions } from './src/ai/llm-player'

// UI components
export { TerminalUI } from './src/cli/terminal-ui'
export type { ITerminalUI } from './src/cli/i-terminal-ui'