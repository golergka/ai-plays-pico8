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
      features: {
        "stone columns": "Massive stone columns rise to the ceiling, carved with intricate spiral patterns that seem to tell ancient stories.",
        "wall inscriptions": "The wall inscriptions appear to be in an ancient script, depicting rituals and warnings about the temple's depths.",
        "grand doorway": "The grand stone doorway is flanked by carved serpents, their eyes seeming to follow your movements."
      }
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
      features: {
        "ancient murals": "The faded murals show robed figures performing complex ceremonies around a golden chalice.",
        "vaulted ceiling": "The vaulted ceiling stretches high above, decorated with astronomical symbols.",
        "stone altar": "A large stone altar dominates the center of the hall, its surface stained dark with age."
      }
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
      features: {
        "wooden shelves": "Wooden shelves line the walls, sagging under the weight of ancient tomes and scrolls.",
        "scholar's desk": "A scholar's desk sits in the corner, covered in dust and fragments of pottery.",
        "bronze brazier": "An old bronze brazier stands cold and empty, its surface green with age."
      }
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
      features: {
        "weapon racks": "The wooden weapon racks stand mostly empty, though you can see where weapons once rested.",
        "training circle": "A circular area marked in the stone floor suggests this was once a practice area.",
        "armor stand": "A toppled armor stand lies in the corner, its bronze surface dulled by time."
      }
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
      features: {
        "crystal lights": "Mysterious crystals embedded in the walls emit a soft, pulsing blue light.",
        "wall carvings": "The walls are carved with flowing patterns that seem to move in the flickering light.",
        "grand archway": "A grand archway ahead bears symbols of power and protection."
      }
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
      features: {
        "stone fountain": "A small fountain trickles with surprisingly clear water, creating a peaceful atmosphere.",
        "crystal formations": "Natural crystal formations grow from the walls, catching and refracting light beautifully.",
        "meditation cushions": "Ancient meditation cushions, now mostly dust, are arranged in a circle."
      }
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
      features: {
        "stone firepit": "A cold firepit contains the ashes of long-dead fires.",
        "stone bunks": "Stone bunks line the walls, their old bedding reduced to dust.",
        "fallen weapon rack": "A fallen weapon rack lies against the wall, its contents long since looted."
      }
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
      features: {
        "ornate pedestals": "Ornate pedestals display various religious artifacts and offerings.",
        "glowing symbols": "Glowing symbols on the floor form a complex magical pattern.",
        "golden statues": "Golden statues of ancient deities stand in alcoves around the room."
      }
    },
    treasureVault: {
      id: "treasureVault",
      name: "Treasure Vault",
      description: "The legendary vault of the temple. Golden artifacts catch the light of your torch.",
      exits: {
        west: "innerSanctum",
      },
      items: ["golden_chalice"],
      features: {
        "treasure piles": "Piles of ancient coins and jewelry glitter in your torchlight.",
        "golden altar": "A golden altar stands at the center, clearly meant for the legendary chalice.",
        "treasure murals": "Rich murals depict the history of the temple's treasures and their guardians."
      }
    },
  },
};
