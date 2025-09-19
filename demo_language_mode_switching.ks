; Demo: Dynamic Language Mode Switching for iscript blocks
; This demonstrates the new language mode flag system similar to HTML <script> tags

*start

[bg storage="background.jpg"]
[text text="Testing dynamic language mode switching..."]

; TyranoScript mode active here - semicolon comments, TyranoScript features
; Use Ctrl+/ here for semicolon comments

[iscript]
// JavaScript mode automatically activated!
// The language mode flag is now set to JavaScript
// Notice the status bar indicator when cursor moves in/out of this block

// JavaScript language features are now native:
// - IntelliSense from VSCode's JavaScript language service
// - Error checking and syntax validation
// - Advanced refactoring capabilities
// - Go to definition for JavaScript symbols

var gameState = {
    player: {
        name: "Hero",
        level: 5,
        health: 100
    },
    inventory: ["sword", "potion", "key"],
    currentScene: "forest"
};

// The language mode manager detects cursor position and switches contexts
function initializeGame() {
    console.log("Game initialized with state:", gameState);
    
    // TyranoScript variables are still available
    f.playerName = gameState.player.name;
    f.playerLevel = gameState.player.level;
    
    return gameState;
}

// Hover over JavaScript globals for documentation
setTimeout(() => {
    alert("Game ready!");
}, 1000);

// Context switches happen automatically as you move cursor in/out
[endscript]

; Back to TyranoScript mode - language flag switched back
; Semicolon comments active again
[text text="Player: &f.playerName (Level &f.playerLevel)"]

[iscript]
// JavaScript mode re-activated automatically
// This demonstrates the dynamic switching capability

const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');

// Language mode switching provides:
// 1. Automatic context detection
// 2. Status bar notifications
// 3. Native JavaScript language features
// 4. Seamless integration with VSCode's language services

Math.random(); // Full JavaScript API available
Date.now();    // With proper IntelliSense
[endscript]

; TyranoScript mode restored
[jump target="*end"]

*end

; The language mode switching system works similar to HTML files:
; - HTML context outside <script> tags
; - JavaScript context inside <script> tags
; - Automatic switching based on cursor position
; - Full language service integration