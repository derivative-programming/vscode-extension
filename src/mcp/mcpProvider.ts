// mcpProvider.ts
// Official VS Code MCP Tool implementation
// Created on: July 5, 2025
// This file implements MCP tools directly using the official VS Code API

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';
import { UserStoryTools } from './tools/userStoryTools';
import { DataObjectTools } from './tools/dataObjectTools';
import { FormTools } from './tools/formTools';

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
 * Input schema for update_user_story tool
 */
interface UpdateUserStoryInput {
    name: string;
    isIgnored: string;
}

/**
 * Input schema for list_roles tool
 */
interface ListRolesInput {
    // No parameters needed
}

/**
 * Input schema for list_data_object_summary tool
 */
interface ListDataObjectSummaryInput {
    search_name?: string;
    is_lookup?: string;
    parent_object_name?: string;
}

/**
 * Input schema for list_data_objects tool (full details)
 */
interface ListDataObjectsInput {
    search_name?: string;
    is_lookup?: string;
    parent_object_name?: string;
}

/**
 * Input schema for create_data_object tool
 */
interface CreateDataObjectInput {
    name: string;
    parentObjectName: string;
    isLookup?: string;
    codeDescription?: string;
}

/**
 * Input schema for add_role tool
 */
interface AddRoleInput {
    name: string;
}

/**
 * Input schema for update_role tool
 */
interface UpdateRoleInput {
    name: string;
    displayName?: string;
    description?: string;
    isActive?: string;
}

/**
 * Input schema for add_lookup_value tool
 */
interface AddLookupValueInput {
    lookupObjectName: string;
    name: string;
    displayName?: string;
    description?: string;
    isActive?: string;
}

/**
 * Input schema for list_lookup_values tool
 */
interface ListLookupValuesInput {
    lookupObjectName: string;
    includeInactive?: boolean;
}

/**
 * Input schema for update_lookup_value tool
 */
interface UpdateLookupValueInput {
    lookupObjectName: string;
    name: string;
    displayName?: string;
    description?: string;
    isActive?: string;
}

/**
 * Input schema for get_data_object tool
 */
interface GetDataObjectInput {
    name: string;
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
    private dataObjectTools: DataObjectTools;
    private formTools: FormTools;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.modelService = ModelService.getInstance();
        this.userStoryTools = new UserStoryTools(this.modelService);
        this.dataObjectTools = new DataObjectTools(this.modelService);
        this.formTools = new FormTools(this.modelService);
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

        // Register update_user_story tool
        console.log('[MCP Provider] Registering update_user_story...');
        const updateUserStoryTool = vscode.lm.registerTool('update_user_story', {
            prepareInvocation: async (options, token) => {
                const input = options.input as UpdateUserStoryInput;
                return {
                    invocationMessage: `Updating user story ${input.name} (isIgnored: ${input.isIgnored})`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as UpdateUserStoryInput;
                    const result = await this.userStoryTools.update_user_story(input);
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
        console.log('[MCP Provider] ✓ update_user_story registered');

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
                    const result = await this.dataObjectTools.list_roles();
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

        // Register add_role tool
        console.log('[MCP Provider] Registering add_role...');
        const addRoleTool = vscode.lm.registerTool('add_role', {
            prepareInvocation: async (options, token) => {
                const input = options.input as AddRoleInput;
                return {
                    invocationMessage: `Adding role: ${input.name}`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as AddRoleInput;
                    const result = await this.dataObjectTools.add_role(input);
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
        console.log('[MCP Provider] ✓ add_role registered');

        // Register update_role tool
        console.log('[MCP Provider] Registering update_role...');
        const updateRoleTool = vscode.lm.registerTool('update_role', {
            prepareInvocation: async (options, token) => {
                const input = options.input as UpdateRoleInput;
                return {
                    invocationMessage: `Updating role: ${input.name}`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as UpdateRoleInput;
                    const result = await this.dataObjectTools.update_role(input);
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
        console.log('[MCP Provider] ✓ update_role registered');

        // Register add_lookup_value tool
        console.log('[MCP Provider] Registering add_lookup_value...');
        const addLookupValueTool = vscode.lm.registerTool('add_lookup_value', {
            prepareInvocation: async (options, token) => {
                const input = options.input as AddLookupValueInput;
                return {
                    invocationMessage: `Adding lookup value "${input.name}" to ${input.lookupObjectName}`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as AddLookupValueInput;
                    const result = await this.dataObjectTools.add_lookup_value(input);
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
        console.log('[MCP Provider] ✓ add_lookup_value registered');

        // Register list_lookup_values tool
        console.log('[MCP Provider] Registering list_lookup_values...');
        const listLookupValuesTool = vscode.lm.registerTool('list_lookup_values', {
            prepareInvocation: async (options, token) => {
                const input = options.input as ListLookupValuesInput;
                return {
                    invocationMessage: `Listing lookup values from ${input.lookupObjectName}`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as ListLookupValuesInput;
                    const result = await this.dataObjectTools.list_lookup_values(input);
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
        console.log('[MCP Provider] ✓ list_lookup_values registered');

        // Register update_lookup_value tool
        console.log('[MCP Provider] Registering update_lookup_value...');
        const updateLookupValueTool = vscode.lm.registerTool('update_lookup_value', {
            prepareInvocation: async (options, token) => {
                const input = options.input as UpdateLookupValueInput;
                return {
                    invocationMessage: `Updating lookup value "${input.name}" in ${input.lookupObjectName}`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as UpdateLookupValueInput;
                    const result = await this.dataObjectTools.update_lookup_value(input);
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
        console.log('[MCP Provider] ✓ update_lookup_value registered');

        // Register get_lookup_value_schema tool
        console.log('[MCP Provider] Registering get_lookup_value_schema...');
        const getLookupValueSchemaTool = vscode.lm.registerTool('get_lookup_value_schema', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Getting lookup value schema definition',
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const result = await this.dataObjectTools.get_lookup_value_schema();
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
        console.log('[MCP Provider] ✓ get_lookup_value_schema registered');

        // Register get_role_schema tool
        console.log('[MCP Provider] Registering get_role_schema...');
        const getRoleSchemaTool = vscode.lm.registerTool('get_role_schema', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Getting role schema definition',
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const result = await this.dataObjectTools.get_role_schema();
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
        console.log('[MCP Provider] ✓ get_role_schema registered');

        // Register get_data_object_summary_schema tool
        console.log('[MCP Provider] Registering get_data_object_summary_schema...');
        const getDataObjectSummarySchemaTool = vscode.lm.registerTool('get_data_object_summary_schema', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Getting data object summary schema definition',
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const result = await this.dataObjectTools.get_data_object_summary_schema();
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
        console.log('[MCP Provider] ✓ get_data_object_summary_schema registered');

        // Register list_data_object_summary tool
        console.log('[MCP Provider] Registering list_data_object_summary...');
        const listDataObjectSummaryTool = vscode.lm.registerTool('list_data_object_summary', {
            prepareInvocation: async (options, token) => {
                const input = options.input as ListDataObjectSummaryInput;
                let message = 'Listing data object summary from the AppDNA model';
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
                    const input = options.input as ListDataObjectSummaryInput;
                    const result = await this.dataObjectTools.list_data_object_summary(input);
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
        console.log('[MCP Provider] ✓ list_data_object_summary registered');

        // Register list_data_objects tool (full details)
        console.log('[MCP Provider] Registering list_data_objects...');
        const listDataObjectsTool = vscode.lm.registerTool('list_data_objects', {
            prepareInvocation: async (options, token) => {
                const input = options.input as ListDataObjectsInput;
                let message = 'Listing full data objects (with prop arrays) from the AppDNA model';
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
                    const result = await this.dataObjectTools.list_data_objects(input);
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

        // Register get_data_object tool
        console.log('[MCP Provider] Registering get_data_object...');
        const getDataObjectTool = vscode.lm.registerTool('get_data_object', {
            prepareInvocation: async (options, token) => {
                const input = options.input as GetDataObjectInput;
                return {
                    invocationMessage: `Getting complete details for data object "${input.name}"`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as GetDataObjectInput;
                    const result = await this.dataObjectTools.get_data_object(input);
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
        console.log('[MCP Provider] ✓ get_data_object registered');

        // Register create_data_object tool
        console.log('[MCP Provider] Registering create_data_object...');
        const createDataObjectTool = vscode.lm.registerTool('create_data_object', {
            prepareInvocation: async (options, token) => {
                const input = options.input as CreateDataObjectInput;
                return {
                    invocationMessage: `Creating data object: ${input.name} (parent: ${input.parentObjectName})`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as CreateDataObjectInput;
                    const result = await this.dataObjectTools.create_data_object(input);
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
        console.log('[MCP Provider] ✓ get_data_object registered');

        // Register get_data_object_schema tool
        console.log('[MCP Provider] Registering get_data_object_schema...');
        const getDataObjectSchemaTool = vscode.lm.registerTool('get_data_object_schema', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Getting schema definition for complete data object structure (with prop array)',
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const result = await this.dataObjectTools.get_data_object_schema();
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
        console.log('[MCP Provider] ✓ get_data_object_schema registered');

        // Register get_data_object_usage tool
        console.log('[MCP Provider] Registering get_data_object_usage...');
        const getDataObjectUsageTool = vscode.lm.registerTool('get_data_object_usage', {
            prepareInvocation: async (options, token) => {
                const input = options.input as { dataObjectName?: string };
                const message = input.dataObjectName 
                    ? `Getting usage data for data object: ${input.dataObjectName}`
                    : 'Getting usage data for all data objects';
                return {
                    invocationMessage: message,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as { dataObjectName?: string };
                    const result = await this.dataObjectTools.get_data_object_usage(input);
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                    ]);
                } catch (error) {
                    const errorResult = {
                        success: false,
                        usageData: [],
                        count: 0,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(JSON.stringify(errorResult, null, 2))
                    ]);
                }
            }
        });
        console.log('[MCP Provider] ✓ get_data_object_usage registered');

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

        // Register get_form_schema tool
        console.log('[MCP Provider] Registering get_form_schema...');
        const getFormSchemaTool = vscode.lm.registerTool('get_form_schema', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Getting schema definition for complete form structure (objectWorkflow)',
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const result = await this.formTools.get_form_schema();
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
        console.log('[MCP Provider] ✓ get_form_schema registered');

        // Register get_form tool
        console.log('[MCP Provider] Registering get_form...');
        const getFormTool = vscode.lm.registerTool('get_form', {
            prepareInvocation: async (options, token) => {
                const input = options.input as { owner_object_name?: string; form_name: string };
                const message = input.owner_object_name 
                    ? `Getting form "${input.form_name}" from owner object "${input.owner_object_name}"`
                    : `Getting form "${input.form_name}" (searching all objects)`;
                return {
                    invocationMessage: message,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as { owner_object_name?: string; form_name: string };
                    const result = await this.formTools.get_form(input);
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
        console.log('[MCP Provider] ✓ get_form registered');

        // Register suggest_form_name_and_title tool
        console.log('[MCP Provider] Registering suggest_form_name_and_title...');
        const suggestFormNameAndTitleTool = vscode.lm.registerTool('suggest_form_name_and_title', {
            prepareInvocation: async (options, token) => {
                const input = options.input as { owner_object_name: string; role_required?: string; action?: string; target_child_object?: string };
                return {
                    invocationMessage: `Suggesting form name and title for owner object "${input.owner_object_name}"`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as { owner_object_name: string; role_required?: string; action?: string; target_child_object?: string };
                    const result = await this.formTools.suggest_form_name_and_title(input);
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
        console.log('[MCP Provider] ✓ suggest_form_name_and_title registered');

        // Register create_form tool
        console.log('[MCP Provider] Registering create_form...');
        const createFormTool = vscode.lm.registerTool('create_form', {
            prepareInvocation: async (options, token) => {
                const input = options.input as { owner_object_name: string; form_name: string; title_text: string };
                return {
                    invocationMessage: `Creating form "${input.form_name}" in owner object "${input.owner_object_name}"`,
                    confirmationMessages: undefined
                };
            },
            invoke: async (options, token) => {
                try {
                    const input = options.input as { owner_object_name: string; form_name: string; title_text: string; role_required?: string; target_child_object?: string };
                    const result = await this.formTools.create_form(input);
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
        console.log('[MCP Provider] ✓ create_form registered');

        // Register open_add_data_object_wizard tool
        const openAddDataObjectWizardTool = vscode.lm.registerTool('open_add_data_object_wizard', {
            description: 'Opens the Add Data Object Wizard for creating a new data object. The wizard guides you through creating a data object with options for lookup objects, child objects, and parent-child relationships.',
            inputSchema: {},
            invoke: async (options, token) => {
                try {
                    await vscode.commands.executeCommand('appdna.mcp.openAddDataObjectWizard');
                    return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Add Data Object Wizard opened successfully' }, null, 2) }] };
                } catch (error) {
                    return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }, null, 2) }] };
                }
            }
        });
        console.log('[MCP Provider] ✓ open_add_data_object_wizard registered');

        // Register open_add_report_wizard tool
        const openAddReportWizardTool = vscode.lm.registerTool('open_add_report_wizard', {
            description: 'Opens the Add Report Wizard for creating a new report. The wizard guides you through creating a report with options for selecting the report type, configuring columns, parameters, and filters.',
            inputSchema: {},
            invoke: async (options, token) => {
                try {
                    await vscode.commands.executeCommand('appdna.mcp.openAddReportWizard');
                    return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Add Report Wizard opened successfully' }, null, 2) }] };
                } catch (error) {
                    return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }, null, 2) }] };
                }
            }
        });
        console.log('[MCP Provider] ✓ open_add_report_wizard registered');

        this.disposables.push(
            createTool, 
            listTool,
            updateUserStoryTool,
            listRolesTool, 
            addRoleTool,
            updateRoleTool,
            addLookupValueTool,
            listLookupValuesTool,
            updateLookupValueTool,
            getLookupValueSchemaTool,
            getRoleSchemaTool,
            getDataObjectSummarySchemaTool,
            listDataObjectSummaryTool,
            listDataObjectsTool,
            getDataObjectTool,
            createDataObjectTool,
            getDataObjectSchemaTool,
            getDataObjectUsageTool,
            searchByRoleTool, 
            searchStoriesTool,
            getFormSchemaTool,
            getFormTool,
            openAddDataObjectWizardTool,
            openAddReportWizardTool
        );
        console.log('[MCP Provider] All 23 tools registered and added to disposables');
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
