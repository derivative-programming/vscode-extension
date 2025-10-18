/**
 * test-mcp-direct.js
 * Direct MCP server connection test with file logging
 * Last Modified: October 18, 2025
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'mcp-test-log.txt');
const log = (msg) => {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logFile, line);
    console.log(msg);
};

// Clear log file
fs.writeFileSync(logFile, '=== MCP Server Test - ' + new Date().toISOString() + ' ===\n\n');

log('Starting MCP server test...');

const serverPath = path.join(__dirname, 'dist', 'mcp', 'server.js');
log('Server path: ' + serverPath);

if (!fs.existsSync(serverPath)) {
    log('ERROR: Server file does not exist!');
    process.exit(1);
}

log('Server file exists');
log('Spawning server process...');

const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let messageId = 1;
let toolsList = null;

log('Server process spawned with PID: ' + server.pid);

// Handle stdout
server.stdout.on('data', (data) => {
    const dataStr = data.toString();
    log('STDOUT: ' + dataStr);
    
    const lines = dataStr.trim().split('\n');
    
    lines.forEach(line => {
        if (!line) {
            return;
        }
        
        try {
            const parsed = JSON.parse(line);
            log('Parsed JSON: ' + JSON.stringify(parsed).substring(0, 200));
            
            if (parsed.id === 1) {
                log('Initialize successful!');
                log('Sending tools/list request...');
                
                const listMessage = {
                    jsonrpc: '2.0',
                    id: messageId++,
                    method: 'tools/list',
                    params: {}
                };
                
                server.stdin.write(JSON.stringify(listMessage) + '\n');
                
            } else if (parsed.id === 2 && parsed.result) {
                toolsList = parsed.result.tools || [];
                log('Tools list received! Count: ' + toolsList.length);
                
                // Write full tool list to separate file
                const toolsFile = path.join(__dirname, 'mcp-tools-list.json');
                fs.writeFileSync(toolsFile, JSON.stringify(toolsList, null, 2));
                log('Full tool list written to: mcp-tools-list.json');
                
                // Log tool names
                log('\n=== TOOLS LIST ===');
                toolsList.forEach((tool, idx) => {
                    log(`${idx + 1}. ${tool.name}`);
                });
                log('=== END OF LIST ===\n');
                
                // Check for new tool
                const newTool = toolsList.find(t => t.name === 'get_data_object_usage');
                if (newTool) {
                    log('✅ Found get_data_object_usage tool!');
                    log('Description: ' + newTool.description);
                } else {
                    log('❌ get_data_object_usage tool NOT found!');
                }
                
                // Close after 1 second
                setTimeout(() => {
                    log('Closing server...');
                    server.stdin.end();
                }, 1000);
            }
        } catch (e) {
            log('Non-JSON data: ' + line);
        }
    });
});

// Handle stderr
server.stderr.on('data', (data) => {
    log('STDERR: ' + data.toString());
});

// Handle errors
server.on('error', (error) => {
    log('SERVER ERROR: ' + error.message);
});

// Handle close
server.on('close', (code) => {
    log('Server exited with code: ' + code);
    log('\nTest complete. Check mcp-test-log.txt for full output.');
    process.exit(code);
});

// Send initialize after short delay
setTimeout(() => {
    log('Sending initialize message...');
    
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
    
    log('Init message: ' + JSON.stringify(initMessage));
    server.stdin.write(JSON.stringify(initMessage) + '\n');
}, 500);

// Timeout
setTimeout(() => {
    log('TIMEOUT: Killing server after 10 seconds');
    server.kill();
    process.exit(1);
}, 10000);
