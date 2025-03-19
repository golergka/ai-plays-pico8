#!/usr/bin/env bun
/**
 * Command line interface for the AI Plays Text Game project
 */
import { playAiGame } from './src/play-ai'
import { playHumanGame } from './src/play-human'
import { playClaudeGame } from './src/play-claude'
import path from 'path'

async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'help'
  const gameType = args[1] || 'text-adventure'
  const model = args[2] || 'gpt-4'
  const maxRetries = args[3] ? parseInt(args[3], 10) : 3
  const maxSteps = args[4] ? parseInt(args[4], 10) : 10
  const saveDir = path.join(process.cwd(), 'saves')

  if (mode === 'help' || mode === '--help' || mode === '-h') {
    console.log('AI Plays Text Game')
    console.log('Usage: ai-gamedev-play [mode] [game-type] [additional options]')
    console.log('\nModes:')
    console.log('  human    - Play a game with human input')
    console.log('  ai       - Play a game with AI input')
    console.log('  claude   - Play a game with Claude using save files')
    console.log('  help     - Show this help message')
    console.log('\nGame Types:')
    console.log('  text-adventure   - Text adventure game')
    console.log('  compact-adventure - Compact version of text adventure')
    console.log('\nAI Options (for "ai" mode):')
    console.log('  model       - AI model to use (default: gpt-4)')
    console.log('  max-retries - Max retries for invalid responses (default: 3)')
    console.log('  max-steps   - Max steps before forced termination (default: 10)')
    console.log('\nClaude Options (for "claude" mode):')
    console.log('  --action="command args" - The action to perform (required)')
    console.log('\nExamples:')
    console.log('  ai-gamedev-play human text-adventure - Play text adventure as human')
    console.log('  ai-gamedev-play ai compact-adventure gpt-4 3 15 - Play compact adventure with AI')
    console.log('  ai-gamedev-play claude text-adventure --action="look" - Claude performs a look action')
    console.log('  ai-gamedev-play claude compact-adventure --action="move north" - Claude moves north')
    return
  }

  if (mode === 'human') {
    await playHumanGame({ gameType })
  } else if (mode === 'ai') {
    await playAiGame({ gameType, model, maxRetries, maxSteps })
  } else if (mode === 'claude') {
    await playClaudeGame({ gameType, saveDir })
  } else {
    console.error(`Unknown mode: ${mode}`)
    console.log('Run with --help for usage information')
    process.exit(1)
  }
}

// Start the application
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})