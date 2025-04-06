import { z } from "zod";

export interface StrategyGameState {
  food: number;
  population: number;
  day: number;
}

export interface StrategyGameOutput {
  status: string;
  resources: {
    food: number;
    population: number;
  };
  day: number;
}

export const StrategyGameSaveSchema = z.object({
  food: z.number(),
  population: z.number(),
  day: z.number()
});

export type StrategyGameSaveData = z.infer<typeof StrategyGameSaveSchema>;
