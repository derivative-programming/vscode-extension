// Description: Handles registration of user stories development view related commands.
// Created: October 5, 2025
// Last Modified: October 5, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the user stories dev view
const userStoriesDevPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the user stories dev panel if it's open
 */
export function getUserStoriesDevPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('userStoriesDev') && userStoriesDevPanel.context && userStoriesDevPanel.modelService) {
        return {
            type: 'userStoriesDev',
            context: userStoriesDevPanel.context,
            modelService: userStoriesDevPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the user stories dev panel if it's open
 */
export function closeUserStoriesDevPanel(): void {
    console.log(`Closing user stories dev panel if open`);
    const panel = activePanels.get('userStoriesDev');
    if (panel) {
        panel.dispose();
        activePanels.delete('userStoriesDev');
    }
    // Clean up panel reference
    userStoriesDevPanel.panel = null;
}

/**
 * Load user stories dev data from both model and separate dev file
 */
async function loadUserStoriesDevData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean): Promise<void> {
    try {
        console.log("[Extension] Loading user stories dev data");
        const model = modelService.getCurrentModel();
        if (!model) {
            console.error("[Extension] No model available");
            panel.webview.postMessage({
                command: "setDevData",
                data: { items: [], totalRecords: 0, sortColumn: sortColumn || 'storyNumber', sortDescending: sortDescending || false }
            });
            return;
        }

        // Get all user stories from model - only processed ones
        const userStories: any[] = [];
        if (model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
            const namespace = model.namespace[0];
            if (namespace.userStory && Array.isArray(namespace.userStory)) {
                // Filter for processed stories only
                const processedStories = namespace.userStory.filter(story => 
                    story.isStoryProcessed === "true" && story.isIgnored !== "true"
                );
                userStories.push(...processedStories);
            }
        }

        // Load existing dev data from separate file
        let existingDevData: any = { devData: [] };
        let devFilePath = '';
        const modelFilePath = modelService.getCurrentFilePath();
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            devFilePath = path.join(modelDir, 'app-dna-user-story-dev.json');
            try {
                if (fs.existsSync(devFilePath)) {
                    const devContent = fs.readFileSync(devFilePath, 'utf8');
                    existingDevData = JSON.parse(devContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load existing dev file:", error);
                existingDevData = { devData: [] };
            }
        }

        // Create lookup for existing dev data
        const devLookup = new Map<string, any>();
        if (existingDevData.devData) {
            existingDevData.devData.forEach((dev: any) => {
                devLookup.set(dev.storyId, dev);
            });
        }

        console.log(`[Extension] Found ${userStories.length} user stories`);

        // Load page mapping data
        let pageMappingData: any = { pageMappings: {} };
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            const pageMappingFilePath = path.join(modelDir, 'app-dna-user-story-page-mapping.json');
            try {
                if (fs.existsSync(pageMappingFilePath)) {
                    const mappingContent = fs.readFileSync(pageMappingFilePath, 'utf8');
                    pageMappingData = JSON.parse(mappingContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load page mapping file:", error);
            }
        }

        // Get all pages from model to find start page and role information
        const allPages: any[] = [];
        const allObjects = modelService.getAllObjects();
        allObjects.forEach((obj: any) => {
            // Extract workflows with isPage=true
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === 'true') {
                        allPages.push({
                            name: workflow.name,
                            roleRequired: workflow.roleRequired,
                            isStartPage: workflow.isStartPage === 'true'
                        });
                    }
                });
            }
            // Extract reports with isPage=true
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if (report.isPage === 'true' || report.isPage === undefined) {
                        allPages.push({
                            name: report.name,
                            roleRequired: report.roleRequired,
                            isStartPage: report.isStartPage === 'true'
                        });
                    }
                });
            }
        });

        // Build combined data array
        const combinedData: any[] = [];
        userStories.forEach(story => {
            const storyId = story.name || '';
            const storyNumber = story.storyNumber || '';
            const existingDev = devLookup.get(storyId);

            // Get pages from mapping
            const mapping = pageMappingData.pageMappings[storyNumber];
            const mappedPages = mapping?.pageMapping || [];
            
            // Enrich page data with role and start page info
            const pageDetails = mappedPages.map((pageName: string) => {
                const pageInfo = allPages.find(p => p.name === pageName);
                return {
                    name: pageName,
                    roleRequired: pageInfo?.roleRequired || '',
                    isStartPage: pageInfo?.isStartPage || false
                };
            });

            combinedData.push({
                storyId: storyId,
                storyNumber: storyNumber,
                storyText: story.storyText || '',
                devStatus: existingDev?.devStatus || 'on-hold',
                priority: existingDev?.priority || 'medium',
                storyPoints: existingDev?.storyPoints || '?',
                assignedTo: existingDev?.assignedTo || '',
                sprint: existingDev?.sprint || '',
                sprintId: existingDev?.sprintId || '',
                startDate: existingDev?.startDate || '',
                estimatedEndDate: existingDev?.estimatedEndDate || '',
                actualEndDate: existingDev?.actualEndDate || '',
                blockedReason: existingDev?.blockedReason || '',
                devNotes: existingDev?.devNotes || '',
                devFilePath: devFilePath,
                mappedPages: pageDetails, // Array of page objects with name, role, isStartPage
                selected: false // For checkbox functionality
            });
        });

        // Sort the data
        if (sortColumn) {
            combinedData.sort((a, b) => {
                let aVal = a[sortColumn] || '';
                let bVal = b[sortColumn] || '';
                
                // Handle numeric comparison for storyNumber
                if (sortColumn === 'storyNumber') {
                    const aNum = typeof aVal === 'number' ? aVal : (aVal === '' ? 0 : parseInt(aVal) || 0);
                    const bNum = typeof bVal === 'number' ? bVal : (bVal === '' ? 0 : parseInt(bVal) || 0);
                    
                    const result = aNum - bNum;
                    return sortDescending ? -result : result;
                }
                
                // Handle string comparison
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                
                let result = 0;
                if (aVal < bVal) {
                    result = -1;
                } else if (aVal > bVal) {
                    result = 1;
                }
                
                return sortDescending ? -result : result;
            });
        }

        console.log(`[Extension] Sending ${combinedData.length} dev items to webview`);

        // Send data to webview
        panel.webview.postMessage({
            command: "setDevData",
            data: {
                items: combinedData,
                totalRecords: combinedData.length,
                sortColumn: sortColumn || 'storyNumber',
                sortDescending: sortDescending || false
            }
        });

    } catch (error) {
        console.error("[Extension] Error loading user stories dev data:", error);
        panel.webview.postMessage({
            command: "setDevData",
            data: { items: [], totalRecords: 0, sortColumn: 'storyNumber', sortDescending: false, error: (error as Error).message }
        });
    }
}

/**
 * Load dev configuration from separate JSON file
 */
async function loadDevConfig(panel: vscode.WebviewPanel, modelService: ModelService): Promise<void> {
    try {
        console.log("[Extension] Loading dev config");
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            console.error("[Extension] No model file path available");
            // Send default config
            panel.webview.postMessage({
                command: "setDevConfig",
                config: getDefaultDevConfig()
            });
            return;
        }

        const modelDir = path.dirname(modelFilePath);
        const configFilePath = path.join(modelDir, 'app-dna-user-story-dev-config.json');
        
        let config: any;
        if (fs.existsSync(configFilePath)) {
            const configContent = fs.readFileSync(configFilePath, 'utf8');
            config = JSON.parse(configContent);
            console.log("[Extension] Dev config loaded from file");
        } else {
            config = getDefaultDevConfig();
            // Save default config
            fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
            console.log("[Extension] Created default dev config file");
        }

        panel.webview.postMessage({
            command: "setDevConfig",
            config: config
        });

    } catch (error) {
        console.error("[Extension] Error loading dev config:", error);
        panel.webview.postMessage({
            command: "setDevConfig",
            config: getDefaultDevConfig()
        });
    }
}

/**
 * Get default dev configuration
 */
function getDefaultDevConfig(): any {
    return {
        developers: [
            {
                id: "dev1",
                name: "Developer 1",
                email: "dev1@example.com",
                active: true
            }
        ],
        sprints: [
            {
                sprintId: "sprint1",
                sprintNumber: 1,
                sprintName: "Sprint 1",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                capacity: 40,
                committedPoints: 0,
                active: true
            }
        ],
        forecastConfig: {
            hoursPerPoint: 4,
            defaultStoryPoints: 1,
            workingHours: {
                "0": { enabled: false },
                "1": { enabled: true, startHour: 9, endHour: 17 },
                "2": { enabled: true, startHour: 9, endHour: 17 },
                "3": { enabled: true, startHour: 9, endHour: 17 },
                "4": { enabled: true, startHour: 9, endHour: 17 },
                "5": { enabled: true, startHour: 9, endHour: 17 },
                "6": { enabled: false }
            }
        },
        settings: {
            defaultSprintLength: 14,
            defaultCapacity: 40,
            storyPointScale: "fibonacci",
            trackCycleTime: true
        }
    };
}

/**
 * Save dev data to separate JSON file
 */
async function saveDevData(devDataArray: any[], filePath: string): Promise<void> {
    try {
        const data = { devData: devDataArray };
        const content = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Extension] Dev data saved to ${filePath}`);
    } catch (error) {
        console.error(`[Extension] Error saving dev data:`, error);
        throw error;
    }
}

/**
 * Save dev configuration to separate JSON file
 */
async function saveDevConfig(config: any, modelService: ModelService): Promise<void> {
    try {
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            throw new Error("No model file path available");
        }

        const modelDir = path.dirname(modelFilePath);
        const configFilePath = path.join(modelDir, 'app-dna-user-story-dev-config.json');
        
        const content = JSON.stringify(config, null, 2);
        fs.writeFileSync(configFilePath, content, 'utf8');
        console.log(`[Extension] Dev config saved to ${configFilePath}`);
    } catch (error) {
        console.error(`[Extension] Error saving dev config:`, error);
        throw error;
    }
}

/**
 * Register user stories dev commands
 */
export function registerUserStoriesDevCommands(context: vscode.ExtensionContext, modelService: ModelService): void {
    // Register user stories dev command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.userStoriesDev', async (initialTab?: string) => {
            // Store references to context and modelService
            userStoriesDevPanel.context = context;
            userStoriesDevPanel.modelService = modelService;

            // Create a consistent panel ID
            const panelId = 'userStoriesDev';
            console.log(`userStoriesDev command called (panelId: ${panelId}, initialTab: ${initialTab})`);

            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for user stories dev, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                const existingPanel = activePanels.get(panelId);
                existingPanel?.reveal(vscode.ViewColumn.One);
                
                // If initialTab is specified, send message to switch to that tab
                if (initialTab && existingPanel) {
                    existingPanel.webview.postMessage({
                        command: 'switchToTab',
                        data: { tabName: initialTab }
                    });
                }
                return;
            }

            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'userStoriesDev',
                'User Stories - Development',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );

            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            userStoriesDevPanel.panel = panel;

            // Cleanup when panel is disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
                userStoriesDevPanel.panel = null;
            });

            // Load data and config
            await loadUserStoriesDevData(panel, modelService);
            await loadDevConfig(panel, modelService);

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                async (message) => {
                    console.log('[Extension] Received message:', message.command);
                    
                    switch (message.command) {
                        case 'saveDevChange':
                            try {
                                const devData = message.data;
                                const filePath = devData.devFilePath;
                                
                                if (!filePath) {
                                    throw new Error("No dev file path provided");
                                }

                                // Load existing data
                                let existingData: any = { devData: [] };
                                if (fs.existsSync(filePath)) {
                                    const content = fs.readFileSync(filePath, 'utf8');
                                    existingData = JSON.parse(content);
                                }

                                // Find and update or add the dev record
                                const index = existingData.devData.findIndex((d: any) => d.storyId === devData.storyId);
                                const devRecord = {
                                    storyId: devData.storyId,
                                    devStatus: devData.devStatus,
                                    priority: devData.priority,
                                    storyPoints: devData.storyPoints,
                                    assignedTo: devData.assignedTo,
                                    sprint: devData.sprint,
                                    sprintId: devData.sprintId,
                                    startDate: devData.startDate,
                                    estimatedEndDate: devData.estimatedEndDate,
                                    actualEndDate: devData.actualEndDate,
                                    blockedReason: devData.blockedReason,
                                    devNotes: devData.devNotes
                                };

                                if (index >= 0) {
                                    existingData.devData[index] = devRecord;
                                } else {
                                    existingData.devData.push(devRecord);
                                }

                                await saveDevData(existingData.devData, filePath);

                                panel.webview.postMessage({
                                    command: 'devChangeSaved',
                                    success: true
                                });

                                vscode.window.showInformationMessage('Development data saved successfully');
                            } catch (error) {
                                console.error('[Extension] Error saving dev change:', error);
                                panel.webview.postMessage({
                                    command: 'devChangeSaved',
                                    success: false,
                                    error: (error as Error).message
                                });
                                vscode.window.showErrorMessage(`Error saving development data: ${(error as Error).message}`);
                            }
                            break;

                        case 'bulkUpdateDevStatus':
                            try {
                                const { storyIds, devStatus, filePath } = message.data;
                                
                                if (!filePath) {
                                    throw new Error("No dev file path provided");
                                }

                                // Load existing data
                                let existingData: any = { devData: [] };
                                if (fs.existsSync(filePath)) {
                                    const content = fs.readFileSync(filePath, 'utf8');
                                    existingData = JSON.parse(content);
                                }

                                // Update each story
                                storyIds.forEach((storyId: string) => {
                                    const index = existingData.devData.findIndex((d: any) => d.storyId === storyId);
                                    if (index >= 0) {
                                        existingData.devData[index].devStatus = devStatus;
                                    } else {
                                        existingData.devData.push({
                                            storyId: storyId,
                                            devStatus: devStatus,
                                            priority: 'medium',
                                            storyPoints: '?',
                                            assignedTo: '',
                                            sprint: '',
                                            sprintId: '',
                                            startDate: '',
                                            estimatedEndDate: '',
                                            actualEndDate: '',
                                            blockedReason: '',
                                            devNotes: ''
                                        });
                                    }
                                });

                                await saveDevData(existingData.devData, filePath);

                                panel.webview.postMessage({
                                    command: 'devChangeSaved',
                                    success: true
                                });

                                vscode.window.showInformationMessage(`Updated ${storyIds.length} stories to status: ${devStatus}`);
                                
                                // Reload data
                                await loadUserStoriesDevData(panel, modelService);
                            } catch (error) {
                                console.error('[Extension] Error in bulk update:', error);
                                vscode.window.showErrorMessage(`Error updating stories: ${(error as Error).message}`);
                            }
                            break;

                        case 'createSprint':
                        case 'updateSprint':
                        case 'saveSprint':
                            try {
                                const sprint = message.data || message.sprint;
                                
                                // Load existing config
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }

                                const modelDir = path.dirname(modelFilePath);
                                const configFilePath = path.join(modelDir, 'app-dna-user-story-dev-config.json');
                                
                                let config: any;
                                if (fs.existsSync(configFilePath)) {
                                    const content = fs.readFileSync(configFilePath, 'utf8');
                                    config = JSON.parse(content);
                                } else {
                                    config = getDefaultDevConfig();
                                }

                                // Find and update or add sprint
                                const index = config.sprints.findIndex((s: any) => s.sprintId === sprint.sprintId);
                                if (index >= 0) {
                                    config.sprints[index] = sprint;
                                } else {
                                    config.sprints.push(sprint);
                                }

                                await saveDevConfig(config, modelService);

                                panel.webview.postMessage({
                                    command: 'sprintSaved',
                                    success: true,
                                    sprint: sprint
                                });

                                vscode.window.showInformationMessage('Sprint saved successfully');
                            } catch (error) {
                                console.error('[Extension] Error saving sprint:', error);
                                vscode.window.showErrorMessage(`Error saving sprint: ${(error as Error).message}`);
                            }
                            break;

                        case 'deleteSprint':
                            try {
                                const { sprintId } = message.data;
                                
                                // Load existing config
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }

                                const modelDir = path.dirname(modelFilePath);
                                const configFilePath = path.join(modelDir, 'app-dna-user-story-dev-config.json');
                                
                                let config: any;
                                if (fs.existsSync(configFilePath)) {
                                    const content = fs.readFileSync(configFilePath, 'utf8');
                                    config = JSON.parse(content);
                                } else {
                                    config = getDefaultDevConfig();
                                }

                                // Remove sprint from config
                                config.sprints = config.sprints.filter((s: any) => s.sprintId !== sprintId);

                                await saveDevConfig(config, modelService);

                                // Load dev data to unassign stories from deleted sprint
                                const devDataPath = path.join(modelDir, 'app-dna-user-story-dev.json');
                                if (fs.existsSync(devDataPath)) {
                                    const devDataContent = fs.readFileSync(devDataPath, 'utf8');
                                    const devData = JSON.parse(devDataContent);

                                    // Unassign stories from deleted sprint
                                    devData.items = devData.items.map((item: any) => {
                                        if (item.assignedSprint === sprintId) {
                                            delete item.assignedSprint;
                                        }
                                        return item;
                                    });

                                    await saveDevData(devData.items, devDataPath);
                                }

                                // Reload data
                                await loadUserStoriesDevData(panel, modelService);
                                await loadDevConfig(panel, modelService);

                                vscode.window.showInformationMessage('Sprint deleted successfully');
                            } catch (error) {
                                console.error('[Extension] Error deleting sprint:', error);
                                vscode.window.showErrorMessage(`Error deleting sprint: ${(error as Error).message}`);
                            }
                            break;

                        case 'assignStoryToSprint':
                            try {
                                const { storyId, sprintId } = message.data;
                                
                                // Load dev data
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }

                                const modelDir = path.dirname(modelFilePath);
                                const devDataPath = path.join(modelDir, 'app-dna-user-story-dev.json');
                                
                                if (!fs.existsSync(devDataPath)) {
                                    throw new Error("Dev data file not found");
                                }

                                const devDataContent = fs.readFileSync(devDataPath, 'utf8');
                                const devData = JSON.parse(devDataContent);

                                // Find and update story
                                const item = devData.items.find((i: any) => i.storyId === storyId);
                                if (item) {
                                    item.assignedSprint = sprintId;
                                    await saveDevData(devData.items, devDataPath);
                                    await loadUserStoriesDevData(panel, modelService);
                                    
                                    panel.webview.postMessage({
                                        command: 'devChangeSaved',
                                        success: true
                                    });
                                }
                            } catch (error) {
                                console.error('[Extension] Error assigning story to sprint:', error);
                                vscode.window.showErrorMessage(`Error assigning story: ${(error as Error).message}`);
                            }
                            break;

                        case 'unassignStoryFromSprint':
                            try {
                                const { storyId } = message.data;
                                
                                // Load dev data
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }

                                const modelDir = path.dirname(modelFilePath);
                                const devDataPath = path.join(modelDir, 'app-dna-user-story-dev.json');
                                
                                if (!fs.existsSync(devDataPath)) {
                                    throw new Error("Dev data file not found");
                                }

                                const devDataContent = fs.readFileSync(devDataPath, 'utf8');
                                const devData = JSON.parse(devDataContent);

                                // Find and update story
                                const item = devData.items.find((i: any) => i.storyId === storyId);
                                if (item) {
                                    delete item.assignedSprint;
                                    await saveDevData(devData.items, devDataPath);
                                    await loadUserStoriesDevData(panel, modelService);
                                    
                                    panel.webview.postMessage({
                                        command: 'devChangeSaved',
                                        success: true
                                    });
                                }
                            } catch (error) {
                                console.error('[Extension] Error unassigning story from sprint:', error);
                                vscode.window.showErrorMessage(`Error unassigning story: ${(error as Error).message}`);
                            }
                            break;

                        case 'saveForecastConfig':
                            try {
                                const forecastConfig = message.config;
                                
                                // Load existing config
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }

                                const modelDir = path.dirname(modelFilePath);
                                const configFilePath = path.join(modelDir, 'app-dna-user-story-dev-config.json');
                                
                                let config: any;
                                if (fs.existsSync(configFilePath)) {
                                    const content = fs.readFileSync(configFilePath, 'utf8');
                                    config = JSON.parse(content);
                                } else {
                                    config = getDefaultDevConfig();
                                }

                                // Update forecast config
                                config.forecastConfig = forecastConfig;

                                await saveDevConfig(config, modelService);

                                panel.webview.postMessage({
                                    command: 'forecastConfigSaved',
                                    success: true,
                                    config: forecastConfig
                                });

                                vscode.window.showInformationMessage('Forecast configuration saved successfully');
                            } catch (error) {
                                console.error('[Extension] Error saving forecast config:', error);
                                vscode.window.showErrorMessage(`Error saving forecast config: ${(error as Error).message}`);
                            }
                            break;

                        case 'refresh':
                            await loadUserStoriesDevData(panel, modelService);
                            await loadDevConfig(panel, modelService);
                            break;

                        case 'downloadCsv':
                            try {
                                // Get the current model data
                                const currentModel = modelService.getCurrentModel();
                                if (!currentModel || !currentModel.namespace || !Array.isArray(currentModel.namespace) || currentModel.namespace.length === 0) {
                                    throw new Error("Model structure is invalid or namespace not found");
                                }

                                // Get the first namespace
                                const namespace = currentModel.namespace[0];
                                const stories = namespace.userStory || [];

                                // Load dev data from separate file
                                let existingDevData: any = { devData: [] };
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (modelFilePath) {
                                    const modelDir = path.dirname(modelFilePath);
                                    const devFilePath = path.join(modelDir, 'app-dna-user-story-dev.json');
                                    try {
                                        if (fs.existsSync(devFilePath)) {
                                            const devContent = fs.readFileSync(devFilePath, 'utf8');
                                            existingDevData = JSON.parse(devContent);
                                        }
                                    } catch (error) {
                                        console.warn("[Extension] Could not load dev data for CSV export:", error);
                                    }
                                }
                                
                                // Create a map for quick lookup
                                const devDataMap = new Map();
                                if (existingDevData.devData) {
                                    existingDevData.devData.forEach((dev: any) => {
                                        devDataMap.set(dev.storyId, dev);
                                    });
                                }

                                // Create CSV content with dev tracking fields
                                let csvContent = "storyNumber,storyText,devStatus,priority,assignedTo,sprint,storyPoints,estimatedHours,actualHours\n";
                                stories.forEach((story: any) => {
                                    const storyNumber = story.storyNumber || "";
                                    const storyText = `"${(story.storyText || "").replace(/"/g, '""')}"`;
                                    
                                    // Get dev data for this story
                                    const dev = devDataMap.get(story.storyId);
                                    const devStatus = dev?.devStatus || "";
                                    const priority = dev?.priority || "";
                                    const assignedTo = dev?.assignedTo || "";
                                    const sprint = dev?.sprint || "";
                                    const storyPoints = dev?.storyPoints || "";
                                    const estimatedHours = dev?.estimatedHours || "";
                                    const actualHours = dev?.actualHours || "";
                                    
                                    csvContent += `${storyNumber},${storyText},${devStatus},${priority},${assignedTo},${sprint},${storyPoints},${estimatedHours},${actualHours}\n`;
                                });

                                // Generate timestamped filename
                                const now = new Date();
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                const y = now.getFullYear();
                                const m = pad(now.getMonth() + 1);
                                const d = pad(now.getDate());
                                const h = pad(now.getHours());
                                const min = pad(now.getMinutes());
                                const s = pad(now.getSeconds());
                                const timestamp = `${y}${m}${d}${h}${min}${s}`;
                                const filename = `user_story_dev_report_${timestamp}.csv`;

                                // Send CSV content back to webview for download
                                panel.webview.postMessage({
                                    command: 'csvData',
                                    data: {
                                        content: csvContent,
                                        filename: filename
                                    }
                                });
                            } catch (error) {
                                console.error('[Extension] Error generating CSV:', error);
                                vscode.window.showErrorMessage(`Error generating CSV: ${(error as Error).message}`);
                                panel.webview.postMessage({
                                    command: 'error',
                                    error: (error as Error).message
                                });
                            }
                            break;

                        case 'downloadGanttCsv':
                            try {
                                const schedules = message.schedules;
                                
                                if (!schedules || schedules.length === 0) {
                                    throw new Error("No schedule data to export");
                                }
                                
                                // Helper function to format dev status
                                const formatDevStatus = (status: string): string => {
                                    const statusMap: { [key: string]: string } = {
                                        'on-hold': 'On Hold',
                                        'ready-for-dev': 'Ready for Dev',
                                        'in-progress': 'In Progress',
                                        'blocked': 'Blocked',
                                        'completed': 'Completed'
                                    };
                                    return statusMap[status] || status;
                                };
                                
                                // Helper function to format date
                                const formatDateShort = (dateStr: string): string => {
                                    if (!dateStr) {
                                        return '';
                                    }
                                    const date = new Date(dateStr);
                                    return date.toISOString().split('T')[0];
                                };
                                
                                // CSV headers
                                const headers = ["Story ID", "Story", "Priority", "Dev Status", "Points", "Developer", "Start Date", "End Date", "Duration (days)"];
                                
                                // CSV rows
                                const rows = schedules.map((s: any) => [
                                    s.storyId,
                                    `"${(s.storyText || '').replace(/"/g, '""')}"`, // Escape quotes
                                    s.priority || '',
                                    formatDevStatus(s.devStatus),
                                    s.storyPoints || '',
                                    s.developer || '',
                                    formatDateShort(s.startDate),
                                    formatDateShort(s.endDate),
                                    s.daysNeeded ? s.daysNeeded.toFixed(1) : ''
                                ]);
                                
                                // Combine
                                const csvContent = [headers, ...rows]
                                    .map(row => row.join(","))
                                    .join("\n");
                                
                                // Generate timestamped filename
                                const now = new Date();
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                const y = now.getFullYear();
                                const m = pad(now.getMonth() + 1);
                                const d = pad(now.getDate());
                                const h = pad(now.getHours());
                                const min = pad(now.getMinutes());
                                const s = pad(now.getSeconds());
                                const timestamp = `${y}${m}${d}${h}${min}${s}`;
                                const filename = `gantt_schedule_${timestamp}.csv`;

                                // Send CSV content back to webview for saving
                                panel.webview.postMessage({
                                    command: 'csvData',
                                    data: {
                                        content: csvContent,
                                        filename: filename
                                    }
                                });
                            } catch (error) {
                                console.error('[Extension] Error generating Gantt CSV:', error);
                                vscode.window.showErrorMessage(`Error generating Gantt CSV: ${(error as Error).message}`);
                                panel.webview.postMessage({
                                    command: 'error',
                                    error: (error as Error).message
                                });
                            }
                            break;

                        case 'saveGanttChartPNG':
                            try {
                                console.log("[Extension] UserStoryDev saveGanttChartPNG requested");
                                const workspaceFolders = vscode.workspace.workspaceFolders;
                                if (!workspaceFolders || workspaceFolders.length === 0) {
                                    throw new Error('No workspace folder is open');
                                }
                                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                                const reportDir = path.join(workspaceRoot, 'user_story_reports');
                                if (!fs.existsSync(reportDir)) {
                                    fs.mkdirSync(reportDir, { recursive: true });
                                }
                                
                                // Extract base64 data
                                const base64Data = message.data.base64.replace(/^data:image\/png;base64,/, '');
                                const buffer = Buffer.from(base64Data, 'base64');
                                
                                // Generate filename
                                const timestamp = new Date().toISOString().split('T')[0];
                                const filename = `gantt-chart-${timestamp}.png`;
                                const filePath = path.join(reportDir, filename);
                                
                                // Write file
                                fs.writeFileSync(filePath, buffer);
                                
                                // Show success message and open file
                                vscode.window.showInformationMessage('PNG file saved to workspace: ' + filePath);
                                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
                                
                                console.log("[Extension] PNG saved successfully to", filePath);
                            } catch (error) {
                                console.error("[Extension] Error saving PNG to workspace:", error);
                                vscode.window.showErrorMessage('Failed to save PNG to workspace: ' + (error as Error).message);
                            }
                            break;

                        case 'saveCsvToWorkspace':
                            try {
                                console.log("[Extension] UserStoryDev saveCsvToWorkspace requested");
                                const workspaceFolders = vscode.workspace.workspaceFolders;
                                if (!workspaceFolders || workspaceFolders.length === 0) {
                                    throw new Error('No workspace folder is open');
                                }
                                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                                const reportDir = path.join(workspaceRoot, 'user_story_reports');
                                if (!fs.existsSync(reportDir)) {
                                    fs.mkdirSync(reportDir, { recursive: true });
                                }
                                const filePath = path.join(reportDir, message.data.filename);
                                fs.writeFileSync(filePath, message.data.content, 'utf8');
                                vscode.window.showInformationMessage('CSV file saved to workspace: ' + filePath);
                                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
                            } catch (error) {
                                console.error("[Extension] Error saving CSV to workspace:", error);
                                vscode.window.showErrorMessage('Failed to save CSV to workspace: ' + (error as Error).message);
                            }
                            break;

                        default:
                            console.warn(`[Extension] Unknown command: ${message.command}`);
                    }
                },
                undefined,
                context.subscriptions
            );

            // Get the VS Code CSS and JS URI for the webview
            const codiconsUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
            );

            // Get all JavaScript module URIs
            const scriptUris = {
                // Templates
                detailsTabTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'detailsTabTemplate.js')
                ),
                storyDetailModalTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'storyDetailModalTemplate.js')
                ),
                boardTabTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'boardTabTemplate.js')
                ),
                analysisTabTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'analysisTabTemplate.js')
                ),
                // Scripts - Details Tab
                tableRenderer: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'tableRenderer.js')
                ),
                filterFunctions: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'filterFunctions.js')
                ),
                selectionActions: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'selectionActions.js')
                ),
                devStatusManagement: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'devStatusManagement.js')
                ),
                priorityManagement: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'priorityManagement.js')
                ),
                storyPointsManagement: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'storyPointsManagement.js')
                ),
                assignmentManagement: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'assignmentManagement.js')
                ),
                modalFunctionality: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'modalFunctionality.js')
                ),
                // Scripts - Board Tab
                cardComponent: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'cardComponent.js')
                ),
                kanbanFunctions: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'kanbanFunctions.js')
                ),
                // Scripts - Analysis Tab
                chartFunctions: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'chartFunctions.js')
                ),
                metricsDisplay: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'metricsDisplay.js')
                ),
                // Helpers - Analysis Tab
                velocityCalculator: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'helpers', 'velocityCalculator.js')
                ),
                cycleTimeCalculator: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'helpers', 'cycleTimeCalculator.js')
                ),
                // Templates - Sprint Tab
                sprintTabTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'sprintTabTemplate.js')
                ),
                sprintModalTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'sprintModalTemplate.js')
                ),
                // Scripts - Sprint Tab
                sprintManagement: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'sprintManagement.js')
                ),
                burndownChart: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'burndownChart.js')
                ),
                // Templates - Forecast Tab
                forecastTabTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'forecastTabTemplate.js')
                ),
                forecastConfigModalTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'forecastConfigModalTemplate.js')
                ),
                // Scripts - Forecast Tab
                forecastFunctions: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'forecastFunctions.js')
                ),
                ganttChart: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'ganttChart.js')
                ),
                forecastConfigManagement: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'forecastConfigManagement.js')
                ),
                // Utility scripts (shared helpers)
                devDataHelpers: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'utils', 'devDataHelpers.js')
                ),
                configValidator: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'utils', 'configValidator.js')
                ),
                errorHandling: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'utils', 'errorHandling.js')
                ),
                // Main orchestrator (must be last)
                main: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'userStoryDevView.js')
                )
            };

            // Set the HTML content for the webview
            panel.webview.html = getWebviewContent(codiconsUri, scriptUris);
        })
    );
}

/**
 * Generate the HTML content for the webview
 */
function getWebviewContent(codiconsUri: vscode.Uri, scriptUris: { [key: string]: vscode.Uri }): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>User Stories Development</title>
            <link href="${codiconsUri}" rel="stylesheet">
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    margin: 0; 
                    padding: 20px; 
                    background: var(--vscode-editor-background); 
                    color: var(--vscode-editor-foreground); 
                }
                
                .header {
                    margin-bottom: 20px;
                }
                .header h2 {
                    margin: 0 0 10px 0;
                    color: var(--vscode-foreground);
                    font-size: 24px;
                }
                .header p {
                    margin: 0;
                    color: var(--vscode-descriptionForeground);
                    font-size: 14px;
                }
                
                .tabs {
                    display: flex;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    margin-bottom: 20px;
                }
                
                .tab {
                    padding: 8px 16px;
                    cursor: pointer;
                    background-color: var(--vscode-tab-inactiveBackground);
                    border: none;
                    outline: none;
                    color: var(--vscode-tab-inactiveForeground);
                    margin-right: 4px;
                    border-top-left-radius: 3px;
                    border-top-right-radius: 3px;
                    user-select: none;
                }
                
                .tab:hover {
                    background-color: var(--vscode-tab-inactiveBackground);
                    color: var(--vscode-tab-inactiveForeground);
                }
                
                .tab.active {
                    background-color: var(--vscode-tab-activeBackground);
                    color: var(--vscode-tab-activeForeground);
                    border-bottom: 2px solid var(--vscode-focusBorder);
                }
                
                .tab-content {
                    display: none;
                }
                
                .tab-content.active {
                    display: block;
                }

                .spinner-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .spinner {
                    border: 4px solid var(--vscode-progressBar-background);
                    border-top: 4px solid var(--vscode-progressBar-foreground);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--vscode-descriptionForeground);
                }
                
                .empty-state .codicon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.6;
                }
                
                .empty-state h3 {
                    color: var(--vscode-foreground);
                    margin: 0 0 8px 0;
                }
                
                .empty-state p {
                    margin: 0;
                    font-size: 14px;
                }

                /* Details Tab Styles */
                .filter-section {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    margin-bottom: 16px;
                }

                .filter-header {
                    padding: 12px 16px;
                    cursor: pointer;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                }

                .filter-header:hover {
                    background: var(--vscode-list-hoverBackground);
                }

                .filter-content {
                    padding: 16px;
                    border-top: 1px solid var(--vscode-panel-border);
                }

                .filter-row {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 12px;
                }

                .filter-item {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .filter-item label {
                    margin-bottom: 4px;
                    font-size: 13px;
                    color: var(--vscode-foreground);
                }

                .filter-item input,
                .filter-item select {
                    padding: 6px 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 2px;
                    font-family: var(--vscode-font-family);
                    font-size: 13px;
                }

                .filter-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }

                .filter-button {
                    padding: 6px 12px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .filter-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }

                .action-bar {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                }

                .action-group {
                    display: flex;
                    gap: 8px;
                }

                .action-button {
                    padding: 6px 12px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .action-button:hover:not(:disabled) {
                    background: var(--vscode-button-secondaryHoverBackground);
                }

                .action-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Icon button styling for toolbar actions (icon-only buttons) */
                .icon-button {
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    padding: 5px;
                    margin-left: 5px;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }

                .icon-button:hover {
                    background: var(--vscode-toolbar-hoverBackground);
                    color: var(--vscode-foreground);
                }

                .icon-button:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                    outline-offset: 2px;
                }

                .record-info {
                    margin-bottom: 12px;
                    font-size: 13px;
                    color: var(--vscode-descriptionForeground);
                }

                .table-container {
                    overflow-x: auto;
                    margin-bottom: 20px;
                }

                .dev-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .dev-table th {
                    background: var(--vscode-editorGroupHeader-tabsBackground);
                    padding: 8px;
                    text-align: left;
                    border: 1px solid var(--vscode-panel-border);
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .dev-table th.sortable {
                    cursor: pointer;
                    user-select: none;
                }

                .dev-table th.sortable:hover {
                    background: var(--vscode-list-hoverBackground);
                }

                .dev-table td {
                    padding: 6px 8px;
                    border: 1px solid var(--vscode-panel-border);
                }

                .dev-table tr:hover {
                    background: var(--vscode-list-hoverBackground);
                    cursor: pointer;
                }

                .dev-table select,
                .dev-table input {
                    width: 100%;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 4px;
                    font-size: 12px;
                }

                .checkbox-column {
                    width: 40px;
                    text-align: center;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                }

                .modal-content {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
                }

                .modal-header {
                    padding: 16px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 18px;
                }

                .close-button {
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    padding: 4px;
                }

                .modal-body {
                    padding: 16px;
                }

                .modal-footer {
                    padding: 16px;
                    border-top: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }

                .form-section {
                    margin-bottom: 24px;
                }

                .form-section h3 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    color: var(--vscode-foreground);
                }

                .form-row {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 12px;
                }

                .form-group {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    margin-bottom: 4px;
                    font-size: 13px;
                }

                .form-control {
                    padding: 6px 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 2px;
                    font-family: var(--vscode-font-family);
                    font-size: 13px;
                }

                .form-control:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }

                .readonly-input {
                    background: var(--vscode-input-background);
                    opacity: 0.7;
                }

                .primary-button {
                    padding: 6px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .primary-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }

                .secondary-button {
                    padding: 6px 16px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .secondary-button:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }

                .info-box {
                    background: var(--vscode-textBlockQuote-background);
                    border-left: 4px solid var(--vscode-textBlockQuote-border);
                    padding: 12px;
                    border-radius: 2px;
                }

                .page-mappings-list {
                    margin: 8px 0 0 0;
                    padding-left: 20px;
                }

                /* Kanban Board Styles */
                .board-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .board-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .board-title h3 {
                    margin: 0;
                    font-size: 18px;
                }

                .board-subtitle {
                    color: var(--vscode-descriptionForeground);
                    font-size: 13px;
                    margin-left: 8px;
                }

                .board-controls {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .board-filter-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .board-filter-group label {
                    font-size: 13px;
                    white-space: nowrap;
                }

                .board-filter-group select {
                    padding: 4px 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 2px;
                    font-size: 13px;
                    min-width: 120px;
                }

                .board-clear-btn {
                    padding: 4px 12px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .board-clear-btn:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }

                .kanban-board {
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    flex: 1;
                    padding-bottom: 16px;
                }

                .kanban-column {
                    flex: 0 0 280px;
                    min-width: 280px;
                    display: flex;
                    flex-direction: column;
                    background: var(--vscode-sideBar-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }

                .column-header {
                    padding: 12px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--vscode-editorGroupHeader-tabsBackground);
                }

                .column-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .column-count {
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .column-body {
                    flex: 1;
                    padding: 8px;
                    overflow-y: auto;
                    min-height: 200px;
                }

                .column-body.drag-over {
                    background: var(--vscode-list-hoverBackground);
                }

                .column-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    color: var(--vscode-descriptionForeground);
                    font-size: 13px;
                    opacity: 0.6;
                }

                .column-empty-state .codicon {
                    font-size: 32px;
                    margin-bottom: 8px;
                }

                /* Kanban Card Styles */
                .kanban-card {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 12px;
                    margin-bottom: 8px;
                    cursor: grab;
                    transition: box-shadow 0.2s, transform 0.2s;
                }

                .kanban-card:hover {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    transform: translateY(-2px);
                }

                .kanban-card.card-dragging {
                    opacity: 0.5;
                    cursor: grabbing;
                }

                .kanban-card.card-highlight {
                    box-shadow: 0 0 0 2px var(--vscode-focusBorder);
                    animation: highlight-pulse 0.5s ease-in-out;
                }

                @keyframes highlight-pulse {
                    0%, 100% { box-shadow: 0 0 0 2px var(--vscode-focusBorder); }
                    50% { box-shadow: 0 0 0 4px var(--vscode-focusBorder); }
                }

                .kanban-card.card-blocked {
                    border-left: 4px solid var(--vscode-errorForeground);
                }

                .kanban-card.card-filtered {
                    display: none;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .card-story-number {
                    font-weight: 600;
                    font-size: 13px;
                    color: var(--vscode-textLink-foreground);
                }

                .card-priority {
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: 600;
                    color: white;
                    text-transform: uppercase;
                }

                .card-body {
                    margin-bottom: 12px;
                }

                .card-text {
                    font-size: 13px;
                    line-height: 1.4;
                    color: var(--vscode-foreground);
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                }

                .card-meta {
                    display: flex;
                    gap: 12px;
                }

                .card-points,
                .card-assignee {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--vscode-descriptionForeground);
                }

                .card-blocked-indicator {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--vscode-errorForeground);
                    font-weight: 600;
                    font-size: 11px;
                }

                /* Board Footer Styles */
                .board-footer {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid var(--vscode-panel-border);
                }

                .board-stats {
                    display: flex;
                    gap: 24px;
                    flex-wrap: wrap;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .stat-label {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }

                .stat-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }

                /* Analysis Tab Styles */
                .analytics-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .analytics-metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .metric-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }

                .metric-card.metric-success {
                    border-left: 3px solid var(--vscode-charts-green);
                }

                .metric-card.metric-warning {
                    border-left: 3px solid var(--vscode-charts-yellow);
                }

                .metric-card.metric-danger {
                    border-left: 3px solid var(--vscode-charts-red);
                }

                .metric-icon {
                    font-size: 24px;
                    color: var(--vscode-foreground);
                }

                .metric-content {
                    flex: 1;
                }

                .metric-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }

                .metric-secondary {
                    font-size: 14px;
                    font-weight: normal;
                    color: var(--vscode-descriptionForeground);
                }

                .metric-label {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 4px;
                }

                .metric-sublabel {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 2px;
                }

                .metric-trend {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    margin-top: 4px;
                    color: var(--vscode-descriptionForeground);
                }

                .analytics-charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                    gap: 20px;
                    margin-bottom: 24px;
                }

                .chart-container {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 16px;
                }

                .chart-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .chart-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }

                .chart-body {
                    min-height: 300px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .chart-no-data {
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    font-size: 14px;
                }

                .chart-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    color: var(--vscode-descriptionForeground);
                }

                .chart-tooltip {
                    position: absolute;
                    background: var(--vscode-editorHoverWidget-background);
                    border: 1px solid var(--vscode-editorHoverWidget-border);
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    pointer-events: none;
                    z-index: 1000;
                    display: none;
                    color: var(--vscode-editorHoverWidget-foreground);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                .analytics-sprint-summary {
                    margin-top: 24px;
                }

                .sprint-summary-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .sprint-summary-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }

                .sprint-summary-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                }

                .sprint-summary-table th,
                .sprint-summary-table td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .sprint-summary-table th {
                    background: var(--vscode-editorGroupHeader-tabsBackground);
                    font-weight: 600;
                    font-size: 12px;
                    color: var(--vscode-foreground);
                }

                .sprint-summary-table td {
                    font-size: 12px;
                    color: var(--vscode-foreground);
                }

                /* Sprint Tab Styles */
                .sprint-tab-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .sprint-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .sprint-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .sprint-header-text h3 {
                    margin: 0 0 4px 0;
                    font-size: 20px;
                    color: var(--vscode-foreground);
                }

                .sprint-header-text p {
                    margin: 0;
                    font-size: 13px;
                    color: var(--vscode-descriptionForeground);
                }

                .sprint-sub-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .sprint-sub-tab {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: var(--vscode-descriptionForeground);
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s;
                }

                .sprint-sub-tab:hover {
                    color: var(--vscode-foreground);
                    background: var(--vscode-list-hoverBackground);
                }

                .sprint-sub-tab.active {
                    color: var(--vscode-foreground);
                    border-bottom-color: var(--vscode-focusBorder);
                    font-weight: 600;
                }

                .sprint-sub-tab-content {
                    display: none;
                    flex: 1;
                    overflow-y: auto;
                }

                .sprint-sub-tab-content.active {
                    display: block;
                }

                /* Sprint Planning Layout */
                .sprint-planning-layout {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 20px;
                    height: 100%;
                }

                .sprint-list-section,
                .sprint-backlog-section {
                    display: flex;
                    flex-direction: column;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .section-header h4 {
                    margin: 0;
                    font-size: 16px;
                    color: var(--vscode-foreground);
                }

                .section-count {
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 600;
                }

                /* Sprint Cards */
                .sprints-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    overflow-y: auto;
                    max-height: 700px;
                }

                .sprint-card {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 12px;
                }

                .sprint-card.active {
                    border-left: 3px solid var(--vscode-charts-green);
                }

                .sprint-card.planned {
                    border-left: 3px solid var(--vscode-charts-blue);
                }

                .sprint-card.completed {
                    border-left: 3px solid var(--vscode-charts-gray);
                }

                .sprint-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 8px;
                }

                .sprint-card-title {
                    flex: 1;
                }

                .sprint-card-title h4 {
                    margin: 4px 0 0 0;
                    font-size: 14px;
                    color: var(--vscode-foreground);
                }

                .sprint-status-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .sprint-status-badge.status-active {
                    background: var(--vscode-charts-green);
                    color: white;
                }

                .sprint-status-badge.status-planned {
                    background: var(--vscode-charts-blue);
                    color: white;
                }

                .sprint-status-badge.status-completed {
                    background: var(--vscode-charts-gray);
                    color: white;
                }

                .sprint-card-actions {
                    display: flex;
                    gap: 4px;
                }

                .sprint-card-dates {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 8px;
                }

                .sprint-duration {
                    color: var(--vscode-descriptionForeground);
                    font-size: 11px;
                }

                .sprint-card-stats {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 8px;
                }

                .sprint-stat {
                    display: flex;
                    flex-direction: column;
                }

                .sprint-stat .stat-label {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                }

                .sprint-stat .stat-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }

                .sprint-card-capacity {
                    margin-top: 8px;
                }

                .capacity-bar {
                    height: 4px;
                    background: var(--vscode-editorWidget-background);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .capacity-fill {
                    height: 100%;
                    background: var(--vscode-charts-green);
                    transition: width 0.3s;
                }

                /* Backlog Styles */
                .backlog-filters {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .backlog-stories {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    overflow-y: auto;
                    max-height: 700px;
                }

                .backlog-story {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 10px;
                    cursor: move;
                    transition: all 0.2s;
                }

                .backlog-story:hover {
                    background: var(--vscode-list-hoverBackground);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .backlog-story-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }

                .story-number {
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }

                .backlog-story-text {
                    font-size: 13px;
                    color: var(--vscode-foreground);
                    margin-bottom: 8px;
                    line-height: 1.4;
                }

                .backlog-story-footer {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }

                .story-points,
                .story-developer {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* Burndown Styles */
                .burndown-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .burndown-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .burndown-sprint-selector {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .burndown-sprint-selector label {
                    font-size: 13px;
                    color: var(--vscode-foreground);
                }

                .burndown-metrics {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 16px;
                }

                .metrics-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                }

                .burndown-metric {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .burndown-metric .metric-icon {
                    font-size: 24px;
                    color: var(--vscode-foreground);
                }

                .burndown-chart-container {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 16px;
                    min-height: 400px;
                }

                .burndown-sprint-info {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 16px;
                }

                .sprint-stories-list h4 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    color: var(--vscode-foreground);
                }

                .sprint-stories-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .sprint-stories-table th,
                .sprint-stories-table td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .sprint-stories-table th {
                    background: var(--vscode-editorGroupHeader-tabsBackground);
                    font-weight: 600;
                    font-size: 12px;
                    color: var(--vscode-foreground);
                }

                .sprint-stories-table td {
                    font-size: 12px;
                    color: var(--vscode-foreground);
                }

                .sprint-stories-table .story-text {
                    max-width: 400px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .status-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                }

                .empty-state-small {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--vscode-descriptionForeground);
                }

                .empty-state-small .codicon {
                    font-size: 48px;
                    margin-bottom: 12px;
                    opacity: 0.5;
                }

                .empty-state-small p {
                    margin: 0;
                    font-size: 14px;
                }

                /* ===== FORECAST TAB STYLES ===== */
                .forecast-tab-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .forecast-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .forecast-header-left h3 {
                    margin: 0 0 4px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .forecast-subtitle {
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                }

                .forecast-header-right {
                    display: flex;
                    gap: 8px;
                }

                .forecast-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 13px;
                }

                .forecast-btn-secondary {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }

                .forecast-btn-secondary:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }

                .forecast-content-layout {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 20px;
                    flex: 1;
                    min-height: 0;
                }

                .forecast-main-section {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    min-height: 0;
                }

                .timeline-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }

                .timeline-controls-left,
                .timeline-controls-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .timeline-control-label {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }

                .timeline-select {
                    padding: 4px 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 3px;
                    font-size: 12px;
                }

                .timeline-btn {
                    padding: 4px 8px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                }

                .timeline-btn:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }

                .gantt-chart-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    overflow: hidden;
                    min-height: 400px;
                }

                .gantt-chart-container {
                    flex: 1;
                    overflow: auto;
                    padding: 20px;
                }

                .gantt-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 40px;
                    color: var(--vscode-descriptionForeground);
                }

                .gantt-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    color: var(--vscode-descriptionForeground);
                }

                .gantt-empty-state .codicon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .gantt-legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    padding: 12px;
                    background: var(--vscode-sideBar-background);
                    border-top: 1px solid var(--vscode-panel-border);
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                }

                .legend-bar {
                    width: 24px;
                    height: 12px;
                    border-radius: 2px;
                }

                .legend-bar-critical { background: #f85149; }
                .legend-bar-high { background: #fb8500; }
                .legend-bar-medium { background: #3b82f6; }
                .legend-bar-low { background: #6b7280; }
                .legend-bar-complete { background: #10b981; }

                .legend-marker {
                    width: 20px;
                    height: 2px;
                }

                .legend-marker-today {
                    background: #fbbf24;
                    border-top: 2px dashed #fbbf24;
                }

                .legend-marker-dependency {
                    background: var(--vscode-descriptionForeground);
                    position: relative;
                }

                .legend-marker-dependency::after {
                    content: '→';
                    position: absolute;
                    right: -8px;
                    top: -8px;
                }

                .forecast-stats-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    overflow-y: auto;
                }

                .forecast-stats-content {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .forecast-stats-title {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    font-weight: 600;
                }

                .forecast-metric {
                    display: flex;
                    gap: 12px;
                    padding: 12px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }

                .forecast-metric.risk-high {
                    border-left: 3px solid #f85149;
                }

                .forecast-metric.risk-medium {
                    border-left: 3px solid #fb8500;
                }

                .forecast-metric.risk-low {
                    border-left: 3px solid #10b981;
                }

                .forecast-metric-icon {
                    font-size: 24px;
                    color: var(--vscode-descriptionForeground);
                }

                .forecast-metric-content {
                    flex: 1;
                }

                .forecast-metric-label {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 4px;
                }

                .forecast-metric-value {
                    font-size: 18px;
                    font-weight: 600;
                }

                .forecast-risk-section,
                .forecast-recommendations-section,
                .forecast-config-summary {
                    padding: 12px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }

                .forecast-risk-section.risk-high {
                    border-left: 3px solid #f85149;
                }

                .forecast-risk-section.risk-medium {
                    border-left: 3px solid #fb8500;
                }

                .forecast-risk-section.risk-low {
                    border-left: 3px solid #10b981;
                }

                .forecast-section-title {
                    margin: 0 0 10px 0;
                    font-size: 13px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .forecast-risk-level {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }

                .forecast-bottlenecks {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid var(--vscode-panel-border);
                }

                .forecast-bottleneck-title {
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .forecast-bottleneck-list,
                .forecast-recommendation-list {
                    margin: 0;
                    padding-left: 20px;
                    font-size: 12px;
                }

                .forecast-bottleneck-list li,
                .forecast-recommendation-list li {
                    margin-bottom: 4px;
                }

                .forecast-config-items {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .forecast-config-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                }

                .forecast-config-label {
                    color: var(--vscode-descriptionForeground);
                }

                .forecast-config-value {
                    font-weight: 600;
                }

                .forecast-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 40px;
                    text-align: center;
                }

                .forecast-empty-state .codicon {
                    font-size: 64px;
                    margin-bottom: 20px;
                    opacity: 0.5;
                }

                .forecast-empty-state h3 {
                    margin: 0 0 10px 0;
                }

                .forecast-empty-state p {
                    margin: 5px 0;
                    color: var(--vscode-descriptionForeground);
                }

                .forecast-empty-hint {
                    margin-top: 20px !important;
                    padding: 12px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                /* Forecast Configuration Modal */
                .modal-large {
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .config-section {
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .config-section:last-of-type {
                    border-bottom: none;
                }

                .config-section-title {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }

                .form-help {
                    cursor: help;
                    color: var(--vscode-descriptionForeground);
                    margin-left: 4px;
                }

                .holidays-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    max-height: 200px;
                    overflow-y: auto;
                    padding: 8px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 3px;
                    margin-bottom: 12px;
                }

                .holidays-empty {
                    text-align: center;
                    padding: 20px;
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                }

                .holiday-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 8px;
                    background: var(--vscode-input-background);
                    border-radius: 3px;
                }

                .holiday-date {
                    font-size: 12px;
                }

                .holiday-remove-btn {
                    padding: 4px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: var(--vscode-errorForeground);
                    border-radius: 3px;
                }

                .holiday-remove-btn:hover {
                    background: var(--vscode-list-hoverBackground);
                }

                .quick-presets {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .preset-btn {
                    padding: 6px 12px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .preset-btn:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }

                /* D3.js Gantt chart styles */
                .gantt-x-axis,
                .gantt-y-axis {
                    font-size: 11px;
                    color: var(--vscode-foreground);
                }

                .gantt-x-axis line,
                .gantt-y-axis line {
                    stroke: var(--vscode-panel-border);
                }

                .gantt-x-axis path,
                .gantt-y-axis path {
                    stroke: var(--vscode-panel-border);
                }

                .gantt-tooltip {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>User Stories - Development Tracking</h2>
                <p>Manage development progress, story points, assignments, and sprints</p>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="switchTab('details')">Details</button>
                <button class="tab" onclick="switchTab('analysis')">Analysis</button>
                <button class="tab" onclick="switchTab('board')">Board</button>
                <button class="tab" onclick="switchTab('sprint')">Sprint</button>
                <button class="tab" onclick="switchTab('forecast')">Forecast</button>
            </div>

            <div id="detailsTab" class="tab-content active">
                <div class="empty-state">
                    <i class="codicon codicon-loading codicon-modifier-spin"></i>
                    <h3>Loading development data...</h3>
                    <p>Please wait while we load your user stories</p>
                </div>
            </div>

            <div id="analysisTab" class="tab-content">
                <div class="empty-state">
                    <i class="codicon codicon-graph"></i>
                    <h3>Analysis Tab</h3>
                    <p>Charts and analysis will be displayed here</p>
                </div>
            </div>

            <div id="boardTab" class="tab-content">
                <div class="empty-state">
                    <i class="codicon codicon-project"></i>
                    <h3>Kanban Board</h3>
                    <p>Board view will be displayed here</p>
                </div>
            </div>

            <div id="sprintTab" class="tab-content">
                <div class="empty-state">
                    <i class="codicon codicon-dashboard"></i>
                    <h3>Sprint Management</h3>
                    <p>Sprint planning and burndown will be displayed here</p>
                </div>
            </div>

            <div id="forecastTab" class="tab-content">
                <div class="empty-state">
                    <i class="codicon codicon-calendar"></i>
                    <h3>Development Forecast</h3>
                    <p>Gantt chart timeline will be displayed here</p>
                </div>
            </div>

            <div id="spinner-overlay" class="spinner-overlay">
                <div class="spinner"></div>
            </div>

            <!-- Load all JavaScript modules in correct order -->
            <!-- Load D3.js library first for charts -->
            <script src="https://d3js.org/d3.v7.min.js"></script>
            
            <!-- Load utility helpers first (no dependencies) -->
            <script src="${scriptUris.devDataHelpers}"></script>
            <script src="${scriptUris.configValidator}"></script>
            <script src="${scriptUris.errorHandling}"></script>
            
            <!-- Templates must be loaded next -->
            <script src="${scriptUris.detailsTabTemplate}"></script>
            <script src="${scriptUris.storyDetailModalTemplate}"></script>
            <script src="${scriptUris.boardTabTemplate}"></script>
            <script src="${scriptUris.analysisTabTemplate}"></script>
            <script src="${scriptUris.sprintTabTemplate}"></script>
            <script src="${scriptUris.sprintModalTemplate}"></script>
            <script src="${scriptUris.forecastTabTemplate}"></script>
            <script src="${scriptUris.forecastConfigModalTemplate}"></script>
            
            <!-- Then load helper modules -->
            <script src="${scriptUris.velocityCalculator}"></script>
            <script src="${scriptUris.cycleTimeCalculator}"></script>
            
            <!-- Then load all component scripts - Details Tab -->
            <script src="${scriptUris.tableRenderer}"></script>
            <script src="${scriptUris.filterFunctions}"></script>
            <script src="${scriptUris.selectionActions}"></script>
            <script src="${scriptUris.devStatusManagement}"></script>
            <script src="${scriptUris.priorityManagement}"></script>
            <script src="${scriptUris.storyPointsManagement}"></script>
            <script src="${scriptUris.assignmentManagement}"></script>
            <script src="${scriptUris.modalFunctionality}"></script>
            
            <!-- Board Tab scripts -->
            <script src="${scriptUris.cardComponent}"></script>
            <script src="${scriptUris.kanbanFunctions}"></script>
            
            <!-- Analysis Tab scripts -->
            <script src="${scriptUris.chartFunctions}"></script>
            <script src="${scriptUris.metricsDisplay}"></script>
            
            <!-- Sprint Tab scripts -->
            <script src="${scriptUris.sprintManagement}"></script>
            <script src="${scriptUris.burndownChart}"></script>
            
            <!-- Forecast Tab scripts -->
            <script src="${scriptUris.forecastFunctions}"></script>
            <script src="${scriptUris.ganttChart}"></script>
            <script src="${scriptUris.forecastConfigManagement}"></script>
            
            <!-- Finally load the main orchestrator -->
            <script src="${scriptUris.main}"></script>
        </body>
        </html>
    `;
}
