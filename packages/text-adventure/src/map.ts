import type { GameMap } from "./types";

  export const gameMap: GameMap = {
    title: "Ancient Maze Temple",
    description: "A complex temple filled with twisting corridors and hidden chambers",
    startRoom: "entrance",
    rooms: {
      entrance: {
        id: "entrance",
        name: "Temple Entrance",
        description: "A grand entranceway with weathered stone columns. Ancient inscriptions cover the walls. The musty air carries the weight of centuries, and your footsteps echo ominously through the chamber.",
        exits: {
          north: "mainHall",
        },
        items: ["torch"],
        characters: [],
      },
      mainHall: {
        id: "mainHall",
        name: "Main Hall",
        description: "A vast ceremonial hall with high ceilings. Faded murals depict forgotten rituals. The air is thick with dust, and your torch casts dancing shadows on the crumbling walls.",
        exits: {
          south: "entrance",
          east: "eastWing",
          west: "westWing",
          north: "northCorridor",
        },
        items: ["old_coin"],
        characters: [],
      },
      eastWing: {
        id: "eastWing",
        name: "Eastern Wing",
        description: "A library-like chamber filled with dusty scrolls and broken pottery.",
        exits: {
          west: "mainHall",
          north: "meditation",
        },
        items: ["ancient_scroll"],
        characters: [],
      },
      westWing: {
        id: "westWing",
        name: "Western Wing",
        description: "An armory with empty weapon racks and fallen shields.",
        exits: {
          east: "mainHall",
          north: "guardRoom",
        },
        items: ["rusty_sword"],
        characters: [],
      },
      northCorridor: {
        id: "northCorridor",
        name: "North Corridor",
        description: "A long hallway with flickering magical lights. The air feels charged with energy.",
        exits: {
          south: "mainHall",
          east: "meditation",
          west: "guardRoom",
          north: "innerSanctum",
        },
        items: [],
        characters: [],
      },
      meditation: {
        id: "meditation",
        name: "Meditation Chamber",
        description: "A peaceful room with a small fountain. Crystal formations catch what little light there is.",
        exits: {
          south: "eastWing",
          west: "northCorridor",
        },
        items: ["crystal_shard"],
        characters: [],
      },
      guardRoom: {
        id: "guardRoom",
        name: "Guard's Quarters",
        description: "Once a guard post, now abandoned. Old bedrolls and equipment lie scattered about.",
        exits: {
          south: "westWing",
          east: "northCorridor",
        },
        items: ["guard_badge"],
        characters: [],
      },
      innerSanctum: {
        id: "innerSanctum",
        name: "Inner Sanctum",
        description: "A sacred chamber bathed in an otherworldly glow. Ancient treasures line ornate pedestals.",
        exits: {
          south: "northCorridor",
          east: "treasureVault",
        },
        items: ["sacred_gem"],
        characters: [],
      },
      treasureVault: {
        id: "treasureVault",
        name: "Treasure Vault",
        description: "The legendary vault of the temple. Golden artifacts catch the light of your torch.",
        exits: {
          west: "innerSanctum",
        },
        items: ["golden_chalice"],
        characters: [],
      },
    },
  };