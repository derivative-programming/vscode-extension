// userStoryTools.ts
// Tools for managing user stories via MCP
// Created on: May 10, 2025
// This file implements the createUserStory and listUserStories tools for MCP

import { MCPServer } from '../server';

/**
 * Implements user story tools for the MCP server
 */
export class UserStoryTools {
    private mcpServer: MCPServer;

    constructor(mcpServer: MCPServer) {
        this.mcpServer = mcpServer;
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
                       '- "As a User, I want to add a task"\n' + 
                       '- "A Manager wants to view all reports"'
            };
        }

        // Try to save to the model if available
        const modelService = this.mcpServer.getModelService();
        let success = false;

        if (modelService && modelService.isFileLoaded()) {
            try {
                // Get the current model
                const currentModel = modelService.getCurrentModel();
                if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
                    // Get the first namespace
                    const namespace = currentModel.namespace[0];
                    if (!namespace.userStory || !Array.isArray(namespace.userStory)) {
                        namespace.userStory = [];
                    }

                    // Check for duplicate
                    const existingStory = namespace.userStory.find(
                        (story: any) => story.storyText === description
                    );
                    
                    if (existingStory) {
                        return {
                            success: false,
                            error: 'A user story with this text already exists'
                        };
                    }

                    // Create a new user story
                    const newStory = {
                        name: this.generateGuid(),
                        storyNumber: title || "",
                        storyText: description,
                        isIgnored: "false",
                        isStoryProcessed: "false"
                    };

                    // Add the new story to the model
                    namespace.userStory.push(newStory);
                    success = true;

                    return {
                        success: true,
                        story: newStory
                    };
                }
            } catch (error) {
                console.error('[MCP] Error saving user story to model:', error);
                // Fall through to in-memory storage
            }
        }

        // If we couldn't save to the model, store in memory
        if (!success) {
            const newStory = {
                name: this.generateGuid(),
                storyNumber: title || "",
                storyText: description,
                isIgnored: "false",
                isStoryProcessed: "false"
            };

            this.mcpServer.addInMemoryUserStory(newStory);
            
            return {
                success: true,
                story: newStory,
                note: "Story created in memory only (model file not loaded)"
            };
        }
    }

    /**
     * Lists all user stories
     * Tool name: list_user_stories (following MCP snake_case convention)
     * @returns Array of user stories
     */
    public async list_user_stories(): Promise<any> {
        // Try to get stories from the model if available
        const modelService = this.mcpServer.getModelService();
        
        if (modelService && modelService.isFileLoaded()) {
            try {
                // Get the current model
                const currentModel = modelService.getCurrentModel();
                if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
                    // Get the first namespace
                    const namespace = currentModel.namespace[0];
                    const userStories = namespace.userStory || [];
                    
                    return {
                        success: true,
                        stories: userStories.map((story: any) => ({
                            title: story.storyNumber || "",
                            description: story.storyText || "",
                            isIgnored: story.isIgnored === "true"
                        }))
                    };
                }
            } catch (error) {
                console.error('[MCP] Error retrieving user stories from model:', error);
                // Fall through to in-memory storage
            }
        }

        // If we couldn't get from the model, use in-memory storage
        const inMemoryStories = this.mcpServer.getInMemoryUserStories();
        return {
            success: true,
            stories: inMemoryStories.map(story => ({
                title: story.storyNumber || "",
                description: story.storyText || "",
                isIgnored: story.isIgnored === "true"
            })),
            note: inMemoryStories.length > 0 ? "Stories loaded from in-memory storage (model file not loaded)" : "No stories found"
        };
    }

    /**
     * Validates user story text against allowed formats.
     * Accepts:
     *   - A [Role Name] wants to [View all, view, add, update, delete] [a,an,all] [Object Name(s)]
     *   - As a [Role Name], I want to [View all, view, add, update, delete] [a,an,all] [Object Name(s)]
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
        
        // Regex for: A [Role] wants to [action] [a|an|all] [object]
        const re1 = /^A\s+\[?\w+(?: \w+)*\]?\s+wants to\s+\[?(View all|view|add|update|delete)\]?\s+(a|an|all)\s+\[?\w+(?: \w+)*\]?$/i;
        
        // Regex for: As a [Role], I want to [action] [a|an|all] [object]
        const re2 = /^As a\s+\[?\w+(?: \w+)*\]?\s*,?\s*I want to\s+\[?(View all|view|add|update|delete)\]?\s+(a|an|all)\s+\[?\w+(?: \w+)*\]?$/i;
        
        return re1.test(t) || re2.test(t);
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
}
