;Test file for embedded language completion features

*test_javascript_completion
;Testing JavaScript completion inside iscript blocks

[iscript]
// This should have JavaScript completion
var player = {
  name: "Test Player",
  level: 1,
  health: 100
};

function updatePlayer() {
  player.level++;
  console.log("Player leveled up to " + player.level);
  document.getElementById("player-name").textContent = player.name;
}

// Array methods should have completion
var items = ["sword", "shield", "potion"];
items.push("bow");
items.forEach(function(item) {
  console.log("Item: " + item);
});

// Modern JavaScript features
const gameState = {
  ...player,
  inventory: items
};
[endscript]

@iscript
// Alternative iscript syntax should also work
let messages = [];
messages.push("Welcome to the game!");
fetch("/api/save")
  .then(response => response.json())
  .then(data => console.log(data));
@endscript

*test_html_completion
;Testing HTML completion inside html blocks

[html]
<!-- This should have HTML completion -->
<div class="game-ui">
  <h1 id="game-title">My Adventure Game</h1>
  <div class="player-stats">
    <span class="player-name">Player Name</span>
    <div class="health-bar">
      <div class="health-fill" style="width: 80%;"></div>
    </div>
  </div>
  <button onclick="updatePlayer()">Level Up</button>
  <ul class="inventory">
    <li>Sword</li>
    <li>Shield</li>
    <li>Potion</li>
  </ul>
</div>
[endhtml]

@html
<!-- Alternative html syntax should also work -->
<style>
  .game-ui {
    background: #333;
    color: white;
    padding: 20px;
  }
  .health-bar {
    background: #666;
    border-radius: 5px;
  }
  .health-fill {
    background: #4CAF50;
    height: 20px;
    border-radius: 5px;
  }
</style>
@endhtml

;Regular TyranoScript content
[bg storage="room.jpg"]
[chara_new name="player" storage="character.png"]

"Welcome to the test!"
[p]