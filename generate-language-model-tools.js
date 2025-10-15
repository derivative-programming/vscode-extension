// generate-language-model-tools.js
// Generates languageModelTools entries for package.json from MCP server tool registrations
// Run this script to update package.json with all view commands

const fs = require('fs');
const path = require('path');

// Read the server.ts file to extract tool registrations
const serverFile = fs.readFileSync(path.join(__dirname, 'src', 'mcp', 'server.ts'), 'utf8');

// Extract all registerTool calls
const toolPattern = /this\.server\.registerTool\('([^']+)',\s*\{[^}]*title:\s*'([^']+)',[^}]*description:\s*'([^']+)',/g;

const tools = [];
let match;

while ((match = toolPattern.exec(serverFile)) !== null) {
    const [, name, title, description] = match;
    
    tools.push({
        name,
        displayName: title,
        modelDescription: description,
        inputSchema: {
            type: "object",
            properties: {}
        }
    });
}

console.log(`Found ${tools.length} tools`);
console.log(JSON.stringify(tools, null, 2));
console.log('\n\nAdd these to package.json languageModelTools section');
