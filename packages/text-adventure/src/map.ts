import type { GameMap } from "./types";

export enum ItemIds {
  torch = "torch",
  oldCoin = "old_coin",
  ancientScroll = "ancient_scroll",
  rustySword = "rusty_sword",
  crystalShard = "crystal_shard",
  guardBadge = "guard_badge",
  sacredGem = "sacred_gem",
  goldenChalice = "golden_chalice",
}

export enum FeatureIds {
  columns = "columns",
  inscriptions = "inscriptions",
  doorway = "doorway",
  ancientMurals = "ancient_murals",
  vaultedCeiling = "vaulted_ceiling",
  stoneAltar = "stone_altar",
  woodenShelves = "wooden_shelves",
  scholarsDesk = "scholars_desk",
  bronzeBrazier = "bronze_brazier",
  weaponRacks = "weapon_racks",
  trainingCircle = "training_circle",
  armorStand = "armor_stand",
  crystalLights = "crystal_lights",
  wallCarvings = "wall_carvings",
  grandArchway = "grand_archway",
  stoneFountain = "stone_fountain",
  crystalFormations = "crystal_formations",
  meditationCushions = "meditation_cushions",
  stoneFirepit = "stone_firepit",
  stoneBunks = "stone_bunks",
  fallenWeaponRack = "fallen_weapon_rack",
  ornatePedestals = "ornate_pedestals",
  glowingSymbols = "glowing_symbols",
  goldenStatues = "golden_statues",
  treasurePiles = "treasure_piles",
  goldenAltar = "golden_altar",
  treasureMurals = "treasure_murals"
}

export enum RoomIds {
  entrance = "entrance",
  mainHall = "mainHall",
  eastWing = "eastWing",
  westWing = "westWing",
  northCorridor = "northCorridor",
  meditation = "meditation",
  guardRoom = "guardRoom",
  innerSanctum = "innerSanctum",
  treasureVault = "treasureVault",
}

export type RoomId = (typeof RoomIds)[keyof typeof RoomIds];

export const gameMap: GameMap = {
  title: "Ancient Maze Temple",
  description:
    "A complex temple filled with twisting corridors and hidden chambers",
  startRoom: RoomIds.entrance,
  rooms: {
    [RoomIds.entrance]: {
      id: RoomIds.entrance,
      name: "Temple Entrance",
      description:
        "A grand entranceway with weathered stone columns. Ancient inscriptions cover the walls. The musty air carries the weight of centuries, and your footsteps echo ominously through the chamber.",
      exits: {
        north: {
          id: "north",
          name: "Northern Passage",
          description: "A passage leading north into the main hall",
          tags: ["north", "passage", "doorway"],
          targetRoom: RoomIds.mainHall,
        },
      },
      items: {
        [ItemIds.torch]: {
          id: ItemIds.torch,
          name: "Ancient Torch",
          description:
            "A weathered torch that still burns with an eternal flame",
          tags: ["torch", "light", "fire"],
          takeable: true,
        },
      },
      features: {
        [FeatureIds.columns]: {
          id: FeatureIds.columns,
          name: "Stone Columns",
          description:
            "Massive stone columns rise to the ceiling, carved with intricate spiral patterns that seem to tell ancient stories.",
          tags: ["column", "pillar", "stone"],
        },
        [FeatureIds.inscriptions]: {
          id: FeatureIds.inscriptions,
          name: "Ancient Inscriptions",
          description:
            "The wall inscriptions appear to be in an ancient script, depicting rituals and warnings about the temple's depths.",
          tags: ["writing", "inscription", "wall", "text"],
        },
        [FeatureIds.doorway]: {
          id: FeatureIds.doorway,
          name: "Grand Doorway",
          description:
            "The grand stone doorway is flanked by carved serpents, their eyes seeming to follow your movements.",
          tags: ["door", "doorway", "entrance", "serpent"],
        },
      },
    },
    [RoomIds.mainHall]: {
      id: RoomIds.mainHall,
      name: "Main Hall",
      description:
        "A vast ceremonial hall with high ceilings. Faded murals depict forgotten rituals. The air is thick with dust, and your torch casts dancing shadows on the crumbling walls.",
      exits: {
        south: {
          id: "south",
          name: "Southern Passage",
          description: "The passage back to the entrance",
          tags: ["south", "passage", "entrance"],
          targetRoom: RoomIds.entrance,
        },
        east: {
          id: "east",
          name: "Eastern Passage",
          description: "A passage leading to the east wing",
          tags: ["east", "passage"],
          targetRoom: RoomIds.eastWing,
        },
        west: {
          id: "west",
          name: "Western Passage",
          description: "A passage leading to the west wing",
          tags: ["west", "passage"],
          targetRoom: RoomIds.westWing,
        },
        north: {
          id: "north",
          name: "Northern Passage",
          description: "A passage leading to the north corridor",
          tags: ["north", "passage"],
          targetRoom: RoomIds.northCorridor,
        },
      },
      items: {
        [ItemIds.oldCoin]: {
          id: ItemIds.oldCoin,
          name: "Ancient Gold Coin",
          description: "A tarnished gold coin bearing ominous markings. Strange symbols pulse faintly in the torchlight.",
          tags: ["coin", "gold", "money"],
          takeable: true,
        },
      },
      features: {
        [FeatureIds.ancientMurals]: {
          id: FeatureIds.ancientMurals,
          name: "Ancient Murals",
          description:
            "The faded murals show robed figures performing complex ceremonies around a golden chalice.",
          tags: ["mural", "art", "wall", "painting"],
        },
        [FeatureIds.vaultedCeiling]: {
          id: FeatureIds.vaultedCeiling,
          name: "Vaulted Ceiling",
          description:
            "The vaulted ceiling stretches high above, decorated with astronomical symbols.",
          tags: ["ceiling", "roof", "astronomy"],
        },
        [FeatureIds.stoneAltar]: {
          id: FeatureIds.stoneAltar,
          name: "Stone Altar",
          description:
            "A large stone altar dominates the center of the hall, its surface stained dark with age.",
          tags: ["altar", "stone", "table"],
        },
      },
    },
    eastWing: {
      id: "eastWing",
      name: "Eastern Wing",
      description:
        "A library-like chamber filled with dusty scrolls and broken pottery.",
      exits: {
        west: {
          id: "west",
          name: "Western Passage",
          description: "The passage back to the main hall",
          tags: ["west", "passage", "door"],
          targetRoom: "mainHall",
        },
        north: {
          id: "north",
          name: "Northern Passage",
          description: "A passage leading to the meditation chamber",
          tags: ["north", "passage", "door"],
          targetRoom: "meditation",
        },
      },
      items: {
        [ItemIds.ancientScroll]: {
          id: ItemIds.ancientScroll,
          name: "Ancient Scroll",
          description: "A fragile scroll covered in mysterious writing",
          tags: ["scroll", "paper", "writing"],
          takeable: true,
        },
      },
      features: {
        [FeatureIds.woodenShelves]: {
          id: FeatureIds.woodenShelves,
          name: "Wooden Shelves",
          description:
            "Wooden shelves line the walls, sagging under the weight of ancient tomes and scrolls.",
          tags: ["shelf", "furniture", "wood"],
        },
        [FeatureIds.scholarsDesk]: {
          id: FeatureIds.scholarsDesk,
          name: "Scholar's Desk",
          description:
            "A scholar's desk sits in the corner, covered in dust and fragments of pottery.",
          tags: ["desk", "furniture", "wood"],
        },
        [FeatureIds.bronzeBrazier]: {
          id: FeatureIds.bronzeBrazier,
          name: "Bronze Brazier",
          description:
            "An old bronze brazier stands cold and empty, its surface green with age.",
          tags: ["brazier", "metal", "bronze"],
        },
      },
    },
    westWing: {
      id: "westWing",
      name: "Western Wing",
      description: "An armory with empty weapon racks and fallen shields.",
      exits: {
        east: {
          id: "east",
          name: "Eastern Passage",
          description: "The passage back to the main hall",
          tags: ["east", "passage", "door"],
          targetRoom: "mainHall",
        },
        north: {
          id: "north",
          name: "Northern Passage",
          description: "A passage leading to the guard room",
          tags: ["north", "passage", "door"],
          targetRoom: "guardRoom",
        },
      },
      items: {
        [ItemIds.rustySword]: {
          id: ItemIds.rustySword,
          name: "Rusty Sword",
          description:
            "An old sword, its blade dulled by rust but still usable",
          tags: ["sword", "weapon", "metal"],
          takeable: true,
        },
      },
      features: {
        [FeatureIds.weaponRacks]: {
          id: FeatureIds.weaponRacks,
          name: "Weapon Racks",
          description:
            "The wooden weapon racks stand mostly empty, though you can see where weapons once rested.",
          tags: ["rack", "weapon", "storage"],
        },
        [FeatureIds.trainingCircle]: {
          id: FeatureIds.trainingCircle,
          name: "Training Circle",
          description:
            "A circular area marked in the stone floor suggests this was once a practice area.",
          tags: ["circle", "floor", "training"],
        },
        [FeatureIds.armorStand]: {
          id: FeatureIds.armorStand,
          name: "Armor Stand",
          description:
            "A toppled armor stand lies in the corner, its bronze surface dulled by time.",
          tags: ["armor", "stand", "bronze"],
        },
      },
    },
    northCorridor: {
      id: "northCorridor",
      name: "North Corridor",
      description:
        "A long hallway with flickering magical lights. The air feels charged with energy.",
      exits: {
        south: {
          id: "south",
          name: "Southern Passage",
          description: "The passage back to the main hall",
          tags: ["south", "passage", "door"],
          targetRoom: "mainHall",
        },
        east: {
          id: "east",
          name: "Eastern Passage",
          description: "A passage leading to the meditation chamber",
          tags: ["east", "passage", "door"],
          targetRoom: "meditation",
        },
        west: {
          id: "west",
          name: "Western Passage",
          description: "A passage leading to the guard room",
          tags: ["west", "passage", "door"],
          targetRoom: "guardRoom",
        },
        north: {
          id: "north",
          name: "Northern Passage",
          description: "A passage leading to the inner sanctum",
          tags: ["north", "passage", "door"],
          targetRoom: "innerSanctum",
        },
      },
      features: {
        [FeatureIds.crystalLights]: {
          id: FeatureIds.crystalLights,
          name: "Crystal Lights",
          description:
            "Mysterious crystals embedded in the walls emit a soft, pulsing blue light.",
          tags: ["crystal", "light", "magic"],
        },
        [FeatureIds.wallCarvings]: {
          id: FeatureIds.wallCarvings,
          name: "Wall Carvings",
          description:
            "The walls are carved with flowing patterns that seem to move in the flickering light.",
          tags: ["carving", "wall", "pattern"],
        },
        [FeatureIds.grandArchway]: {
          id: FeatureIds.grandArchway,
          name: "Grand Archway",
          description:
            "A grand archway ahead bears symbols of power and protection.",
          tags: ["arch", "doorway", "symbol"],
        },
      },
    },
    meditation: {
      id: "meditation",
      name: "Meditation Chamber",
      description:
        "A peaceful room with a small fountain. Crystal formations catch what little light there is.",
      exits: {
        south: {
          id: "south",
          name: "Southern Passage",
          description: "The passage back to the east wing",
          tags: ["south", "passage", "door"],
          targetRoom: "eastWing",
        },
        west: {
          id: "west",
          name: "Western Passage",
          description: "The passage to the north corridor",
          tags: ["west", "passage", "door"],
          targetRoom: "northCorridor",
        },
      },
      items: {
        [ItemIds.crystalShard]: {
          id: ItemIds.crystalShard,
          name: "Crystal Shard",
          description:
            "A piece of glowing crystal that thrums with magical energy",
          tags: ["crystal", "magic", "light"],
          takeable: true,
        },
      },
      features: {
        [FeatureIds.stoneFountain]: {
          id: FeatureIds.stoneFountain,
          name: "Stone Fountain",
          description:
            "A small fountain trickles with surprisingly clear water, creating a peaceful atmosphere.",
          tags: ["fountain", "water", "stone"],
        },
        [FeatureIds.crystalFormations]: {
          id: FeatureIds.crystalFormations,
          name: "Crystal Formations",
          description:
            "Natural crystal formations grow from the walls, catching and refracting light beautifully.",
          tags: ["crystal", "formation", "light"],
        },
        [FeatureIds.meditationCushions]: {
          id: FeatureIds.meditationCushions,
          name: "Meditation Cushions",
          description:
            "Ancient meditation cushions, now mostly dust, are arranged in a circle.",
          tags: ["cushion", "furniture", "circle"],
        },
      },
    },
    guardRoom: {
      id: "guardRoom",
      name: "Guard's Quarters",
      description:
        "Once a guard post, now abandoned. Old bedrolls and equipment lie scattered about.",
      exits: {
        south: {
          id: "south",
          name: "Southern Passage",
          description: "The passage back to the west wing",
          tags: ["south", "passage", "door"],
          targetRoom: "westWing",
        },
        east: {
          id: "east",
          name: "Eastern Passage",
          description: "The passage to the north corridor",
          tags: ["east", "passage", "door"],
          targetRoom: "northCorridor",
        },
      },
      items: {
        [ItemIds.guardBadge]: {
          id: ItemIds.guardBadge,
          name: "Guard Badge",
          description:
            "An ancient badge of office, still gleaming despite its age",
          tags: ["badge", "metal", "guard"],
          takeable: true,
        },
      },
      features: {
        [FeatureIds.stoneFirepit]: {
          id: FeatureIds.stoneFirepit,
          name: "Stone Firepit",
          description: "A cold firepit contains the ashes of long-dead fires.",
          tags: ["firepit", "stone", "ash"],
        },
        [FeatureIds.stoneBunks]: {
          id: FeatureIds.stoneBunks,
          name: "Stone Bunks",
          description:
            "Stone bunks line the walls, their old bedding reduced to dust.",
          tags: ["bunk", "bed", "stone"],
        },
        [FeatureIds.fallenWeaponRack]: {
          id: FeatureIds.fallenWeaponRack,
          name: "Fallen Weapon Rack",
          description:
            "A fallen weapon rack lies against the wall, its contents long since looted.",
          tags: ["rack", "weapon", "storage"],
        },
      },
    },
    innerSanctum: {
      id: "innerSanctum",
      name: "Inner Sanctum",
      description:
        "A sacred chamber bathed in an otherworldly glow. Ancient treasures line ornate pedestals.",
      exits: {
        south: {
          id: "south",
          name: "Southern Passage",
          description: "The passage back to the north corridor",
          tags: ["south", "passage", "door"],
          targetRoom: "northCorridor",
        },
        east: {
          id: "east",
          name: "Eastern Passage",
          description: "A passage leading to the treasure vault",
          tags: ["east", "passage", "door"],
          targetRoom: "treasureVault",
        },
      },
      items: {
        [ItemIds.sacredGem]: {
          id: ItemIds.sacredGem,
          name: "Sacred Gem",
          description:
            "A perfectly cut gem that seems to glow with inner light",
          tags: ["gem", "crystal", "magic"],
          takeable: true,
        },
      },
      features: {
        [FeatureIds.ornatePedestals]: {
          id: FeatureIds.ornatePedestals,
          name: "Ornate Pedestals",
          description:
            "Ornate pedestals display various religious artifacts and offerings.",
          tags: ["pedestal", "display", "ornate"],
        },
        [FeatureIds.glowingSymbols]: {
          id: FeatureIds.glowingSymbols,
          name: "Glowing Symbols",
          description:
            "Glowing symbols on the floor form a complex magical pattern.",
          tags: ["symbol", "magic", "floor"],
        },
        [FeatureIds.goldenStatues]: {
          id: FeatureIds.goldenStatues,
          name: "Golden Statues",
          description:
            "Golden statues of ancient deities stand in alcoves around the room.",
          tags: ["statue", "gold", "deity"],
        },
      },
    },
    treasureVault: {
      id: "treasureVault",
      name: "Treasure Vault",
      description:
        "The legendary vault of the temple. Golden artifacts catch the light of your torch.",
      exits: {
        west: {
          id: "west",
          name: "Western Passage",
          description: "The passage back to the inner sanctum",
          tags: ["west", "passage", "door"],
          targetRoom: "innerSanctum",
        },
      },
      items: {
        [ItemIds.goldenChalice]: {
          id: ItemIds.goldenChalice,
          name: "Golden Chalice",
          description:
            "The legendary chalice of the temple, its surface etched with magical runes",
          tags: ["chalice", "gold", "magic"],
          takeable: true,
        },
      },
      features: {
        treasure_piles: {
          id: "treasure_piles",
          name: "Treasure Piles",
          description:
            "Piles of ancient coins and jewelry glitter in your torchlight.",
          tags: ["treasure", "gold", "coins"],
        },
        golden_altar: {
          id: "golden_altar",
          name: "Golden Altar",
          description:
            "A golden altar stands at the center, clearly meant for the legendary chalice.",
          tags: ["altar", "gold", "ritual"],
        },
        treasure_murals: {
          id: "treasure_murals",
          name: "Treasure Murals",
          description:
            "Rich murals depict the history of the temple's treasures and their guardians.",
          tags: ["mural", "art", "history"],
        },
      },
    },
  },
};
