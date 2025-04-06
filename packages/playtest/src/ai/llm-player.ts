import type { InputOutput, ActionSchemas } from "../types";
import type { Schema } from "../schema/utils";
import { z } from "zod";
import {
  callOpenAI,
  type Message,
  type ToolDefinition,
  type ToolUse,
} from "./api";
import "dotenv/config";

const SYSTEM_PROMPT = `
You are a play-tester for a text-based game. You can take actions using tool 
usage, as any player. You can also output text as your inner monologue, either 
as your chain of thought to help you plan your actions, or as comment intended 
for the game developers. However, your text output will not advance the game. 
Only one tool can be used at a time.
`.trim();

const FEEDBACK_PROMPT = `
As a play-tester, please provide feedback on the game that you have just played. 
You can assume a role of a qualified QA and game designer to steer developers in 
the right direction.
`.trim();

const IGNORED_TOOL_MESSAGE = `
Please only use one tool at a time. This tool call has been ignored.
`.trim();

const NO_ACTION_MESSAGE = `
Assistant inner monologue has been noted, but no in-game action was taken. 
Proceed with your next action.
`.trim();

const MAX_RETRIES_MESSAGE = (retries: number) =>
  `
No valid tool use found after ${retries} retries
`.trim();

export enum LLMPlayerEventType {
  playerInput = "playerInput",
  error = "error",
  playerAction = "playerAction",
  prompt = "prompt",
  gameAction = "gameAction",
  gameState = "gameState",
  playtesterFeedback = "playtesterFeedback",
}

/**
 * Event emitted during LLM player operation
 */
export interface LLMPlayerEvent {
  type: LLMPlayerEventType;
  message: Message;
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
  private eventHistory: LLMPlayerEvent[] = [];
  private readonly options: Required<LLMPlayerOptions>;

  private lastToolCallId: string | null = null;

  constructor(options: LLMPlayerOptions) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      model: options.model || "openrouter/auto",
      onEvent: options.onEvent || (() => {}),
    };
  }

  /**
   * Add a message to chat history and emit corresponding event
   */
  private addMessage(event: LLMPlayerEvent) {
    this.eventHistory.push(event);
    this.options.onEvent(event);
  }

  private constructRequestHistory(): Message[] {
    return [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...this.eventHistory.map(({ message }) => message),
    ];
  }

  private async getToolUse(
    definitions: ToolDefinition<z.ZodType>[],
    schemas: Record<string, z.ZodType>
  ): Promise<ToolUse> {
    for (let retries = 0; retries < this.options.maxRetries; retries++) {
      let result: Awaited<ReturnType<typeof callOpenAI>>;
      // Used only for this iteration to save errors on top of
      try {
        result = await callOpenAI({
          model: this.options.model,
          messages: this.constructRequestHistory(),
          tools: {
            definitions,
            schemas,
            choice: "auto", // Let the AI choose which action to take
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.addMessage({
          type: LLMPlayerEventType.error,
          message: { role: "system", content: `Error:\n\n${message}` }
        });
        continue;
      }

      // Add assistant response to chat history
      this.addMessage({
        type: LLMPlayerEventType.playerAction,
        message: result.message
      });

      const [toolUse, ...rest] = result.toolUse;

      for (const failed of rest) {
        const ignoredMessage = IGNORED_TOOL_MESSAGE;
        this.addMessage({
          type: LLMPlayerEventType.error,
          message: {
            role: "tool",
            content: ignoredMessage,
            tool_call_id: failed.callId,
          }
        });
      }

      if (toolUse) {
        return toolUse;
      }

      const noAction = NO_ACTION_MESSAGE;
      this.addMessage({
        type: LLMPlayerEventType.error,
        message: { role: "system", content: noAction }
      });
    }

    throw new Error(MAX_RETRIES_MESSAGE(this.options.maxRetries));
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
    if (feedback) {
      this.addMessage({
        type: LLMPlayerEventType.gameAction,
        message: this.lastToolCallId
          ? {
              role: "tool",
              content: feedback,
              tool_call_id: this.lastToolCallId,
            }
          : { role: "system", content: feedback }
      });
    }

    // Add latest game state to chat history
    this.addMessage({
      type: LLMPlayerEventType.gameState,
      message: { role: "system", content: gameState }
    });

    const { definitions, schemas } = convertActionSchemas(actionSchemas);

    try {
      const toolUse = await this.getToolUse(definitions, schemas);
      const actionName = toolUse.name as keyof T;
      const actionData = toolUse.call;
      this.lastToolCallId = toolUse.callId;

      return [
        actionName,
        actionData as T[keyof T] extends Schema<infer U> ? U : never,
      ];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addMessage({
        type: LLMPlayerEventType.error,
        message: { role: "system", content: `Error:\n\n${errorMessage}` },
        data: { error }
      });
      throw error;
    }
  }

  async askForFeedback(): Promise<string> {
    this.addMessage({
      type: LLMPlayerEventType.prompt,
      message: { role: "system", content: FEEDBACK_PROMPT }
    });

    const feedback = await callOpenAI({
      model: this.options.model,
      messages: this.constructRequestHistory(),
    });

    this.addMessage({
      type: LLMPlayerEventType.playtesterFeedback,
      message: feedback.message
    });

    return feedback.message.content as string;
  }

  outputResult(text: string): void {
    this.addMessage({
      message: { role: "system", content: text },
      type: LLMPlayerEventType.gameAction,
    });
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clear the chat history
    this.eventHistory = [];
  }
}
