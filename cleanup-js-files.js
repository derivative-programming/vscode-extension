/**
 * Cleanup Script for TypeScript generated files
 * 
 * This script will scan the project for TypeScript (.ts) files and delete
 * the corresponding JavaScript (.js) and source map (.js.map) files.
 * It will NOT delete JavaScript files that don't have a TypeScript counterpart.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = __dirname; // The extension root directory
const ignoreDirs = ['node_modules', 'dist', '.git', '.vscode']; // Directories to ignore

// Counter for deleted files
let deletedJsFiles = 0;
let deletedMapFiles = 0;

/**
 * Check if a path should be ignored
 * @param {string} dirPath - Directory path to check
 * @returns {boolean} - True if directory should be ignored
 */
function shouldIgnoreDir(dirPath) {
    const relativePath = path.relative(rootDir, dirPath);
    return ignoreDirs.some(dir => 
        relativePath === dir || 
        relativePath.startsWith(dir + path.sep) ||
        relativePath.includes(path.sep + dir + path.sep)
    );
}

/**
 * Process a single TypeScript file and delete corresponding .js and .js.map files
 * @param {string} tsFile - Path to the TypeScript file
 */
function processTypeScriptFile(tsFile) {
    const jsFile = tsFile.replace(/\.ts$/, '.js');
    const mapFile = tsFile.replace(/\.ts$/, '.js.map');
    
    // Check and delete .js file
    if (fs.existsSync(jsFile)) {
        console.log(`Deleting: ${path.relative(rootDir, jsFile)}`);
        fs.unlinkSync(jsFile);
        deletedJsFiles++;
    }
    
    // Check and delete .js.map file
    if (fs.existsSync(mapFile)) {
        console.log(`Deleting: ${path.relative(rootDir, mapFile)}`);
        fs.unlinkSync(mapFile);
        deletedMapFiles++;
    }
}

/**
 * Recursively scan directories for .ts files
 * @param {string} dirPath - Directory to scan
 */
function scanDirectory(dirPath) {
    if (shouldIgnoreDir(dirPath)) {
        return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            processTypeScriptFile(fullPath);
        }
    }
}

// Start the cleanup process
console.log('Starting TypeScript generated files cleanup...');
console.log('This will delete .js and .js.map files that have corresponding .ts files');
console.log('-------------------------------------------------------------------');

try {
    scanDirectory(rootDir);
    console.log('-------------------------------------------------------------------');
    console.log(`Cleanup completed successfully!`);
    console.log(`Deleted ${deletedJsFiles} JavaScript files and ${deletedMapFiles} source map files.`);
} catch (error) {
    console.error('Error during cleanup:', error);
}