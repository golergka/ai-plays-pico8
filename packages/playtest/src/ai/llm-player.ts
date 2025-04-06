import type { InputOutput, ActionSchemas, GameResult } from "../types";
import type { Schema } from "../schema/utils";
import { z } from "zod";
import {
  callOpenAI,
  type Message,
  type ToolDefinition,
  type ToolUse,
} from "./api";
import "dotenv/config";

/**
 * Event emitted during LLM player operation
 */
export interface LLMPlayerEvent {
  type: "response" | "error" | "action" | "prompt" | "system";
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
  model: string;

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

  private lastToolCallId: string | null = null;

  constructor(options: LLMPlayerOptions) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      systemPrompt:
        options.systemPrompt ||
        "You are a play-tester for a text-based game. You can take actions using tool usage, as any player. You can also output text as your inner monologue, either as your chain of thought to help you plan your actions, or as comment intended for the game developers. However, your text output will not advance the game. Only one tool can be used at a time.",
      model: options.model || "openrouter/auto",
      onEvent: options.onEvent || (() => {}),
    };
  }

  private getChatHistory(): Message[] {
    return [
      {
        role: "system",
        content: this.options.systemPrompt,
      },
      ...this.chatHistory,
    ];
  }

  private async getToolUse(
    definitions: ToolDefinition<z.ZodType>[],
    schemas: Record<string, z.ZodType>
  ): Promise<ToolUse> {
    for (let retries = 0; retries < this.options.maxRetries; retries++) {
      let result: Awaited<ReturnType<typeof callOpenAI>>;
      // Used only for this iteration to save errors on top of
      const callChatHistory = this.getChatHistory();
      try {
        result = await callOpenAI({
          model: this.options.model,
          messages: callChatHistory,
          tools: {
            definitions,
            schemas,
            choice: "auto", // Let the AI choose which action to take
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.addMessage(
          { role: "system", content: `Error:\n\n${message}` },
          "error"
        );
        continue;
      }

      // Add assistant response to chat history
      this.addMessage(result.message, "response");

      const [toolUse, ...rest] = result.toolUse;

      for (const failed of rest) {
        const ignoredMessage = `Please only use one tool at a time. This tool call has been ignored.`;
        this.addMessage(
          {
            role: "tool",
            content: ignoredMessage,
            tool_call_id: failed.callId,
          },
          "system"
        );
      }

      if (toolUse) {
        return toolUse;
      }

      const noAction =
        "Assistant inner monologue has been noted, but no in-game action was taken. Proceed with your next action.";
      this.addMessage({ role: "system", content: noAction }, "system");
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
    gameState: string,
    feedback: string,
    actionSchemas: T
  ): Promise<[keyof T, T[keyof T] extends Schema<infer U> ? U : never]> {

    // Add feedback to chat history
    this.addMessage(
      this.lastToolCallId
        ? {
            role: "tool",
            content: feedback,
            tool_call_id: this.lastToolCallId,
          }
        : { role: "system", content: feedback },
      "prompt"
    );

    // Add latest game state to chat history
    this.addMessage(
      { role: "system", content: gameState },
      "system"
    );

    const { definitions, schemas } = convertActionSchemas(actionSchemas);

    try {
      const toolUse = await this.getToolUse(definitions, schemas);
      const actionName = toolUse.name as keyof T;
      const actionData = toolUse.call;
      this.lastToolCallId = toolUse.callId;

      this.addMessage(
        { role: "system", content: `Selected action: ${String(actionName)}` },
        "action",
        { action: actionName, args: actionData }
      );

      return [
        actionName,
        actionData as T[keyof T] extends Schema<infer U> ? U : never,
      ];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addMessage(
        { role: "system", content: `Error:\n\n${errorMessage}` },
        "error"
      );
      throw error;
    }
  }

  async askForFeedback(result: GameResult): Promise<string> {
    this.addMessage(
      { role: "system", content: `Game result:\n\n${result.description}` },
      "system"
    );
    this.addMessage(
      {
        role: "system",
        content:
          "As a play-tester, please provide feedback on the game that you have just played. You can assume a role of a qualified QA and game designer to steer developers in the right direction.",
      },
      "system"
    );

    const feedback = await callOpenAI({
      model: this.options.model,
      messages: this.chatHistory,
    });

    this.addMessage(feedback.message, "response");

    return feedback.message.content as string;
  }

  outputResult(text: string): void {
    this.addMessage({ role: "system", content: text }, "system");
  }

  /**
   * Add a message to chat history and emit corresponding event
   */
  private addMessage(
    message: Message,
    eventType: LLMPlayerEvent["type"],
    eventData?: Record<string, unknown>
  ) {
    this.chatHistory.push(message);
    this.options.onEvent({
      type: eventType,
      content: message.content as string,
      data: eventData,
    });
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clear the chat history
    this.chatHistory = [];
  }
}
