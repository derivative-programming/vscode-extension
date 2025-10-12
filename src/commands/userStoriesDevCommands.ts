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

            // Parse storyNumber as integer for developmentQueuePosition default
            const storyNumberInt = typeof storyNumber === 'number' ? storyNumber : (storyNumber === '' ? 0 : parseInt(storyNumber) || 0);
            
            combinedData.push({
                storyId: storyId,
                storyNumber: storyNumber,
                storyText: story.storyText || '',
                devStatus: existingDev?.devStatus || 'on-hold',
                priority: existingDev?.priority || 'medium',
                storyPoints: existingDev?.storyPoints || '?',
                assignedTo: existingDev?.assignedTo || '',
                sprintId: existingDev?.sprintId || '',
                startDate: existingDev?.startDate || '',
                estimatedEndDate: existingDev?.estimatedEndDate || '',
                actualEndDate: existingDev?.actualEndDate || '',
                blockedReason: existingDev?.blockedReason || '',
                devNotes: existingDev?.devNotes || '',
                developmentQueuePosition: existingDev?.developmentQueuePosition !== undefined ? existingDev.developmentQueuePosition : storyNumberInt,
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
        const assignedCount = combinedData.filter(item => item.sprintId).length;
        console.log(`[Extension] ${assignedCount} items have sprintId property set`);

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
                hourlyRate: null,
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
            trackCycleTime: true,
            defaultDeveloperRate: 60
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

            // If initialTab is specified, send message to switch to that tab after data is loaded
            if (initialTab) {
                panel.webview.postMessage({
                    command: 'switchToTab',
                    data: { tabName: initialTab }
                });
            }

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
                                    sprintId: devData.sprintId,
                                    startDate: devData.startDate,
                                    estimatedEndDate: devData.estimatedEndDate,
                                    actualEndDate: devData.actualEndDate,
                                    blockedReason: devData.blockedReason,
                                    devNotes: devData.devNotes,
                                    developmentQueuePosition: devData.developmentQueuePosition
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

                        case 'bulkUpdatePriority':
                            try {
                                const { storyIds, newPriority } = message;
                                
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }
                                
                                const modelDir = path.dirname(modelFilePath);
                                const filePath = path.join(modelDir, 'app-dna-user-story-dev.json');

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
                                        existingData.devData[index].priority = newPriority;
                                    }
                                });

                                await saveDevData(existingData.devData, filePath);

                                panel.webview.postMessage({
                                    command: 'devChangeSaved',
                                    success: true
                                });

                                vscode.window.showInformationMessage(`Updated ${storyIds.length} stories to priority: ${newPriority}`);
                                
                                // Reload data
                                await loadUserStoriesDevData(panel, modelService);
                            } catch (error) {
                                console.error('[Extension] Error in bulk priority update:', error);
                                vscode.window.showErrorMessage(`Error updating priorities: ${(error as Error).message}`);
                            }
                            break;

                        case 'bulkUpdateStoryPoints':
                            try {
                                const { storyIds, newPoints } = message;
                                
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }
                                
                                const modelDir = path.dirname(modelFilePath);
                                const filePath = path.join(modelDir, 'app-dna-user-story-dev.json');

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
                                        existingData.devData[index].storyPoints = newPoints;
                                    }
                                });

                                await saveDevData(existingData.devData, filePath);

                                panel.webview.postMessage({
                                    command: 'devChangeSaved',
                                    success: true
                                });

                                vscode.window.showInformationMessage(`Updated ${storyIds.length} stories to ${newPoints} story points`);
                                
                                // Reload data
                                await loadUserStoriesDevData(panel, modelService);
                            } catch (error) {
                                console.error('[Extension] Error in bulk story points update:', error);
                                vscode.window.showErrorMessage(`Error updating story points: ${(error as Error).message}`);
                            }
                            break;

                        case 'bulkUpdateAssignment':
                            try {
                                const { storyIds, newAssignment } = message;
                                
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }
                                
                                const modelDir = path.dirname(modelFilePath);
                                const filePath = path.join(modelDir, 'app-dna-user-story-dev.json');

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
                                        existingData.devData[index].assignedTo = newAssignment;
                                    }
                                });

                                await saveDevData(existingData.devData, filePath);

                                panel.webview.postMessage({
                                    command: 'devChangeSaved',
                                    success: true
                                });

                                const assignmentText = newAssignment || '(Unassigned)';
                                vscode.window.showInformationMessage(`Updated ${storyIds.length} stories to: ${assignmentText}`);
                                
                                // Reload data
                                await loadUserStoriesDevData(panel, modelService);
                            } catch (error) {
                                console.error('[Extension] Error in bulk assignment update:', error);
                                vscode.window.showErrorMessage(`Error updating assignments: ${(error as Error).message}`);
                            }
                            break;

                        case 'bulkUpdateSprint':
                            try {
                                const { storyIds, newSprintId, newSprint } = message;
                                
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }
                                
                                const modelDir = path.dirname(modelFilePath);
                                const filePath = path.join(modelDir, 'app-dna-user-story-dev.json');

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
                                        existingData.devData[index].sprintId = newSprintId;
                                    }
                                });

                                await saveDevData(existingData.devData, filePath);

                                panel.webview.postMessage({
                                    command: 'devChangeSaved',
                                    success: true
                                });

                                const sprintText = newSprint || '(No Sprint)';
                                vscode.window.showInformationMessage(`Updated ${storyIds.length} stories to sprint: ${sprintText}`);
                                
                                // Reload data
                                await loadUserStoriesDevData(panel, modelService);
                            } catch (error) {
                                console.error('[Extension] Error in bulk sprint update:', error);
                                vscode.window.showErrorMessage(`Error updating sprints: ${(error as Error).message}`);
                            }
                            break;

                        case 'batchUpdateQueuePositions':
                            try {
                                const updates = message.data; // Array of { storyId, developmentQueuePosition }
                                
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }
                                
                                const modelDir = path.dirname(modelFilePath);
                                const filePath = path.join(modelDir, 'app-dna-user-story-dev.json');

                                // Load existing data
                                let existingData: any = { devData: [] };
                                if (fs.existsSync(filePath)) {
                                    const content = fs.readFileSync(filePath, 'utf8');
                                    existingData = JSON.parse(content);
                                }

                                // Update each story's queue position
                                updates.forEach((update: any) => {
                                    const index = existingData.devData.findIndex((d: any) => d.storyId === update.storyId);
                                    if (index >= 0) {
                                        existingData.devData[index].developmentQueuePosition = update.developmentQueuePosition;
                                    } else {
                                        // Create new record if doesn't exist
                                        existingData.devData.push({
                                            storyId: update.storyId,
                                            developmentQueuePosition: update.developmentQueuePosition,
                                            devStatus: 'on-hold',
                                            priority: 'medium',
                                            storyPoints: '?',
                                            assignedTo: '',
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

                                console.log(`[Extension] Updated queue positions for ${updates.length} stories`);
                            } catch (error) {
                                console.error('[Extension] Error in batch queue position update:', error);
                                vscode.window.showErrorMessage(`Error updating queue positions: ${(error as Error).message}`);
                            }
                            break;

                        case 'getDataObjectsForRanking':
                            try {
                                console.log('[Extension] Getting data objects for ranking calculation');
                                
                                // Use modelService.getAllObjects() to get all data objects
                                const dataObjects = modelService.getAllObjects();

                                console.log(`[Extension] Sending ${dataObjects.length} data objects for ranking`);

                                // Send data objects back to webview
                                panel.webview.postMessage({
                                    command: 'setDataObjectsForRanking',
                                    dataObjects: dataObjects
                                });
                            } catch (error) {
                                console.error('[Extension] Error getting data objects for ranking:', error);
                                vscode.window.showErrorMessage(`Error loading data objects: ${(error as Error).message}`);
                            }
                            break;

                        case 'bulkUpdateQueuePositions':
                            try {
                                const updates = message.updates; // Array of { storyId, developmentQueuePosition, primaryDataObject, dataObjectRank }
                                
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file path available");
                                }
                                
                                const modelDir = path.dirname(modelFilePath);
                                const filePath = path.join(modelDir, 'app-dna-user-story-dev.json');

                                // Load existing data
                                let existingData: any = { devData: [] };
                                if (fs.existsSync(filePath)) {
                                    const content = fs.readFileSync(filePath, 'utf8');
                                    existingData = JSON.parse(content);
                                }

                                // Update each story's queue position
                                updates.forEach((update: any) => {
                                    const index = existingData.devData.findIndex((d: any) => d.storyId === update.storyId);
                                    if (index >= 0) {
                                        existingData.devData[index].developmentQueuePosition = update.developmentQueuePosition;
                                    } else {
                                        // Create new record if doesn't exist
                                        existingData.devData.push({
                                            storyId: update.storyId,
                                            developmentQueuePosition: update.developmentQueuePosition,
                                            devStatus: 'on-hold',
                                            priority: 'medium',
                                            storyPoints: '?',
                                            assignedTo: '',
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

                                // Reload data to show updated queue positions
                                await loadUserStoriesDevData(panel, modelService);

                                panel.webview.postMessage({
                                    command: 'queuePositionsUpdated',
                                    success: true
                                });

                                vscode.window.showInformationMessage(`Queue positions calculated successfully for ${updates.length} stories`);
                                console.log(`[Extension] Updated queue positions for ${updates.length} stories based on data object rank`);
                            } catch (error) {
                                console.error('[Extension] Error in bulk queue position update:', error);
                                vscode.window.showErrorMessage(`Error updating queue positions: ${(error as Error).message}`);
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
                                    devData.devData = devData.devData.map((item: any) => {
                                        if (item.sprintId === sprintId) {
                                            delete item.sprintId;
                                        }
                                        return item;
                                    });

                                    await saveDevData(devData.devData, devDataPath);
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

                        case 'saveDevConfig':
                            try {
                                const config = message.config;
                                
                                // Save the entire config
                                await saveDevConfig(config, modelService);

                                // Send updated config back to webview
                                panel.webview.postMessage({
                                    command: 'setDevConfig',
                                    config: config
                                });

                                vscode.window.showInformationMessage('Configuration saved successfully');
                            } catch (error) {
                                console.error('[Extension] Error saving dev config:', error);
                                vscode.window.showErrorMessage(`Error saving configuration: ${(error as Error).message}`);
                            }
                            break;

                        case 'assignStoryToSprint':
                            try {
                                const { storyId, sprintId } = message.data;
                                console.log(`[Extension] Assigning story ${storyId} to sprint ${sprintId}`);
                                
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
                                let item = devData.devData.find((i: any) => i.storyId === storyId);
                                console.log(`[Extension] Found item:`, item ? 'yes' : 'no');
                                
                                if (!item) {
                                    // Story doesn't exist in dev data yet, create a new entry
                                    console.log(`[Extension] Story ${storyId} not found in dev data, creating new entry`);
                                    item = {
                                        storyId: storyId,
                                        devStatus: 'on-hold',
                                        priority: 'medium',
                                        storyPoints: '?',
                                        assignedTo: '',
                                        sprintId: sprintId,
                                        startDate: '',
                                        estimatedEndDate: '',
                                        actualEndDate: '',
                                        blockedReason: '',
                                        devNotes: ''
                                    };
                                    devData.devData.push(item);
                                } else {
                                    // Story exists, just update the sprint assignment
                                    item.sprintId = sprintId;
                                }
                                
                                console.log(`[Extension] Set item.sprintId to:`, sprintId);
                                console.log(`[Extension] Updated item, saving...`);
                                await saveDevData(devData.devData, devDataPath);
                                await loadUserStoriesDevData(panel, modelService);
                                
                                panel.webview.postMessage({
                                    command: 'devChangeSaved',
                                    success: true
                                });
                                console.log(`[Extension] Story assigned successfully`);
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
                                const item = devData.devData.find((i: any) => i.storyId === storyId);
                                if (item) {
                                    delete item.sprintId;
                                    await saveDevData(devData.devData, devDataPath);
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

                        case 'sortDevTable':
                            try {
                                const sortColumn = message.column;
                                const sortDescending = message.descending;
                                console.log(`[Extension] Sorting by ${sortColumn}, descending: ${sortDescending}`);
                                await loadUserStoriesDevData(panel, modelService, sortColumn, sortDescending);
                            } catch (error) {
                                console.error('[Extension] Error sorting dev table:', error);
                                vscode.window.showErrorMessage(`Error sorting table: ${(error as Error).message}`);
                            }
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
                                
                                // Load dev config to get sprint names and developers
                                let devConfig: any = { sprints: [], developers: [] };
                                if (modelFilePath) {
                                    const modelDir = path.dirname(modelFilePath);
                                    const configFilePath = path.join(modelDir, 'app-dna-user-story-dev-config.json');
                                    try {
                                        if (fs.existsSync(configFilePath)) {
                                            const configContent = fs.readFileSync(configFilePath, 'utf8');
                                            devConfig = JSON.parse(configContent);
                                        }
                                    } catch (error) {
                                        console.warn("[Extension] Could not load dev config for CSV export:", error);
                                    }
                                }
                                
                                // Create a map for sprint ID to name lookup
                                const sprintMap = new Map();
                                if (devConfig.sprints) {
                                    devConfig.sprints.forEach((sprint: any) => {
                                        sprintMap.set(sprint.sprintId, sprint.sprintName || sprint.sprintId);
                                    });
                                }
                                
                                // Helper function to convert devStatus ID to display label
                                const getDevStatusLabel = (status: string): string => {
                                    const statusMap: { [key: string]: string } = {
                                        'on-hold': 'On Hold',
                                        'ready-for-dev': 'Ready for Development',
                                        'in-progress': 'In Progress',
                                        'blocked': 'Blocked',
                                        'completed': 'Completed'
                                    };
                                    return statusMap[status] || status || '';
                                };
                                
                                // Helper function to convert priority ID to display label
                                const getPriorityLabel = (priority: string): string => {
                                    const priorityMap: { [key: string]: string } = {
                                        'critical': 'Critical',
                                        'high': 'High',
                                        'medium': 'Medium',
                                        'low': 'Low'
                                    };
                                    return priorityMap[priority] || priority || '';
                                };
                                
                                // Helper function to format dates
                                const formatDate = (dateStr: string): string => {
                                    if (!dateStr) {
                                        return '';
                                    }
                                    // Return as-is if already formatted, otherwise try to format
                                    return dateStr;
                                };
                                
                                // Helper function to escape CSV values
                                const escapeCsvValue = (value: string): string => {
                                    if (!value) {
                                        return '';
                                    }
                                    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
                                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                                        return `"${value.replace(/"/g, '""')}"`;
                                    }
                                    return value;
                                };
                                
                                // Create a map for quick lookup
                                const devDataMap = new Map();
                                if (existingDevData.devData) {
                                    existingDevData.devData.forEach((dev: any) => {
                                        devDataMap.set(dev.storyId, dev);
                                    });
                                }

                                // Create CSV content with columns matching the Details Tab table
                                // Columns: Story #, Story Text, Priority, Dev Queue Position, Points, Assigned To, Dev Status, Sprint, Start Date, Est. End Date, Actual End Date, Blocked Reason, Dev Notes
                                let csvContent = "Story #,Story Text,Priority,Dev Queue Position,Points,Assigned To,Dev Status,Sprint,Start Date,Est. End Date,Actual End Date,Blocked Reason,Dev Notes\n";
                                stories.forEach((story: any) => {
                                    // Only export processed stories that aren't ignored
                                    if (story.isStoryProcessed !== "true" || story.isIgnored === "true") {
                                        return;
                                    }
                                    
                                    const storyNumber = story.storyNumber || "";
                                    const storyText = story.storyText || "";
                                    
                                    // Get dev data for this story - use story.name as the key (matches loadUserStoriesDevData)
                                    const storyId = story.name || story.storyId || "";
                                    const dev = devDataMap.get(storyId);
                                    
                                    // Get display labels for dropdown values
                                    const priority = getPriorityLabel(dev?.priority || "");
                                    const queuePosition = dev?.developmentQueuePosition !== undefined ? dev.developmentQueuePosition : storyNumber;
                                    const storyPoints = dev?.storyPoints || "";
                                    const assignedTo = dev?.assignedTo || "";
                                    const devStatus = getDevStatusLabel(dev?.devStatus || "");
                                    const sprintId = dev?.sprintId || "";
                                    const sprintName = sprintId ? (sprintMap.get(sprintId) || sprintId) : "";
                                    const startDate = formatDate(dev?.startDate || "");
                                    const estEndDate = formatDate(dev?.estimatedEndDate || dev?.estEndDate || "");
                                    const actualEndDate = formatDate(dev?.actualEndDate || "");
                                    const blockedReason = dev?.blockedReason || "";
                                    const devNotes = dev?.devNotes || "";
                                    
                                    // Build CSV row with proper escaping
                                    const row = [
                                        storyNumber,
                                        escapeCsvValue(storyText),
                                        priority,
                                        queuePosition,
                                        storyPoints,
                                        assignedTo,
                                        devStatus,
                                        sprintName,
                                        startDate,
                                        estEndDate,
                                        actualEndDate,
                                        escapeCsvValue(blockedReason),
                                        escapeCsvValue(devNotes)
                                    ].join(',');
                                    
                                    csvContent += row + '\n';
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

                        case 'downloadDevelopersCsv':
                            try {
                                // Load dev config
                                const modelFilePath = modelService.getCurrentFilePath();
                                if (!modelFilePath) {
                                    throw new Error("No model file is currently open");
                                }

                                const modelDir = path.dirname(modelFilePath);
                                const configFilePath = path.join(modelDir, 'app-dna-user-story-dev-config.json');
                                
                                let config: any = { developers: [] };
                                if (fs.existsSync(configFilePath)) {
                                    const configContent = fs.readFileSync(configFilePath, 'utf8');
                                    config = JSON.parse(configContent);
                                }

                                const developers = config.developers || [];

                                // Load dev data to count assignments
                                const devFilePath = path.join(modelDir, 'app-dna-user-story-dev.json');
                                let devData: any = { devData: [] };
                                if (fs.existsSync(devFilePath)) {
                                    const devContent = fs.readFileSync(devFilePath, 'utf8');
                                    devData = JSON.parse(devContent);
                                }

                                // Count assignments for each developer
                                const assignmentCounts = new Map<string, number>();
                                if (devData.devData && Array.isArray(devData.devData)) {
                                    devData.devData.forEach((item: any) => {
                                        if (item.assignedTo) {
                                            assignmentCounts.set(item.assignedTo, (assignmentCounts.get(item.assignedTo) || 0) + 1);
                                        }
                                    });
                                }

                                // CSV headers
                                const headers = ['Name', 'Email', 'Role', 'Capacity (pts/sprint)', 'Status', 'Assigned Stories'];
                                
                                // CSV rows
                                const rows = developers.map((dev: any) => {
                                    const assignedCount = assignmentCounts.get(dev.name) || 0;
                                    return [
                                        dev.name || '',
                                        dev.email || '',
                                        dev.role || '',
                                        dev.capacity || '',
                                        dev.active !== false ? 'Active' : 'Inactive',
                                        assignedCount.toString()
                                    ];
                                });

                                // Create CSV content
                                let csvContent = headers.join(',') + '\n';
                                rows.forEach((row: string[]) => {
                                    csvContent += row.map(cell => {
                                        // Escape quotes and wrap in quotes if contains comma or quote
                                        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                                            return '"' + cell.replace(/"/g, '""') + '"';
                                        }
                                        return cell;
                                    }).join(',') + '\n';
                                });

                                // Generate filename with timestamp
                                const now = new Date();
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                const y = now.getFullYear();
                                const m = pad(now.getMonth() + 1);
                                const d = pad(now.getDate());
                                const h = pad(now.getHours());
                                const min = pad(now.getMinutes());
                                const s = pad(now.getSeconds());
                                const timestamp = `${y}${m}${d}${h}${min}${s}`;
                                const filename = `developers_${timestamp}.csv`;

                                // Send CSV content back to webview for download
                                panel.webview.postMessage({
                                    command: 'csvData',
                                    data: {
                                        content: csvContent,
                                        filename: filename
                                    }
                                });
                            } catch (error) {
                                console.error('[Extension] Error generating developers CSV:', error);
                                vscode.window.showErrorMessage(`Error generating developers CSV: ${(error as Error).message}`);
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
                queuePositionManagement: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'queuePositionManagement.js')
                ),
                dataObjectRankCalculator: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'dataObjectRankCalculator.js')
                ),
                devQueueTabTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'devQueueTabTemplate.js')
                ),
                devQueueDragDrop: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'devQueueDragDrop.js')
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
                // Templates - Developers Tab
                developersTabTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'developersTabTemplate.js')
                ),
                developerModalTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'developerModalTemplate.js')
                ),
                // Scripts - Developers Tab
                developerManagement: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'developerManagement.js')
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
                // Templates - Cost Tab
                costTabTemplate: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'templates', 'costTabTemplate.js')
                ),
                // Scripts - Cost Tab
                costAnalysisFunctions: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'scripts', 'costAnalysisFunctions.js')
                ),
                // Utility scripts (shared helpers)
                devDataHelpers: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'utils', 'devDataHelpers.js')
                ),
                configValidator: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'utils', 'configValidator.js')
                ),
                workingHoursHelper: panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoryDev', 'components', 'utils', 'workingHoursHelper.js')
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
                    justify-content: space-between;
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
                .modal {
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
                    overflow: auto;
                }

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
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
                    margin: 20px;
                }

                .modal-medium {
                    max-width: 600px;
                }

                .modal-small {
                    max-width: 400px;
                }

                .modal-header {
                    padding: 16px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2,
                .modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                    color: var(--vscode-foreground);
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

                .form-section h3,
                .form-section h4 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    color: var(--vscode-foreground);
                    font-weight: 600;
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
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-bottom: 4px;
                    font-size: 13px;
                }

                .form-group label .codicon {
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

                .form-input,
                .form-select,
                .form-textarea {
                    padding: 6px 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 2px;
                    font-family: var(--vscode-font-family);
                    font-size: 13px;
                    width: 100%;
                }

                .form-input:focus,
                .form-select:focus,
                .form-textarea:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }

                .form-input:disabled,
                .form-select:disabled,
                .form-textarea:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .field-hint {
                    color: var(--vscode-descriptionForeground);
                    font-size: 11px;
                    font-weight: normal;
                    margin-left: 4px;
                }

                .form-text {
                    display: block;
                    margin-top: 4px;
                    color: var(--vscode-input-placeholderForeground);
                    font-size: 12px;
                    line-height: 1.4;
                }

                .readonly-input {
                    background: var(--vscode-input-background);
                    opacity: 0.7;
                }

                /* Working Hours Table Styles */
                .working-hours-table-container {
                    overflow-x: auto;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    background: var(--vscode-editor-background);
                }

                .working-hours-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .working-hours-table thead {
                    background: var(--vscode-editorGroup-dropBackground);
                }

                .working-hours-table th {
                    padding: 8px 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    color: var(--vscode-foreground);
                }

                .working-hours-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .working-hours-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .working-hours-table tbody tr:hover {
                    background: var(--vscode-list-hoverBackground);
                }

                .working-hours-table tbody tr.disabled-row {
                    opacity: 0.5;
                }

                .working-hours-enabled-checkbox {
                    cursor: pointer;
                    width: 16px;
                    height: 16px;
                }

                .working-hours-time-input {
                    padding: 4px 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 2px;
                    font-family: var(--vscode-font-family);
                    font-size: 13px;
                    width: 100%;
                }

                .working-hours-time-input:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }

                .working-hours-time-input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .working-hours-display {
                    text-align: right;
                    font-weight: 600;
                    color: var(--vscode-charts-blue);
                }

                .working-hours-table tbody tr.invalid-time-range {
                    background: var(--vscode-inputValidation-errorBackground);
                }

                .working-hours-table tbody tr.warning-time-range {
                    background: var(--vscode-inputValidation-warningBackground);
                }

                .working-hours-table tbody tr.invalid-time-range:hover {
                    background: var(--vscode-inputValidation-errorBackground);
                    opacity: 0.9;
                }

                .working-hours-table tbody tr.warning-time-range:hover {
                    background: var(--vscode-inputValidation-warningBackground);
                    opacity: 0.9;
                }

                /* Button Styles */
                .btn,
                .primary-button {
                    padding: 6px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }

                .btn:hover,
                .primary-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }

                .btn-primary {
                    padding: 6px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }

                .btn-primary:hover {
                    background: var(--vscode-button-hoverBackground);
                }

                .btn-secondary,
                .secondary-button {
                    padding: 6px 16px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }

                .btn-secondary:hover,
                .secondary-button:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }

                .btn-sm {
                    padding: 4px 12px;
                    font-size: 12px;
                }

                .btn-icon {
                    padding: 6px;
                    background: transparent;
                    border: 1px solid var(--vscode-button-border);
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 2px;
                }

                .btn-icon:hover {
                    background: var(--vscode-toolbar-hoverBackground);
                }

                .modal-close {
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 2px;
                }

                .modal-close:hover {
                    background: var(--vscode-toolbar-hoverBackground);
                }

                .btn-danger {
                    padding: 6px 16px;
                    background: #f85149;
                    color: white;
                    border: 1px solid #f85149;
                    border-radius: 2px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }

                .btn-danger:hover {
                    background: #da3633;
                    border-color: #da3633;
                }

                /* Warning and Info Messages */
                .warning-message {
                    display: flex;
                    gap: 12px;
                    padding: 12px;
                    background: var(--vscode-inputValidation-warningBackground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                    border-radius: 4px;
                    align-items: flex-start;
                }

                .warning-message .codicon {
                    color: var(--vscode-inputValidation-warningForeground);
                    font-size: 20px;
                    flex-shrink: 0;
                }

                .warning-content {
                    flex: 1;
                }

                .warning-content p {
                    margin: 0 0 8px 0;
                }

                .warning-content p:last-child {
                    margin-bottom: 0;
                }

                /* Sprint Presets */
                .sprint-presets {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid var(--vscode-panel-border);
                }

                .sprint-presets h5 {
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    font-weight: 600;
                }

                .preset-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
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
                .analysis-container {
                    padding: 0;
                }

                .analysis-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .analysis-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }

                .analysis-controls {
                    display: flex;
                    gap: 8px;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .charts-section {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                    gap: 20px;
                    margin-bottom: 24px;
                }

                .chart-subtitle {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    font-weight: normal;
                }

                .chart-large {
                    grid-column: 1 / -1;
                }

                .data-table-section {
                    margin-top: 24px;
                }

                .table-header {
                    margin-bottom: 12px;
                }

                .table-header h4 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }

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
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .chart-header h4 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
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

                .sprint-card.sprint-drag-over {
                    background: var(--vscode-list-hoverBackground);
                    border: 2px dashed var(--vscode-focusBorder);
                    box-shadow: 0 0 8px rgba(0, 122, 204, 0.3);
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

                /* Sprint Card Stories */
                .sprint-card-stories {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid var(--vscode-panel-border);
                }

                .sprint-stories-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--vscode-descriptionForeground);
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }

                .sprint-stories-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .sprint-story-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 8px;
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 3px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .sprint-story-item:hover {
                    background: var(--vscode-list-hoverBackground);
                    border-color: var(--vscode-focusBorder);
                }

                .sprint-story-item .story-number {
                    color: var(--vscode-textLink-foreground);
                    font-weight: 600;
                    flex-shrink: 0;
                }

                .sprint-story-item .story-title {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .sprint-story-item .story-points-badge {
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 600;
                    flex-shrink: 0;
                }

                .sprint-story-item .btn-small {
                    padding: 2px;
                    opacity: 0.6;
                }

                .sprint-story-item .btn-small:hover {
                    opacity: 1;
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
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .backlog-story:hover {
                    background: var(--vscode-list-hoverBackground);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    border-color: var(--vscode-focusBorder);
                }

                .backlog-story.story-dragging {
                    opacity: 0.5;
                    cursor: grabbing;
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

                /* ===== DEVELOPERS TAB STYLES ===== */
                .developers-tab-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .developers-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .developers-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .developers-header-text h3 {
                    margin: 0 0 4px 0;
                    font-size: 20px;
                    color: var(--vscode-foreground);
                }

                .developers-header-text p {
                    margin: 0;
                    font-size: 13px;
                    color: var(--vscode-descriptionForeground);
                }

                .developers-table-container {
                    flex: 1;
                    overflow: auto;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    background: var(--vscode-editor-background);
                }

                .developers-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .developers-table thead {
                    position: sticky;
                    top: 0;
                    background: var(--vscode-editorGroupHeader-tabsBackground);
                    z-index: 10;
                }

                .developers-table th {
                    padding: 12px 8px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 12px;
                    color: var(--vscode-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    cursor: default;
                }

                .developers-table th.sortable {
                    cursor: pointer;
                    user-select: none;
                }

                .developers-table th.sortable:hover {
                    background: var(--vscode-list-hoverBackground);
                }

                .developers-table .col-select {
                    width: 40px;
                    text-align: center;
                }

                .developers-table .col-name {
                    width: 200px;
                }

                .developers-table .col-email {
                    width: 220px;
                }

                .developers-table .col-role {
                    width: 180px;
                }

                .developers-table .col-capacity {
                    width: 150px;
                }

                .developers-table .col-rate {
                    width: 130px;
                    text-align: right;
                }

                .developers-table .col-assigned {
                    width: 120px;
                    text-align: center;
                }

                .developers-table .col-status {
                    width: 100px;
                }

                .developers-table .col-actions {
                    width: 100px;
                    text-align: right;
                }

                .developers-table tbody tr {
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .developers-table tbody tr:hover {
                    background: var(--vscode-list-hoverBackground);
                }

                .developers-table tbody td {
                    padding: 10px 8px;
                    font-size: 13px;
                    color: var(--vscode-foreground);
                }

                .developer-row[data-developer-id] {
                    cursor: pointer;
                }

                .assigned-count {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    font-size: 11px;
                    font-weight: 600;
                }

                .assigned-count.has-assignments {
                    background: var(--vscode-charts-blue);
                    color: white;
                }

                .status-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .status-active {
                    background: var(--vscode-testing-iconPassed);
                    color: white;
                }

                .status-inactive {
                    background: var(--vscode-descriptionForeground);
                    color: white;
                    opacity: 0.6;
                }

                .developers-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 12px;
                    padding: 12px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }

                #developerBulkActions {
                    display: flex;
                    gap: 8px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .checkbox-text {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .form-error {
                    padding: 8px 12px;
                    background: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    color: var(--vscode-errorForeground);
                    border-radius: 4px;
                    margin-top: 12px;
                    font-size: 12px;
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

                /* Cost Tab Styles */
                .cost-tab-container {
                    padding: 0;
                }

                .cost-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .cost-header h3 {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .cost-actions {
                    display: flex;
                    gap: 8px;
                }

                .cost-filters {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                    padding: 12px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                }

                .cost-filters label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                }

                .cost-table-wrapper {
                    overflow-x: auto;
                    margin-bottom: 24px;
                }

                .cost-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .cost-table thead th {
                    position: sticky;
                    top: 0;
                    background: var(--vscode-editor-background);
                    padding: 12px 16px;
                    text-align: left;
                    border-bottom: 2px solid var(--vscode-panel-border);
                    font-weight: 600;
                    z-index: 10;
                }

                .cost-table .developer-column {
                    min-width: 150px;
                    position: sticky;
                    left: 0;
                    background: var(--vscode-editor-background);
                    z-index: 11;
                }

                .cost-table thead .developer-column {
                    z-index: 12;
                }

                .cost-table .month-column {
                    min-width: 120px;
                    text-align: right;
                }

                .cost-table .month-column.current-month {
                    background: var(--vscode-list-hoverBackground);
                }

                .cost-table .current-badge {
                    display: block;
                    font-size: 10px;
                    font-weight: normal;
                    color: var(--vscode-charts-blue);
                    margin-top: 2px;
                }

                .cost-table tbody tr {
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .cost-table tbody tr:hover {
                    background: var(--vscode-list-hoverBackground);
                }

                .cost-table .developer-row td {
                    padding: 12px 16px;
                }

                .cost-table .developer-name {
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    position: sticky;
                    left: 0;
                    background: inherit;
                }

                .cost-table .unassigned-row {
                    background: var(--vscode-editor-background);
                    font-style: italic;
                }

                .cost-table .unassigned-row .developer-name {
                    color: var(--vscode-descriptionForeground);
                }

                .cost-table .total-row {
                    background: var(--vscode-editor-background);
                    border-top: 2px solid var(--vscode-panel-border);
                    font-weight: 600;
                }

                .cost-cell {
                    text-align: right;
                }

                .cost-cell.current-month {
                    background: var(--vscode-list-hoverBackground);
                }

                .cost-cell.has-cost {
                    color: var(--vscode-charts-green);
                }

                .cost-summary {
                    display: flex;
                    gap: 20px;
                    padding: 20px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                }

                .summary-card {
                    flex: 1;
                    padding: 16px;
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }

                .summary-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 8px;
                }

                .summary-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--vscode-charts-green);
                }

                /* Dev Queue Tab Styles */
                .dev-queue-container {
                    padding: 0;
                }

                .dev-queue-header {
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .dev-queue-header h3 {
                    margin: 0 0 12px 0;
                    font-size: 18px;
                    color: var(--vscode-foreground);
                }

                .dev-queue-description {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 12px;
                    background: var(--vscode-textCodeBlock-background);
                    border-left: 3px solid var(--vscode-focusBorder);
                    border-radius: 4px;
                    line-height: 1.5;
                    color: var(--vscode-descriptionForeground);
                    font-size: 13px;
                }

                .dev-queue-description .codicon {
                    margin-top: 2px;
                    flex-shrink: 0;
                }

                .dev-queue-stats {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 20px;
                    padding: 16px;
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }

                .dev-queue-stats .stat-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .dev-queue-stats .stat-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    color: var(--vscode-descriptionForeground);
                }

                .dev-queue-stats .stat-value {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }

                .dev-queue-actions {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .dev-queue-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .dev-queue-item {
                    display: flex;
                    background: var(--vscode-list-inactiveSelectionBackground);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    cursor: move;
                    transition: all 0.2s ease;
                }

                .dev-queue-item:hover {
                    background: var(--vscode-list-hoverBackground);
                    border-color: var(--vscode-focusBorder);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .dev-queue-item.dragging {
                    opacity: 0.5;
                    transform: scale(0.98);
                }

                .dev-queue-item.drag-over {
                    border-color: var(--vscode-focusBorder);
                    border-width: 2px;
                    background: var(--vscode-list-activeSelectionBackground);
                }

                .queue-item-handle {
                    display: flex;
                    align-items: center;
                    padding: 12px 8px;
                    color: var(--vscode-descriptionForeground);
                    cursor: grab;
                }

                .queue-item-handle:active {
                    cursor: grabbing;
                }

                .queue-item-content {
                    flex: 1;
                    padding: 12px;
                    cursor: pointer;
                }

                .queue-item-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    flex-wrap: wrap;
                }

                .queue-item-position {
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--vscode-textLink-foreground);
                }

                .queue-item-story-number {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }

                .queue-item-status {
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .queue-item-status.status-on-hold {
                    background: var(--vscode-inputValidation-warningBackground);
                    color: var(--vscode-inputValidation-warningForeground);
                }

                .queue-item-status.status-ready-for-dev {
                    background: var(--vscode-charts-blue);
                    color: white;
                }

                .queue-item-status.status-in-progress {
                    background: var(--vscode-charts-green);
                    color: white;
                }

                .queue-item-status.status-blocked {
                    background: var(--vscode-charts-red);
                    color: white;
                }

                .queue-item-priority {
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .queue-item-priority.priority-critical {
                    background: var(--vscode-charts-red);
                    color: white;
                }

                .queue-item-priority.priority-high {
                    background: var(--vscode-charts-orange);
                    color: white;
                }

                .queue-item-priority.priority-medium {
                    background: var(--vscode-charts-yellow);
                    color: black;
                }

                .queue-item-priority.priority-low {
                    background: var(--vscode-charts-blue);
                    color: white;
                }

                .queue-item-text {
                    margin-bottom: 8px;
                    line-height: 1.4;
                    color: var(--vscode-foreground);
                }

                .queue-item-footer {
                    display: flex;
                    gap: 12px;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }

                .queue-item-footer span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .empty-queue-message {
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--vscode-descriptionForeground);
                }

                .empty-queue-message .codicon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    color: var(--vscode-charts-green);
                }

                .empty-queue-message p {
                    font-size: 16px;
                    margin: 0;
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
                <button class="tab" onclick="switchTab('devQueue')">Dev Queue</button>
                <button class="tab" onclick="switchTab('board')">Board</button>
                <button class="tab" onclick="switchTab('sprint')">Sprint</button>
                <button class="tab" onclick="switchTab('developers')">Developers</button>
                <button class="tab" onclick="switchTab('forecast')">Forecast</button>
                <button class="tab" onclick="switchTab('cost')">Cost</button>
                <button class="tab" onclick="switchTab('analysis')">Analysis</button>
            </div>

            <div id="detailsTab" class="tab-content active">
                <div class="empty-state">
                    <i class="codicon codicon-loading codicon-modifier-spin"></i>
                    <h3>Loading development data...</h3>
                    <p>Please wait while we load your user stories</p>
                </div>
            </div>

            <div id="devQueueTab" class="tab-content">
                <div class="empty-state">
                    <i class="codicon codicon-list-ordered"></i>
                    <h3>Development Queue</h3>
                    <p>Queue view will be displayed here</p>
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

            <div id="developersTab" class="tab-content">
                <div class="empty-state">
                    <i class="codicon codicon-person"></i>
                    <h3>Developers Tab</h3>
                    <p>Developer management will be displayed here</p>
                </div>
            </div>

            <div id="forecastTab" class="tab-content">
                <div class="empty-state">
                    <i class="codicon codicon-calendar"></i>
                    <h3>Development Forecast</h3>
                    <p>Gantt chart timeline will be displayed here</p>
                </div>
            </div>

            <div id="costTab" class="tab-content">
                <div class="empty-state">
                    <i class="codicon codicon-credit-card"></i>
                    <h3>Cost Analysis</h3>
                    <p>Monthly cost breakdown will be displayed here</p>
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
            <script src="${scriptUris.workingHoursHelper}"></script>
            <script src="${scriptUris.errorHandling}"></script>
            
            <!-- Templates must be loaded next -->
            <script src="${scriptUris.detailsTabTemplate}"></script>
            <script src="${scriptUris.devQueueTabTemplate}"></script>
            <script src="${scriptUris.storyDetailModalTemplate}"></script>
            <script src="${scriptUris.boardTabTemplate}"></script>
            <script src="${scriptUris.analysisTabTemplate}"></script>
            <script src="${scriptUris.sprintTabTemplate}"></script>
            <script src="${scriptUris.sprintModalTemplate}"></script>
            <script src="${scriptUris.developersTabTemplate}"></script>
            <script src="${scriptUris.developerModalTemplate}"></script>
            <script src="${scriptUris.forecastTabTemplate}"></script>
            <script src="${scriptUris.forecastConfigModalTemplate}"></script>
            <script src="${scriptUris.costTabTemplate}"></script>
            
            <!-- Then load helper modules -->
            <script src="${scriptUris.velocityCalculator}"></script>
            <script src="${scriptUris.cycleTimeCalculator}"></script>
            
            <!-- Then load all component scripts - Details Tab -->
            <script src="${scriptUris.tableRenderer}"></script>
            <script src="${scriptUris.filterFunctions}"></script>
            <script src="${scriptUris.selectionActions}"></script>
            <script src="${scriptUris.devStatusManagement}"></script>
            <script src="${scriptUris.priorityManagement}"></script>
            <script src="${scriptUris.queuePositionManagement}"></script>
            <script src="${scriptUris.storyPointsManagement}"></script>
            <script src="${scriptUris.assignmentManagement}"></script>
            <script src="${scriptUris.modalFunctionality}"></script>
            
            <!-- Dev Queue Tab scripts -->
            <script src="${scriptUris.devQueueDragDrop}"></script>
            <script src="${scriptUris.dataObjectRankCalculator}"></script>
            
            <!-- Board Tab scripts -->
            <script src="${scriptUris.cardComponent}"></script>
            <script src="${scriptUris.kanbanFunctions}"></script>
            
            <!-- Analysis Tab scripts -->
            <script src="${scriptUris.chartFunctions}"></script>
            <script src="${scriptUris.metricsDisplay}"></script>
            
            <!-- Sprint Tab scripts -->
            <script src="${scriptUris.sprintManagement}"></script>
            <script src="${scriptUris.burndownChart}"></script>
            
            <!-- Developers Tab scripts -->
            <script src="${scriptUris.developerManagement}"></script>
            
            <!-- Forecast Tab scripts -->
            <script src="${scriptUris.forecastFunctions}"></script>
            <script src="${scriptUris.ganttChart}"></script>
            <script src="${scriptUris.forecastConfigManagement}"></script>
            
            <!-- Cost Tab scripts -->
            <script src="${scriptUris.costAnalysisFunctions}"></script>
            
            <!-- Finally load the main orchestrator -->
            <script src="${scriptUris.main}"></script>
        </body>
        </html>
    `;
}
