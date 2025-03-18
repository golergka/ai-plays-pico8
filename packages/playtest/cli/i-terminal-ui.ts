/**
 * Interface for terminal UI implementations
 * Provides methods for displaying text and getting user input
 */
export interface ITerminalUI {
  /**
   * Display text output to the terminal
   * 
   * @param text Text to display
   */
  display(text: string): void
  
  /**
   * Display a decorated header
   * 
   * @param text Header text
   */
  displayHeader(text: string): void
  
  /**
   * Display error message
   * 
   * @param text Error text
   */
  displayError(text: string): void
  
  /**
   * Display help text
   * 
   * @param commands Available commands
   */
  displayHelp(commands: Record<string, string>): void
  
  /**
   * Prompt user for input
   * 
   * @param prompt Prompt text
   * @returns Promise resolving with user input
   */
  prompt(prompt: string): Promise<string>
  
  /**
   * Clean up resources
   */
  cleanup(): void
}