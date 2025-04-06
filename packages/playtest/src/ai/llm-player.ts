import type { InputOutput, ActionSchemas } from "../types";
import type { Schema } from "../schema/utils";
import { z } from "zod";
import {
  callOpenAI,
  type Message,
  type OpenAIResult,
  type ToolDefinition,
} from "./api";
import "dotenv/config";

/**
 * Event emitted during LLM player operation
 */
export interface LLMPlayerEvent {
  type: "thinking" | "response" | "error" | "action" | "prompt" | "system";
  content: string;
  data?: Record<string, unknown> | undefined;
}

/**
 * Event handler for LLM player events
 */
export type LLMPlayerEventHandler = (event: LLMPlayerEvent) => void;

/**
 * Options for the LLM player
 */
export interface LLMPlayerOptions {
  /**
   * Maximum number of retries for getting a valid action
   */
  maxRetries?: number;

  /**
   * System prompt for the LLM
   */
  systemPrompt?: string;

  /**
   * Model to use
   */
  model?: string;

  /**
   * Event handler for LLM player events
   */
  onEvent?: LLMPlayerEventHandler;
}

function convertActionSchemas<T extends ActionSchemas>(
  actionSchemas: T
): {
  definitions: ToolDefinition<z.ZodType>[];
  schemas: Record<string, z.ZodType>;
} {
  const definitions: ToolDefinition<z.ZodType>[] = [];
  const schemas: Record<string, z.ZodType> = {};

  // Process each action schema into a separate tool
  for (const [actionName, schema] of Object.entries(actionSchemas)) {
    // Schema is already a Zod schema (Schema<T> is just an alias for z.ZodType<T>)
    const zodSchema = schema;
    definitions.push({
      name: actionName,
      description: `Tool for performing the ${actionName} action`,
      schema: zodSchema,
    });

    schemas[actionName] = zodSchema;
  }
  return { definitions, schemas };
}

/**
 * LLM-based game player implementation
 *
 * IMPORTANT: This class MUST remain completely game-agnostic.
 * It should NEVER contain any game-specific logic, hardcoded actions,
 * or assumptions about specific game mechanics.
 *
 * All game-specific handling should be done at the schema level by the caller.
 */
export class LLMPlayer implements InputOutput {
  private chatHistory: Message[] = [];
  private readonly options: Required<LLMPlayerOptions>;
  private readonly onEvent: LLMPlayerEventHandler;

  private lastToolCallId: string | null = null;

  constructor(options: LLMPlayerOptions) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      systemPrompt:
        options.systemPrompt ||
        "You are playing a game. Analyze the game state and take the most appropriate action.",
      model: options.model || "gpt-4o",
      onEvent: options.onEvent || (() => {}),
    };

    this.onEvent = this.options.onEvent;

    // Initialize chat history with system message
    this.chatHistory = [
      {
        role: "system",
        content: this.options.systemPrompt,
      },
    ];
  }

  private async getToolUse(
    definitions: ToolDefinition<z.ZodType>[],
    schemas: Record<string, z.ZodType>
  ): Promise<NonNullable<OpenAIResult["toolUse"]>> {
    for (let retries = 0; retries < this.options.maxRetries; retries++) {
      const result = await callOpenAI({
        model: this.options.model,
        messages: this.chatHistory,
        tools: {
          definitions,
          schemas,
          choice: "auto", // Let the AI choose which action to take
        },
      });

      // Add assistant response to chat history
      this.chatHistory.push(result.message);
      if (result.message.content) {
        this.emitEvent("response", result.message.content as string);
      }

      if (result.toolUse) {
        return result.toolUse;
      } else {
        const noAction = 'Your inner monologue has been noted, but no in-game action was taken.';
        this.chatHistory.push({
          role: "system",
          content: noAction
        })
        this.emitEvent("system", noAction);
      }
    }

    throw new Error(
      `No valid tool use found after ${this.options.maxRetries} retries`
    );
  }

  /**
   * Get an action from the LLM player based on game output and action schemas
   *
   * @param gameOutput Text description of current game state
   * @param actionSchemas Map of action names to schemas defining valid actions
   * @returns Promise resolving with a tuple of action name and the corresponding action data
   */
  async askForAction<T extends ActionSchemas>(
    gameOutput: string,
    actionSchemas: T
  ): Promise<[keyof T, T[keyof T] extends Schema<infer U> ? U : never]> {
    // Add game output to chat history
    this.chatHistory.push(
      this.lastToolCallId
        ? {
            role: "tool",
            content: gameOutput,
            tool_call_id: this.lastToolCallId,
          }
        : {
            role: "system",
            content: gameOutput,
          }
    );

    this.emitEvent("prompt", gameOutput);
    this.emitEvent("thinking", "Analyzing game state...");

    const { definitions, schemas } = convertActionSchemas(actionSchemas);

    try {
      const toolUse = await this.getToolUse(definitions, schemas);
      const actionName = toolUse.name as keyof T;
      const actionData = toolUse.call;
      this.lastToolCallId = toolUse.callId;

      this.emitEvent("action", `Selected action: ${String(actionName)}`, {
        action: actionName,
        args: actionData,
      });

      return [
        actionName,
        actionData as T[keyof T] extends Schema<infer U> ? U : never,
      ];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.emitEvent("error", `Error selecting action: ${errorMessage}`);
      throw error;
    }
  }

  outputResult(text: string): void {
    this.chatHistory.push({
      role: "system",
      content: text,
    });
    this.emitEvent("system", text);
  }

  /**
   * Get the chat history
   */
  getChatHistory(): Message[] {
    return [...this.chatHistory];
  }

  /**
   * Emit an event to the registered handler
   */
  private emitEvent(
    type: LLMPlayerEvent["type"],
    content: string,
    data?: Record<string, unknown>
  ): void {
    this.onEvent({ type, content, data });
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clear the chat history
    this.chatHistory = [];
  }
}
