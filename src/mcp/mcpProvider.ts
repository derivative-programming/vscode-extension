// mcpProvider.ts
// Official VS Code MCP Tool implementation
// Created on: July 5, 2025
// This file implements MCP tools directly using the official VS Code API

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';
import { UserStoryTools } from './tools/userStoryTools';

/**
 * Input schema for create_user_story tool
 */
interface CreateUserStoryInput {
    title?: string;
    description: string;
}

/**
 * Input schema for list_user_stories tool
 */
interface ListUserStoriesInput {
    // No parameters needed
}

/**
 * Input schema for list_roles tool
 */
interface ListRolesInput {
    // No parameters needed
}

/**
 * Input schema for list_data_objects tool
 */
interface ListDataObjectsInput {
    search_name?: string;
    is_lookup?: string;
    parent_object_name?: string;
}

/**
 * Input schema for search_user_stories_by_role tool
 */
interface SearchUserStoriesByRoleInput {
    role: string;
}

/**
 * Input schema for search_user_stories tool
 */
interface SearchUserStoriesInput {
    query: string;
    caseSensitive?: boolean;
}

/**
 * AppDNA MCP Tools Provider
 * Implements MCP tools directly using VS Code's official language model API
 */
export class AppDNAMcpProvider {
    private modelService: ModelService;
    private userStoryTools: UserStoryTools;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.modelService = ModelService.getInstance();
        this.userStoryTools = new UserStoryTools(this.modelService);
        this.registerTools();
    }

    /**
     * Register MCP tools with VS Code's language model API
     */
    private registerTools(): void {
        console.log('[MCP Provider] Starting tool registration...');
        
        // Register create_user_story tool
        console.log('[MCP Provider] Registering create_user_story...');
        const createTool = vscode.lm.registerTool('create_user_story', {
            prepareInvocation: async (options, token) => {
                const input = options.input as CreateUserStoryInput;
                return {
                    invocationMessage: `Creating user story: ${input.title || 'Untitled'}`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as CreateUserStoryInput;
                    const result = await this.userStoryTools.create_user_story(input);
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                    ]);
                } catch (error) {
                    const errorResult = {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
                    ]);
                }
            }
        });
        console.log('[MCP Provider] ✓ create_user_story registered');

        // Register list_user_stories tool
        console.log('[MCP Provider] Registering list_user_stories...');
        const listTool = vscode.lm.registerTool('list_user_stories', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Listing all user stories',
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const result = await this.userStoryTools.list_user_stories();
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                    ]);
                } catch (error) {
                    const errorResult = {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
                    ]);
                }
            }
        });
        console.log('[MCP Provider] ✓ list_user_stories registered');

        // Register list_roles tool
        console.log('[MCP Provider] Registering list_roles...');
        const listRolesTool = vscode.lm.registerTool('list_roles', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Listing all roles from the AppDNA model',
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const result = await this.userStoryTools.list_roles();
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                    ]);
                } catch (error) {
                    const errorResult = {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
                    ]);
                }
            }
        });
        console.log('[MCP Provider] ✓ list_roles registered');

        // Register list_data_objects tool
        console.log('[MCP Provider] Registering list_data_objects...');
        const listDataObjectsTool = vscode.lm.registerTool('list_data_objects', {
            prepareInvocation: async (options, token) => {
                const input = options.input as ListDataObjectsInput;
                let message = 'Listing data objects from the AppDNA model';
                if (input?.search_name) {
                    message += ` matching "${input.search_name}"`;
                }
                if (input?.is_lookup) {
                    message += ` (lookup: ${input.is_lookup})`;
                }
                if (input?.parent_object_name) {
                    message += ` (parent: ${input.parent_object_name})`;
                }
                return {
                    invocationMessage: message,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as ListDataObjectsInput;
                    const result = await this.userStoryTools.list_data_objects(input);
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                    ]);
                } catch (error) {
                    const errorResult = {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
                    ]);
                }
            }
        });
        console.log('[MCP Provider] ✓ list_data_objects registered');

        // Register search_user_stories_by_role tool
        console.log('[MCP Provider] Registering search_user_stories_by_role...');
        const searchByRoleTool = vscode.lm.registerTool('search_user_stories_by_role', {
            prepareInvocation: async (options, token) => {
                const input = options.input as SearchUserStoriesByRoleInput;
                return {
                    invocationMessage: `Searching user stories for role: ${input.role}`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as SearchUserStoriesByRoleInput;
                    const result = await this.userStoryTools.search_user_stories_by_role(input);
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                    ]);
                } catch (error) {
                    const errorResult = {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
                    ]);
                }
            }
        });
        console.log('[MCP Provider] ✓ search_user_stories_by_role registered');

        // Register search_user_stories tool
        console.log('[MCP Provider] Registering search_user_stories...');
        const searchStoriesTool = vscode.lm.registerTool('search_user_stories', {
            prepareInvocation: async (options, token) => {
                const input = options.input as SearchUserStoriesInput;
                return {
                    invocationMessage: `Searching user stories for: "${input.query}"`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as SearchUserStoriesInput;
                    const result = await this.userStoryTools.search_user_stories(input);
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                    ]);
                } catch (error) {
                    const errorResult = {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
                    ]);
                }
            }
        });
        console.log('[MCP Provider] ✓ search_user_stories registered');

        this.disposables.push(createTool, listTool, listRolesTool, listDataObjectsTool, searchByRoleTool, searchStoriesTool);
        console.log('[MCP Provider] All 6 tools registered and added to disposables');
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
