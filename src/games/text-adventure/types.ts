/**
 * Represents a location in the text adventure
 */
export interface Room {
  id: string
  name: string
  description: string
  exits: {
    [direction: string]: string // Maps direction to room ID
  }
  items?: string[] // IDs of items in the room
  interactions?: {
    [item: string]: {
      description: string
      result?: {
        addItems?: string[]
        removeItems?: string[]
        message: string
      }
    }
  }
}

/**
 * Represents an item in the text adventure
 */
export interface Item {
  id: string
  name: string
  description: string
  takeable: boolean
  usableWith?: string[] // IDs of other items or objects this can be used with
}

/**
 * Game state for text adventure
 */
export interface TextAdventureState {
  currentRoom: string // ID of current room
  inventory: string[] // IDs of items in inventory
  visited: Set<string> // IDs of rooms visited
  gameOver: boolean
  win: boolean
  turns: number
}

/**
 * Possible actions in the text adventure
 */
export type TextAdventureAction = 
  | { type: 'move', direction: 'north' | 'south' | 'east' | 'west' }
  | { type: 'look' }
  | { type: 'examine', target: string }
  | { type: 'take', item: string }
  | { type: 'use', item: string, target?: string | undefined }
  | { type: 'inventory' }
  | { type: 'help' }