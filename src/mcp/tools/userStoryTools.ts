// userStoryTools.ts
// Tools for managing user stories via MCP
// Created on: May 10, 2025
// This file implements the createUserStory and listUserStories tools for MCP

// Note: ModelService import removed to allow this to run in standalone MCP server process
// import { ModelService } from '../../services/modelService';

/**
 * Implements user story tools for the MCP server
 */
export class UserStoryTools {
    constructor(modelService: any) {
        // modelService parameter kept for compatibility but not used
        // All data comes from HTTP bridge to extension
    }

    /**
     * Creates a user story and validates its format
     * Tool name: create_user_story (following MCP snake_case convention)
     * @param parameters Tool parameters containing title and description
     * @returns Result of the user story creation
     */
    public async create_user_story(parameters: any): Promise<any> {
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
                       '- "As a Manager, I want to view all items in the application"',
                validatedFormat: false
            };
        }

        // Use HTTP bridge to add story to ModelService with full validation
        try {
            const newStory = await this.postToBridge('/api/user-stories', {
                storyText: description,
                ...(title ? { storyNumber: title } : {})
            });

            return {
                success: true,
                story: newStory.story,
                message: newStory.message || 'User story created successfully',
                note: 'Story added to AppDNA model via MCP bridge (unsaved changes)',
                validatedFormat: true
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to create story: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: 'Could not connect to extension or validation failed',
                validatedFormat: true
            };
        }
    }

    /**
     * Lists all user stories
     * Tool name: list_user_stories (following MCP snake_case convention)
     * @returns Array of user stories
     */
    public async list_user_stories(): Promise<any> {
        // Get stories from extension via HTTP bridge
        try {
            const response = await this.fetchFromBridge('/api/user-stories');
            return {
                success: true,
                stories: response.map((story: any) => ({
                    name: story.name || "",
                    storyText: story.storyText || "",
                    isIgnored: story.isIgnored || "false"
                })),
                count: response.length,
                note: "Stories loaded from AppDNA model file via MCP bridge"
            };
        } catch (error) {
            return {
                success: false,
                stories: [],
                count: 0,
                error: `Could not connect to extension: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: "MCP bridge is not available. Make sure the extension is running."
            };
        }
    }

    /**
     * Lists all roles from the Role data object
     * Tool name: list_roles (following MCP snake_case convention)
     * @returns Array of role names
     */
    public async list_roles(): Promise<any> {
        // Try to get roles from extension via HTTP bridge
        try {
            const response = await this.fetchFromBridge('/api/roles');
            return {
                success: true,
                roles: response,
                count: response.length,
                note: "Roles loaded from Role data object via MCP bridge"
            };
        } catch (error) {
            // Return empty list if bridge is not available
            return {
                success: false,
                roles: [],
                count: 0,
                note: "Could not load roles from bridge",
                warning: `Could not connect to extension: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Lists all data objects from the AppDNA model
     * Tool name: list_data_objects (following MCP snake_case convention)
     * @param parameters Optional search and filter parameters
     * @returns Array of data objects with name, isLookup, and parentObjectName
     */
    public async list_data_objects(parameters?: any): Promise<any> {
        const { search_name, is_lookup, parent_object_name } = parameters || {};
        
        // Try to get data objects from extension via HTTP bridge
        try {
            const response = await this.fetchFromBridge('/api/data-objects');
            let filteredObjects = response;
            
            // Apply search_name filter (case-insensitive)
            if (search_name && typeof search_name === 'string') {
                const searchLower = search_name.toLowerCase();
                const searchNoSpaces = search_name.replace(/\s+/g, '').toLowerCase();
                
                filteredObjects = filteredObjects.filter((obj: any) => {
                    const nameLower = (obj.name || '').toLowerCase();
                    const nameNoSpaces = (obj.name || '').replace(/\s+/g, '').toLowerCase();
                    
                    // Search with spaces and without spaces
                    return nameLower.includes(searchLower) || nameNoSpaces.includes(searchNoSpaces);
                });
            }
            
            // Apply is_lookup filter
            if (is_lookup !== undefined && is_lookup !== null) {
                const lookupValue = is_lookup === 'true' || is_lookup === true;
                filteredObjects = filteredObjects.filter((obj: any) => obj.isLookup === lookupValue);
            }
            
            // Apply parent_object_name filter (case-insensitive exact match)
            if (parent_object_name && typeof parent_object_name === 'string') {
                const parentLower = parent_object_name.toLowerCase();
                filteredObjects = filteredObjects.filter((obj: any) => {
                    const objParentLower = (obj.parentObjectName || '').toLowerCase();
                    return objParentLower === parentLower;
                });
            }
            
            return {
                success: true,
                objects: filteredObjects,
                count: filteredObjects.length,
                filters: {
                    search_name: search_name || null,
                    is_lookup: is_lookup || null,
                    parent_object_name: parent_object_name || null
                },
                note: "Data objects loaded from AppDNA model file via MCP bridge"
            };
        } catch (error) {
            // Return empty list if bridge is not available
            return {
                success: false,
                objects: [],
                count: 0,
                note: "Could not load data objects from bridge",
                warning: `Could not connect to extension: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Get the secret word of the day - unique to this MCP server and project
     * Tool name: secret_word_of_the_day (following MCP snake_case convention)
     * @returns The secret word for today
     */
    public async secret_word_of_the_day(): Promise<any> {
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
     * Extracts the role from a user story text
     * @param text User story text
     * @returns The extracted role name or null if not found
     */
    private extractRoleFromUserStory(text: string): string | null {
        if (!text || typeof text !== "string") {
            return null;
        }
        
        const t = text.trim().replace(/\s+/g, " ");
        
        // Pattern 1: "A [Role] wants to..."
        const match1 = t.match(/^A\s+([\w\s]+?)\s+wants to\s+/i);
        if (match1) {
            return match1[1].trim();
        }
        
        // Pattern 2: "As a [Role], I want to..."
        const match2 = t.match(/^As a\s+([\w\s]+?)\s*,\s*I want to\s+/i);
        if (match2) {
            return match2[1].trim();
        }
        
        return null;
    }

    /**
     * Searches user stories by role name
     * Tool name: search_user_stories_by_role (following MCP snake_case convention)
     * @param parameters Tool parameters containing role name
     * @returns Array of user stories matching the role
     */
    public async search_user_stories_by_role(parameters: any): Promise<any> {
        const { role } = parameters;
        
        if (!role) {
            throw new Error('Role parameter is required');
        }
        
        // Get stories from extension via HTTP bridge
        try {
            const response = await this.fetchFromBridge('/api/user-stories');
            
            // Filter stories by role (case-insensitive match)
            const roleLower = role.toLowerCase();
            const matchingStories = response.filter((story: any) => {
                const storyText = story.storyText || "";
                const extractedRole = this.extractRoleFromUserStory(storyText);
                return extractedRole && extractedRole.toLowerCase() === roleLower;
            });
            
            return {
                success: true,
                role: role,
                stories: matchingStories.map((story: any) => ({
                    name: story.name || "",
                    storyText: story.storyText || "",
                    isIgnored: story.isIgnored || "false"
                })),
                count: matchingStories.length,
                note: "Stories loaded from AppDNA model file via MCP bridge"
            };
        } catch (error) {
            return {
                success: false,
                role: role,
                stories: [],
                count: 0,
                error: `Could not connect to extension: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: "MCP bridge is not available. Make sure the extension is running."
            };
        }
    }

    /**
     * Searches user stories by text query
     * Tool name: search_user_stories (following MCP snake_case convention)
     * @param parameters Tool parameters containing search query
     * @returns Array of user stories matching the search query
     */
    public async search_user_stories(parameters: any): Promise<any> {
        const { query, caseSensitive } = parameters;
        
        if (!query) {
            throw new Error('Query parameter is required');
        }
        
        const isCaseSensitive = caseSensitive === true;
        
        // Get stories from extension via HTTP bridge
        try {
            const response = await this.fetchFromBridge('/api/user-stories');
            
            // Filter stories by text search
            const matchingStories = response.filter((story: any) => {
                const storyText = story.storyText || "";
                const name = story.name || "";
                
                const searchText = isCaseSensitive 
                    ? storyText + " " + name
                    : (storyText + " " + name).toLowerCase();
                const searchQuery = isCaseSensitive ? query : query.toLowerCase();
                
                return searchText.includes(searchQuery);
            });
            
            return {
                success: true,
                query: query,
                caseSensitive: isCaseSensitive,
                stories: matchingStories.map((story: any) => ({
                    name: story.name || "",
                    storyText: story.storyText || "",
                    isIgnored: story.isIgnored || "false"
                })),
                count: matchingStories.length,
                note: "Stories loaded from AppDNA model file via MCP bridge"
            };
        } catch (error) {
            return {
                success: false,
                query: query,
                caseSensitive: isCaseSensitive,
                stories: [],
                count: 0,
                error: `Could not connect to extension: ${error instanceof Error ? error.message : 'Unknown error'}`,
                note: "MCP bridge is not available. Make sure the extension is running."
            };
        }
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
    private isValidUserStoryFormat(text: string): boolean {
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
    private generateGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Fetch data from extension via HTTP bridge (data bridge on port 3001)
     * @param endpoint The API endpoint to fetch from (e.g., '/api/user-stories')
     * @returns Promise resolving to the fetched data
     */
    private async fetchFromBridge(endpoint: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: endpoint,
                method: 'GET',
                timeout: 5000 // 5 second timeout
            };

            const req = http.request(options, (res: any) => {
                let data = '';
                
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`));
                    }
                });
            });

            req.on('error', (e: any) => {
                reject(new Error(`HTTP request failed: ${e.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out - is the extension running?'));
            });

            req.end();
        });
    }

    /**
     * Post data to extension via HTTP bridge (data bridge on port 3001)
     * @param endpoint The API endpoint to post to (e.g., '/api/user-stories')
     * @param data The data to post
     * @returns Promise resolving to the response data
     */
    private async postToBridge(endpoint: string, data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const postData = JSON.stringify(data);
            
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000 // 5 second timeout
            };

            const req = http.request(options, (res: any) => {
                let responseData = '';
                
                res.on('data', (chunk: any) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
                        }
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`));
                    }
                });
            });

            req.on('error', (e: any) => {
                reject(new Error(`HTTP request failed: ${e.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out - is the extension running?'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Execute a command in extension via HTTP bridge (command bridge on port 3002)
     * @param command The VS Code command to execute
     * @param args Optional arguments for the command
     * @returns Promise resolving to the command result
     */
    private async executeCommand(command: string, args: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            const postData = JSON.stringify({ command, args });
            
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/api/execute-command',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000 // 5 second timeout
            };

            const req = http.request(options, (res: any) => {
                let data = '';
                
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.success) {
                            resolve(response.result);
                        } else {
                            reject(new Error(response.error || 'Command execution failed'));
                        }
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`));
                    }
                });
            });

            req.on('error', (e: any) => {
                reject(new Error(`HTTP request failed: ${e.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out - is the extension running?'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Opens the user stories list view in the extension
     * Tool name: open_user_stories_view
     * @param parameters Optional parameters (initialTab)
     * @returns Result of opening the view
     */
    public async open_user_stories_view(parameters?: any): Promise<any> {
        try {
            const initialTab = parameters?.initialTab;
            
            // Execute command to open user stories view
            await this.executeCommand('appdna.mcp.openUserStories', initialTab ? [initialTab] : []);
            
            return {
                success: true,
                view: 'user-stories',
                initialTab: initialTab || 'default',
                message: 'User stories view opened successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to open user stories view - is the extension running?'
            };
        }
    }
}
