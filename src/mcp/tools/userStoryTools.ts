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
                       '- "A Manager wants to view all reports"\n' + 
                       '- "A Manager wants to view all tasks in a project"\n' + 
                       '- "A User wants to add a task"\n' + 
                       '- "As a User, I want to update an employee"\n' + 
                       '- "As a Manager, I want to view all items in the application"'
            };
        }

        // Extract and validate the role from the user story
        const roleName = this.extractRoleFromUserStory(description);
        if (!roleName) {
            return {
                success: false,
                error: 'Unable to extract role name from the user story. Please ensure the story follows the correct format.'
            };
        }

        // Validate that the role exists in the model
        if (!this.isValidRole(roleName)) {
            return {
                success: false,
                error: `Role "${roleName}" does not exist in the model. Please ensure the role is defined in a Role data object with lookup items before creating user stories that reference it.`
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
                        storyText: description
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
                storyText: description
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
     * Extracts the role name from a user story text.
     * @param text User story text
     * @returns The extracted role name or null if not found
     */
    private extractRoleFromUserStory(text: string): string | null {
        if (!text || typeof text !== "string") {
            return null;
        }
        
        // Remove extra spaces
        const t = text.trim().replace(/\s+/g, " ");
        
        // Regex to extract role from: A [Role] wants to...
        const re1 = /^A\s+\[?(\w+(?:\s+\w+)*)\]?\s+wants to/i;
        // Regex to extract role from: As a [Role], I want to...
        const re2 = /^As a\s+\[?(\w+(?:\s+\w+)*)\]?\s*,?\s*I want to/i;
        
        const match1 = re1.exec(t);
        const match2 = re2.exec(t);
        
        if (match1) {
            return match1[1].trim();
        } else if (match2) {
            return match2[1].trim();
        }
        
        return null;
    }

    /**
     * Validates if a role exists in the model's role data objects.
     * @param roleName The role name to validate
     * @returns True if the role exists, false otherwise
     */
    private isValidRole(roleName: string): boolean {
        if (!roleName) {
            return false;
        }
        
        try {
            const modelService = this.mcpServer.getModelService();
            if (!modelService || !modelService.isFileLoaded()) {
                return false;
            }
            
            const allObjects = modelService.getAllObjects();
            if (!allObjects || !Array.isArray(allObjects)) {
                return false;
            }
            
            // Find Role objects (objects with name 'Role' or containing 'role')
            const roleObjects = allObjects.filter((obj: any) => 
                obj.name === 'Role' || (obj.name && obj.name.toLowerCase().includes('role'))
            );
            
            if (roleObjects.length === 0) {
                // If no Role objects exist in the model, allow any role name
                return true;
            }
            
            // Check if the role name exists in any Role object's lookup items
            for (const roleObj of roleObjects) {
                if (roleObj.lookupItem && Array.isArray(roleObj.lookupItem)) {
                    const roleExists = roleObj.lookupItem.some((item: any) => {
                        // Check both name and displayName for matches (case insensitive)
                        const itemName = (item.name || "").toLowerCase();
                        const itemDisplayName = (item.displayName || "").toLowerCase();
                        const searchRole = roleName.toLowerCase();
                        
                        return itemName === searchRole || itemDisplayName === searchRole;
                    });
                    
                    if (roleExists) {
                        return true;
                    }
                }
            }
            
            // Role not found in any lookup items
            return false;
        } catch (error) {
            console.error('Error validating role:', error);
            // In case of error, return true to avoid blocking user stories
            return true;
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
}
