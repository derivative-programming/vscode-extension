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

    test('Server Instance Creation', () => {
        const server = MCPServer.getInstance();
        assert.ok(server, 'Server instance should be created');
        assert.ok(server.getServer(), 'Server should have MCP server instance');
        assert.ok(server.getTransport(), 'Server should have transport instance');
    });
});

suite('User Story Tools Tests', () => {
    test('Valid User Story Format', async () => {
        const userStoryTools = new UserStoryTools(null);

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
        const userStoryTools = new UserStoryTools(null);

        // Try with invalid format
        const invalidResult = await userStoryTools.create_user_story({
            description: 'I want to add a task'
        });
        assert.strictEqual(invalidResult.success, false, 'Invalid user story format should be rejected');
    });

    test('List User Stories', async () => {
        const userStoryTools = new UserStoryTools(null);

        // Add a test story
        await userStoryTools.create_user_story({
            title: 'TEST-1',
            description: 'As a Tester, I want to view all test cases'
        });

        // List stories
        const result = await userStoryTools.list_user_stories();

        assert.strictEqual(result.success, true, 'List operation should succeed');
        assert.ok(result.stories.length >= 1, 'Should have at least one story');
    });

    test('Secret Word of the Day', async () => {
        const userStoryTools = new UserStoryTools(null);

        // Get the secret word
        const result = await userStoryTools.secret_word_of_the_day();

        assert.strictEqual(result.success, true, 'Secret word operation should succeed');
        assert.ok(result.word, 'Should return a word');
        assert.ok(result.date, 'Should return a date');
        assert.ok(result.project, 'Should return a project identifier');
        assert.ok(result.note, 'Should return a note');

        // Test that the word is consistent for the same day
        const result2 = await userStoryTools.secret_word_of_the_day();
        assert.strictEqual(result.word, result2.word, 'Word should be consistent for the same day');
        assert.strictEqual(result.date, result2.date, 'Date should be consistent');
    });
});
