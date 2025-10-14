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
        // Register create_user_story tool
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

        // Register list_user_stories tool
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

        this.disposables.push(createTool, listTool);
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
