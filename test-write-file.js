// Simple file writer test
const fs = require('fs');

const output = [];
output.push('=== MCP Server Test ===\n');
output.push('Testing file output...\n');

fs.writeFileSync('test-output-sync.txt', output.join(''), 'utf8');
console.log('File written');
