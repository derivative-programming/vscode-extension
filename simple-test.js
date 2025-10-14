// simple-test.js
// Simple test to check if MCP server starts
// Created: October 13, 2025

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting simple MCP server test...');

const server = spawn('node', [path.join(__dirname, 'dist', 'mcp', 'server.js')], {
    stdio: ['pipe', 'pipe', 'inherit'] // inherit stderr to see console.error messages
});

let responseData = '';

server.stdout.on('data', (data) => {
    responseData += data.toString();
    console.log('Server response:', data.toString());
});

server.stderr.on('data', (data) => {
    console.log('Server stderr:', data.toString());
});

server.on('close', (code) => {
    console.log('Server exited with code:', code);
    console.log('Total response:', responseData);
});

// Send a simple initialize message
setTimeout(() => {
    console.log('Sending initialize message...');
    const initMsg = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0' }
        }
    };
    server.stdin.write(JSON.stringify(initMsg) + '\n');

    // After a delay, close the input
    setTimeout(() => {
        console.log('Closing server input...');
        server.stdin.end();
    }, 2000);
}, 1000);