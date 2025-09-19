; Demo: Microsoft JavaScript Tokens Integration
; This demonstrates using Microsoft's JavaScript language service and tokens

*start

[bg storage="background.jpg"]
[text text="Testing Microsoft JavaScript tokens integration..."]

; TyranoScript mode - semicolon comments
[iscript]
// Microsoft JavaScript tokens are now active!
// This leverages VSCode's built-in JavaScript/TypeScript language service

// Microsoft's official JavaScript globals with proper type definitions:
console.log("Using Microsoft's Console API");  // Hover for official documentation
alert("Microsoft JavaScript Alert API");        // Signature help with official types

// Microsoft's Math object with complete API
var randomValue = Math.random();    // Official Math.random() documentation
var roundedValue = Math.round(randomValue * 100);
var powerValue = Math.pow(2, 8);    // All Math methods from Microsoft's lib.d.ts

// Microsoft's Date constructor and methods
var currentDate = new Date();       // Official DateConstructor
var timestamp = Date.now();         // Static method from Microsoft's types
console.log("Current date:", currentDate.toISOString());

// Microsoft's JSON API with full type safety
var gameData = {
    player: "Hero",
    level: 5,
    items: ["sword", "potion"]
};
var jsonString = JSON.stringify(gameData);  // Official JSON.stringify signature
var parsedData = JSON.parse(jsonString);    // Official JSON.parse with error handling

// Microsoft's Array constructor and methods
var inventory = new Array("item1", "item2");
var filteredItems = inventory.filter(item => item.startsWith("item"));

// Microsoft's String methods with proper typing
var playerName = "Hero";
var upperName = playerName.toUpperCase();    // String.prototype.toUpperCase()
var nameLength = playerName.length;          // String length property

// Microsoft's Number methods and properties
var score = Number("100");                   // Number constructor
var maxValue = Number.MAX_VALUE;             // Number.MAX_VALUE constant
var isValid = !Number.isNaN(score);          // Number.isNaN() method

// Microsoft's Boolean constructor
var gameActive = new Boolean(true);
var isReady = Boolean("true");               // Boolean() function

// Microsoft's global functions with proper signatures
var intValue = parseInt("42", 10);           // parseInt(string, radix)
var floatValue = parseFloat("3.14");         // parseFloat(string)
var encoded = encodeURIComponent("hello world"); // URI encoding functions

// Microsoft's browser globals (when available)
if (typeof window !== 'undefined') {
    console.log("Window object available:", window.location);
    console.log("Document title:", document.title);
    console.log("Navigator info:", navigator.userAgent);
}

// Microsoft's timer functions with exact signatures
setTimeout(function() {
    console.log("Timer executed using Microsoft's setTimeout");
}, 1000);

var intervalId = setInterval(function() {
    console.log("Interval tick");
}, 5000);

// Clear timers using Microsoft's functions
clearTimeout(intervalId);  // Note: intentionally using wrong function for demo
clearInterval(intervalId);

// Microsoft's regular expression support
var pattern = new RegExp("\\d+", "g");
var testString = "Score: 100 points";
var matches = testString.match(pattern);

// TyranoScript variables still work
f.playerScore = score;
sf.gameVersion = "1.0.0";
tf.sessionData = gameData;

// Microsoft's error handling
try {
    var invalidJson = JSON.parse("invalid json");
} catch (error) {
    console.error("JSON parsing error:", error.message);
}

// Microsoft's Object methods
var keys = Object.keys(gameData);            // Object.keys() method
var values = Object.values(gameData);        // Object.values() method
var entries = Object.entries(gameData);      // Object.entries() method

console.log("Demo completed with Microsoft JavaScript tokens!");
[endscript]

; Back to TyranoScript mode
[text text="Score: &f.playerScore"]

*end

; This implementation uses:
; 1. VSCode's executeCompletionItemProvider API for native JavaScript completions
; 2. Virtual JavaScript documents for true language service integration
; 3. Microsoft's official TypeScript lib.d.ts definitions as fallback
; 4. Context-aware switching between Microsoft JS and TyranoScript features