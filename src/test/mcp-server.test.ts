/**
 * Unit tests for the Model Context Protocol server
 * Created on: May 10, 2025
 */

import * as assert from 'assert';
import { MCPServer } from '../mcp/server';
import { UserStoryTools } from '../mcp/tools/userStoryTools';

suite('MCP Server Tests', () => {
    test('MCPServer Singleton', () => {
        const instance1 = MCPServer.getInstance();
        const instance2 = MCPServer.getInstance();
        
        assert.strictEqual(instance1, instance2, 'MCPServer should be a singleton');
    });

    test('Start and Stop Server', () => {
        const server = MCPServer.getInstance();
        assert.strictEqual(server.isServerRunning(), false, 'Server should be initially stopped');
        
        // Start the server
        server.start();
        assert.strictEqual(server.isServerRunning(), true, 'Server should be running after start');
        
        // Stop the server
        server.stop();
        assert.strictEqual(server.isServerRunning(), false, 'Server should be stopped after stop');
    });
});

suite('User Story Tools Tests', () => {
    test('Valid User Story Format', async () => {
        const server = MCPServer.getInstance();
        const userStoryTools = new UserStoryTools(server);
        
        // Try with both valid formats
        const validResult1 = await userStoryTools.create_user_story({
            description: 'As a User, I want to add a task'
        });
        assert.strictEqual(validResult1.success, true, 'Valid user story format should be accepted');
        
        const validResult2 = await userStoryTools.create_user_story({
            title: 'US-123',
            description: 'A Manager wants to view all reports'
        });
        assert.strictEqual(validResult2.success, true, 'Valid user story format should be accepted');
    });
    
    test('Invalid User Story Format', async () => {
        const server = MCPServer.getInstance();
        const userStoryTools = new UserStoryTools(server);
        
        // Try with invalid format
        const invalidResult = await userStoryTools.create_user_story({
            description: 'I want to add a task'
        });
        assert.strictEqual(invalidResult.success, false, 'Invalid user story format should be rejected');
    });
    
    test('List User Stories', async () => {
        const server = MCPServer.getInstance();
        // Clear any existing stories
        server.setInMemoryUserStories([]);
        
        const userStoryTools = new UserStoryTools(server);
        
        // Add a test story
        await userStoryTools.create_user_story({
            title: 'TEST-1',
            description: 'As a Tester, I want to view all test cases'
        });
        
        // List stories
        const result = await userStoryTools.list_user_stories();
        
        assert.strictEqual(result.success, true, 'List operation should succeed');
        assert.strictEqual(result.stories.length, 1, 'Should have one story');
        assert.strictEqual(result.stories[0].description, 'As a Tester, I want to view all test cases', 
            'Story description should match');
    });
});
