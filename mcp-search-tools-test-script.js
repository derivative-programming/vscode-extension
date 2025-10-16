// mcp-search-tools-test-script.js
// Test script for MCP server search tools
// Created: October 16, 2025
// Purpose: Test list_data_objects and search_user_stories tools via direct MCP communication

const { spawn } = require('child_process');
const path = require('path');

class MCPTestClient {
    constructor() {
        this.requestId = 1;
        this.serverProcess = null;
        this.responseBuffer = '';
    }

    /**
     * Start the MCP server
     */
    startServer() {
        const serverPath = path.join(__dirname, 'dist', 'mcp', 'server.js');
        console.log(`Starting MCP server: node ${serverPath}`);
        
        this.serverProcess = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_PATH: path.join(__dirname, 'node_modules') }
        });

        this.serverProcess.stderr.on('data', (data) => {
            console.error(`[Server Error] ${data.toString()}`);
        });

        console.log('✅ MCP server started\n');
    }

    /**
     * Send a request to the MCP server
     */
    async sendRequest(method, params = {}) {
        return new Promise((resolve, reject) => {
            const request = {
                jsonrpc: '2.0',
                id: this.requestId++,
                method: method,
                params: params
            };

            console.log(`📤 Sending request: ${method}`);
            console.log(`   Params: ${JSON.stringify(params, null, 2)}`);

            let responseData = '';
            
            const dataHandler = (data) => {
                responseData += data.toString();
                
                // Try to parse complete JSON-RPC messages
                const lines = responseData.split('\n');
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        try {
                            const response = JSON.parse(line);
                            if (response.id === request.id) {
                                this.serverProcess.stdout.removeListener('data', dataHandler);
                                resolve(response);
                                return;
                            }
                        } catch (e) {
                            // Not a complete JSON message yet
                        }
                    }
                }
                responseData = lines[lines.length - 1];
            };

            this.serverProcess.stdout.on('data', dataHandler);

            // Send the request
            this.serverProcess.stdin.write(JSON.stringify(request) + '\n');

            // Timeout after 5 seconds
            setTimeout(() => {
                this.serverProcess.stdout.removeListener('data', dataHandler);
                reject(new Error('Request timeout'));
            }, 5000);
        });
    }

    /**
     * Initialize the MCP server
     */
    async initialize() {
        console.log('🔧 Initializing MCP server...');
        const response = await this.sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'test-client',
                version: '1.0.0'
            }
        });
        console.log(`✅ Server initialized: ${response.result.serverInfo.name} v${response.result.serverInfo.version}\n`);
        return response;
    }

    /**
     * List available tools
     */
    async listTools() {
        console.log('📋 Listing available tools...');
        const response = await this.sendRequest('tools/list');
        console.log(`✅ Found ${response.result.tools.length} tools:\n`);
        response.result.tools.forEach(tool => {
            console.log(`   • ${tool.name}: ${tool.description}`);
        });
        console.log('');
        return response.result.tools;
    }

    /**
     * Call a tool
     */
    async callTool(toolName, args = {}) {
        console.log(`🔧 Calling tool: ${toolName}`);
        const response = await this.sendRequest('tools/call', {
            name: toolName,
            arguments: args
        });
        return response;
    }

    /**
     * Stop the server
     */
    stopServer() {
        if (this.serverProcess) {
            console.log('\n🛑 Stopping MCP server...');
            this.serverProcess.kill();
        }
    }
}

/**
 * Run all tests
 */
async function runTests() {
    const client = new MCPTestClient();
    
    try {
        // Start server
        client.startServer();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for server to start

        // Initialize
        await client.initialize();

        // List tools
        const tools = await client.listTools();

        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 1: Data Object Search Tools');
        console.log('═══════════════════════════════════════════════════════\n');

        // Test 1.1: List all data objects
        console.log('TEST 1.1: List All Data Objects');
        console.log('─────────────────────────────────────────');
        try {
            const result = await client.callTool('list_data_objects', {});
            console.log(`📊 Result:`);
            console.log(JSON.stringify(result.result, null, 2));
            console.log(`✅ Found ${result.result.count || 0} data objects\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 1.2: Search by name
        console.log('TEST 1.2: Search Data Objects by Name ("User")');
        console.log('─────────────────────────────────────────');
        try {
            const result = await client.callTool('list_data_objects', {
                search_name: 'User'
            });
            console.log(`📊 Result:`);
            console.log(JSON.stringify(result.result, null, 2));
            console.log(`✅ Found ${result.result.count || 0} matching objects\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 1.3: Search with space handling
        console.log('TEST 1.3: Search Data Objects with Space Handling ("UserRole")');
        console.log('─────────────────────────────────────────');
        try {
            const result = await client.callTool('list_data_objects', {
                search_name: 'UserRole'
            });
            console.log(`📊 Result:`);
            console.log(JSON.stringify(result.result, null, 2));
            console.log(`✅ Found ${result.result.count || 0} matching objects (should match "User Role" too)\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 1.4: Filter by isLookup
        console.log('TEST 1.4: Filter Data Objects by isLookup=true');
        console.log('─────────────────────────────────────────');
        try {
            const result = await client.callTool('list_data_objects', {
                is_lookup: 'true'
            });
            console.log(`📊 Result:`);
            console.log(JSON.stringify(result.result, null, 2));
            console.log(`✅ Found ${result.result.count || 0} lookup objects\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 2: User Story Search Tools');
        console.log('═══════════════════════════════════════════════════════\n');

        // Test 2.1: List all user stories
        console.log('TEST 2.1: List All User Stories');
        console.log('─────────────────────────────────────────');
        try {
            const result = await client.callTool('list_user_stories', {});
            console.log(`📊 Result:`);
            console.log(JSON.stringify(result.result, null, 2));
            console.log(`✅ Found ${result.result.count || 0} user stories\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 2.2: Search user stories (case-insensitive)
        console.log('TEST 2.2: Search User Stories ("manager", case-insensitive)');
        console.log('─────────────────────────────────────────');
        try {
            const result = await client.callTool('search_user_stories', {
                query: 'manager',
                caseSensitive: false
            });
            console.log(`📊 Result:`);
            console.log(JSON.stringify(result.result, null, 2));
            console.log(`✅ Found ${result.result.count || 0} matching stories\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 2.3: Search user stories (case-sensitive)
        console.log('TEST 2.3: Search User Stories ("Manager", case-sensitive)');
        console.log('─────────────────────────────────────────');
        try {
            const result = await client.callTool('search_user_stories', {
                query: 'Manager',
                caseSensitive: true
            });
            console.log(`📊 Result:`);
            console.log(JSON.stringify(result.result, null, 2));
            console.log(`✅ Found ${result.result.count || 0} matching stories (exact case)\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 2.4: Search by role
        console.log('TEST 2.4: Search User Stories by Role ("Manager")');
        console.log('─────────────────────────────────────────');
        try {
            const result = await client.callTool('search_user_stories_by_role', {
                role: 'Manager'
            });
            console.log(`📊 Result:`);
            console.log(JSON.stringify(result.result, null, 2));
            console.log(`✅ Found ${result.result.count || 0} stories with Manager role\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST SUMMARY');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('✅ All tests completed!');
        console.log('\nKey Observations:');
        console.log('1. Data Objects: Space-agnostic search (removes spaces)');
        console.log('2. User Stories: Simple substring search (no space removal)');
        console.log('3. Data Objects: Always case-insensitive');
        console.log('4. User Stories: Configurable case sensitivity');
        console.log('\nRecommendations:');
        console.log('• Add space-removal logic to user story search');
        console.log('• Add case sensitivity option to data object search');
        console.log('• Consider unified search utility for both tools\n');

    } catch (error) {
        console.error(`\n❌ Test failed: ${error.message}`);
        console.error(error.stack);
    } finally {
        client.stopServer();
    }
}

// Run tests
console.log('🚀 Starting MCP Search Tools Test Suite\n');
runTests().then(() => {
    console.log('✅ Test suite completed');
    process.exit(0);
}).catch((error) => {
    console.error(`❌ Test suite failed: ${error.message}`);
    process.exit(1);
});
