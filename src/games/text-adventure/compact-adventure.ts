import type { Game, GamePlayer, GameResult } from '../../types'
import type { Item, Room, TextAdventureAction, TextAdventureState } from './types'
import { TextAdventureActionSchemas, toTextAdventureAction } from './schema'

/**
 * Compact text adventure game implementation that can be completed in 10-15 actions
 */
export class CompactTextAdventure implements Game {
  private rooms: Map<string, Room> = new Map()
  private items: Map<string, Item> = new Map()
  private state: TextAdventureState
  
  constructor() {
    this.state = {
      currentRoom: 'entrance',
      inventory: [],
      visited: new Set<string>(),
      gameOver: false,
      win: false,
      turns: 0
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
        actionType as keyof typeof TextAdventureActionSchemas,
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
    // Define rooms for a compact adventure
    const rooms: Room[] = [
      {
        id: 'entrance',
        name: 'Cave Entrance',
        description: 'You stand at the entrance of a mysterious cave. A cool breeze flows from inside. There\'s a path leading east into the darkness.',
        exits: {
          east: 'mainChamber'
        },
        items: ['torch']
      },
      {
        id: 'mainChamber',
        name: 'Main Chamber',
        description: 'A spacious chamber with ancient writing on the walls. There are passages to the west, north, and east.',
        exits: {
          west: 'entrance',
          north: 'treasureRoom',
          east: 'puzzleRoom'
        },
        interactions: {
          'wall writing': {
            description: 'Faded glyphs on the stone wall.',
            result: {
              message: 'You make out the words: "Only with light can the treasure be found."'
            }
          }
        }
      },
      {
        id: 'treasureRoom',
        name: 'Dark Room',
        description: 'This room is pitch black. You can\'t see anything without a light source. There\'s a passage to the south.',
        exits: {
          south: 'mainChamber'
        },
        items: ['treasure'],
        interactions: {
          darkness: {
            description: 'The room is too dark to see anything.',
            result: {
              message: 'You need a light source to explore this room properly.'
            }
          }
        }
      },
      {
        id: 'puzzleRoom',
        name: 'Puzzle Room',
        description: 'A small room with a stone pedestal in the center. There\'s a keyhole in the pedestal. A passage leads west.',
        exits: {
          west: 'mainChamber'
        },
        items: ['key'],
        interactions: {
          pedestal: {
            description: 'A stone pedestal with a small keyhole.',
            result: {
              message: 'The keyhole seems to be waiting for a matching key.'
            }
          }
        }
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
    // Define items for a compact adventure
    const items: Item[] = [
      {
        id: 'torch',
        name: 'Unlit Torch',
        description: 'A wooden torch that could be lit with a fire source.',
        takeable: true,
        usableWith: ['darkness']
      },
      {
        id: 'key',
        name: 'Small Key',
        description: 'A small bronze key with unusual teeth.',
        takeable: true,
        usableWith: ['pedestal']
      },
      {
        id: 'treasure',
        name: 'Golden Idol',
        description: 'A gleaming golden idol of immense value.',
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
    
    // Handle special case for dark room without lit torch
    if (room.id === 'treasureRoom' && !this.state.inventory.includes('lit_torch')) {
      output += 'It\'s pitch black. You can\'t see anything without a light source.\n\n'
      output += 'Exits: south\n\n'
      return output
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
    
    // Add inventory reminder for new players
    output += 'Type "inventory" to see what you\'re carrying or "help" for commands.\n'
    
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
        // No state change needed for look
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
        // No state change needed for inventory check
        break
      case 'help':
        // No state change needed for help
        break
    }
  }
  
  /**
   * Handle movement
   */
  private handleMove(direction: string, currentRoom: Room): void {
    const nextRoomId = currentRoom.exits[direction]
    
    if (nextRoomId) {
      // Move to the next room
      this.state.currentRoom = nextRoomId
      
      // Mark as visited
      this.state.visited.add(nextRoomId)
    }
  }
  
  /**
   * Handle examining an object
   */
  private handleExamine(target: string, currentRoom: Room): void {
    // Check interactions in the room
    if (currentRoom.interactions && currentRoom.interactions[target]) {
      const interaction = currentRoom.interactions[target]
      
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
    }
  }
  
  /**
   * Handle taking an item
   */
  private handleTake(itemId: string, currentRoom: Room): void {
    // Special case for darkness
    if (currentRoom.id === 'treasureRoom' && !this.state.inventory.includes('lit_torch')) {
      if (itemId === 'treasure') {
        return // Can't see to take anything
      }
    }
    
    if (!currentRoom.items) {
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
      }
    }
  }
  
  /**
   * Handle using an item
   */
  private handleUse(itemId: string, targetId: string | undefined, currentRoom: Room): void {
    // Check if item is in inventory
    if (!this.state.inventory.includes(itemId)) {
      return
    }
    
    const item = this.items.get(itemId)
    
    if (!item) {
      return
    }
    
    // Special case: using torch (converts to lit_torch)
    if (itemId === 'torch' && !targetId) {
      // Light the torch
      const torchIndex = this.state.inventory.indexOf('torch')
      if (torchIndex !== -1) {
        this.state.inventory.splice(torchIndex, 1)
        this.state.inventory.push('lit_torch')
        
        // Create the lit torch item if it doesn't exist
        if (!this.items.has('lit_torch')) {
          this.items.set('lit_torch', {
            id: 'lit_torch',
            name: 'Lit Torch',
            description: 'A flaming torch providing light and warmth.',
            takeable: true,
            usableWith: ['darkness']
          })
        }
      }
      return
    }
    
    // Using lit torch in the dark room
    if (itemId === 'lit_torch' && currentRoom.id === 'treasureRoom') {
      // Room is now illuminated, no need to change state
      return
    }
    
    // Using key with pedestal
    if (itemId === 'key' && targetId === 'pedestal' && currentRoom.id === 'puzzleRoom') {
      // Using the key triggers game completion
      this.state.gameOver = true
      this.state.win = true
      return
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
    }
    
    // Lose condition: too many turns
    if (this.state.turns >= 20) {
      this.state.gameOver = true
      this.state.win = false
    }
  }
}