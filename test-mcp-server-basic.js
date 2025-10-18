/**
 * test-mcp-server-basic.js
 * Basic diagnostic test for MCP server
 * Last Modified: October 18, 2025
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== MCP Server Basic Test ===');
console.log('');

const serverPath = path.join(__dirname, 'dist', 'mcp', 'server.js');
console.log('Server path:', serverPath);
console.log('');

const fs = require('fs');
if (!fs.existsSync(serverPath)) {
    console.log('ERROR: Server file does not exist!');
    process.exit(1);
}

console.log('Server file exists: YES');
console.log('');
console.log('Starting server...');
console.log('');

const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let receivedData = false;

server.stdout.on('data', (data) => {
    receivedData = true;
    console.log('[STDOUT]', data.toString());
});

server.stderr.on('data', (data) => {
    console.log('[STDERR]', data.toString());
});

server.on('error', (error) => {
    console.log('[ERROR]', error);
});

server.on('close', (code) => {
    console.log('[CLOSE] Exit code:', code);
    process.exit(code);
});

// Send initialize after a short delay
setTimeout(() => {
    console.log('Sending initialize message...');
    const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'test',
                version: '1.0.0'
            }
        }
    };
    
    const msg = JSON.stringify(initMessage) + '\n';
    console.log('Message:', msg);
    server.stdin.write(msg);
}, 100);

// Timeout
setTimeout(() => {
    if (!receivedData) {
        console.log('');
        console.log('TIMEOUT: No data received from server');
        console.log('This might indicate the server is not responding');
    }
    server.kill();
}, 5000);
