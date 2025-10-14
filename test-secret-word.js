// test-secret-word.js
// Simple test script to verify the secret word MCP tool works
// Created: October 13, 2025

const { spawn } = require('child_process');
const path = require('path');

async function testSecretWord() {
    return new Promise((resolve, reject) => {
        const serverPath = path.join(__dirname, 'dist', 'mcp', 'server.js');
        console.log('Starting server at:', serverPath);

        const server = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        server.stdout.on('data', (data) => {
            console.log('Server stdout:', data.toString());
            output += data.toString();
        });

        server.stderr.on('data', (data) => {
            console.log('Server stderr:', data.toString());
            errorOutput += data.toString();
        });

        server.on('close', (code) => {
            console.log('Server exit code:', code);
            resolve({ output, errorOutput, code });
        });

        server.on('error', (error) => {
            console.error('Server spawn error:', error);
            reject(error);
        });

        // Send initialize request
        const initRequest = {
            jsonrpc: '2.0',
            id: 1,
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

        console.log('Sending initialize request...');
        server.stdin.write(JSON.stringify(initRequest) + '\n');

        // Wait a bit then send tools/list
        setTimeout(() => {
            console.log('Sending tools/list request...');
            const listRequest = {
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/list'
            };
            server.stdin.write(JSON.stringify(listRequest) + '\n');

            // Wait a bit then send secret word call
            setTimeout(() => {
                console.log('Sending secret_word_of_the_day call...');
                const callRequest = {
                    jsonrpc: '2.0',
                    id: 3,
                    method: 'tools/call',
                    params: {
                        name: 'secret_word_of_the_day',
                        arguments: {}
                    }
                };
                server.stdin.write(JSON.stringify(callRequest) + '\n');

                // Close stdin after a delay to let server respond
                setTimeout(() => {
                    console.log('Closing server stdin...');
                    server.stdin.end();
                }, 2000);
            }, 1000);
        }, 1000);
    });
}

testSecretWord().then((result) => {
    console.log('Test completed successfully');
    console.log('Final output:', result.output);
    console.log('Final error output:', result.errorOutput);
}).catch((error) => {
    console.error('Test failed:', error);
});