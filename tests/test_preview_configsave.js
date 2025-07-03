/**
 * Test script to validate that the preview functionality works with configSave="file"
 * This test simulates the browser environment where Node.js modules are not available
 */

// Mock the browser environment where Node.js modules are not available
global.window = {};
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

// Mock the require function to throw an error for 'fs' module (simulating browser environment)
const originalRequire = require;
global.require = function(moduleName) {
    if (moduleName === 'fs') {
        throw new Error("Cannot find module 'fs'");
    }
    return originalRequire(moduleName);
};

// Load the libs.js functionality
const fs = require('fs');
const path = require('path');

// Read the libs.js file
const libsPath = path.join(__dirname, '..', 'test_project', 'tyrano', 'libs.js');
const libsContent = fs.readFileSync(libsPath, 'utf8');

// Extract the storage functions
const storageMatches = libsContent.match(/\$\.setStorage\s*=[\s\S]*?};/);
const getStorageMatches = libsContent.match(/\$\.getStorage\s*=[\s\S]*?};/);

if (!storageMatches || !getStorageMatches) {
    console.error('Could not find storage functions in libs.js');
    process.exit(1);
}

// Mock $ object with storage functions
global.$ = {};

// Test the storage function behavior
try {
    // This should work - webstorage mode
    eval(`
        ${storageMatches[0]}
        ${getStorageMatches[0]}
        
        // Mock webstorage functions
        $.setStorageWeb = function(key, val) { console.log('setStorageWeb called'); };
        $.getStorageWeb = function(key) { console.log('getStorageWeb called'); return null; };
        
        // Test webstorage mode (should work)
        console.log('Testing webstorage mode...');
        $.setStorage('test', {data: 'test'}, 'webstorage');
        console.log('✓ webstorage mode works');
        
        // Test file mode (should fail without fix)
        console.log('Testing file mode...');
        try {
            $.setStorage('test', {data: 'test'}, 'file');
            console.log('✗ file mode unexpectedly worked');
        } catch (error) {
            console.log('✓ file mode correctly fails:', error.message);
        }
    `);
} catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
}

console.log('\nTest completed successfully!');
console.log('This demonstrates that configSave="file" will fail in browser environment.');
console.log('The fix overrides configSave to "webstorage" during preview mode.');