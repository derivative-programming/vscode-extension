// testMCPServer.js
// Script to simulate MCP server communication
// Created on: May 10, 2025
// This script simulates an MCP client interacting with the server

// Example MCP request
const createUserStoryRequest = {
    jsonrpc: '2.0',
    id: '1',
    method: 'mcp/execute',
    params: {
        name: 'createUserStory',
        parameters: {
            title: 'US-001',
            description: 'As a User, I want to add a task'
        }
    }
};

const listUserStoriesRequest = {
    jsonrpc: '2.0',
    id: '2',
    method: 'mcp/execute',
    params: {
        name: 'listUserStories',
        parameters: {}
    }
};

// Print the requests for manual testing
console.log('Create User Story Request:');
console.log(JSON.stringify(createUserStoryRequest, null, 2));
console.log('\nList User Stories Request:');
console.log(JSON.stringify(listUserStoriesRequest, null, 2));

// Instructions for manual testing
console.log('\n==========================================');
console.log('Manual Testing Instructions:');
console.log('1. Start the MCP server using "AppDNA: Start MCP Server" command');
console.log('2. Copy one of the above requests');
console.log('3. Paste it into the Debug Console');
console.log('4. Check the server response');
console.log('==========================================');

// Export the requests for programmatic testing if needed
module.exports = {
    createUserStoryRequest,
    listUserStoriesRequest
};
