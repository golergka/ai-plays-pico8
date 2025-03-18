import readline from 'node:readline'

/**
 * Options for terminal UI
 */
export interface TerminalUIOptions {
  /**
   * Custom input stream (defaults to process.stdin)
   */
  input?: NodeJS.ReadableStream
  
  /**
   * Custom output stream (defaults to process.stdout)
   */
  output?: NodeJS.WritableStream
}

/**
 * Terminal user interface for interacting with the player
 */
export class TerminalUI {
  private rl: readline.Interface
  
  /**
   * Create a new terminal UI
   * 
   * @param options Optional configuration options
   */
  constructor(options: TerminalUIOptions = {}) {
    this.rl = readline.createInterface({
      input: options.input || process.stdin,
      output: options.output || process.stdout
    })
  }
  
  /**
   * Display text output to the terminal
   * 
   * @param text Text to display
   */
  display(text: string): void {
    console.log(text)
  }
  
  /**
   * Display a decorated header
   * 
   * @param text Header text
   */
  displayHeader(text: string): void {
    console.log('\n' + '='.repeat(text.length + 4))
    console.log(`= ${text} =`)
    console.log('='.repeat(text.length + 4) + '\n')
  }
  
  /**
   * Display error message
   * 
   * @param text Error text
   */
  displayError(text: string): void {
    console.error(`\x1b[31mError: ${text}\x1b[0m`)
  }
  
  /**
   * Display help text
   * 
   * @param commands Available commands
   */
  displayHelp(commands: Record<string, string>): void {
    this.displayHeader('Available Commands')
    
    for (const [command, description] of Object.entries(commands)) {
      console.log(`\x1b[33m${command}\x1b[0m: ${description}`)
    }
    
    console.log('')
  }
  
  /**
   * Prompt user for input
   * 
   * @param prompt Prompt text
   * @returns Promise resolving with user input
   */
  async prompt(prompt: string): Promise<string> {
    return new Promise<string>(resolve => {
      this.rl.question(`${prompt} `, answer => {
        resolve(answer.trim())
      })
    })
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.rl.close()
  }
}