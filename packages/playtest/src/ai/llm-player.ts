import type { InputOutput, ActionSchemas, ActionCall } from "../types";
import { z } from "zod";
import {
  callOpenAI,
  type Message,
  type OpenAIResult,
  type ToolDefinition,
} from "./api";
import "dotenv/config";
import { randomUUID } from "node:crypto";

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

const SUMMARIZE_PROMPT = `
Condense the following play‑log so a future agent can keep playing flawlessly.
Omit fluff, keep essential game state and internal monologue.
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
  error = "error",
  playerAction = "playerAction",
  prompt = "prompt",
  gameAction = "gameAction",
  gameState = "gameState",
  playtesterFeedback = "playtesterFeedback",
  summary = "summary",
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

  sessionId?: string;
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

  constructor(options: LLMPlayerOptions) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      model: options.model || "openrouter/auto",
      onEvent: options.onEvent || (() => {}),
      sessionId: randomUUID(),
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
    let lastGameStateIndex = this.eventHistory.findLastIndex(
      (event) => event.type === LLMPlayerEventType.gameState
    );
    if (lastGameStateIndex === -1) {
      lastGameStateIndex = 0;
    }
    // Find the last summary index
    let lastSummaryIndex = this.eventHistory.findLastIndex(
      (event) => event.type === LLMPlayerEventType.summary
    );
    if (lastSummaryIndex === -1) {
      lastSummaryIndex = 0;
    }
    const messageHistory: Message[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ];

    // Start at the last summary, we don't need any messages before that
    this.eventHistory.slice(lastSummaryIndex).forEach((entry, index) => {
      switch (entry.type) {
        // Skip all errors messages before the last game state
        case LLMPlayerEventType.error:
          if (index >= lastGameStateIndex) {
            messageHistory.push(entry.message);
          }
          break;

        default:
          messageHistory.push(entry.message);
          break;
      }
    });

    return messageHistory;
  }

  private async summariseIfNeccessary(usage: OpenAIResult["usage"]) {
    if (!usage || usage.total_tokens < 5000) {
      return;
    }

    let lastSummaryIndex = this.eventHistory.findLastIndex(
      (e) => e.type === LLMPlayerEventType.summary
    );
    if (lastSummaryIndex === -1) {
      lastSummaryIndex = 0;
    }

    const messages: Message[] = [
      {
        role: "system",
        content: SUMMARIZE_PROMPT
      },
      ...this.eventHistory.slice(lastSummaryIndex).map((entry) => entry.message),
    ]

    const summaryRes = await callOpenAI({
      messages,
      langfuseSessionId: this.options.sessionId,
      model: this.options.model,
    });

    this.addMessage({
      type: LLMPlayerEventType.summary,
      message: summaryRes.message,
      data: {
        oldUsage: usage,
        newUsage: summaryRes.usage,
      }
    });
  }

  private async withRetries<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    for (let retries = 0; retries < this.options.maxRetries; retries++) {
      try {
        return await fn();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.addMessage({
          type: LLMPlayerEventType.error,
          message: { role: "system", content: `Error:\n\n${message}` },
          data: { error }
        });
      }
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
  async askForActions<T extends ActionSchemas>(
    gameState: string,
    actionSchemas: T
  ): Promise<ActionCall<T>[]> {
    // Add latest game state to chat history
    this.addMessage({
      type: LLMPlayerEventType.gameState,
      message: { role: "system", content: gameState },
    });

    const { definitions, schemas } = convertActionSchemas(actionSchemas);

    return this.withRetries(async () => {
      let result: Awaited<ReturnType<typeof callOpenAI>>;
        result = await callOpenAI({
          model: this.options.model,
          messages: this.constructRequestHistory(),
          tools: {
            definitions,
            schemas,
            choice: "auto", // Let the AI choose which action to take
          },
          langfuseSessionId: this.options.sessionId,
        });

        await this.summariseIfNeccessary(result.usage);

        this.addMessage({
          type: LLMPlayerEventType.playerAction,
          message: result.message,
        });

      if (result.toolUse.length === 0) {
        this.addMessage({
          type: LLMPlayerEventType.error,
          message: { role: "system", content: NO_ACTION_MESSAGE },
        });
      }

      return result.toolUse.map(({
        call, callId, name, 
      }) => {
        const action = actionSchemas[name];
        if (!action) {
          throw new Error(
            `Action "${name}" not found in action schemas`
          );
        }
        const data = action.parse(call);
        return [name, data, (result) =>
          this.addMessage({
            type: LLMPlayerEventType.gameAction,
            message: {
              role: 'tool',
              content: result,
              tool_call_id: callId,
            }
          })
        ] as ActionCall<T>;
      });
    });
  }

  async askForFeedback(): Promise<string> {
    this.addMessage({
      type: LLMPlayerEventType.prompt,
      message: { role: "system", content: FEEDBACK_PROMPT },
    });

    const feedback = await callOpenAI({
      model: this.options.model,
      messages: this.constructRequestHistory(),
      langfuseSessionId: this.options.sessionId,
    });

    this.addMessage({
      type: LLMPlayerEventType.playtesterFeedback,
      message: feedback.message,
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
