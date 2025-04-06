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
  chop: z
    .object({
      workers: z
        .number()
        .min(1)
        .describe("Number of people to send chopping wood"),
    })
    .describe("Send people to chop wood"),
  build: z
    .object({
      shelters: z
        .number()
        .min(1)
        .describe("Number of shelters to build (costs 5 wood each)"),
    })
    .describe("Build shelters to improve living conditions"),
  endTurn: z.object({}).describe("End the current day and process results"),
} as const;

export class StrategyGame implements Game {
  private state: StrategyGameState = {
    food: 10,
    wood: 5,
    population: 5,
    shelters: 1,
    day: 1,
    score: 0,
    freeWorkers: 5
  };

  async initialize(): Promise<void> {
    this.state = {
      food: 10,
      wood: 5,
      population: 5,
      shelters: 1,
      day: 1,
      score: 0,
      freeWorkers: 5
    };
  }

  private formatOutput(output: StrategyGameOutput): string {
    return [
      `Day ${output.day}`,
      "Objectives:",
      "- Grow your population to 20",
      "- Build at least 10 shelters",
      "- Don't run out of food!",
      "",
      output.status,
      `Score: ${output.resources.score}`,
      `Population: ${output.resources.population} (${this.state.freeWorkers} available)`,
      `Shelters: ${output.resources.shelters}`,
      `Food: ${output.resources.food}`,
      `Wood: ${output.resources.wood}`,
    ].join("\n\n");
  }

  private simulateDay(baseFeedback: string): StepResult {
    this.state.day += 1;
    this.state.freeWorkers = this.state.population; // Reset free workers
    
    // Calculate food consumption (less with proper shelter)
    const shelterEffect = Math.min(this.state.shelters * 2, this.state.population);
    const unsheltered = Math.max(0, this.state.population - shelterEffect);
    const foodConsumed = shelterEffect + unsheltered * 2; // Unsheltered people consume double food
    this.state.food -= foodConsumed;

    // Calculate score changes
    const shelterBonus = Math.min(this.state.shelters * 2, this.state.population);
    const foodSurplus = Math.max(0, this.state.food - foodConsumed);
    this.state.score += shelterBonus + Math.floor(foodSurplus / 2);

    // Check loss condition
    if (this.state.food < 0) {
      return {
        type: "result",
        result: {
          description: [
            "Your tribe has run out of food and perished.",
            `Final Score: ${this.state.score}`,
            `Survived ${this.state.day} days`,
            `Peak Population: ${this.state.population}`,
          ].join("\n\n"),
          metadata: {
            survived_days: this.state.day,
            final_population: this.state.population,
            final_score: this.state.score
          },
        },
      };
    }

    // Check win condition
    if (this.state.population >= 20 && this.state.shelters >= 10) {
      return {
        type: "result",
        result: {
          description: [
            "Victory! Your tribe has grown strong and prosperous with proper housing!",
            `Final Score: ${this.state.score}`,
            `Completed in ${this.state.day} days`,
            `Final Population: ${this.state.population}`,
            `Shelters Built: ${this.state.shelters}`,
            `Resources Remaining: ${this.state.food} food, ${this.state.wood} wood`,
          ].join("\n\n"),
          metadata: {
            survived_days: this.state.day,
            final_population: this.state.population,
            shelters: this.state.shelters,
            food_stored: this.state.food,
            wood_stored: this.state.wood,
            final_score: this.state.score
          },
        },
      };
    }

    // Check population growth (requires food surplus and adequate shelter)
    if (this.state.food > this.state.population * 3 && this.state.shelters * 2 >= this.state.population) {
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
        shelters: this.state.shelters,
        wood: this.state.wood,
        score: this.state.score,
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

    if (actionType === 'endTurn') {
      return this.simulateDay("Day ended.");
    }

    switch (actionType) {
      case 'gather': {
        const { workers } = actions.gather.parse(actionData);

        if (workers > this.state.freeWorkers) {
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

        this.state.freeWorkers -= workers;

        return {
          type: "state",
          state: {
            output: this.formatOutput(
              this.getGameState(`Your gatherers collected ${foodGathered} food! (${this.state.freeWorkers} workers remaining)`)
            ),
            actions,
          },
        };
      }
      
      case 'chop': {
        const { workers } = actions.chop.parse(actionData);

        if (workers > this.state.freeWorkers) {
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

        const woodChopped = workers * (1 + Math.floor(Math.random() * 2));
        this.state.wood += woodChopped;

        this.state.freeWorkers -= workers;

        return {
          type: "state",
          state: {
            output: this.formatOutput(
              this.getGameState(`Your workers chopped ${woodChopped} wood! (${this.state.freeWorkers} workers remaining)`)
            ),
            actions,
          },
        };
      }

      case 'build': {
        const { shelters } = actions.build.parse(actionData);
        const woodNeeded = shelters * 5;

        if (woodNeeded > this.state.wood) {
          return {
            type: "state",
            state: {
              output: this.formatOutput(
                this.getGameState(
                  `Not enough wood! Need ${woodNeeded} but only have ${this.state.wood}.`
                )
              ),
              actions,
            },
          };
        }

        this.state.wood -= woodNeeded;
        this.state.shelters += shelters;

        return {
          type: "state",
          state: {
            output: this.formatOutput(
              this.getGameState(`Built ${shelters} new shelter${shelters > 1 ? 's' : ''}! (${this.state.freeWorkers} workers remaining)`)
            ),
            actions,
          },
        };
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
