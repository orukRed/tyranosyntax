; Demo: JavaScript completion and language features in iscript blocks
; This file demonstrates the new JavaScript-like behavior

*start

[bg storage="background.jpg"]
[text text="Testing JavaScript features in iscript blocks..."]

[iscript]
// JavaScript completion and language features now work here!

// Try typing these and use Ctrl+Space for completion:
// - "con" + Ctrl+Space should show "console"
// - "ale" + Ctrl+Space should show "alert"
// - "Mat" + Ctrl+Space should show "Math"
// - "f." + Ctrl+Space should show TyranoScript variables

// Context-aware completions:
// Type "console." and you'll get log, error, warn, info, etc.
console.log("JavaScript completion is working!");

// Math object completions
var randomValue = Math.random() * 100;
var roundedValue = Math.round(randomValue);

// JavaScript keyword completions (var, let, const, function, if, etc.)
function calculateScore(level) {
    if (level > 10) {
        return level * 100;
    } else {
        return level * 50;
    }
}

// TyranoScript variable completions
f.playerScore = calculateScore(5);
f.playerName = "Hero";
sf.gameVersion = "1.0.0";
tf.temporaryData = "temp";

// Signature help (hover over function calls to see parameter info)
alert("Player score: " + f.playerScore);
setTimeout(function() {
    console.log("Delayed message");
}, 1000);

// Hover information (hover over JavaScript globals to see documentation)
var currentDate = new Date();
var jsonData = JSON.stringify({ score: f.playerScore });

// Comment toggling: Use Ctrl+/ to toggle JavaScript-style comments
// This line will be commented with // instead of ;
[endscript]

; Back to TyranoScript - comment toggling will use semicolon style again
[text text="Score: &f.playerScore"]
[text text="Player: &f.playerName"]

*end