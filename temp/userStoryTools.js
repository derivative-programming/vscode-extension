"use strict";
// userStoryTools.ts
// Tools for managing user stories via MCP
// Created on: May 10, 2025
// This file implements the createUserStory and listUserStories tools for MCP
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStoryTools = void 0;
// Note: ModelService import removed to allow this to run in standalone MCP server process
// import { ModelService } from '../../services/modelService';
/**
 * Implements user story tools for the MCP server
 */
class UserStoryTools {
    constructor(modelService) {
        // private modelService: ModelService;
        this.inMemoryUserStories = [];
        // this.modelService = modelService;
        // Always use in-memory storage for MCP server
    }
    /**
     * Creates a user story and validates its format
     * Tool name: create_user_story (following MCP snake_case convention)
     * @param parameters Tool parameters containing title and description
     * @returns Result of the user story creation
     */
    async create_user_story(parameters) {
        const { title, description } = parameters;
        if (!description) {
            throw new Error('Description is required');
        }
        // Validate the user story format
        const isValid = this.isValidUserStoryFormat(description);
        if (!isValid) {
            return {
                success: false,
                error: 'Invalid format. Examples of correct formats:\n' +
                    '- "A Manager wants to view all reports"\n' +
                    '- "A Manager wants to view all tasks in a project"\n' +
                    '- "A User wants to add a task"\n' +
                    '- "As a User, I want to update an employee"\n' +
                    '- "As a Manager, I want to view all items in the application"'
            };
        }
        // For MCP server, always use in-memory storage
        const storyId = `US-${Date.now()}`;
        const newStory = {
            storyNumber: title || storyId,
            storyText: description,
            isIgnored: "false"
        };
        this.inMemoryUserStories.push(newStory);
        return {
            success: true,
            story: {
                id: storyId,
                title: newStory.storyNumber,
                description: newStory.storyText
            },
            message: 'User story created successfully in MCP server memory'
        };
    }
    /**
     * Lists all user stories
     * Tool name: list_user_stories (following MCP snake_case convention)
     * @returns Array of user stories
     */
    async list_user_stories() {
        // For MCP server, use in-memory storage only
        const inMemoryStories = this.getInMemoryUserStories();
        return {
            success: true,
            stories: inMemoryStories.map(story => ({
                title: story.storyNumber || "",
                description: story.storyText || "",
                isIgnored: story.isIgnored === "true"
            })),
            note: inMemoryStories.length > 0 ? "Stories loaded from in-memory storage" : "No stories found"
        };
    }
    /**
     * Add a user story to in-memory storage
     */
    addInMemoryUserStory(story) {
        this.inMemoryUserStories.push(story);
    }
    /**
     * Get all in-memory user stories
     */
    getInMemoryUserStories() {
        return this.inMemoryUserStories;
    }
    /**
     * Get the secret word of the day - unique to this MCP server and project
     * Tool name: secret_word_of_the_day (following MCP snake_case convention)
     * @returns The secret word for today
     */
    async secret_word_of_the_day() {
        // Generate a unique word based on the current date and project identifier
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const projectId = 'vscode-extension-appdna'; // Unique to this project
        // Create a simple hash of the date + project ID
        const hashInput = dateString + projectId;
        let hash = 0;
        for (let i = 0; i < hashInput.length; i++) {
            const char = hashInput.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Use the hash to select from a curated list of interesting words
        const wordList = [
            'quantum', 'nebula', 'cipher', 'phoenix', 'zenith', 'aurora', 'cosmos',
            'enigma', 'galaxy', 'harmony', 'infinity', 'journey', 'kaleidoscope',
            'labyrinth', 'mirage', 'nexus', 'oracle', 'paradox', 'quasar', 'riddle',
            'sapphire', 'tesseract', 'universe', 'vortex', 'whisper', 'xenon',
            'yggdrasil', 'zephyr', 'amber', 'brilliance', 'cascade', 'dynamo',
            'echo', 'fusion', 'glimmer', 'horizon', 'illusion', 'jubilee'
        ];
        const wordIndex = Math.abs(hash) % wordList.length;
        const secretWord = wordList[wordIndex];
        return {
            success: true,
            word: secretWord,
            date: dateString,
            project: 'AppDNA VS Code Extension',
            note: 'This word is uniquely generated for this MCP server and project files'
        };
    }
    /**
     * Validates user story text against allowed formats.
     * Accepts:
     *   - A [Role Name] wants to [view, add, update, delete] [a,an] [Object Name(s)]
     *   - A [Role Name] wants to view all [Object Name(s)] in a [Container Object Name]
     *   - As a [Role Name], I want to [view, add, update, delete] [a,an] [Object Name(s)]
     *   - As a [Role Name], I want to view all [Object Name(s)] in a [Container Object Name]
     * Brackets are optional, case is ignored, and 'a', 'an', or 'all' are allowed before the object.
     * @param text User story text to validate
     * @returns boolean indicating if the format is valid
     */
    isValidUserStoryFormat(text) {
        if (!text || typeof text !== "string") {
            return false;
        }
        // Remove extra spaces
        const t = text.trim().replace(/\s+/g, " ");
        // Regex for: A [Role] wants to view all [objects] in a [container] OR in the [container]
        const re1ViewAll = /^A\s+[\w\s]+\s+wants to\s+view all\s+[\w\s]+\s+in (?:a |the )[\w\s]+$/i;
        // Regex for: As a [Role], I want to view all [objects] in a [container] OR in the [container]  
        const re2ViewAll = /^As a\s+[\w\s]+\s*,\s*I want to\s+view all\s+[\w\s]+\s+in (?:a |the )[\w\s]+$/i;
        // Regex for: A [Role] wants to [action] [a|an] [object] (single object actions)
        const re1Single = /^A\s+[\w\s]+\s+wants to\s+(?:view|add|create|update|edit|delete|remove)\s+(?:a |an )[\w\s]+$/i;
        // Regex for: As a [Role], I want to [action] [a|an] [object] (single object actions)
        const re2Single = /^As a\s+[\w\s]+\s*,\s*I want to\s+(?:view|add|create|update|edit|delete|remove)\s+(?:a |an )[\w\s]+$/i;
        return re1ViewAll.test(t) || re2ViewAll.test(t) || re1Single.test(t) || re2Single.test(t);
    }
    /**
     * Generates a GUID for new user stories
     * @returns New GUID string
     */
    generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
exports.UserStoryTools = UserStoryTools;
