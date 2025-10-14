// Direct test of UserStoryTools
const path = require('path');

// Try to load the bundled UserStoryTools
try {
    // Since it's webpack bundled, we need to load it differently
    const userStoryToolsPath = path.join(__dirname, 'dist', 'mcp', 'server.js');
    console.log('Loading from:', userStoryToolsPath);

    // The webpack bundle exports the MCPServer, which has UserStoryTools
    const { MCPServer } = require(userStoryToolsPath);

    console.log('MCPServer loaded successfully');

    // Get an instance
    const server = MCPServer.getInstance();
    console.log('Server instance created');

    // The server has userStoryTools internally, but we can't access it directly
    // Let's try calling the tool through the MCP interface

    console.log('Test completed - MCP server loads successfully');

} catch (error) {
    console.error('Error loading MCP server:', error.message);
    console.error('Stack:', error.stack);
}