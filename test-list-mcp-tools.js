/**
 * test-list-mcp-tools.js
 * Test script to list all MCP tools using proper JSON-RPC protocol
 * Last Modified: October 18, 2025
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== MCP Tool List Test ===\n');
console.log('Starting MCP server via JSON-RPC...\n');

const serverPath = path.join(__dirname, 'dist', 'mcp', 'server.js');
const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit']
});

let messageId = 1;
let toolsList = null;

// Send initialize message
const initMessage = {
    jsonrpc: '2.0',
    id: messageId++,
    method: 'initialize',
    params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
            name: 'tool-list-test',
            version: '1.0.0'
        }
    }
};

console.log('📤 Sending initialize request...');
server.stdin.write(JSON.stringify(initMessage) + '\n');

// Listen for responses
server.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    
    lines.forEach(line => {
        if (!line) {
            return;
        }
        
        try {
            const parsed = JSON.parse(line);
            
            if (parsed.id === 1) {
                // Initialize response received
                console.log('✅ Initialize successful!\n');
                console.log('📤 Requesting tools list...\n');

                const listMessage = {
                    jsonrpc: '2.0',
                    id: messageId++,
                    method: 'tools/list',
                    params: {}
                };

                server.stdin.write(JSON.stringify(listMessage) + '\n');
                
            } else if (parsed.id === 2 && parsed.result) {
                // Tools list received
                console.log('✅ Tools list received!\n');
                toolsList = parsed.result.tools || [];
                
                console.log('=== Available MCP Tools ===\n');
                console.log(`Total Tools: ${toolsList.length}\n`);
                
                // Group tools by category
                const toolsByCategory = {};
                
                toolsList.forEach(tool => {
                    let category = 'Other';
                    
                    if (tool.name.includes('data_object')) {
                        category = 'Data Object Management';
                    } else if (tool.name.includes('page_workflow') || tool.name.includes('form')) {
                        category = 'Page Workflow (Form) Management';
                    } else if (tool.name.includes('report')) {
                        category = 'Report Management';
                    } else if (tool.name.includes('flow')) {
                        category = 'Flow Management';
                    } else if (tool.name.includes('user_story')) {
                        category = 'User Story Management';
                    } else if (tool.name.includes('view')) {
                        category = 'View Navigation';
                    } else if (tool.name.includes('model') || tool.name === 'list_properties' || tool.name === 'get_property') {
                        category = 'Model & Navigation';
                    }
                    
                    if (!toolsByCategory[category]) {
                        toolsByCategory[category] = [];
                    }
                    toolsByCategory[category].push(tool);
                });
                
                // Display tools by category
                const categories = Object.keys(toolsByCategory).sort();
                
                categories.forEach(category => {
                    console.log(`\n📦 ${category} (${toolsByCategory[category].length} tools)`);
                    console.log('─'.repeat(70));
                    
                    toolsByCategory[category].sort((a, b) => a.name.localeCompare(b.name)).forEach(tool => {
                        console.log(`\n  🔧 ${tool.name}`);
                        if (tool.description) {
                            const desc = tool.description.split('\n')[0];
                            console.log(`     ${desc}`);
                        }
                        
                        // Show parameters
                        if (tool.inputSchema && tool.inputSchema.properties) {
                            const props = Object.keys(tool.inputSchema.properties);
                            const required = tool.inputSchema.required || [];
                            
                            if (props.length > 0) {
                                const paramList = props.map(p => {
                                    const isRequired = required.includes(p);
                                    return isRequired ? `${p}*` : p;
                                }).join(', ');
                                console.log(`     Parameters: ${paramList}`);
                            }
                        }
                    });
                });
                
                // Summary statistics
                console.log('\n\n=== Summary Statistics ===\n');
                categories.forEach(category => {
                    console.log(`  ${category}: ${toolsByCategory[category].length} tools`);
                });
                console.log(`\n  Total: ${toolsList.length} tools`);
                
                // Check for new tool
                console.log('\n\n=== Verification: New Tool ===\n');
                const newTool = toolsList.find(t => t.name === 'get_data_object_usage');
                if (newTool) {
                    console.log('✅ Tool "get_data_object_usage" is registered!\n');
                    console.log(`   Description: ${newTool.description}\n`);
                    
                    if (newTool.inputSchema) {
                        console.log('   Input Schema:');
                        console.log(JSON.stringify(newTool.inputSchema, null, 4));
                    }
                } else {
                    console.log('❌ Tool "get_data_object_usage" NOT found!');
                    console.log('   Make sure the code is compiled and the server is updated.\n');
                }
                
                console.log('\n✅ Test completed successfully!\n');
                
                // Close the server
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
    console.log(`\nServer exited with code: ${code}\n`);
    process.exit(code);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('\n⏱️  Timeout reached, killing server...\n');
    server.kill();
    process.exit(1);
}, 10000);
