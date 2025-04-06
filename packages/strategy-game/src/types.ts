import { z } from "zod";

export interface StrategyGameState {
  food: number;
  wood: number;
  population: number;
  shelters: number;
  day: number;
}

export interface StrategyGameOutput {
  status: string;
  resources: {
    food: number;
    wood: number;
    population: number;
    shelters: number;
  };
  day: number;
}

export const StrategyGameSaveSchema = z.object({
  food: z.number(),
  wood: z.number(),
  population: z.number(),
  shelters: z.number(),
  day: z.number()
});

export type StrategyGameSaveData = z.infer<typeof StrategyGameSaveSchema>;
