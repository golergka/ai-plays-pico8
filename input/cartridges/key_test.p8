pico-8 cartridge // http://www.pico-8.com
version 18
__lua__
-- key_test.p8
-- simple key test for ai input

function _init()
  cls()
  print("key test cartridge", 20, 5, 7)
  print("press arrow keys", 25, 15, 6)
  
  -- initialize key states
  key_states = {
    [0] = false, -- left
    [1] = false, -- right
    [2] = false, -- up
    [3] = false, -- down
    [4] = false, -- z/o button
    [5] = false, -- x/x button
    [6] = false, -- p
  }
  
  -- position for visual representation
  player_x = 64
  player_y = 64
end

function _update()
  -- check and update key states
  for i=0,5 do
    key_states[i] = btn(i)
  end
  
  -- move player based on keys
  if key_states[0] then player_x -= 2 end
  if key_states[1] then player_x += 2 end
  if key_states[2] then player_y -= 2 end
  if key_states[3] then player_y += 2 end
  
  -- keep player on screen
  player_x = mid(4, player_x, 124)
  player_y = mid(4, player_y, 124)
end

function _draw()
  cls()
  
  -- draw title
  print("key test cartridge", 20, 5, 7)
  
  -- draw key status
  print("key status:", 5, 15, 6)
  
  -- draw key indicators
  local row = 25
  print("left:  " .. (key_states[0] and "PRESSED" or "---"), 10, row, key_states[0] and 11 or 5)
  row += 8
  print("right: " .. (key_states[1] and "PRESSED" or "---"), 10, row, key_states[1] and 11 or 5)
  row += 8
  print("up:    " .. (key_states[2] and "PRESSED" or "---"), 10, row, key_states[2] and 11 or 5)
  row += 8
  print("down:  " .. (key_states[3] and "PRESSED" or "---"), 10, row, key_states[3] and 11 or 5)
  row += 8
  print("z/o:   " .. (key_states[4] and "PRESSED" or "---"), 10, row, key_states[4] and 11 or 5)
  row += 8
  print("x/x:   " .. (key_states[5] and "PRESSED" or "---"), 10, row, key_states[5] and 11 or 5)
  
  -- draw player that moves with arrow keys
  circfill(player_x, player_y, 4, 8)
  print("♥", player_x-2, player_y-2, 7)
  
  -- show last keys pressed status
  local active_count = 0
  for i=0,5 do
    if key_states[i] then active_count += 1 end
  end
  
  if active_count > 0 then
    print("keys detected!", 30, 100, 11)
  else
    print("no keys detected", 30, 100, 5)
  end
end