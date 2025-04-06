import readline from "node:readline";
import chalk from "chalk";
import type { ITerminalUI } from "./i-terminal-ui";

/**
 * Options for terminal UI
 */
export interface TerminalUIOptions {
  /**
   * Custom input stream (defaults to process.stdin)
   */
  input?: NodeJS.ReadableStream;

  /**
   * Custom output stream (defaults to process.stdout)
   */
  output?: NodeJS.WritableStream;

  /**
   * Whether to use colored output (defaults to true)
   */
  useColors?: boolean;
}

/**
 * Terminal user interface for interacting with the player
 * Implements the ITerminalUI interface
 */
export class TerminalUI implements ITerminalUI {
  private rl: readline.Interface;
  private useColors: boolean;

  /**
   * Create a new terminal UI
   *
   * @param options Optional configuration options
   */
  constructor(options: TerminalUIOptions = {}) {
    this.rl = readline.createInterface({
      input: options.input || process.stdin,
      output: options.output || process.stdout,
    });
    this.useColors = options.useColors !== undefined ? options.useColors : true;
  }

  /**
   * Display text output to the terminal
   *
   * @param text Text to display
   */
  display(text: string): void {
    console.log(text);
  }

  /**
   * Display a decorated header
   *
   * @param text Header text
   */
  displayTitle(text: string): void {
    console.log("\n" + "=".repeat(text.length + 4));
    console.log(`= ${text} =`);
    console.log("=".repeat(text.length + 4) + "\n");
  }

  displayHeader(text: string, level: number = 1): void {
    const header = `${"#".repeat(level)} ${text}`;
    console.log('\n');
    console.log(this.useColors ? chalk.blue(header) : header);
    console.log("\n");
  }

  /**
   * Display error message
   *
   * @param text Error text
   */
  displayError(text: string): void {
    console.error(
      this.useColors ? chalk.red(`Error: ${text}`) : `Error: ${text}`
    );
  }

  /**
   * Display help text
   *
   * @param commands Available commands
   */
  displayHelp(commands: Record<string, string>): void {
    this.displayHeader("Available Commands");

    for (const [command, description] of Object.entries(commands)) {
      if (this.useColors) {
        console.log(`${chalk.yellow(command)}: ${description}`);
      } else {
        console.log(`${command}: ${description}`);
      }
    }

    console.log("");
  }

  /**
   * Colorize text based on the specified color
   *
   * @param text Text to colorize
   * @param color Color name
   * @returns Colorized or plain text based on useColors setting
   */
  color(
    text: string,
    color: "blue" | "green" | "red" | "yellow" | "bold" | "cyan" | "gray"
  ): string {
    if (!this.useColors) return text;
    return chalk[color](text);
  }

  /**
   * Prompt user for input
   *
   * @param prompt Prompt text
   * @returns Promise resolving with user input
   */
  async prompt(prompt: string): Promise<string> {
    return new Promise<string>((resolve) => {
      this.rl.question(`${prompt} `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.rl.close();
  }
}
