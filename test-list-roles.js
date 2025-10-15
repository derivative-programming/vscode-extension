// Test script for list_roles MCP tool
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing list_roles MCP tool...');
console.log('='.repeat(60));

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
            name: 'test-client-list-roles',
            version: '1.0.0'
        }
    }
};

console.log('[1] Sending initialize request...');
server.stdin.write(JSON.stringify(initMessage) + '\n');

// Listen for responses
server.stdout.on('data', (data) => {
    const response = data.toString().trim();
    
    // Handle potential multiple messages
    const lines = response.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
        try {
            const parsed = JSON.parse(line);
            console.log('\n' + '='.repeat(60));
            
            if (parsed.id === 1) {
                // Initialize response received
                console.log('[2] ✅ Initialize successful!');
                console.log('Server capabilities:', JSON.stringify(parsed.result?.capabilities, null, 2));
                
                // Now send tools/list
                console.log('\n[3] Requesting tools list...');
                const listMessage = {
                    jsonrpc: '2.0',
                    id: messageId++,
                    method: 'tools/list',
                    params: {}
                };
                server.stdin.write(JSON.stringify(listMessage) + '\n');
                
            } else if (parsed.id === 2) {
                // Tools list received
                console.log('[4] ✅ Tools list received!');
                const tools = parsed.result?.tools || [];
                console.log(`Found ${tools.length} tools:`);
                tools.forEach((tool, index) => {
                    console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
                });
                
                // Check if list_roles is in the list
                const listRolesTool = tools.find(t => t.name === 'list_roles');
                if (listRolesTool) {
                    console.log('\n✅ list_roles tool FOUND in tools list!');
                    console.log('Tool details:', JSON.stringify(listRolesTool, null, 2));
                } else {
                    console.log('\n❌ list_roles tool NOT FOUND in tools list!');
                    console.log('Available tools:', tools.map(t => t.name).join(', '));
                }
                
                // Now call list_roles
                console.log('\n[5] Calling list_roles tool...');
                const callMessage = {
                    jsonrpc: '2.0',
                    id: messageId++,
                    method: 'tools/call',
                    params: {
                        name: 'list_roles',
                        arguments: {}
                    }
                };
                server.stdin.write(JSON.stringify(callMessage) + '\n');
                
            } else if (parsed.id === 3) {
                // list_roles response received
                console.log('[6] ✅ list_roles response received!');
                console.log('Full response:', JSON.stringify(parsed, null, 2));
                
                // Parse the content
                if (parsed.result?.content) {
                    const content = parsed.result.content[0];
                    if (content.type === 'text') {
                        try {
                            const resultData = JSON.parse(content.text);
                            console.log('\n📊 Parsed Result:');
                            console.log('  Success:', resultData.success);
                            console.log('  Roles Count:', resultData.count);
                            console.log('  Roles:', resultData.roles);
                            console.log('  Note:', resultData.note);
                            if (resultData.warning) {
                                console.log('  ⚠️  Warning:', resultData.warning);
                            }
                        } catch (e) {
                            console.log('Could not parse result text:', content.text);
                        }
                    }
                }
                
                // Close the server
                console.log('\n[7] Test complete, closing server...');
                setTimeout(() => {
                    server.stdin.end();
                }, 1000);
            }
        } catch (e) {
            console.log('Received non-JSON data:', line);
        }
    });
});

server.on('close', (code) => {
    console.log('\n' + '='.repeat(60));
    console.log(`Server exited with code: ${code}`);
    console.log('Test completed!');
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

// Timeout after 15 seconds
setTimeout(() => {
    console.log('\n⏱️  Timeout reached, killing server...');
    server.kill();
}, 15000);
