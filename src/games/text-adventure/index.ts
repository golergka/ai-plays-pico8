import type { Game, GamePlayer, GameResult } from '../../types'
import type { Item, Room, TextAdventureAction, TextAdventureState } from './types'
import { TextAdventureActionSchemas, toTextAdventureAction } from './schema'
import type { ActionType } from './schema'
import { CompactTextAdventure } from './compact-adventure'

// Re-export types and CompactTextAdventure
export type { Item, Room, TextAdventureAction, TextAdventureState }
export { CompactTextAdventure }

/**
 * Simple text adventure game implementation
 */
export class TextAdventure implements Game {
  private rooms: Map<string, Room> = new Map()
  private items: Map<string, Item> = new Map()
  private state: TextAdventureState
  
  constructor() {
    this.state = {
      currentRoom: 'start',
      inventory: [],
      visited: new Set<string>(),
      gameOver: false,
      win: false,
      turns: 0,
      lastActionResult: 'You begin your adventure.'
    }
  }
  
  /**
   * Initialize the game by setting up rooms and items
   */
  async initialize(): Promise<void> {
    // Setup rooms
    this.setupRooms()
    
    // Setup items
    this.setupItems()
    
    // Mark starting room as visited
    this.state.visited.add(this.state.currentRoom)
  }
  
  /**
   * Run the game with the provided player (AI or human)
   */
  async run(player: GamePlayer): Promise<GameResult> {
    // Main game loop
    while (!this.state.gameOver) {
      // Get the current room
      const currentRoom = this.rooms.get(this.state.currentRoom)
      
      if (!currentRoom) {
        throw new Error(`Room not found: ${this.state.currentRoom}`)
      }
      
      // Generate game output
      const gameOutput = this.generateGameOutput(currentRoom)
      
      // Get action from player using our schema map
      const [actionType, actionData] = await player.getAction(
        gameOutput, 
        TextAdventureActionSchemas
      )
      
      // Convert to the legacy action format
      const action = toTextAdventureAction(
        actionType as ActionType,
        actionData
      )
      
      // Process the action
      this.processAction(action)
      
      // Increment turn counter
      this.state.turns++
      
      // Check for win/lose conditions
      this.checkGameEnd()
    }
    
    // Return game result
    return {
      success: this.state.win,
      actionCount: this.state.turns,
      metadata: {
        visitedRooms: Array.from(this.state.visited),
        inventoryItems: [...this.state.inventory]
      }
    }
  }
  
  /**
   * Clean up resources when game ends
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up for this simple game
  }
  
  /**
   * Setup the game rooms
   */
  private setupRooms(): void {
    // Define rooms
    const rooms: Room[] = [
      {
        id: 'start',
        name: 'Starting Room',
        description: 'You find yourself in a small, dimly lit room. There is a door to the north and a window to the east.',
        exits: {
          north: 'hallway',
          east: 'balcony'
        },
        items: ['key'],
        interactions: {
          window: {
            description: 'A dusty window shows a view of a garden below.',
            result: {
              message: 'You look through the window and see a beautiful garden below.'
            }
          }
        }
      },
      {
        id: 'hallway',
        name: 'Hallway',
        description: 'A long hallway stretches before you. There are doors to the south and west.',
        exits: {
          south: 'start',
          west: 'library'
        }
      },
      {
        id: 'library',
        name: 'Library',
        description: 'A dusty library filled with old books. There\'s a door to the east and a locked door to the north.',
        exits: {
          east: 'hallway'
        },
        interactions: {
          'north door': {
            description: 'A sturdy wooden door with a keyhole.',
            result: {
              message: 'The door is locked. You need a key to open it.'
            }
          },
          books: {
            description: 'Shelves filled with dusty old tomes.',
            result: {
              addItems: ['note'],
              message: 'While browsing the books, you find a small folded note hidden between the pages of an old volume.'
            }
          }
        }
      },
      {
        id: 'balcony',
        name: 'Balcony',
        description: 'A small balcony overlooking a garden. There is a door back to the west.',
        exits: {
          west: 'start'
        },
        items: ['flower']
      },
      {
        id: 'secret_room',
        name: 'Secret Room',
        description: 'A hidden room with a treasure chest in the center. This must be what you were looking for!',
        exits: {
          south: 'library'
        },
        items: ['treasure']
      }
    ]
    
    // Add rooms to map
    for (const room of rooms) {
      this.rooms.set(room.id, room)
    }
  }
  
  /**
   * Setup the game items
   */
  private setupItems(): void {
    // Define items
    const items: Item[] = [
      {
        id: 'key',
        name: 'Brass Key',
        description: 'An old brass key with ornate designs.',
        takeable: true,
        usableWith: ['north door']
      },
      {
        id: 'note',
        name: 'Folded Note',
        description: 'A handwritten note that reads: "The garden holds the secret."',
        takeable: true
      },
      {
        id: 'flower',
        name: 'Strange Flower',
        description: 'A flower with glowing blue petals. It seems to pulse with energy.',
        takeable: true,
        usableWith: ['books']
      },
      {
        id: 'treasure',
        name: 'Ancient Treasure',
        description: 'A golden treasure box filled with precious gems and ancient artifacts.',
        takeable: true
      }
    ]
    
    // Add items to map
    for (const item of items) {
      this.items.set(item.id, item)
    }
  }
  
  /**
   * Generate the current game output based on the room and state
   */
  private generateGameOutput(room: Room): string {
    let output = `== ${room.name} ==\n\n`
    
    // Show last action result if available
    if (this.state.lastActionResult) {
      output += `[Last action] ${this.state.lastActionResult}\n\n`
    }
    
    // Add room description
    output += `${room.description}\n\n`
    
    // List visible items
    const visibleItems = room.items || []
    if (visibleItems.length > 0) {
      output += 'You can see:\n'
      for (const itemId of visibleItems) {
        const item = this.items.get(itemId)
        if (item) {
          output += `- ${item.name}\n`
        }
      }
      output += '\n'
    }
    
    // List available exits
    const exits = Object.keys(room.exits)
    if (exits.length > 0) {
      output += 'Exits: ' + exits.join(', ') + '\n\n'
    } else {
      output += 'There are no obvious exits.\n\n'
    }
    
    return output
  }
  
  /**
   * Process a player action
   */
  private processAction(action: TextAdventureAction): void {
    const currentRoom = this.rooms.get(this.state.currentRoom)
    
    if (!currentRoom) {
      return
    }
    
    switch (action.type) {
      case 'move':
        this.handleMove(action.direction, currentRoom)
        break
      case 'look':
        this.state.lastActionResult = 'You look around carefully.'
        break
      case 'examine':
        this.handleExamine(action.target, currentRoom)
        break
      case 'take':
        this.handleTake(action.item, currentRoom)
        break
      case 'use':
        this.handleUse(action.item, action.target, currentRoom)
        break
      case 'inventory':
        const itemNames = this.state.inventory.map(id => {
          const item = this.items.get(id)
          return item ? item.name : id
        }).join(', ')
        this.state.lastActionResult = itemNames 
          ? `You are carrying: ${itemNames}.` 
          : 'Your inventory is empty.'
        break
      case 'help':
        this.state.lastActionResult = 'Available commands: move, look, examine, take, use, inventory, help.'
        break
    }
  }
  
  /**
   * Handle movement
   */
  private handleMove(direction: string, currentRoom: Room): void {
    const nextRoomId = currentRoom.exits[direction]
    
    if (nextRoomId) {
      // Special case for library -> secret_room
      if (currentRoom.id === 'library' && direction === 'north') {
        // Check if player has key in inventory
        if (!this.state.inventory.includes('key')) {
          this.state.lastActionResult = "The door is locked. You need a key to open it.";
          return // Can't move, door is locked
        }
      }
      
      // Move to the next room
      this.state.currentRoom = nextRoomId
      
      // Mark as visited
      this.state.visited.add(nextRoomId)
      
      // Set action result
      const nextRoom = this.rooms.get(nextRoomId);
      this.state.lastActionResult = nextRoom 
        ? `You move ${direction} to the ${nextRoom.name}.` 
        : `You move ${direction}.`;
    } else {
      this.state.lastActionResult = `You can't go ${direction}.`;
    }
  }
  
  /**
   * Handle examining an object
   */
  private handleExamine(target: string, currentRoom: Room): void {
    // Check interactions in the room
    if (currentRoom.interactions && currentRoom.interactions[target]) {
      const interaction = currentRoom.interactions[target]
      
      // Set action result
      this.state.lastActionResult = interaction.result?.message || `You examine the ${target}.`;
      
      // Apply interaction results
      if (interaction.result) {
        // Add items
        if (interaction.result.addItems) {
          for (const itemId of interaction.result.addItems) {
            if (!currentRoom.items) {
              currentRoom.items = []
            }
            if (!currentRoom.items.includes(itemId)) {
              currentRoom.items.push(itemId)
            }
          }
        }
        
        // Remove items
        if (interaction.result.removeItems) {
          for (const itemId of interaction.result.removeItems) {
            if (currentRoom.items) {
              const index = currentRoom.items.indexOf(itemId)
              if (index !== -1) {
                currentRoom.items.splice(index, 1)
              }
            }
          }
        }
      }
    } else {
      // Check if target is in inventory
      const isInInventory = this.state.inventory.some(itemId => {
        const item = this.items.get(itemId);
        return item && (item.id === target || item.name.toLowerCase() === target.toLowerCase());
      });
      
      if (isInInventory) {
        const itemId = this.state.inventory.find(id => {
          const item = this.items.get(id);
          return item && (item.id === target || item.name.toLowerCase() === target.toLowerCase());
        });
        const item = this.items.get(itemId || '');
        if (item) {
          this.state.lastActionResult = `${item.name}: ${item.description}`;
          return;
        }
      }
      
      this.state.lastActionResult = `You don't see anything special about the ${target}.`;
    }
  }
  
  /**
   * Handle taking an item
   */
  private handleTake(itemId: string, currentRoom: Room): void {
    if (!currentRoom.items) {
      this.state.lastActionResult = `You don't see a ${itemId} here.`;
      return
    }
    
    const index = currentRoom.items.indexOf(itemId)
    
    if (index !== -1) {
      const item = this.items.get(itemId)
      
      if (item && item.takeable) {
        // Remove from room
        currentRoom.items.splice(index, 1)
        
        // Add to inventory
        this.state.inventory.push(itemId)
        
        this.state.lastActionResult = `You take the ${item.name}.`;
      } else if (item) {
        this.state.lastActionResult = `You can't take the ${item.name}.`;
      } else {
        this.state.lastActionResult = `You don't see a ${itemId} here.`;
      }
    } else {
      this.state.lastActionResult = `You don't see a ${itemId} here.`;
    }
  }
  
  /**
   * Handle using an item
   */
  private handleUse(itemId: string, targetId: string | undefined, currentRoom: Room): void {
    // Check if item is in inventory
    if (!this.state.inventory.includes(itemId)) {
      this.state.lastActionResult = `You don't have a ${itemId}.`;
      return
    }
    
    const item = this.items.get(itemId)
    
    if (!item) {
      this.state.lastActionResult = `You don't have a ${itemId}.`;
      return
    }
    
    // If no target specified
    if (!targetId) {
      this.state.lastActionResult = `You need to specify what to use the ${item.name} on.`;
      return;
    }
    
    // Special interactions
    if (itemId === 'key' && targetId === 'north door' && currentRoom.id === 'library') {
      // Add north exit to library
      currentRoom.exits['north'] = 'secret_room'
      
      // Remove key from inventory (used up)
      const keyIndex = this.state.inventory.indexOf('key')
      if (keyIndex !== -1) {
        this.state.inventory.splice(keyIndex, 1)
      }
      
      this.state.lastActionResult = `You unlock the north door with the ${item.name}. The door swings open.`;
    } else if (item.usableWith && item.usableWith.includes(targetId)) {
      this.state.lastActionResult = `You use the ${item.name} on the ${targetId}, but nothing happens.`;
    } else {
      this.state.lastActionResult = `You can't use the ${item.name} on that.`;
    }
  }
  
  /**
   * Check for game ending conditions
   */
  private checkGameEnd(): void {
    // Win condition: player has the treasure
    if (this.state.inventory.includes('treasure')) {
      this.state.gameOver = true
      this.state.win = true
      this.state.lastActionResult = "You've found the ancient treasure! You win!";
    }
    
    // Lose condition: too many turns (simple example)
    if (this.state.turns >= 50) {
      this.state.gameOver = true
      this.state.win = false
      this.state.lastActionResult = "You've spent too much time exploring. The cave entrance collapses, trapping you inside. Game over.";
    }
  }
}