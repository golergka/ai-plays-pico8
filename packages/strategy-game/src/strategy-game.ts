import { z } from "zod";
import type { Game, GameState, StepResult } from "@ai-gamedev/playtest";
import type { StrategyGameOutput, StrategyGameState } from "./types";

const actions = {
  gather: z
    .object({
      workers: z
        .number()
        .min(1)
        .describe("Number of people to send gathering food"),
    })
    .describe("Send people to gather food"),
  rest: z.object({}).describe("Rest for the day, consuming food"),
} as const;

export class StrategyGame implements Game {
  private state: StrategyGameState = {
    food: 10,
    population: 5,
    day: 1,
  };

  async initialize(): Promise<void> {
    this.state = {
      food: 10,
      population: 5,
      day: 1,
    };
  }

  private formatOutput(output: StrategyGameOutput): string {
    return [
      `Day ${output.day}`,
      output.status,
      `Population: ${output.resources.population}`,
      `Food: ${output.resources.food}`,
    ].join("\n\n");
  }

  private simulateDay(baseFeedback: string): StepResult {
    this.state.day += 1;
    const foodConsumed = this.state.population;
    this.state.food -= foodConsumed;

    // Check loss condition
    if (this.state.food < 0) {
      return {
        type: "result",
        result: {
          description: "Your tribe has run out of food and perished.",
          metadata: {
            survived_days: this.state.day,
            final_population: this.state.population,
          },
        },
      };
    }

    // Check win condition
    if (this.state.population >= 20) {
      return {
        type: "result",
        result: {
          description:
            "Your tribe has grown strong and prosperous! You've won!",
          metadata: {
            survived_days: this.state.day,
            final_population: this.state.population,
            food_stored: this.state.food,
          },
        },
      };
    }

    // Check population growth
    if (this.state.food > this.state.population * 2) {
      this.state.population += 1;
      baseFeedback += `\n\nYour tribe has grown! Population increased to ${this.state.population}.`;
    }

    return {
      type: 'state',
      state: {
        output: this.formatOutput(
          this.getGameState(`${baseFeedback}\n\nFood consumed: ${foodConsumed}`)
        ),
        actions,
      }
    }
  }

  private getGameState(status: string): StrategyGameOutput {
    return {
      status,
      resources: {
        food: this.state.food,
        population: this.state.population,
      },
      day: this.state.day,
    };
  }

  async start(): Promise<GameState> {
    const output = this.getGameState(
      "Your tribe awaits your guidance. You must manage food and population to survive."
    );

    return {
      output: this.formatOutput(output),
      actions,
    };
  }

  async step(action: [string, unknown]): Promise<StepResult> {
    const [actionType, actionData] = action;

    switch (actionType) {
      case 'gather': {
        const { workers } = actions.gather.parse(actionData);

        if (workers > this.state.population) {
          return {
            type: "state",
            state: {
              output: this.formatOutput(
                this.getGameState(
                  `You only have ${this.state.population} people available!`
                )
              ),
              actions,
            },
          };
        }

        const foodGathered = workers * (2 + Math.floor(Math.random() * 3));
        this.state.food += foodGathered;

        return this.simulateDay(`Your gatherers collected ${foodGathered} food!`);

      }
      case 'rest': {
        return this.simulateDay("Your tribe rests for the day.");
      }
      default: {
        return {
          type: "state",
          state: {
            output: this.formatOutput(
              this.getGameState("Action not recognized.")
            ),
            actions,
          },
        };
      }
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
  }
}
