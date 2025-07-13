# Embedded Language Support Test Guide

This guide explains how to test the JavaScript and HTML completion features in TyranoScript files.

## JavaScript Completion in iscript Blocks

### Test Cases

1. **Variable and Function Completion:**
```tyranoscript
[iscript]
var player = {
  name: "Test",
  level: 1
};

// Test: Type "player." and you should see completion for name, level
console.log(player.name);

// Test: Type "console." and you should see completion for log, error, warn, etc.
console.log("Testing");
[endscript]
```

2. **DOM API Completion:**
```tyranoscript
[iscript]
// Test: Type "document." and you should see completion for getElementById, querySelector, etc.
var element = document.getElementById("test");

// Test: Type "element." and you should see completion for textContent, style, etc.
element.textContent = "Hello";
[endscript]
```

3. **Array Method Completion:**
```tyranoscript
[iscript]
var items = ["sword", "shield"];

// Test: Type "items." and you should see completion for push, pop, forEach, map, etc.
items.push("potion");
items.forEach(function(item) {
  console.log(item);
});
[endscript]
```

## HTML Completion in html Blocks

### Test Cases

1. **HTML Tag Completion:**
```tyranoscript
[html]
<!-- Test: Type "<" and you should see completion for div, span, p, etc. -->
<div class="container">
  <!-- Test: Type "<h" and you should see completion for h1, h2, h3, etc. -->
  <h1>Title</h1>
</div>
[endhtml]
```

2. **Attribute Completion:**
```tyranoscript
[html]
<!-- Test: Type "class=" and you should see quote completion -->
<div class="">
  <!-- Test: Type "style=" and you should see quote completion -->
  <p style="">Content</p>
</div>
[endhtml]
```

3. **CSS in Style Tags:**
```tyranoscript
[html]
<style>
/* Test: CSS completion should work here */
.container {
  /* Type "background" and you should see completion for background-color, background-image, etc. */
  background: #333;
  /* Type "padding" and you should see completion */
  padding: 10px;
}
</style>
[endhtml]
```

## Alternative Syntax Support

Both `[tag]...[endtag]` and `@tag...@endtag` syntaxes should work:

```tyranoscript
@iscript
// JavaScript completion should work here too
let message = "Hello World";
console.log(message);
@endscript

@html
<!-- HTML completion should work here too -->
<div>Content</div>
@endhtml
```

## Expected Behavior

- **Inside iscript blocks:** You should get JavaScript IntelliSense including:
  - Variable and function completion
  - DOM API completion
  - Built-in JavaScript object completion (Array, Object, Math, etc.)
  - Syntax highlighting for JavaScript

- **Inside html blocks:** You should get HTML IntelliSense including:
  - HTML tag completion
  - Attribute completion
  - CSS completion inside `<style>` tags
  - Syntax highlighting for HTML

## Testing the Extension

1. Open a `.ks` file in VS Code with the TyranoScript extension installed
2. Create iscript and html blocks as shown above
3. Try typing inside the blocks and verify completion works
4. Check that syntax highlighting is applied correctly

If completion doesn't work, make sure:
1. The extension is properly installed and activated
2. You're working inside a TyranoScript project (with index.html)
3. The file has the `.ks` extension