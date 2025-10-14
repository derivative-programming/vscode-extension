// MCP Protocol test
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing MCP server with proper protocol...');

const server = spawn('node', [path.join(__dirname, 'dist', 'mcp', 'server.js')], {
    stdio: ['pipe', 'pipe', 'inherit']
});

let messageId = 1;

// Send initialize message
const initMessage = {
    jsonrpc: '2.0',
    id: messageId++,
    method: 'initialize',
    params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
            name: 'test-client',
            version: '1.0.0'
        }
    }
};

console.log('Sending initialize...');
server.stdin.write(JSON.stringify(initMessage) + '\n');

// Listen for responses
server.stdout.on('data', (data) => {
    const response = data.toString().trim();
    console.log('Server response:', response);

    try {
        const parsed = JSON.parse(response);
        if (parsed.id === 1) {
            // Initialize response received, now send tools/list
            console.log('Initialize successful, requesting tools list...');

            const listMessage = {
                jsonrpc: '2.0',
                id: messageId++,
                method: 'tools/list',
                params: {}
            };

            server.stdin.write(JSON.stringify(listMessage) + '\n');
        } else if (parsed.id === 2) {
            // Tools list received, now call secret word tool
            console.log('Tools list received, calling secret word tool...');

            const callMessage = {
                jsonrpc: '2.0',
                id: messageId++,
                method: 'tools/call',
                params: {
                    name: 'secret_word_of_the_day',
                    arguments: {}
                }
            };

            server.stdin.write(JSON.stringify(callMessage) + '\n');
        } else if (parsed.id === 3) {
            // Secret word response received
            console.log('Secret word response received!');
            console.log('Full response:', JSON.stringify(parsed, null, 2));

            // Close the server
            setTimeout(() => {
                server.stdin.end();
            }, 1000);
        }
    } catch (e) {
        console.log('Received non-JSON data:', response);
    }
});

server.on('close', (code) => {
    console.log('Server exited with code:', code);
});

server.on('error', (error) => {
    console.error('Server error:', error);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('Timeout reached, killing server...');
    server.kill();
}, 10000);