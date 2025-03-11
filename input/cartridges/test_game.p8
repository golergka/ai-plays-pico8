pico-8 cartridge // http://www.pico-8.com
version 38
__lua__
-- ai-plays-pico8 test cartridge
-- a simple game for testing the ai framework

-- game state
player = {
  x = 64,
  y = 64,
  speed = 2,
  sprite = 1
}

targets = {}
score = 0
game_over = false
timer = 30 * 60 -- 30 seconds at 60 fps

-- initialize the game
function _init()
  -- create some initial targets
  for i=1,5 do
    add_target()
  end
end

-- create a new target at random position
function add_target()
  local target = {
    x = rnd(112) + 8,
    y = rnd(112) + 8,
    sprite = 2 
  }
  add(targets, target)
end

-- update game state
function _update()
  if game_over then
    if btnp(❎) then -- x button to restart
      _init()
      score = 0
      timer = 30 * 60
      game_over = false
    end
    return
  end
  
  -- update timer
  timer = timer - 1
  if timer <= 0 then
    game_over = true
    return
  end
  
  -- player movement with arrow keys
  if btn(⬅️) then 
    player.x = max(player.x - player.speed, 4)
  end
  if btn(➡️) then 
    player.x = min(player.x + player.speed, 124)
  end
  if btn(⬆️) then 
    player.y = max(player.y - player.speed, 4)
  end
  if btn(⬇️) then 
    player.y = min(player.y + player.speed, 124)
  end
  
  -- check for target collection
  for i=#targets,1,-1 do
    local t = targets[i]
    -- simple collision detection
    if abs(player.x - t.x) < 8 and abs(player.y - t.y) < 8 then
      del(targets, t)
      score = score + 10
      add_target() -- replace with a new target
    end
  end
  
  -- add new target occasionally
  if timer % 60 == 0 and #targets < 10 then
    add_target()
  end
end

-- draw the game
function _draw()
  cls(0) -- clear screen (black)
  
  -- draw border
  rect(0, 0, 127, 127, 7) -- white border
  
  -- draw targets
  for t in all(targets) do
    spr(t.sprite, t.x-4, t.y-4)
  end
  
  -- draw player
  spr(player.sprite, player.x-4, player.y-4)
  
  -- draw score
  print("score: "..score, 2, 2, 7)
  
  -- draw timer
  local time_left = flr(timer / 60)
  print("time: "..time_left, 80, 2, 7)
  
  -- game over screen
  if game_over then
    rectfill(24, 48, 104, 80, 0)
    rect(24, 48, 104, 80, 7)
    print("game over!", 40, 56, 7)
    print("final score: "..score, 32, 64, 7)
    print("press ❎ to restart", 24, 72, 6)
  end
end

__gfx__
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000006666000008800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00700700069999600089980000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
0007700006999960008ff80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
0007700006999960008ff80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00700700069999600089980000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000006666000008800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000