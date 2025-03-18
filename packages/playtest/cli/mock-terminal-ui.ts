import type { ITerminalUI } from './i-terminal-ui'

/**
 * Mock implementation of ITerminalUI for testing
 * Records all interactions and provides predefined responses
 */
export class MockTerminalUI implements ITerminalUI {
  /**
   * Captured outputs from display() calls
   */
  public outputs: string[] = []
  
  /**
   * Captured headers from displayHeader() calls
   */
  public headers: string[] = []
  
  /**
   * Captured errors from displayError() calls
   */
  public errors: string[] = []
  
  /**
   * Captured help commands from displayHelp() calls
   */
  public helpCommands: Record<string, string>[] = []
  
  /**
   * Captured prompts from prompt() calls
   */
  public prompts: string[] = []
  
  /**
   * Number of times cleanup() was called
   */
  public cleanupCalls: number = 0
  
  /**
   * Predefined responses for prompt() calls
   * Each call to prompt() will take the next response from this queue
   */
  private responseQueue: string[] = []

  /**
   * Reset all captured data
   */
  reset(): void {
    this.outputs = []
    this.headers = []
    this.errors = []
    this.helpCommands = []
    this.prompts = []
    this.cleanupCalls = 0
    this.responseQueue = []
  }
  
  /**
   * Queue responses to be returned by prompt() calls
   * 
   * @param responses Array of responses to queue
   */
  queueResponses(responses: string[]): void {
    this.responseQueue.push(...responses)
  }
  
  /**
   * Display text output
   * 
   * @param text Text to display
   */
  display(text: string): void {
    this.outputs.push(text)
  }
  
  /**
   * Display a decorated header
   * 
   * @param text Header text
   */
  displayHeader(text: string): void {
    this.headers.push(text)
  }
  
  /**
   * Display error message
   * 
   * @param text Error text
   */
  displayError(text: string): void {
    this.errors.push(text)
  }
  
  /**
   * Display help text
   * 
   * @param commands Available commands
   */
  displayHelp(commands: Record<string, string>): void {
    this.helpCommands.push({...commands})
  }
  
  /**
   * Prompt user for input
   * Returns the next queued response or throws if none are available
   * 
   * @param prompt Prompt text
   * @returns Promise resolving with simulated user input
   */
  async prompt(prompt: string): Promise<string> {
    this.prompts.push(prompt)
    
    if (this.responseQueue.length === 0) {
      throw new Error('No responses queued in MockTerminalUI')
    }
    
    return Promise.resolve(this.responseQueue.shift() as string)
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.cleanupCalls++
  }
}