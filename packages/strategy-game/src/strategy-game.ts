import { z } from "zod";
import type { Game, GameState } from "@ai-gamedev/playtest";
import type { StrategyGameState } from "./types";

function formatOutput(state: StrategyGameState): string {
  return [
    `Day ${state.day}`,
    "Objectives:",
    "- Grow your population to 20",
    "- Build at least 10 shelters",
    "- Don't run out of food!",
    "",
    `Score: ${state.score}`,
    `Population: ${state.population} (${state.freeWorkers} available)`,
    `Shelters: ${state.shelters}`,
    `Food: ${state.food}`,
    `Wood: ${state.wood}`,
  ].join("\n");
}

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

export class StrategyGame implements Game<typeof actions> {
  private state: StrategyGameState = {
    food: 10,
    wood: 5,
    population: 5,
    shelters: 1,
    day: 1,
    score: 0,
    freeWorkers: 5,
  };
  private gameOver = false;

  async initialize(): Promise<void> {
    this.state = {
      food: 10,
      wood: 5,
      population: 5,
      shelters: 1,
      day: 1,
      score: 0,
      freeWorkers: 5,
    };
    this.gameOver = false;
  }

  public readonly actions = actions;

  public getGameState(): GameState {
    return {
      description: formatOutput(this.state),
      gameOver: this.gameOver,
    };
  }

  private gather(workers: number): string {
    if (workers > this.state.freeWorkers) {
      return `You only have ${this.state.population} people available!`;
    }

    const foodGathered = workers * (2 + Math.floor(Math.random() * 3));
    this.state.food += foodGathered;

    this.state.freeWorkers -= workers;

    return `Your gatherers collected ${foodGathered} food! (${this.state.freeWorkers} workers remaining)`;
  }

  private chop(workers: number): string {
    if (workers > this.state.freeWorkers) {
      return `You only have ${this.state.population} people available!`;
    }

    const woodChopped = workers * (1 + Math.floor(Math.random() * 2));
    this.state.wood += woodChopped;

    this.state.freeWorkers -= workers;

    return `Your workers chopped ${woodChopped} wood! (${this.state.freeWorkers} workers remaining)`;
  }

  private build(shelters: number): string {
    const woodNeeded = shelters * 5;

    if (woodNeeded > this.state.wood) {
      return `Not enough wood! Need ${woodNeeded} but only have ${this.state.wood}.`;
    }

    this.state.wood -= woodNeeded;
    this.state.shelters += shelters;

    return `You built ${shelters} new shelter${shelters > 1 ? "s" : ""}! (${
      this.state.freeWorkers
    } workers remaining)`;
  }

  private endTurn(): string {
    let feedback = `Day ${this.state.day} summary:`;

    this.state.day += 1;
    this.state.freeWorkers = this.state.population; // Reset free workers

    // Calculate food consumption (less with proper shelter)
    const shelterEffect = Math.min(
      this.state.shelters * 2,
      this.state.population
    );
    const unsheltered = Math.max(0, this.state.population - shelterEffect);
    const foodConsumed = shelterEffect + unsheltered * 2; // Unsheltered people consume double food
    this.state.food -= foodConsumed;
    feedback += `\n\nFood consumed: ${foodConsumed} (${shelterEffect} sheltered, ${unsheltered} unsheltered)`;

    // Calculate score changes
    const shelterBonus = Math.min(
      this.state.shelters * 2,
      this.state.population
    );
    const foodSurplus = Math.max(0, this.state.food - foodConsumed);
    this.state.score += shelterBonus + Math.floor(foodSurplus / 2);
    feedback += `\n\nScore increased by ${
      shelterBonus + Math.floor(foodSurplus / 2)
    }.`;

    // Check loss condition
    if (this.state.food < 0) {
      return (
        feedback +
        `\n\nYour tribe has run out of food and perished. Final Score: ${this.state.score}\n` +
        `Survived ${this.state.day} days`
      );
    }

    // Check win condition
    if (this.state.population >= 20 && this.state.shelters >= 10) {
      return (
        feedback +
        [
          "\nVictory! Your tribe has grown strong and prosperous with proper housing!",
          `Final Score: ${this.state.score}`,
          `Completed in ${this.state.day} days`,
          `Final Population: ${this.state.population}`,
          `Shelters Built: ${this.state.shelters}`,
          `Resources Remaining: ${this.state.food} food, ${this.state.wood} wood`,
        ].join("\n")
      );
    }

    // Check population growth (requires food surplus and adequate shelter)
    if (
      this.state.food > this.state.population * 3 &&
      this.state.shelters * 2 >= this.state.population
    ) {
      this.state.population += 1;
      feedback += `\n\nYour tribe has grown! Population increased to ${this.state.population}.`;
    }

    return feedback;
  }

  async callAction(
    name: keyof typeof actions,
    data: z.infer<(typeof actions)[typeof name]>,
    onResult: (result: string) => void
  ) {
    switch (name) {
      case "endTurn":
        onResult(this.endTurn());
        return;
      case "gather": {
        const { workers } = this.actions.gather.parse(data);
        onResult(this.gather(workers));
        return;
      }
      case "chop": {
        const { workers } = actions.chop.parse(data);
        onResult(this.chop(workers));
        return;
      }
      case "build": {
        const { shelters } = actions.build.parse(data);
        onResult(this.build(shelters));
        return;
      }
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
  }
}
