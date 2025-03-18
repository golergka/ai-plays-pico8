import type { Game, GameState, StepResult } from '../../types'
import type { Item, Room, TextAdventureAction, TextAdventureState } from './types'
import { TextAdventureActionSchemas, toTextAdventureAction } from './schema'
import type { ActionType } from './schema'

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
      turns: 0,
      lastActionResult: 'You stand at the entrance of a mysterious cave.'
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
   * Get the initial state of the game
   */
  async start(): Promise<GameState> {
    const currentRoom = this.rooms.get(this.state.currentRoom)
    
    if (!currentRoom) {
      throw new Error(`Room not found: ${this.state.currentRoom}`)
    }
    
    return {
      output: this.generateGameOutput(currentRoom),
      actions: TextAdventureActionSchemas
    }
  }
  
  /**
   * Process a single game step with the given action
   */
  async step(action: [string, unknown]): Promise<StepResult> {
    // Get the current room
    const currentRoom = this.rooms.get(this.state.currentRoom)
    
    if (!currentRoom) {
      throw new Error(`Room not found: ${this.state.currentRoom}`)
    }
    
    // Extract action type and data
    const [actionType, actionData] = action
    
    // Convert to the legacy action format
    const textAction = toTextAdventureAction(
      actionType as ActionType,
      actionData
    )
    
    // Process the action
    this.processAction(textAction)
    
    // Increment turn counter
    this.state.turns++
    
    // Check for win/lose conditions
    this.checkGameEnd()
    
    // If game is over, return result
    if (this.state.gameOver) {
      return {
        type: 'result',
        result: {
          success: this.state.win,
          actionCount: this.state.turns,
          metadata: {
            visitedRooms: Array.from(this.state.visited),
            inventoryItems: [...this.state.inventory],
            currentRoom: this.state.currentRoom
          }
        }
      }
    }
    
    // Otherwise, return the new state
    const newRoom = this.rooms.get(this.state.currentRoom)
    
    if (!newRoom) {
      throw new Error(`Room not found: ${this.state.currentRoom}`)
    }
    
    return {
      type: 'state',
      state: {
        output: this.generateGameOutput(newRoom),
        actions: TextAdventureActionSchemas,
        // Add metadata to the state for potential error handling by the platform
        // This allows the game-specific data to be available if needed
        // without requiring platform code to have knowledge of game structure
        _metadata: {
          visitedRooms: Array.from(this.state.visited),
          inventoryItems: [...this.state.inventory],
          currentRoom: this.state.currentRoom
        }
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
    
    // Show last action result if available
    if (this.state.lastActionResult) {
      output += `[Last action] ${this.state.lastActionResult}\n\n`
    }
    
    // Handle special case for dark room without lit torch
    if (room.id === 'treasureRoom' && !this.state.inventory.includes('lit_torch')) {
      output += 'It\'s pitch black. You can\'t see anything without a light source.\n\n'
      output += 'Exits: south\n\n'
      output += 'Type "inventory" to see what you\'re carrying or "help" for commands.\n'
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
        this.state.lastActionResult = 'You look around the cave carefully.'
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
    // Special case for darkness
    if (currentRoom.id === 'treasureRoom' && !this.state.inventory.includes('lit_torch')) {
      this.state.lastActionResult = "It's too dark to see anything clearly.";
      return;
    }
    
    // First try exact match in room interactions
    let interaction = currentRoom.interactions && currentRoom.interactions[target];
    
    // If not found, try fuzzy matching for interactions
    if (!interaction && currentRoom.interactions) {
      const interactionKey = Object.keys(currentRoom.interactions).find(key => 
        key.toLowerCase() === target.toLowerCase()
      );
      
      if (interactionKey) {
        interaction = currentRoom.interactions[interactionKey];
        target = interactionKey; // Use the actual key for messages
      }
    }
    
    // Check interactions in the room
    if (interaction) {
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
      // Check if target is in inventory with fuzzy matching
      const inventoryItemId = this.state.inventory.find(id => {
        const item = this.items.get(id);
        return item && (
          id === target || 
          item.name.toLowerCase() === target.toLowerCase() ||
          item.id.toLowerCase() === target.toLowerCase()
        );
      });
      
      if (inventoryItemId) {
        const item = this.items.get(inventoryItemId);
        if (item) {
          this.state.lastActionResult = `${item.name}: ${item.description}`;
          return;
        }
      }
      
      // Check if target matches an item in the room
      if (currentRoom.items && currentRoom.items.length > 0) {
        const roomItemId = currentRoom.items.find(id => {
          const item = this.items.get(id);
          return item && (
            id === target || 
            item.name.toLowerCase() === target.toLowerCase() ||
            item.id.toLowerCase() === target.toLowerCase()
          );
        });
        
        if (roomItemId) {
          const item = this.items.get(roomItemId);
          if (item) {
            this.state.lastActionResult = `${item.name}: ${item.description}`;
            return;
          }
        }
      }
      
      this.state.lastActionResult = `You don't see anything special about the ${target}.`;
    }
  }
  
  /**
   * Handle taking an item
   */
  private handleTake(itemId: string, currentRoom: Room): void {
    // Special case for darkness
    if (currentRoom.id === 'treasureRoom' && !this.state.inventory.includes('lit_torch')) {
      this.state.lastActionResult = "It's too dark to find anything.";
      return // Can't see to take anything
    }
    
    // First check if item is already in inventory
    const isInInventory = this.state.inventory.some(existingItemId => {
      const item = this.items.get(existingItemId);
      return item && (
        existingItemId === itemId || 
        item.name.toLowerCase() === itemId.toLowerCase() ||
        item.id.toLowerCase() === itemId.toLowerCase()
      );
    });
    
    if (isInInventory) {
      const existingItem = this.state.inventory
        .map(id => this.items.get(id))
        .find(item => item && (
          item.id === itemId || 
          item.name.toLowerCase() === itemId.toLowerCase() ||
          item.id.toLowerCase() === itemId.toLowerCase()
        ));
      this.state.lastActionResult = `You already have the ${existingItem?.name || itemId}.`;
      return;
    }
    
    
    if (!currentRoom.items || currentRoom.items.length === 0) {
      this.state.lastActionResult = `You don't see a ${itemId} here.`;
      return;
    }
    
    // Try to find item by exact ID first
    let index = currentRoom.items.indexOf(itemId);
    let foundItem = this.items.get(itemId);
    
    // If not found by exact ID, try fuzzy matching
    if (index === -1) {
      // Try to match by name (case insensitive)
      const roomItemId = currentRoom.items.find(id => {
        const item = this.items.get(id);
        return item && (
          item.name.toLowerCase() === itemId.toLowerCase() ||
          item.id.toLowerCase() === itemId.toLowerCase()
        );
      });
      
      if (roomItemId) {
        index = currentRoom.items.indexOf(roomItemId);
        foundItem = this.items.get(roomItemId);
      }
    }
    
    if (index !== -1 && foundItem) {
      if (foundItem.takeable) {
        // Remove from room
        currentRoom.items.splice(index, 1);
        
        // Add to inventory
        this.state.inventory.push(foundItem.id);
        
        this.state.lastActionResult = `You take the ${foundItem.name}.`;
      } else {
        this.state.lastActionResult = `You can't take the ${foundItem.name}.`;
      }
    } else {
      this.state.lastActionResult = `You don't see a ${itemId} here.`;
    }
  }
  
  /**
   * Handle using an item
   */
  private handleUse(itemId: string, targetId: string | undefined, currentRoom: Room): void {
    // Find the item in inventory using fuzzy matching
    const inventoryItemId = this.state.inventory.find(id => {
      const item = this.items.get(id);
      return item && (
        id === itemId || 
        item.name.toLowerCase() === itemId.toLowerCase() ||
        item.id.toLowerCase() === itemId.toLowerCase()
      );
    });
    
    if (!inventoryItemId) {
      this.state.lastActionResult = `You don't have a ${itemId}.`;
      return;
    }
    
    const item = this.items.get(inventoryItemId);
    
    if (!item) {
      this.state.lastActionResult = `You don't have a ${itemId}.`;
      return;
    }
    
    // Special case: using torch (converts to lit_torch)
    if (inventoryItemId === 'torch' && !targetId) {
      // Light the torch
      const torchIndex = this.state.inventory.indexOf('torch');
      if (torchIndex !== -1) {
        this.state.inventory.splice(torchIndex, 1);
        this.state.inventory.push('lit_torch');
        
        // Create the lit torch item if it doesn't exist
        if (!this.items.has('lit_torch')) {
          this.items.set('lit_torch', {
            id: 'lit_torch',
            name: 'Lit Torch',
            description: 'A flaming torch providing light and warmth.',
            takeable: true,
            usableWith: ['darkness']
          });
        }
        
        this.state.lastActionResult = "You light the torch. It flickers brightly, illuminating the area around you.";
      }
      return;
    }
    
    // Special case: handle using lit torch in dark room
    if (inventoryItemId === 'lit_torch') {
      // If in the dark room, using the torch reveals the room contents
      if (currentRoom.id === 'treasureRoom') {
        this.state.lastActionResult = "The torch illuminates the dark room, revealing its contents.";
        return;
      }
      
      // If using with "darkness" target specifically
      if (targetId && targetId.toLowerCase() === 'darkness') {
        this.state.lastActionResult = "The torch illuminates the dark area, revealing its contents.";
        return;
      }
      
      // Otherwise just a basic message
      if (!targetId) {
        this.state.lastActionResult = "The torch is already lit and burning brightly.";
        return;
      }
    }
    
    // Fuzzy match target if provided
    let matchedTargetId = targetId;
    if (targetId) {
      // Try to match interactions in the room
      if (currentRoom.interactions) {
        const interactionKey = Object.keys(currentRoom.interactions).find(key => 
          key.toLowerCase() === targetId.toLowerCase()
        );
        if (interactionKey) {
          matchedTargetId = interactionKey;
        }
      }
    }
    
    // Using key with pedestal (with fuzzy matching)
    if (inventoryItemId === 'key' && 
        matchedTargetId && 
        matchedTargetId.toLowerCase() === 'pedestal' && 
        currentRoom.id === 'puzzleRoom') {
      // Using the key triggers game completion
      this.state.gameOver = true;
      this.state.win = true;
      this.state.lastActionResult = "You insert the key into the pedestal. There's a rumbling sound as hidden mechanisms activate. You've solved the puzzle!";
      return;
    }
    
    // If no target specified (except for special cases handled above)
    if (!matchedTargetId) {
      this.state.lastActionResult = `You need to specify what to use the ${item.name} on.`;
      return;
    }
    
    // For other cases with a target
    if (item.usableWith && item.usableWith.some(target => 
      target.toLowerCase() === matchedTargetId?.toLowerCase()
    )) {
      this.state.lastActionResult = `You use the ${item.name} on the ${matchedTargetId}, but nothing happens.`;
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
      this.state.lastActionResult = "You've found the Golden Idol! You carefully place it in your bag and hurry out of the cave. You win!";
    }
    
    // Lose condition: too many turns
    if (this.state.turns >= 20) {
      this.state.gameOver = true
      this.state.win = false
      this.state.lastActionResult = "You hear a rumbling sound as the cave begins to collapse. You've taken too long and now you're trapped! Game over.";
    }
  }
}