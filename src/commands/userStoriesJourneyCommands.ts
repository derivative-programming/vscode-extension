// Description: Handles registration of user stories user journey view related commands.
// Created: August 6, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the user stories journey view
const userStoriesJourneyPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the user stories journey panel if it's open
 */
export function getUserStoriesJourneyPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('userStoriesJourney') && userStoriesJourneyPanel.context && userStoriesJourneyPanel.modelService) {
        return {
            type: 'userStoriesJourney',
            context: userStoriesJourneyPanel.context,
            modelService: userStoriesJourneyPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the user stories journey panel if it's open
 */
export function closeUserStoriesJourneyPanel(): void {
    console.log(`Closing user stories journey panel if open`);
    const panel = activePanels.get('userStoriesJourney');
    if (panel) {
        panel.dispose();
        activePanels.delete('userStoriesJourney');
    }
    // Clean up panel reference
    userStoriesJourneyPanel.panel = null;
}

/**
 * Load user stories journey data from both model and page mapping file
 */
async function loadUserStoriesJourneyData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean): Promise<void> {
    try {
        console.log("[Extension] Loading user stories journey data");
        const model = modelService.getCurrentModel();
        if (!model) {
            console.error("[Extension] No model available");
            panel.webview.postMessage({
                command: "setUserStoriesJourneyData",
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

        // Load existing page mapping data from separate file
        let existingPageMappingData: any = { pageMappings: {} };
        let pageMappingFilePath = '';
        const modelFilePath = modelService.getCurrentFilePath();
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            pageMappingFilePath = path.join(modelDir, 'app-dna-user-story-page-mapping.json');
            try {
                if (fs.existsSync(pageMappingFilePath)) {
                    const mappingContent = fs.readFileSync(pageMappingFilePath, 'utf8');
                    existingPageMappingData = JSON.parse(mappingContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load existing page mapping file:", error);
                existingPageMappingData = { pageMappings: {} };
            }
        }

        console.log(`[Extension] Found ${userStories.length} user stories`);

        // Load existing journey data (for page distances)
        let journeyData: any = { pageDistances: [] };
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');
            
            try {
                if (fs.existsSync(journeyFilePath)) {
                    const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                    journeyData = JSON.parse(journeyContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load journey data file:", error);
            }
        }

        // Build combined data array with page mapping
        const combinedData: any[] = [];
        
        // Get all pages from model to find role information
        const allPages: any[] = [];
        const allObjects = modelService.getAllObjects();
        allObjects.forEach((obj: any) => {
            // Extract workflows with isPage=true
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === 'true') {
                        allPages.push({
                            name: workflow.name,
                            roleRequired: workflow.roleRequired
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
                            roleRequired: report.roleRequired
                        });
                    }
                });
            }
        });
        
        userStories.forEach(story => {
            const storyId = story.name || '';
            const storyNumber = story.storyNumber || '';
            const existingMapping = existingPageMappingData.pageMappings[storyNumber];

            // Get pages from mapping (stored as array in pageMapping field)
            const pages = existingMapping?.pageMapping || [];
            
            if (pages.length > 0) {
                // Create a row for each page that fulfils the story
                pages.forEach((page: string) => {
                    // Find page distance from journey data
                    const pageDistanceData = journeyData.pageDistances?.find((pd: any) => pd.destinationPage === page);
                    const journeyPageDistance = pageDistanceData ? pageDistanceData.distance : -1;
                    
                    // Find page role from all pages
                    const pageInfo = allPages.find(p => p.name === page);
                    const pageRole = pageInfo ? pageInfo.roleRequired : '';
                    
                    combinedData.push({
                        storyId: storyId,
                        storyNumber: story.storyNumber || '',
                        storyText: story.storyText || '',
                        page: page,
                        pageRole: pageRole,
                        journeyPageDistance: journeyPageDistance,
                        pageMappingFilePath: pageMappingFilePath,
                        selected: false // For checkbox functionality
                    });
                });
            } else {
                // If no pages mapped, still show the story but with empty page
                combinedData.push({
                    storyId: storyId,
                    storyNumber: story.storyNumber || '',
                    storyText: story.storyText || '',
                    page: '',
                    pageRole: '',
                    journeyPageDistance: -1,
                    pageMappingFilePath: pageMappingFilePath,
                    selected: false // For checkbox functionality
                });
            }
        });

        // Sort the data
        if (sortColumn) {
            combinedData.sort((a, b) => {
                let aVal = a[sortColumn] || '';
                let bVal = b[sortColumn] || '';
                
                // Handle numeric comparison for journeyPageDistance
                if (sortColumn === 'journeyPageDistance') {
                    const aNum = typeof aVal === 'number' ? aVal : (aVal === '' ? -1 : parseInt(aVal) || -1);
                    const bNum = typeof bVal === 'number' ? bVal : (bVal === '' ? -1 : parseInt(bVal) || -1);
                    
                    // Sort with -1 values at the end
                    if (aNum === -1 && bNum === -1) {
                        return 0;
                    }
                    if (aNum === -1) {
                        return 1;
                    }
                    if (bNum === -1) {
                        return -1;
                    }
                    
                    const result = aNum - bNum;
                    return sortDescending ? -result : result;
                }
                
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

        console.log(`[Extension] Sending ${combinedData.length} journey items to webview`);

        // Send data to webview
        panel.webview.postMessage({
            command: "setUserStoriesJourneyData",
            data: {
                items: combinedData,
                totalRecords: combinedData.length,
                sortColumn: sortColumn || 'storyNumber',
                sortDescending: sortDescending || false
            }
        });

    } catch (error) {
        console.error("[Extension] Error loading user stories journey data:", error);
        panel.webview.postMessage({
            command: "setUserStoriesJourneyData",
            data: { items: [], totalRecords: 0, sortColumn: 'storyNumber', sortDescending: false, error: error.message }
        });
    }
}

/**
 * Save journey data to CSV file
 */
async function saveJourneyDataToCSV(items: any[], modelService: ModelService): Promise<string> {
    try {
        // Create CSV content
        const csvHeader = 'Story Number,Story Text,Page,Journey Page Distance\n';
        const csvRows = items.map(item => {
            const storyNumber = (item.storyNumber || '').toString().replace(/"/g, '""');
            const storyText = (item.storyText || '').toString().replace(/"/g, '""');
            const page = (item.page || '').toString().replace(/"/g, '""');
            const journeyPageDistance = (item.journeyPageDistance !== undefined && item.journeyPageDistance !== -1) 
                ? item.journeyPageDistance.toString() 
                : '';
            return `"${storyNumber}","${storyText}","${page}","${journeyPageDistance}"`;
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        return csvContent;
    } catch (error) {
        console.error("[Extension] Error creating CSV:", error);
        throw error;
    }
}

/**
 * Save page usage data to CSV format
 */
async function savePageUsageDataToCSV(pages: any[], modelService: ModelService): Promise<string> {
    try {
        // Create CSV content with page usage data
        const csvHeader = 'Page Name,Type,Complexity,Total Elements,Usage Count\n';
        const csvRows = pages.map(page => {
            const name = (page.name || '').toString().replace(/"/g, '""');
            const type = (page.type || '').toString().replace(/"/g, '""');
            const complexity = (page.complexity || '').toString().replace(/"/g, '""');
            const totalElements = (page.totalElements || 0).toString();
            const usageCount = (page.usageCount || 0).toString();
            
            return `"${name}","${type}","${complexity}","${totalElements}","${usageCount}"`;
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        return csvContent;
    } catch (error) {
        console.error("[Extension] Error creating Page Usage CSV:", error);
        throw error;
    }
}

/**
 * Load journey start data including roles and existing journey start pages
 */
async function loadJourneyStartData(modelService: ModelService): Promise<any> {
    try {
        const model = modelService.getCurrentModel();
        if (!model) {
            throw new Error('No model available');
        }

        // Extract roles from Role data objects
        const roles: string[] = [];
        if (model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
            const namespace = model.namespace[0];
            if (namespace.object && Array.isArray(namespace.object)) {
                namespace.object.forEach((obj: any) => {
                    if (obj.name && obj.name.toLowerCase() === 'role') {
                        if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                            obj.lookupItem.forEach((lookupItem: any) => {
                                if (lookupItem.name) {
                                    roles.push(lookupItem.name);
                                }
                            });
                        }
                    }
                });
            }
        }

        // Load existing journey start pages from separate user journey file
        let existingJourneyStartPages: any = {};
        const modelFilePath = modelService.getCurrentFilePath();
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');
            
            try {
                if (fs.existsSync(journeyFilePath)) {
                    const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                    const journeyData = JSON.parse(journeyContent);
                    existingJourneyStartPages = journeyData.journeyStartPages || {};
                }
            } catch (error) {
                console.warn("[Extension] Could not load journey start pages from user journey file:", error);
            }
        }

        return {
            roles: roles.sort(),
            journeyStartPages: existingJourneyStartPages
        };
    } catch (error) {
        console.error("[Extension] Error loading journey start data:", error);
        throw error;
    }
}

/**
 * Get page list for journey start selection
 */
async function getPageListForJourneyStart(modelService: ModelService): Promise<any[]> {
    try {
        const model = modelService.getCurrentModel();
        if (!model) {
            throw new Error('No model available');
        }

        const pages: any[] = [];
        
        if (model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
            const namespace = model.namespace[0];
            
            // Get pages from objects (data objects)
            if (namespace.object && Array.isArray(namespace.object)) {
                namespace.object.forEach((obj: any) => {
                    // Get pages from object reports
                    if (obj.report && Array.isArray(obj.report)) {
                        obj.report.forEach((report: any) => {
                            if ((report.isPage === "true" || report.isPage === undefined) && report.name) {
                                pages.push({
                                    name: report.name,
                                    type: 'Report',
                                    titleText: report.titleText || '',
                                    visualizationType: report.visualizationType || 'N/A',
                                    ownerObject: obj.name || 'N/A'
                                });
                            }
                        });
                    }
                    
                    // Get pages from object objectWorkflows (forms)
                    if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                        obj.objectWorkflow.forEach((workflow: any) => {
                            if (workflow.isPage === "true" && workflow.name) {
                                pages.push({
                                    name: workflow.name,
                                    type: 'Form',
                                    titleText: workflow.titleText || '',
                                    visualizationType: 'Form',
                                    ownerObject: obj.name || 'N/A'
                                });
                            }
                        });
                    }
                });
            }
        }

        // Sort pages alphabetically by name
        return pages.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("[Extension] Error getting page list:", error);
        throw error;
    }
}

/**
 * Save journey start data to the separate user journey file
 */
async function saveJourneyStartData(journeyStartPages: any, modelService: ModelService): Promise<void> {
    try {
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            throw new Error('No model file path available');
        }

        const modelDir = path.dirname(modelFilePath);
        const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');

        // Load existing journey data or create new structure
        let journeyData: any = { journeyStartPages: {} };
        try {
            if (fs.existsSync(journeyFilePath)) {
                const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                journeyData = JSON.parse(journeyContent);
                
                // Ensure journeyStartPages property exists
                if (!journeyData.journeyStartPages) {
                    journeyData.journeyStartPages = {};
                }
            }
        } catch (error) {
            console.warn("[Extension] Could not load existing journey file, creating new one:", error);
        }

        // Update journey start pages
        journeyData.journeyStartPages = journeyStartPages;

        // Save to file
        const content = JSON.stringify(journeyData, null, 2);
        fs.writeFileSync(journeyFilePath, content, 'utf8');
        
        console.log(`[Extension] Journey start pages saved to ${journeyFilePath}`);
    } catch (error) {
        console.error("[Extension] Error saving journey start data:", error);
        throw error;
    }
}

/**
 * Extracts buttons with destination targets from a workflow
 */
function extractButtonsFromWorkflow(workflow: any): any[] {
    const buttons: any[] = [];
    
    // Extract object workflow buttons with destination targets
    if (workflow.objectWorkflowButton && Array.isArray(workflow.objectWorkflowButton)) {
        workflow.objectWorkflowButton.forEach((button: any) => {
            // Only include buttons that have destination targets and are visible and not ignored
            if (button.destinationTargetName && 
                (!button.hasOwnProperty('isVisible') || button.isVisible !== "false") && 
                (!button.hasOwnProperty('isIgnored') || button.isIgnored !== "true")) {
                buttons.push({
                    buttonName: button.buttonText || 'Button',
                    buttonText: button.buttonText,
                    buttonType: button.buttonType || 'other',
                    destinationTargetName: button.destinationTargetName,
                    destinationContextObjectName: button.destinationContextObjectName
                });
            }
        });
    }
    
    return buttons;
}

/**
 * Extracts buttons with destination targets from a report
 */
function extractButtonsFromReport(report: any): any[] {
    const buttons: any[] = [];
    
    // Extract report buttons (excluding breadcrumb buttons)
    if (report.reportButton && Array.isArray(report.reportButton)) {
        report.reportButton.forEach((button: any) => {
            // Only include buttons that have destination targets, are not breadcrumb buttons, and are visible and not ignored
            if (button.destinationTargetName && 
                button.buttonType !== "breadcrumb" &&
                (!button.hasOwnProperty('isVisible') || button.isVisible !== "false") && 
                (!button.hasOwnProperty('isIgnored') || button.isIgnored !== "true")) {
                buttons.push({
                    buttonName: button.buttonName || button.buttonText,
                    buttonText: button.buttonText,
                    buttonType: button.buttonType,
                    destinationTargetName: button.destinationTargetName,
                    destinationContextObjectName: button.destinationContextObjectName
                });
            }
        });
    }
    
    // Extract report column buttons with destinations
    if (report.reportColumn && Array.isArray(report.reportColumn)) {
        report.reportColumn.forEach((column: any) => {
            // Only include column buttons that have destination targets and are visible and not ignored
            if (column.isButton === "true" && 
                column.destinationTargetName &&
                (!column.hasOwnProperty('isVisible') || column.isVisible !== "false") && 
                (!column.hasOwnProperty('isIgnored') || column.isIgnored !== "true")) {
                buttons.push({
                    buttonName: column.name,
                    buttonText: column.buttonText,
                    buttonType: 'column',
                    destinationTargetName: column.destinationTargetName,
                    destinationContextObjectName: column.destinationContextObjectName
                });
            }
        });
    }
    
    return buttons;
}

/**
 * Calculate page distances from journey start pages
 */
async function calculatePageDistances(panel: vscode.WebviewPanel, modelService: ModelService): Promise<void> {
    try {
        console.log("[Extension] Starting page distance calculation");
        
        // Step 1: Load journey start pages (10%)
        panel.webview.postMessage({
            command: 'distanceCalculationProgress',
            data: {
                step: 'loading',
                percentage: 10,
                detail: 'Loading journey start pages...',
                stepDetails: { loading: 'Loading journey start pages from file' }
            }
        });

        const journeyStartData = await loadJourneyStartData(modelService);
        const journeyStartPages = journeyStartData.journeyStartPages || {};
        
        console.log("[Extension] Loaded journey start pages:", journeyStartPages);

        if (Object.keys(journeyStartPages).length === 0) {
            throw new Error('No journey start pages defined. Please define journey start pages first.');
        }

        // Step 2: Load page flow data (30%)
        panel.webview.postMessage({
            command: 'distanceCalculationProgress',
            data: {
                step: 'pageFlow',
                percentage: 30,
                detail: 'Loading page flow data...',
                stepDetails: { pageFlow: 'Loading pages and connections from model' }
            }
        });

        // Get all objects using ModelService (same approach as Page Flow view)
        const allObjects = modelService.getAllObjects();
        if (!allObjects || allObjects.length === 0) {
            throw new Error('No objects available in model');
        }

        // Extract pages from objectWorkflow and report arrays (same logic as Page Flow view)
        const pages: any[] = [];
        const connections: any[] = []; // Keep empty for now, will use button destinations

        allObjects.forEach((obj: any) => {
            // Extract forms (object workflows with isPage=true)
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === 'true') {
                        const page = {
                            name: workflow.name,
                            titleText: workflow.titleText || workflow.name,
                            type: 'form',
                            objectName: obj.name,
                            buttons: extractButtonsFromWorkflow(workflow),
                            roleRequired: workflow.roleRequired,
                            isPage: workflow.isPage
                        };
                        pages.push(page);
                    }
                });
            }

            // Extract reports with isPage=true
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if (report.isPage === 'true' || report.isPage === undefined) {
                        const page = {
                            name: report.name,
                            titleText: report.titleText || report.name,
                            type: 'report',
                            objectName: obj.name,
                            buttons: extractButtonsFromReport(report),
                            roleRequired: report.roleRequired,
                            isPage: report.isPage
                        };
                        pages.push(page);
                    }
                });
            }
        });

        const flowData = { pages, connections };
        console.log("[Extension] Extracted pages:", pages.length);
        console.log("[Extension] Extracted connections:", connections.length);
        console.log("[Extension] Sample page:", pages.length > 0 ? pages[0] : 'none');

        // Step 3: Calculate distances (70%)
        panel.webview.postMessage({
            command: 'distanceCalculationProgress',
            data: {
                step: 'calculating',
                percentage: 50,
                detail: 'Calculating page distances...',
                stepDetails: { calculating: 'Building page connection graph' }
            }
        });

        // Build the page graph (same logic as in page flow user journey)
        const graph: { [key: string]: string[] } = {};
        const pageMap: { [key: string]: any } = {};

        // Initialize graph with all pages
        pages.forEach(page => {
            graph[page.name] = [];
            pageMap[page.name] = page;
        });

        // Add explicit connections to graph
        connections.forEach(connection => {
            if (connection.from && connection.to && graph[connection.from] && graph[connection.to]) {
                graph[connection.from].push(connection.to);
            }
        });

        // Add button destinations from each page
        pages.forEach(page => {
            if (page.buttons && Array.isArray(page.buttons)) {
                page.buttons.forEach((button: any) => {
                    if (button.destinationTargetName && graph[page.name] && graph[button.destinationTargetName]) {
                        // Avoid duplicate connections
                        if (!graph[page.name].includes(button.destinationTargetName)) {
                            graph[page.name].push(button.destinationTargetName);
                        }
                    }
                });
            }
        });

        // Calculate distances for each page from its role's start page
        const pageDistances: any[] = [];
        const totalPages = pages.length;
        let processedPages = 0;

        for (const page of pages) {
            // Find which role this page belongs to and get the start page for that role
            const roleStartPages = Object.entries(journeyStartPages);
            let shortestDistance = -1; // -1 means unreachable
            let fromStartPage = '';

            // Check distance from each role's start page and take the shortest
            for (const [roleName, startPageName] of roleStartPages) {
                if (typeof startPageName === 'string' && startPageName.trim() !== '') {
                    const distance = findShortestPathDistance(startPageName, page.name, graph);
                    if (distance >= 0 && (shortestDistance < 0 || distance < shortestDistance)) {
                        shortestDistance = distance;
                        fromStartPage = startPageName;
                    }
                }
            }

            pageDistances.push({
                destinationPage: page.name,
                distance: shortestDistance
            });

            processedPages++;
            const progressPercentage = 50 + Math.round((processedPages / totalPages) * 20);
            
            panel.webview.postMessage({
                command: 'distanceCalculationProgress',
                data: {
                    step: 'calculating',
                    percentage: progressPercentage,
                    detail: `Calculating distances... (${processedPages}/${totalPages})`,
                    stepDetails: { 
                        calculating: `Processed ${processedPages} of ${totalPages} pages` 
                    }
                }
            });
        }

        // Step 4: Save results (90%)
        panel.webview.postMessage({
            command: 'distanceCalculationProgress',
            data: {
                step: 'saving',
                percentage: 90,
                detail: 'Saving distance calculations...',
                stepDetails: { saving: 'Writing results to user journey file' }
            }
        });

        // Save the page distances to the user journey file
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            throw new Error('No model file path available');
        }

        const modelDir = path.dirname(modelFilePath);
        const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');
        
        console.log("[Extension] Journey file path:", journeyFilePath);
        console.log("[Extension] Calculated page distances:", pageDistances.length, "items");

        // Load existing journey data
        let journeyData: any = { journeyStartPages: {}, pageDistances: [] };
        try {
            if (fs.existsSync(journeyFilePath)) {
                console.log("[Extension] Loading existing journey file");
                const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                journeyData = JSON.parse(journeyContent);
                console.log("[Extension] Existing journey data loaded:", Object.keys(journeyData));
            } else {
                console.log("[Extension] Journey file does not exist, creating new one");
            }
        } catch (error) {
            console.warn("[Extension] Could not load existing journey file:", error);
        }

        // Update page distances
        journeyData.pageDistances = pageDistances;
        console.log("[Extension] Updated journey data with page distances:", journeyData.pageDistances.length, "items");

        // Save to file
        const content = JSON.stringify(journeyData, null, 2);
        console.log("[Extension] Writing file content length:", content.length, "characters");
        fs.writeFileSync(journeyFilePath, content, 'utf8');
        console.log("[Extension] File written successfully to:", journeyFilePath);

        // Complete (100%)
        panel.webview.postMessage({
            command: 'distanceCalculationComplete',
            data: {
                success: true,
                pageDistances: pageDistances,
                message: `Successfully calculated distances for ${pageDistances.length} pages`
            }
        });

        console.log(`[Extension] Page distances calculated and saved: ${pageDistances.length} pages processed`);

    } catch (error) {
        console.error("[Extension] Error calculating page distances:", error);
        panel.webview.postMessage({
            command: 'distanceCalculationComplete',
            data: {
                success: false,
                error: error.message
            }
        });
        throw error;
    }
}

/**
 * Extracts the role name from a user story text.
 * @param text User story text
 * @returns The extracted role name or null if not found
 */
function extractRoleFromUserStory(text: string): string | null {
    if (!text || typeof text !== "string") { return null; }
    
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
 * Find shortest path between two pages using BFS and return the complete path
 */
function findShortestPath(startPageName: string, targetPageName: string, graph: { [key: string]: string[] }): string[] {
    if (startPageName === targetPageName) {
        return [startPageName];
    }

    const queue = [{ page: startPageName, path: [startPageName] }];
    const visited = new Set<string>();
    visited.add(startPageName);

    while (queue.length > 0) {
        const { page, path } = queue.shift()!;

        if (page === targetPageName) {
            return path;
        }

        if (graph[page]) {
            graph[page].forEach(neighborPage => {
                if (!visited.has(neighborPage)) {
                    visited.add(neighborPage);
                    queue.push({
                        page: neighborPage,
                        path: [...path, neighborPage]
                    });
                }
            });
        }
    }

    return []; // No path found
}

/**
 * Find shortest path distance between two pages using BFS
 */
function findShortestPathDistance(startPageName: string, targetPageName: string, graph: { [key: string]: string[] }): number {
    if (startPageName === targetPageName) {
        return 0;
    }

    const queue = [{ page: startPageName, distance: 0 }];
    const visited = new Set<string>();
    visited.add(startPageName);

    while (queue.length > 0) {
        const { page, distance } = queue.shift()!;

        if (page === targetPageName) {
            return distance;
        }

        if (graph[page]) {
            graph[page].forEach(neighborPage => {
                if (!visited.has(neighborPage)) {
                    visited.add(neighborPage);
                    queue.push({
                        page: neighborPage,
                        distance: distance + 1
                    });
                }
            });
        }
    }

    return -1; // No path found
}

/**
 * Load page usage data including all pages with their complexity and usage statistics
 */
async function loadPageUsageData(modelService: ModelService): Promise<any> {
    try {
        const model = modelService.getCurrentModel();
        if (!model) {
            throw new Error('No model available');
        }

        console.log("[Extension] Loading page usage data");

        // Extract all pages from objectWorkflow and report arrays
        const allPages: any[] = [];
        const pageUsageCount: { [key: string]: number } = {};

        // Get all objects from model
        const allObjects = modelService.getAllObjects();
        allObjects.forEach((obj: any) => {
            // Extract workflows with isPage=true (forms)
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === 'true' && workflow.name) {
                        // Calculate complexity based on element counts
                        const elements = {
                            buttons: (workflow.objectWorkflowButton && Array.isArray(workflow.objectWorkflowButton)) ? workflow.objectWorkflowButton.length : 0,
                            inputs: (workflow.objectWorkflowParam && Array.isArray(workflow.objectWorkflowParam)) ? workflow.objectWorkflowParam.length : 0,
                            outputVars: (workflow.objectWorkflowOutputVar && Array.isArray(workflow.objectWorkflowOutputVar)) ? workflow.objectWorkflowOutputVar.length : 0
                        };

                        const totalElements = elements.buttons + elements.inputs + elements.outputVars;
                        let complexity = 'simple';
                        if (totalElements > 20) {
                            complexity = 'very-complex';
                        } else if (totalElements > 10) {
                            complexity = 'complex';
                        } else if (totalElements > 5) {
                            complexity = 'moderate';
                        }

                        allPages.push({
                            name: workflow.name,
                            type: 'form',
                            complexity: complexity,
                            elements: elements,
                            totalElements: totalElements,
                            roleRequired: workflow.roleRequired || '',
                            buttons: extractButtonsFromWorkflow(workflow),
                            usageCount: 0 // Will be calculated later
                        });
                    }
                });
            }

            // Extract reports with isPage=true or undefined (reports)
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if ((report.isPage === 'true' || report.isPage === undefined) && report.name) {
                        // Calculate complexity based on element counts
                        const elements = {
                            buttons: (report.reportButton && Array.isArray(report.reportButton)) ? report.reportButton.length : 0,
                            columns: (report.reportColumn && Array.isArray(report.reportColumn)) ? report.reportColumn.length : 0,
                            params: (report.reportParam && Array.isArray(report.reportParam)) ? report.reportParam.length : 0,
                            filters: 0 // Reports don't have a separate filter array in the schema
                        };

                        const totalElements = elements.buttons + elements.columns + elements.params;
                        let complexity = 'simple';
                        if (totalElements > 20) {
                            complexity = 'very-complex';
                        } else if (totalElements > 10) {
                            complexity = 'complex';
                        } else if (totalElements > 5) {
                            complexity = 'moderate';
                        }

                        allPages.push({
                            name: report.name,
                            type: 'report',
                            complexity: complexity,
                            elements: elements,
                            totalElements: totalElements,
                            roleRequired: report.roleRequired || '',
                            buttons: extractButtonsFromReport(report),
                            usageCount: 0 // Will be calculated later
                        });
                    }
                });
            }
        });

        // Load existing page mapping data to get user story journeys
        let existingPageMappingData: any = { pageMappings: {} };
        const modelFilePath = modelService.getCurrentFilePath();
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            const pageMappingFilePath = path.join(modelDir, 'app-dna-user-story-page-mapping.json');
            try {
                if (fs.existsSync(pageMappingFilePath)) {
                    const mappingContent = fs.readFileSync(pageMappingFilePath, 'utf8');
                    existingPageMappingData = JSON.parse(mappingContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load existing page mapping file:", error);
            }
        }

        // Build page graph for pathfinding (same logic as calculatePageDistances)
        const graph: { [key: string]: string[] } = {};
        const pageMap: { [key: string]: any } = {};

        // Initialize graph with all pages
        allPages.forEach(page => {
            graph[page.name] = [];
            pageMap[page.name] = page;
        });

        // Add button destinations from each page to build the graph
        allPages.forEach(page => {
            if (page.buttons && Array.isArray(page.buttons)) {
                page.buttons.forEach((button: any) => {
                    if (button.destinationTargetName && graph[page.name] && graph[button.destinationTargetName]) {
                        // Avoid duplicate connections
                        if (!graph[page.name].includes(button.destinationTargetName)) {
                            graph[page.name].push(button.destinationTargetName);
                        }
                    }
                });
            }
        });

        // Load user stories to get role information for start page matching
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

        // Load journey start pages to count their usage
        let journeyData: any = { journeyStartPages: {}, pageDistances: [] };
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');
            
            try {
                if (fs.existsSync(journeyFilePath)) {
                    const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                    journeyData = JSON.parse(journeyContent);
                }
            } catch (error) {
                console.warn("[Extension] Could not load journey data file:", error);
            }
        }

        console.log("[Extension] Journey start pages loaded:", journeyData.journeyStartPages);

        // Calculate usage statistics by analyzing journey paths
        console.log("[Extension] Page mapping data loaded:", Object.keys(existingPageMappingData));
        console.log("[Extension] Number of page mappings:", existingPageMappingData.pageMappings ? Object.keys(existingPageMappingData.pageMappings).length : 0);
        
        if (existingPageMappingData.pageMappings) {
            console.log("[Extension] Analyzing journey paths for usage calculation...");
            
            Object.entries(existingPageMappingData.pageMappings).forEach(([storyNumber, mapping]: [string, any]) => {
                if (mapping.pageMapping && Array.isArray(mapping.pageMapping) && mapping.pageMapping.length > 0) {
                    const pages = mapping.pageMapping;
                    console.log("[Extension] Processing user story", storyNumber, "journey:", pages);
                    
                    // Find the corresponding user story to get role information
                    const userStory = userStories.find(story => story.storyNumber === storyNumber);
                    
                    // Count usage for journey start page based on extracted role from story text
                    if (journeyData.journeyStartPages && Object.keys(journeyData.journeyStartPages).length > 0 && userStory) {
                        // Extract role from the user story text
                        const extractedRole = extractRoleFromUserStory(userStory.storyText || '');
                        let startPageUsed = false;
                        
                        if (extractedRole && journeyData.journeyStartPages[extractedRole]) {
                            const startPageName = journeyData.journeyStartPages[extractedRole];
                            if (typeof startPageName === 'string' && startPageName.trim() !== '') {
                                pageUsageCount[startPageName] = (pageUsageCount[startPageName] || 0) + 1;
                                console.log("[Extension] Counting start page usage for extracted role", extractedRole, ":", startPageName);
                                startPageUsed = true;
                            }
                        }
                        
                        // If no role-specific start page found, use the closest start page based on distance
                        if (!startPageUsed && pages.length > 0) {
                            const firstMappedPage = pages[0];
                            let closestStartPage = '';
                            let shortestDistance = -1;
                            
                            // Find the closest start page to the first mapped page
                            Object.entries(journeyData.journeyStartPages).forEach(([roleName, startPageName]: [string, any]) => {
                                if (typeof startPageName === 'string' && startPageName.trim() !== '') {
                                    const distance = findShortestPathDistance(startPageName, firstMappedPage, graph);
                                    if (distance >= 0 && (shortestDistance < 0 || distance < shortestDistance)) {
                                        shortestDistance = distance;
                                        closestStartPage = startPageName;
                                    }
                                }
                            });
                            
                            if (closestStartPage) {
                                pageUsageCount[closestStartPage] = (pageUsageCount[closestStartPage] || 0) + 1;
                                console.log("[Extension] Counting closest start page usage:", closestStartPage, "for story", storyNumber);
                            }
                        }
                    }
                    
                    if (pages.length === 1) {
                        // Single page journey
                        const pageName = pages[0];
                        pageUsageCount[pageName] = (pageUsageCount[pageName] || 0) + 1;
                        console.log("[Extension] Single page journey:", pageName);
                    } else if (pages.length > 1) {
                        // Multi-page journey: find path from start to end
                        const startPage = pages[0];
                        const endPage = pages[pages.length - 1];
                        
                        console.log("[Extension] Finding path from", startPage, "to", endPage);
                        const journeyPath = findShortestPath(startPage, endPage, graph);
                        
                        if (journeyPath.length > 0) {
                            console.log("[Extension] Journey path found:", journeyPath);
                            // Count usage for all pages on the journey path
                            journeyPath.forEach(pageName => {
                                pageUsageCount[pageName] = (pageUsageCount[pageName] || 0) + 1;
                            });
                        } else {
                            console.log("[Extension] No path found between", startPage, "and", endPage, "- counting direct pages");
                            // If no path found, fall back to counting the mapped pages directly
                            pages.forEach((pageName: string) => {
                                pageUsageCount[pageName] = (pageUsageCount[pageName] || 0) + 1;
                            });
                        }
                    }
                }
            });
        }

        console.log("[Extension] Final usage count data:", pageUsageCount);
        console.log("[Extension] Total pages with usage > 0:", Object.values(pageUsageCount).filter(count => count > 0).length);

        // Apply usage counts to pages and mark start pages
        const journeyStartData = await loadJourneyStartData(modelService);
        const journeyStartPages = journeyStartData.journeyStartPages || {};
        const startPageNames = new Set(Object.values(journeyStartPages).filter(name => typeof name === 'string'));
        
        allPages.forEach(page => {
            page.usageCount = pageUsageCount[page.name] || 0;
            page.isStartPage = startPageNames.has(page.name);
        });

        // Calculate complexity breakdown
        const complexityBreakdown = {
            'simple': 0,
            'moderate': 0,
            'complex': 0,
            'very-complex': 0
        };

        allPages.forEach(page => {
            if (complexityBreakdown.hasOwnProperty(page.complexity)) {
                complexityBreakdown[page.complexity]++;
            }
        });

        // Sort pages by name for consistent display
        allPages.sort((a, b) => a.name.localeCompare(b.name));

        console.log(`[Extension] Found ${allPages.length} pages with usage data`);

        return {
            pages: allPages,
            totalPages: allPages.length,
            complexityBreakdown: complexityBreakdown,
            usageStats: pageUsageCount
        };

    } catch (error) {
        console.error("[Extension] Error loading page usage data:", error);
        throw error;
    }
}

/**
 * Register user stories journey commands
 */
export function registerUserStoriesJourneyCommands(context: vscode.ExtensionContext, modelService: ModelService): void {
    console.log("Registering user stories journey commands");

    // Register the main user stories journey command
    const userStoriesJourneyCommand = vscode.commands.registerCommand(
        'appdna.userStoriesJourney',
        async () => {
            console.log("User Stories Journey command triggered");

            try {
                // Check if panel already exists
                if (activePanels.has('userStoriesJourney')) {
                    const existingPanel = activePanels.get('userStoriesJourney');
                    if (existingPanel) {
                        existingPanel.reveal();
                        return;
                    }
                }

                // Create webview panel
                const panel = vscode.window.createWebviewPanel(
                    'userStoriesJourney',
                    'User Stories Journey',
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true,
                    }
                );

                // Store panel reference
                activePanels.set('userStoriesJourney', panel);
                userStoriesJourneyPanel.panel = panel;
                userStoriesJourneyPanel.context = context;
                userStoriesJourneyPanel.modelService = modelService;

                // Clean up when panel is disposed
                panel.onDidDispose(() => {
                    activePanels.delete('userStoriesJourney');
                    userStoriesJourneyPanel.panel = null;
                });

                // Get the webview script URI
                const scriptUri = panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoriesJourneyView.js')
                );

                // Get the codicons CSS URI
                const codiconsUri = panel.webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
                );

                // Set the webview HTML content
                panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>User Stories Journey</title>
                    <link href="${codiconsUri}" rel="stylesheet">
                    <style>
                        body { 
                            font-family: var(--vscode-font-family); 
                            margin: 0; 
                            padding: 20px; 
                            background: var(--vscode-editor-background); 
                            color: var(--vscode-editor-foreground); 
                        }
                        .validation-header {
                            margin-bottom: 20px;
                        }
                        .validation-header h2 {
                            margin: 0 0 10px 0;
                            color: var(--vscode-foreground);
                            font-size: 24px;
                        }
                        .validation-header p {
                            margin: 0;
                            color: var(--vscode-descriptionForeground);
                            font-size: 14px;
                        }
                        table { border-collapse: collapse; width: 100%; margin-top: 1em; }
                        th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 8px 12px; text-align: left; }
                        th { background: var(--vscode-sideBar-background); cursor: pointer; font-weight: bold; }
                        tr:nth-child(even) { background: var(--vscode-sideBarSectionHeader-background); }
                        tr:hover { background-color: var(--vscode-list-hoverBackground); }
                        tbody tr { cursor: pointer; }
                        #paging { margin: 1em 0; padding: 10px 0; text-align: center; }
                        button { 
                            margin: 0 4px; 
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: none;
                            padding: 4px 8px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                        }
                        button:hover:not(:disabled):not(.filter-button-secondary):not(.page-lookup-close):not(.page-lookup-cancel-button):not(.page-lookup-select-button):not(.journey-start-close):not(.journey-start-cancel-button) {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        
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
                        
                        .filter-section {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                            margin-bottom: 15px;
                            background-color: var(--vscode-sideBar-background);
                        }
                        
                        .filter-header {
                            padding: 8px 12px;
                            cursor: pointer;
                            user-select: none;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            background-color: var(--vscode-list-hoverBackground);
                            border-radius: 3px 3px 0 0;
                        }
                        .filter-header:hover {
                            background-color: var(--vscode-list-activeSelectionBackground);
                        }
                        
                        .filter-content {
                            padding: 15px;
                            border-top: 1px solid var(--vscode-panel-border);
                        }
                        .filter-content.collapsed {
                            display: none;
                        }
                        .filter-row {
                            display: flex;
                            gap: 15px;
                            margin-bottom: 10px;
                            flex-wrap: wrap;
                        }
                        .filter-group {
                            display: flex;
                            flex-direction: column;
                            min-width: 150px;
                            flex: 1;
                        }
                        .filter-group label {
                            font-weight: 600;
                            margin-bottom: 4px;
                            font-size: 12px;
                            color: var(--vscode-foreground);
                        }
                        .filter-group input, .filter-group select {
                            padding: 4px 8px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                            font-size: 13px;
                        }
                        .filter-group input:focus, .filter-group select:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        .filter-actions {
                            display: flex;
                            gap: 10px;
                            margin-top: 15px;
                            padding-top: 10px;
                            border-top: 1px solid var(--vscode-panel-border);
                        }
                        .filter-button-secondary {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: none;
                            padding: 6px 12px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        .filter-button-secondary:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-toolbar-hoverBackground)) !important;
                        }
                        .table-container {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                            overflow: hidden;
                            background-color: var(--vscode-editor-background);
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            background-color: var(--vscode-editor-background);
                        }
                        
                        th, td {
                            text-align: left;
                            padding: 8px 12px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                        }
                        
                        th {
                            background-color: var(--vscode-sideBar-background);
                            font-weight: 600;
                            position: sticky;
                            top: 0;
                            z-index: 1;
                        }
                        
                        th.sortable {
                            cursor: pointer;
                        }
                        
                        th.sortable:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        tr:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .checkbox-column {
                            width: 40px;
                            text-align: center;
                            padding: 4px 8px;
                        }
                        .row-checkbox, .select-all-checkbox {
                            cursor: pointer;
                            margin: 0;
                        }
                        .checkbox-header {
                            text-align: center;
                            padding: 4px 8px;
                        }
                        
                        .story-number-column {
                            width: 120px;
                        }
                        
                        .story-text-column {
                            max-width: 300px;
                            word-wrap: break-word;
                        }
                        
                        .page-column {
                            width: 200px;
                        }
                        
                        .journey-page-distance-column {
                            width: 120px;
                            text-align: center;
                        }
                        
                        .distance-container {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 4px;
                        }
                        
                        .distance-value {
                            font-size: 12px;
                        }
                        
                        .journey-icon-button {
                            background: transparent;
                            border: none;
                            color: var(--vscode-foreground);
                            cursor: pointer;
                            padding: 2px;
                            border-radius: 2px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 12px;
                            width: 16px;
                            height: 16px;
                        }
                        
                        .journey-icon-button:hover {
                            background-color: var(--vscode-toolbar-hoverBackground);
                        }
                        
                        .journey-icon-button .codicon {
                            font-size: 12px;
                        }
                        
                        .header-actions {
                            display: flex;
                            gap: 8px;
                            justify-content: flex-end;
                            margin-bottom: 10px;
                        }
                        
                        .refresh-button {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 4px 8px;
                            cursor: pointer;
                            border-radius: 2px;
                            font-size: 13px;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        }
                        
                        .refresh-button:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground);
                        }
                        
                        .table-footer {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-top: 10px;
                        }
                        .table-footer-left {
                            display: flex;
                            align-items: center;
                        }
                        .table-footer-right {
                            display: flex;
                            align-items: center;
                        }
                        
                        .spinner-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            display: flex;
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
                        
                        /* Journey Start Modal Styles */
                        .journey-start-modal {
                            position: fixed;
                            z-index: 1000;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            display: none;
                        }
                        
                        .journey-start-modal-content {
                            background-color: var(--vscode-editor-background);
                            margin: 5% auto;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 6px;
                            width: 80%;
                            max-width: 800px;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                        }
                        
                        .journey-start-header {
                            padding: 16px 20px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            background-color: var(--vscode-sideBar-background);
                            border-radius: 6px 6px 0 0;
                        }
                        
                        .journey-start-header h3 {
                            margin: 0;
                            color: var(--vscode-editor-foreground);
                            font-size: 16px;
                            font-weight: 600;
                        }
                        
                        .journey-start-close {
                            background: none;
                            border: none;
                            color: var(--vscode-editor-foreground);
                            cursor: pointer;
                            padding: 4px;
                            border-radius: 3px;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .journey-start-close:hover {
                            background-color: var(--vscode-toolbar-hoverBackground) !important;
                        }
                        
                        .journey-start-body {
                            padding: 20px;
                            max-height: 400px;
                            overflow-y: auto;
                        }
                        
                        .journey-start-table-container {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                            overflow: hidden;
                        }
                        
                        #journeyStartTable {
                            width: 100%;
                            border-collapse: collapse;
                            background-color: var(--vscode-editor-background);
                        }
                        
                        #journeyStartTable th {
                            background-color: var(--vscode-sideBar-background);
                            color: var(--vscode-editor-foreground);
                            font-weight: 600;
                            padding: 10px 12px;
                            text-align: left;
                            border-bottom: 1px solid var(--vscode-panel-border);
                        }
                        
                        #journeyStartTable td {
                            padding: 8px 12px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            vertical-align: middle;
                        }
                        
                        #journeyStartTable tr:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .journey-start-page-input {
                            width: calc(100% - 35px);
                            margin-right: 5px;
                            padding: 4px 8px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                        }
                        
                        .journey-start-page-input:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        
                        .journey-start-lookup-btn {
                            background: none;
                            border: 1px solid var(--vscode-button-border);
                            color: var(--vscode-editor-foreground);
                            cursor: pointer;
                            padding: 4px 6px;
                            border-radius: 2px;
                            font-size: 12px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .journey-start-lookup-btn:hover {
                            background-color: var(--vscode-toolbar-hoverBackground);
                        }
                        
                        .journey-start-footer {
                            padding: 16px 20px;
                            border-top: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                            background-color: var(--vscode-sideBar-background);
                            border-radius: 0 0 6px 6px;
                        }
                        
                        .journey-start-save-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 6px 14px;
                            cursor: pointer;
                            border-radius: 2px;
                            font-weight: 600;
                        }
                        
                        .journey-start-save-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        
                        .journey-start-cancel-button {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 6px 14px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        
                        .journey-start-cancel-button:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-toolbar-hoverBackground)) !important;
                        }
                        
                        /* Page Lookup Modal Styles */
                        .page-lookup-modal {
                            position: fixed;
                            z-index: 1001;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            display: none;
                        }
                        
                        .page-lookup-modal-content {
                            background-color: var(--vscode-editor-background);
                            margin: 5% auto;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 6px;
                            width: 70%;
                            max-width: 600px;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                        }
                        
                        .page-lookup-header {
                            padding: 16px 20px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            background-color: var(--vscode-sideBar-background);
                            border-radius: 6px 6px 0 0;
                        }
                        
                        .page-lookup-header h3 {
                            margin: 0;
                            color: var(--vscode-editor-foreground);
                            font-size: 16px;
                            font-weight: 600;
                        }
                        
                        .page-lookup-close {
                            background: none;
                            border: none;
                            color: var(--vscode-editor-foreground);
                            cursor: pointer;
                            padding: 4px;
                            border-radius: 3px;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .page-lookup-close:hover {
                            background-color: var(--vscode-toolbar-hoverBackground) !important;
                        }
                        
                        .page-lookup-body {
                            padding: 20px;
                        }
                        
                        .page-filter-container {
                            margin-bottom: 15px;
                        }
                        
                        .page-filter-input {
                            width: 100%;
                            padding: 8px 12px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                            font-size: 13px;
                        }
                        
                        .page-filter-input:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        
                        .page-list-container {
                            max-height: 300px;
                            overflow-y: auto;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 3px;
                        }
                        
                        .page-list-item {
                            padding: 8px 12px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            cursor: pointer;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        
                        .page-list-item:last-child {
                            border-bottom: none;
                        }
                        
                        .page-list-item:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .page-list-item:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .page-list-item.selected {
                            background-color: var(--vscode-list-activeSelectionBackground);
                            color: var(--vscode-list-activeSelectionForeground);
                        }
                        
                        .page-list-item-main {
                            flex: 1;
                        }
                        
                        .page-list-item-name {
                            font-weight: 600;
                            margin-bottom: 2px;
                        }
                        
                        .page-list-item-details {
                            font-size: 12px;
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .page-lookup-footer {
                            padding: 16px 20px;
                            border-top: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                            background-color: var(--vscode-sideBar-background);
                            border-radius: 0 0 6px 6px;
                        }
                        
                        .page-lookup-select-button {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 6px 14px;
                            cursor: pointer;
                            border-radius: 2px;
                            font-weight: 600;
                        }
                        
                        .page-lookup-select-button:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        
                        .page-lookup-select-button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                        }
                        
                        .page-lookup-cancel-button {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: 1px solid var(--vscode-button-border);
                            padding: 6px 14px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        
                        .page-lookup-cancel-button:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-toolbar-hoverBackground)) !important;
                        }
                        
                        /* Progress Modal Styles */
                        .progress-modal {
                            display: none;
                            position: fixed;
                            z-index: 1001;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                        }
                        
                        .progress-modal-content {
                            background-color: var(--vscode-panel-background);
                            margin: 15% auto;
                            padding: 20px;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 6px;
                            width: 400px;
                            max-width: 90%;
                            color: var(--vscode-editor-foreground);
                            position: relative;
                        }
                        
                        .progress-header {
                            font-size: 16px;
                            font-weight: 600;
                            margin-bottom: 20px;
                            color: var(--vscode-editor-foreground);
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        
                        .progress-content {
                            margin-bottom: 20px;
                        }
                        
                        .progress-step {
                            margin-bottom: 10px;
                            padding: 8px 0;
                            border-bottom: 1px solid var(--vscode-panel-border);
                        }
                        
                        .progress-step:last-child {
                            border-bottom: none;
                        }
                        
                        .progress-step-title {
                            font-weight: 500;
                            margin-bottom: 4px;
                        }
                        
                        .progress-step-detail {
                            font-size: 12px;
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .progress-bar-container {
                            width: 100%;
                            height: 8px;
                            background-color: var(--vscode-progressBar-background);
                            border-radius: 4px;
                            margin: 10px 0;
                            overflow: hidden;
                        }
                        
                        .progress-bar {
                            height: 100%;
                            background-color: var(--vscode-progressBar-background);
                            border-radius: 4px;
                            transition: width 0.3s ease;
                            background: linear-gradient(90deg, var(--vscode-progressBar-background) 0%, var(--vscode-button-background) 100%);
                        }
                        
                        .progress-percentage {
                            text-align: center;
                            font-size: 12px;
                            color: var(--vscode-descriptionForeground);
                            margin-top: 5px;
                        }
                        
                        .progress-spinner {
                            display: inline-block;
                            width: 16px;
                            height: 16px;
                            border: 2px solid var(--vscode-progressBar-background);
                            border-radius: 50%;
                            border-top-color: var(--vscode-button-background);
                            animation: spin 1s ease-in-out infinite;
                        }
                        
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                        
                        .progress-footer {
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                        }
                        
                        .progress-close-button {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                            border: none;
                            padding: 8px 16px;
                            cursor: pointer;
                            border-radius: 2px;
                        }
                        
                        .progress-close-button:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-toolbar-hoverBackground));
                        }
                        
                        .progress-close-button:disabled {
                            opacity: 0.4;
                            cursor: not-allowed;
                        }
                        
                        /* Tab styling following metrics analysis pattern */
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
                        
                        .tab.active {
                            background-color: var(--vscode-tab-activeBackground);
                            color: var(--vscode-tab-activeForeground);
                            border-bottom: 2px solid var(--vscode-focusBorder);
                        }
                        
                        .tab-content {
                            display: none;
                            padding: 15px;
                            background-color: var(--vscode-editor-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-top: none;
                            border-radius: 0 0 3px 3px;
                        }
                        
                        .tab-content.active {
                            display: block;
                        }
                        
                        /* Analytics placeholder styling */
                        .analytics-placeholder {
                            text-align: center;
                            padding: 40px 20px;
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .empty-state {
                            max-width: 500px;
                            margin: 0 auto;
                        }
                        
                        .empty-state h3 {
                            margin: 0 0 15px 0;
                            color: var(--vscode-foreground);
                            font-size: 18px;
                        }
                        
                        .empty-state ul {
                            color: var(--vscode-descriptionForeground);
                            font-size: 14px;
                        }
                        
                        .empty-state li {
                            margin: 8px 0;
                        }

                        /* Treemap styles */
                        .treemap-container {
                            padding: 15px;
                        }
                        
                        .treemap-header {
                            margin-bottom: 20px;
                        }
                        
                        .treemap-header-content {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            gap: 15px;
                        }
                        
                        .treemap-title {
                            flex: 1;
                        }
                        
                        .treemap-actions {
                            display: flex;
                            gap: 10px;
                            align-items: flex-start;
                        }
                        
                        .svg-export-btn {
                            background: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: 1px solid var(--vscode-button-border);
                            border-radius: 2px;
                            padding: 6px 12px;
                            font-size: 13px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            white-space: nowrap;
                        }
                        
                        .svg-export-btn:hover {
                            background: var(--vscode-button-hoverBackground);
                        }
                        
                        .svg-export-btn:active {
                            background: var(--vscode-button-activeBackground);
                        }
                        
                        .svg-export-btn .codicon {
                            font-size: 14px;
                        }
                        
                        .treemap-header h3 {
                            margin: 0 0 5px 0;
                            color: var(--vscode-foreground);
                            font-size: 16px;
                        }
                        
                        .treemap-header p {
                            margin: 0;
                            color: var(--vscode-descriptionForeground);
                            font-size: 12px;
                        }
                        
                        .treemap-viz {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            margin-bottom: 15px;
                            overflow: hidden;
                        }
                        
                        .treemap-legend {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 15px;
                            font-size: 12px;
                            color: var(--vscode-foreground);
                        }
                        
                        .legend-item {
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        }
                        
                        .legend-color {
                            width: 16px;
                            height: 16px;
                            border-radius: 2px;
                            border: 1px solid var(--vscode-panel-border);
                        }
                        
                        /* Treemap rectangle styles */
                        .treemap-rect {
                            stroke: var(--vscode-panel-border);
                            stroke-width: 1px;
                            cursor: pointer;
                            transition: opacity 0.2s;
                        }
                        
                        .treemap-rect:hover {
                            opacity: 0.8;
                            stroke-width: 2px;
                        }
                        
                        .treemap-text {
                            font-family: var(--vscode-font-family);
                            font-size: 11px;
                            fill: white;
                            text-anchor: middle;
                            dominant-baseline: middle;
                            pointer-events: none;
                            text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
                        }
                        
                        .treemap-tooltip {
                            position: absolute;
                            background: var(--vscode-editorHoverWidget-background);
                            border: 1px solid var(--vscode-editorHoverWidget-border);
                            border-radius: 4px;
                            padding: 8px;
                            font-size: 12px;
                            color: var(--vscode-editorHoverWidget-foreground);
                            pointer-events: none;
                            z-index: 1000;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        }

                        /* Histogram styles */
                        .histogram-container {
                            padding: 15px;
                        }
                        
                        .histogram-header {
                            margin-bottom: 20px;
                        }
                        
                        .histogram-header-content {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            gap: 15px;
                        }
                        
                        .histogram-title {
                            flex: 1;
                        }
                        
                        .histogram-actions {
                            display: flex;
                            gap: 10px;
                            align-items: flex-start;
                        }
                        
                        .histogram-header h3 {
                            margin: 0 0 5px 0;
                            color: var(--vscode-foreground);
                            font-size: 16px;
                        }
                        
                        .histogram-header p {
                            margin: 0;
                            color: var(--vscode-descriptionForeground);
                            font-size: 12px;
                        }
                        
                        .histogram-viz {
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            margin-bottom: 15px;
                            overflow: hidden;
                        }
                        
                        .histogram-legend {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 15px;
                            font-size: 12px;
                            color: var(--vscode-foreground);
                        }
                        
                        /* Histogram bar styles */
                        .histogram-bar {
                            cursor: pointer;
                            transition: opacity 0.2s;
                        }
                        
                        .histogram-bar:hover {
                            opacity: 0.8;
                        }
                        
                        .histogram-refresh-button:hover {
                            background: transparent !important;
                            color: inherit !important;
                        }
                        
                        .treemap-refresh-button:hover {
                            background: transparent !important;
                            color: inherit !important;
                        }
                        
                        .histogram-tooltip {
                            position: absolute;
                            background: var(--vscode-editorHoverWidget-background);
                            border: 1px solid var(--vscode-editorHoverWidget-border);
                            border-radius: 4px;
                            padding: 8px;
                            font-size: 12px;
                            color: var(--vscode-editorHoverWidget-foreground);
                            pointer-events: none;
                            z-index: 1000;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        }

                        /* Journey-specific legend colors - matching data object size analysis pattern */
                        .legend-color.journey-simple {
                            background-color: #6c757d;  /* Simple -> Gray (like Tiny Size) */
                        }
                        
                        .legend-color.journey-medium {
                            background-color: #28a745;  /* Medium -> Green (like Small Size) */
                        }
                        
                        .legend-color.journey-complex {
                            background-color: #f66a0a;  /* Complex -> Orange (like Medium Size) */
                        }
                        
                        .legend-color.journey-very-complex {
                            background-color: #d73a49;  /* Very Complex -> Red (like Large Size) */
                        }

                        /* Page Usage visualization legend colors */
                        .legend-color.page-simple {
                            background-color: #6c757d;  /* Simple -> Gray */
                        }
                        
                        .legend-color.page-moderate {
                            background-color: #28a745;  /* Moderate -> Green */
                        }
                        
                        .legend-color.page-complex {
                            background-color: #f66a0a;  /* Complex -> Orange */
                        }
                        
                        .legend-color.page-very-complex {
                            background-color: #d73a49;  /* Very Complex -> Red */
                        }

                        /* Page Usage frequency legend colors */
                        .legend-color.usage-low {
                            background-color: #6c757d;  /* Low Usage -> Gray */
                        }
                        
                        .legend-color.usage-medium {
                            background-color: #28a745;  /* Medium Usage -> Green */
                        }
                        
                        .legend-color.usage-high {
                            background-color: #f66a0a;  /* High Usage -> Orange */
                        }
                        
                        .legend-color.usage-very-high {
                            background-color: #d73a49;  /* Very High Usage -> Red */
                        }

                        /* Scatter plot container styles */
                        .scatter-container {
                            margin-bottom: 20px;
                            background: var(--vscode-editor-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            padding: 15px;
                        }

                        .scatter-header {
                            margin-bottom: 15px;
                        }

                        .scatter-header-content {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                        }

                        .scatter-title h3 {
                            margin: 0 0 5px 0;
                            color: var(--vscode-editor-foreground);
                            font-size: 16px;
                        }

                        .scatter-title p {
                            margin: 0;
                            color: var(--vscode-descriptionForeground);
                            font-size: 12px;
                        }

                        .scatter-actions {
                            display: flex;
                            gap: 8px;
                            align-items: center;
                        }

                        .scatter-viz {
                            background: var(--vscode-editor-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            min-height: 400px;
                            margin-bottom: 15px;
                        }

                        .scatter-quadrants {
                            margin-top: 15px;
                        }

                        .quadrant-legend {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 12px;
                            background: var(--vscode-editor-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            padding: 15px;
                        }

                        .quadrant-item {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }

                        .quadrant-color {
                            width: 16px;
                            height: 16px;
                            border-radius: 50%;
                            flex-shrink: 0;
                        }

                        .quadrant-color.high-usage-low-complexity {
                            background-color: #28a745; /* Green - Well-designed */
                        }

                        .quadrant-color.high-usage-high-complexity {
                            background-color: #dc3545; /* Red - Needs attention */
                        }

                        .quadrant-color.low-usage-low-complexity {
                            background-color: #6f42c1; /* Purple - Simple utility */
                        }

                        .quadrant-color.low-usage-high-complexity {
                            background-color: #fd7e14; /* Orange - Over-engineered */
                        }
                        
                        .journey-treemap-tooltip {
                            position: absolute;
                            background: var(--vscode-editorHoverWidget-background);
                            border: 1px solid var(--vscode-editorHoverWidget-border);
                            border-radius: 4px;
                            padding: 8px;
                            font-size: 12px;
                            color: var(--vscode-editorHoverWidget-foreground);
                            pointer-events: none;
                            z-index: 1000;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            max-width: 300px;
                            word-wrap: break-word;
                        }
                        
                        /* Page Usage Tab Specific Styles */
                        .page-usage-content {
                            display: none;
                        }
                        
                        .page-usage-content.active {
                            display: block;
                        }
                        
                        .page-type-column {
                            width: 100px;
                            text-align: center;
                        }
                        
                        .page-type-badge {
                            display: inline-block;
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            white-space: nowrap;
                        }
                        
                        .page-type-badge.form {
                            background-color: var(--vscode-charts-blue);
                            color: var(--vscode-editor-background);
                        }
                        
                        .page-type-badge.report {
                            background-color: var(--vscode-charts-green);
                            color: var(--vscode-editor-background);
                        }
                        
                        .page-complexity-column {
                            width: 120px;
                            text-align: center;
                        }
                        
                        .page-total-elements-column {
                            width: 80px;
                            text-align: center;
                        }
                        
                        .page-complexity-indicator {
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                            padding: 2px 8px;
                            border-radius: 4px;
                            font-size: 11px;
                            font-weight: 600;
                        }
                        
                        .page-complexity-indicator.simple {
                            background-color: rgba(40, 167, 69, 0.15);
                            color: var(--vscode-charts-green);
                            border: 1px solid rgba(40, 167, 69, 0.3);
                        }
                        
                        .page-complexity-indicator.moderate {
                            background-color: rgba(255, 193, 7, 0.15);
                            color: var(--vscode-charts-yellow);
                            border: 1px solid rgba(255, 193, 7, 0.3);
                        }
                        
                        .page-complexity-indicator.complex {
                            background-color: rgba(255, 152, 0, 0.15);
                            color: var(--vscode-charts-orange);
                            border: 1px solid rgba(255, 152, 0, 0.3);
                        }
                        
                        .page-complexity-indicator.very-complex {
                            background-color: rgba(220, 53, 69, 0.15);
                            color: var(--vscode-charts-red);
                            border: 1px solid rgba(220, 53, 69, 0.3);
                        }
                        
                        .page-complexity-dot {
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            flex-shrink: 0;
                        }
                        
                        .page-complexity-dot.simple {
                            background-color: var(--vscode-charts-green);
                        }
                        
                        .page-complexity-dot.moderate {
                            background-color: var(--vscode-charts-yellow);
                        }
                        
                        .page-complexity-dot.complex {
                            background-color: var(--vscode-charts-orange);
                        }
                        
                        .page-complexity-dot.very-complex {
                            background-color: var(--vscode-charts-red);
                        }
                        
                        .page-elements-column {
                            width: 300px;
                        }
                        
                        .page-elements-summary {
                            display: flex;
                            gap: 8px;
                            flex-wrap: wrap;
                        }
                        
                        .element-count {
                            display: inline-flex;
                            align-items: center;
                            gap: 3px;
                            padding: 1px 5px;
                            background-color: var(--vscode-badge-background);
                            color: var(--vscode-badge-foreground);
                            border-radius: 3px;
                            font-size: 10px;
                            font-weight: 500;
                        }
                        
                        .element-count .codicon {
                            font-size: 10px;
                        }
                        
                        .element-count.buttons {
                            border-left: 3px solid var(--vscode-charts-blue);
                        }
                        
                        .element-count.columns {
                            border-left: 3px solid var(--vscode-charts-green);
                        }
                        
                        .element-count.inputs {
                            border-left: 3px solid var(--vscode-charts-yellow);
                        }
                        
                        .element-count.filters {
                            border-left: 3px solid var(--vscode-charts-orange);
                        }
                        
                        .page-usage-column {
                            width: 120px;
                            text-align: center;
                        }
                        
                        .page-actions-column {
                            width: 80px;
                            text-align: center;
                        }
                        
                        .action-edit-button {
                            background: none;
                            border: none;
                            color: var(--vscode-editor-foreground);
                            cursor: pointer;
                            padding: 4px 6px;
                            border-radius: 4px;
                            transition: background 0.15s;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .action-edit-button:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .action-edit-button .codicon {
                            font-size: 16px;
                        }
                        
                        .usage-count-indicator {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            min-width: 24px;
                            height: 20px;
                            padding: 0 6px;
                            border-radius: 10px;
                            font-size: 11px;
                            font-weight: 600;
                        }
                        
                        .usage-count-indicator.high {
                            background-color: var(--vscode-charts-red);
                            color: var(--vscode-editor-background);
                        }
                        
                        .usage-count-indicator.medium {
                            background-color: var(--vscode-charts-orange);
                            color: var(--vscode-editor-background);
                        }
                        
                        .usage-count-indicator.low {
                            background-color: var(--vscode-charts-blue);
                            color: var(--vscode-editor-background);
                        }
                        
                        .usage-count-indicator.none {
                            background-color: var(--vscode-input-border);
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .page-name-column {
                            width: 250px;
                            font-weight: 500;
                        }
                        
                        .page-name-cell {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        
                        .page-icon {
                            font-size: 14px;
                            color: var(--vscode-symbolIcon-colorForeground);
                            flex-shrink: 0;
                        }
                        
                        .page-name-text {
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        
                        .page-usage-filter-section .filter-group select option[value="simple"] {
                            color: var(--vscode-charts-green);
                        }
                        
                        .page-usage-filter-section .filter-group select option[value="moderate"] {
                            color: var(--vscode-charts-yellow);
                        }
                        
                        .page-usage-filter-section .filter-group select option[value="complex"] {
                            color: var(--vscode-charts-orange);
                        }
                        
                        .page-usage-filter-section .filter-group select option[value="very-complex"] {
                            color: var(--vscode-charts-red);
                        }
                        
                        /* Page Usage Graph Filter Styles */
                        .page-usage-graph-filter {
                            background: var(--vscode-sideBar-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                            padding: 8px 12px;
                            margin-bottom: 10px;
                        }
                        
                        .page-usage-graph-filter .filter-group {
                            margin: 0;
                        }
                        
                        .page-usage-graph-filter .filter-group label {
                            font-size: 12px;
                            font-weight: normal;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            color: var(--vscode-foreground);
                        }
                        
                        .page-usage-graph-filter .filter-group input[type="checkbox"] {
                            margin: 0;
                            transform: scale(0.9);
                        }
                        
                        .page-usage-summary {
                            display: flex;
                            gap: 20px;
                            margin-bottom: 15px;
                            padding: 12px;
                            background-color: var(--vscode-sideBar-background);
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 4px;
                        }
                        
                        .summary-stat {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            min-width: 80px;
                        }
                        
                        .summary-stat-value {
                            font-size: 18px;
                            font-weight: 600;
                            color: var(--vscode-editor-foreground);
                        }
                        
                        .summary-stat-label {
                            font-size: 11px;
                            color: var(--vscode-descriptionForeground);
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="validation-header">
                        <h2>User Stories - User Journey</h2>
                        <p>User story journey analysis with multiple views and perspectives</p>
                    </div>

                    <div class="tabs">
                        <button class="tab active" data-tab="user-stories">User Stories</button>
                        <button class="tab" data-tab="page-usage">Page Usage</button>
                        <button class="tab" data-tab="page-usage-treemap">Page Usage Treemap</button>
                        <button class="tab" data-tab="page-usage-distribution">Page Usage Distribution</button>
                        <button class="tab" data-tab="page-usage-vs-complexity">Page Usage vs Complexity</button>
                        <button class="tab" data-tab="journey-visualization">Journey Visualization</button>
                        <button class="tab" data-tab="journey-distribution">Journey Distribution</button>
                    </div>

                    <div id="user-stories-tab" class="tab-content active">
                        <div class="filter-section">
                        <div class="filter-header" onclick="toggleFilterSection()">
                            <span class="codicon codicon-chevron-down" id="filterChevron"></span>
                            <span>Filters</span>
                        </div>
                        <div class="filter-content" id="filterContent">
                            <div class="filter-row">
                                <div class="filter-group">
                                    <label>Story Number:</label>
                                    <input type="text" id="filterStoryNumber" placeholder="Filter by story number...">
                                </div>
                                <div class="filter-group">
                                    <label>Story Text:</label>
                                    <input type="text" id="filterStoryText" placeholder="Filter by story text...">
                                </div>
                                <div class="filter-group">
                                    <label>Page:</label>
                                    <input type="text" id="filterPage" placeholder="Filter by page...">
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                            </div>
                        </div>
                    </div>

                    <div class="header-actions">
                        <button id="defineJourneyStartButton" class="icon-button" title="Define Journey Start Pages">
                            <i class="codicon codicon-location"></i>
                        </button>
                        <button id="calculateDistanceButton" class="icon-button" title="Calculate Page Distances">
                            <i class="codicon codicon-pulse"></i>
                        </button>
                        <button id="exportButton" class="icon-button" title="Download CSV">
                            <i class="codicon codicon-cloud-download"></i>
                        </button>
                        <button id="refreshButton" class="icon-button" title="Refresh Table">
                            <i class="codicon codicon-refresh"></i>
                        </button>
                    </div>

                    <div class="table-container">
                        <table id="journeyTable">
                            <thead id="journeyTableHead">
                                <!-- Table headers will be dynamically generated -->
                            </thead>
                            <tbody id="journeyTableBody">
                                <!-- Table rows will be dynamically generated -->
                            </tbody>
                        </table>
                    </div>

                    <div class="table-footer">
                        <div class="table-footer-left">
                            <!-- Left side content if needed -->
                        </div>
                        <div class="table-footer-right">
                            <span id="record-info"></span>
                        </div>
                    </div>
                </div>

                <!-- Page Usage Treemap Tab Content -->
                <div id="page-usage-treemap-tab" class="tab-content">
                    <div class="treemap-container">
                        <div class="treemap-header">
                            <div class="treemap-header-content">
                                <div class="treemap-title">
                                    <h3>Page Usage Proportional Visualization</h3>
                                    <p>Rectangle size represents usage frequency, color represents usage category. Hover for page details.</p>
                                </div>
                                <div class="treemap-actions">
                                    <button id="refreshPageUsageTreemapButton" class="icon-button treemap-refresh-button" title="Refresh Data">
                                        <i class="codicon codicon-refresh"></i>
                                    </button>
                                    <button id="generatePageUsageTreemapPngBtn" class="svg-export-btn">
                                        <span class="codicon codicon-device-camera"></span>
                                        Generate PNG
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="page-usage-graph-filter">
                            <div class="filter-group">
                                <label>
                                    <input type="checkbox" id="hideStartPagesTreemap">
                                    Hide Start Pages
                                </label>
                            </div>
                        </div>
                        <div id="page-usage-treemap-loading" class="loading">Loading page usage visualization...</div>
                        <div id="page-usage-treemap-visualization" class="treemap-viz hidden"></div>
                        <div class="treemap-legend">
                            <div class="legend-item">
                                <span class="legend-color usage-low"></span>
                                <span>Low Usage (1-2 journeys)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color usage-medium"></span>
                                <span>Medium Usage (3-5 journeys)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color usage-high"></span>
                                <span>High Usage (6-10 journeys)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color usage-very-high"></span>
                                <span>Very High Usage (10+ journeys)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Page Usage Distribution Tab Content -->
                <div id="page-usage-distribution-tab" class="tab-content">
                    <div class="histogram-container">
                        <div class="histogram-header">
                            <div class="histogram-header-content">
                                <div class="histogram-title">
                                    <h3>Page Usage Distribution</h3>
                                    <p>Distribution of pages across usage frequency categories</p>
                                </div>
                                <div class="histogram-actions">
                                    <button id="refreshPageUsageHistogramButton" class="icon-button histogram-refresh-button" title="Refresh Data">
                                        <i class="codicon codicon-refresh"></i>
                                    </button>
                                    <button id="generatePageUsageHistogramPngBtn" class="svg-export-btn">
                                        <span class="codicon codicon-device-camera"></span>
                                        Generate PNG
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="page-usage-graph-filter">
                            <div class="filter-group">
                                <label>
                                    <input type="checkbox" id="hideStartPagesHistogram">
                                    Hide Start Pages
                                </label>
                            </div>
                        </div>
                        <div id="page-usage-histogram-loading" class="loading">Loading page usage distribution...</div>
                        <div id="page-usage-histogram-visualization" class="histogram-viz hidden"></div>
                        <div class="histogram-legend">
                            <div class="legend-item">
                                <span class="legend-color usage-low"></span>
                                <span>Low Usage (1-2 journeys)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color usage-medium"></span>
                                <span>Medium Usage (3-5 journeys)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color usage-high"></span>
                                <span>High Usage (6-10 journeys)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color usage-very-high"></span>
                                <span>Very High Usage (10+ journeys)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Page Usage vs Complexity Tab Content -->
                <div id="page-usage-vs-complexity-tab" class="tab-content">
                    <div class="scatter-container">
                        <div class="scatter-header">
                            <div class="scatter-header-content">
                                <div class="scatter-title">
                                    <h3>Page Usage vs Complexity Scatter Plot</h3>
                                    <p>Visualizes the relationship between page complexity (element count) and usage frequency. Each dot represents a page.</p>
                                </div>
                                <div class="scatter-actions">
                                    <button id="refreshPageUsageVsComplexityButton" class="icon-button scatter-refresh-button" title="Refresh Data">
                                        <i class="codicon codicon-refresh"></i>
                                    </button>
                                    <button id="generatePageUsageVsComplexityPngBtn" class="svg-export-btn">
                                        <span class="codicon codicon-device-camera"></span>
                                        Generate PNG
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="page-usage-graph-filter">
                            <div class="filter-group">
                                <label>
                                    <input type="checkbox" id="hideStartPagesScatter">
                                    Hide Start Pages
                                </label>
                            </div>
                        </div>
                        <div id="page-usage-vs-complexity-loading" class="loading">Loading scatter plot...</div>
                        <div id="page-usage-vs-complexity-visualization" class="scatter-viz hidden"></div>
                        <div class="scatter-quadrants">
                            <div class="quadrant-legend">
                                <div class="quadrant-item">
                                    <span class="quadrant-color high-usage-low-complexity"></span>
                                    <span><strong>High Usage, Low Complexity:</strong> Well-designed core pages</span>
                                </div>
                                <div class="quadrant-item">
                                    <span class="quadrant-color high-usage-high-complexity"></span>
                                    <span><strong>High Usage, High Complexity:</strong> Critical pages needing attention</span>
                                </div>
                                <div class="quadrant-item">
                                    <span class="quadrant-color low-usage-low-complexity"></span>
                                    <span><strong>Low Usage, Low Complexity:</strong> Simple utility pages</span>
                                </div>
                                <div class="quadrant-item">
                                    <span class="quadrant-color low-usage-high-complexity"></span>
                                    <span><strong>Low Usage, High Complexity:</strong> Potential over-engineering</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Journey Visualization Tab Content -->
                <div id="journey-visualization-tab" class="tab-content">
                    <div class="treemap-container">
                        <div class="treemap-header">
                            <div class="treemap-header-content">
                                <div class="treemap-title">
                                    <h3>User Story Journey Distance Visualization</h3>
                                    <p>Rectangle size represents the journey page distance for each user story. Hover for story details.</p>
                                </div>
                                <div class="treemap-actions">
                                    <button id="refreshTreemapButton" class="icon-button treemap-refresh-button" title="Refresh Data">
                                        <i class="codicon codicon-refresh"></i>
                                    </button>
                                    <button id="generateTreemapPngBtn" class="svg-export-btn">
                                        <span class="codicon codicon-device-camera"></span>
                                        Generate PNG
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div id="journey-treemap-loading" class="loading">Loading journey visualization...</div>
                        <div id="journey-treemap-visualization" class="treemap-viz hidden"></div>
                        <div class="treemap-legend">
                            <div class="legend-item">
                                <span class="legend-color journey-simple"></span>
                                <span>Simple (1-2 pages)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color journey-medium"></span>
                                <span>Medium (3-5 pages)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color journey-complex"></span>
                                <span>Complex (6-10 pages)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color journey-very-complex"></span>
                                <span>Very Complex (10+ pages)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Journey Distribution Tab Content -->
                <div id="journey-distribution-tab" class="tab-content">
                    <div class="histogram-container">
                        <div class="histogram-header">
                            <div class="histogram-header-content">
                                <div class="histogram-title">
                                    <h3>Journey Distance Distribution</h3>
                                    <p>Distribution of user stories across journey distance complexity categories</p>
                                </div>
                                <div class="histogram-actions">
                                    <button id="refreshHistogramButton" class="icon-button histogram-refresh-button" title="Refresh Data">
                                        <i class="codicon codicon-refresh"></i>
                                    </button>
                                    <button id="generateHistogramPngBtn" class="svg-export-btn">
                                        <span class="codicon codicon-device-camera"></span>
                                        Generate PNG
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div id="journey-histogram-loading" class="loading">Loading journey distribution...</div>
                        <div id="journey-histogram-visualization" class="histogram-viz hidden"></div>
                        <div class="histogram-legend">
                            <div class="legend-item">
                                <span class="legend-color journey-simple"></span>
                                <span>Simple (1-2 pages)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color journey-medium"></span>
                                <span>Medium (3-5 pages)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color journey-complex"></span>
                                <span>Complex (6-10 pages)</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color journey-very-complex"></span>
                                <span>Very Complex (10+ pages)</span>
                            </div>
                        </div>
                    </div>
                </div>
                    </div>
                </div>

                <!-- Page Usage Tab Content -->
                <div id="page-usage-tab" class="tab-content">
                    <div class="filter-section">
                        <div class="filter-header" onclick="togglePageUsageFilterSection()">
                            <span class="codicon codicon-chevron-down" id="pageUsageFilterChevron"></span>
                            <span>Filters</span>
                        </div>
                        <div class="filter-content" id="pageUsageFilterContent">
                            <div class="filter-row">
                                <div class="filter-group">
                                    <label>Page Name:</label>
                                    <input type="text" id="filterPageName" placeholder="Filter by page name...">
                                </div>
                                <div class="filter-group">
                                    <label>Page Type:</label>
                                    <select id="filterPageType">
                                        <option value="">All Types</option>
                                        <option value="form">Form</option>
                                        <option value="report">Report</option>
                                    </select>
                                </div>
                                <div class="filter-group">
                                    <label>Complexity:</label>
                                    <select id="filterPageComplexity">
                                        <option value="">All Complexity</option>
                                        <option value="simple">Simple</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="complex">Complex</option>
                                        <option value="very-complex">Very Complex</option>
                                    </select>
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button onclick="clearPageUsageFilters()" class="filter-button-secondary">Clear All</button>
                            </div>
                        </div>
                    </div>

                    <div class="header-actions">
                        <button id="refreshPageUsageButton" class="icon-button" title="Refresh Page Usage Data">
                            <i class="codicon codicon-refresh"></i>
                        </button>
                        <button id="exportPageUsageButton" class="icon-button" title="Download Page Usage CSV">
                            <i class="codicon codicon-cloud-download"></i>
                        </button>
                    </div>

                    <div class="table-container">
                        <table id="pageUsageTable">
                            <thead id="pageUsageTableHead">
                                <!-- Table headers will be dynamically generated -->
                            </thead>
                            <tbody id="pageUsageTableBody">
                                <!-- Table rows will be dynamically generated -->
                            </tbody>
                        </table>
                    </div>

                    <div class="table-footer">
                        <div class="table-footer-left">
                            <!-- Left side content if needed -->
                        </div>
                        <div class="table-footer-right">
                            <span id="page-usage-record-info"></span>
                        </div>
                    </div>
                </div>

                    <div id="spinner-overlay" class="spinner-overlay" style="display: none;">
                        <div class="spinner"></div>
                    </div>

                    <!-- Journey Start Pages Modal -->
                    <div id="journeyStartModal" class="journey-start-modal">
                        <div class="journey-start-modal-content">
                            <div class="journey-start-header">
                                <h3>Define Journey Start Pages for Roles</h3>
                                <button class="journey-start-close" onclick="closeJourneyStartModal()">
                                    <span class="codicon codicon-close"></span>
                                </button>
                            </div>
                            <div class="journey-start-body">
                                <div class="journey-start-table-container">
                                    <table id="journeyStartTable">
                                        <thead>
                                            <tr>
                                                <th style="width: 40%;">Role Name</th>
                                                <th style="width: 60%;">Journey Start Page</th>
                                            </tr>
                                        </thead>
                                        <tbody id="journeyStartTableBody">
                                            <!-- Table rows will be dynamically generated -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="journey-start-footer">
                                <button onclick="saveJourneyStartPages()" class="journey-start-save-button">Save</button>
                                <button onclick="closeJourneyStartModal()" class="journey-start-cancel-button">Cancel</button>
                            </div>
                        </div>
                    </div>

                    <!-- Page Lookup Modal for Journey Start -->
                    <div id="journeyStartPageLookupModal" class="page-lookup-modal">
                        <div class="page-lookup-modal-content">
                            <div class="page-lookup-header">
                                <h3>Select Journey Start Page</h3>
                                <button class="page-lookup-close" onclick="closeJourneyStartPageLookupModal()">
                                    <span class="codicon codicon-close"></span>
                                </button>
                            </div>
                            <div class="page-lookup-body">
                                <div class="page-filter-container">
                                    <input type="text" 
                                           id="journeyStartPageFilterInput" 
                                           class="page-filter-input" 
                                           placeholder="Filter pages by name or title..." 
                                           onkeyup="filterJourneyStartPageList()" 
                                           onkeydown="handleJourneyStartPageFilterKeydown(event)">
                                </div>
                                <div class="page-list-container">
                                    <div id="journeyStartPageListContent">
                                        <!-- Page list will be populated dynamically -->
                                    </div>
                                </div>
                            </div>
                            <div class="page-lookup-footer">
                                <button onclick="applySelectedJourneyStartPage()" class="page-lookup-select-button">Select</button>
                                <button onclick="closeJourneyStartPageLookupModal()" class="page-lookup-cancel-button">Cancel</button>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Modal -->
                    <div id="progressModal" class="progress-modal">
                        <div class="progress-modal-content">
                            <div class="progress-header">
                                <span class="progress-spinner"></span>
                                <span>Calculating Page Distances</span>
                            </div>
                            <div class="progress-content">
                                <div class="progress-bar-container">
                                    <div id="progressBar" class="progress-bar" style="width: 0%"></div>
                                </div>
                                <div id="progressPercentage" class="progress-percentage">0%</div>
                                
                                <div id="progressSteps">
                                    <div class="progress-step">
                                        <div class="progress-step-title">Loading journey start pages...</div>
                                        <div class="progress-step-detail" id="stepLoadingDetail">Initializing</div>
                                    </div>
                                    <div class="progress-step">
                                        <div class="progress-step-title">Loading page flow data...</div>
                                        <div class="progress-step-detail" id="stepPageFlowDetail">Waiting</div>
                                    </div>
                                    <div class="progress-step">
                                        <div class="progress-step-title">Calculating distances...</div>
                                        <div class="progress-step-detail" id="stepCalculatingDetail">Waiting</div>
                                    </div>
                                    <div class="progress-step">
                                        <div class="progress-step-title">Saving results...</div>
                                        <div class="progress-step-detail" id="stepSavingDetail">Waiting</div>
                                    </div>
                                </div>
                            </div>
                            <div class="progress-footer">
                                <button id="progressCloseButton" class="progress-close-button" onclick="closeProgressModal()" disabled>Close</button>
                            </div>
                        </div>
                    </div>

                    <script src="https://d3js.org/d3.v7.min.js"></script>
                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;

                // Handle messages from the webview
                panel.webview.onDidReceiveMessage(
                    async message => {
                        switch (message.command) {
                            case 'UserStoriesJourneyWebviewReady':
                                console.log("[Extension] UserStoriesJourney webview ready");
                                // Load initial journey data
                                await loadUserStoriesJourneyData(panel, modelService);
                                break;

                            case 'refresh':
                                console.log("[Extension] UserStoriesJourney refresh requested");
                                await loadUserStoriesJourneyData(panel, modelService);
                                break;

                            case 'sortUserStoriesJourney':
                                console.log("[Extension] UserStoriesJourney sort requested:", message.column, message.descending);
                                await loadUserStoriesJourneyData(panel, modelService, message.column, message.descending);
                                break;

                            case 'exportToCSV':
                                console.log("[Extension] UserStoriesJourney CSV export requested");
                                try {
                                    const csvContent = await saveJourneyDataToCSV(message.data.items, modelService);
                                    
                                    // Generate timestamped filename
                                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                                                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
                                    const filename = `user-stories-journey-${timestamp}.csv`;

                                    panel.webview.postMessage({
                                        command: 'csvExportReady',
                                        csvContent: csvContent,
                                        filename: filename
                                    });
                                } catch (error) {
                                    console.error('[Extension] Error exporting CSV:', error);
                                    panel.webview.postMessage({
                                        command: 'csvExportReady',
                                        success: false,
                                        error: error.message
                                    });
                                }
                                break;

                            case 'exportPageUsageToCSV':
                                console.log("[Extension] Page Usage CSV export requested");
                                try {
                                    const csvContent = await savePageUsageDataToCSV(message.data.pages, modelService);
                                    
                                    // Generate timestamped filename
                                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                                                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
                                    const filename = `page-usage-analysis-${timestamp}.csv`;

                                    panel.webview.postMessage({
                                        command: 'csvExportReady',
                                        csvContent: csvContent,
                                        filename: filename
                                    });
                                } catch (error) {
                                    console.error('[Extension] Error exporting Page Usage CSV:', error);
                                    panel.webview.postMessage({
                                        command: 'csvExportReady',
                                        success: false,
                                        error: error.message
                                    });
                                }
                                break;

                            case 'saveCsvToWorkspace':
                                try {
                                    // Use the actual workspace root, not extensionPath
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
                                    console.error('Error saving CSV to workspace:', error);
                                    vscode.window.showErrorMessage('Failed to save CSV to workspace: ' + error.message);
                                }
                                break;

                            case 'getJourneyStartData':
                                console.log("[Extension] Getting journey start data");
                                try {
                                    const journeyStartData = await loadJourneyStartData(modelService);
                                    panel.webview.postMessage({
                                        command: 'journeyStartDataReady',
                                        data: journeyStartData
                                    });
                                } catch (error) {
                                    console.error('[Extension] Error getting journey start data:', error);
                                    panel.webview.postMessage({
                                        command: 'journeyStartDataReady',
                                        success: false,
                                        error: error.message
                                    });
                                }
                                break;

                            case 'getPageListForJourneyStart':
                                console.log("[Extension] Getting page list for journey start");
                                try {
                                    const pages = await getPageListForJourneyStart(modelService);
                                    panel.webview.postMessage({
                                        command: 'journeyStartPageListReady',
                                        pages: pages
                                    });
                                } catch (error) {
                                    console.error('[Extension] Error getting page list:', error);
                                    panel.webview.postMessage({
                                        command: 'journeyStartPageListReady',
                                        success: false,
                                        error: error.message
                                    });
                                }
                                break;

                            case 'saveJourneyStartPages':
                                console.log("[Extension] Saving journey start pages");
                                try {
                                    await saveJourneyStartData(message.data.journeyStartPages, modelService);
                                    panel.webview.postMessage({
                                        command: 'journeyStartPagesSaved',
                                        success: true
                                    });
                                    vscode.window.showInformationMessage('Journey start pages saved successfully');
                                } catch (error) {
                                    console.error('[Extension] Error saving journey start pages:', error);
                                    panel.webview.postMessage({
                                        command: 'journeyStartPagesSaved',
                                        success: false,
                                        message: error.message
                                    });
                                    vscode.window.showErrorMessage('Failed to save journey start pages: ' + error.message);
                                }
                                break;

                            case 'calculatePageDistances':
                                console.log("[Extension] Calculating page distances");
                                try {
                                    await calculatePageDistances(panel, modelService);
                                } catch (error) {
                                    console.error('[Extension] Error calculating page distances:', error);
                                    panel.webview.postMessage({
                                        command: 'distanceCalculationComplete',
                                        data: {
                                            success: false,
                                            error: error.message
                                        }
                                    });
                                    vscode.window.showErrorMessage('Failed to calculate page distances: ' + error.message);
                                }
                                break;

                            case 'openUserJourneyForPage':
                                console.log("[Extension] Opening User Journey for page:", message.targetPage, "with role:", message.pageRole);
                                try {
                                    // Load journey start data to find the start page for this role
                                    let startPage = null;
                                    if (message.pageRole) {
                                        const journeyStartData = await loadJourneyStartData(modelService);
                                        const journeyStartPages = journeyStartData.journeyStartPages || {};
                                        startPage = journeyStartPages[message.pageRole];
                                        console.log("[Extension] Found start page for role", message.pageRole, ":", startPage);
                                    }
                                    
                                    // Import the page flow view function
                                    const { showPageFlowWithUserJourney } = require('../webviews/pageFlowDiagramView');
                                    
                                    // Open Page Flow with User Journey tab, target page, and start page
                                    await showPageFlowWithUserJourney(context, modelService, message.targetPage, startPage);
                                } catch (error) {
                                    console.error('[Extension] Error opening User Journey:', error);
                                    vscode.window.showErrorMessage('Failed to open User Journey: ' + error.message);
                                }
                                break;

                            case 'openPagePreviewForPage':
                                console.log("[Extension] Opening Page Preview for page:", message.targetPage, "with role:", message.pageRole);
                                try {
                                    // Load journey start data to find the start page for this role
                                    let startPage = null;
                                    if (message.pageRole) {
                                        const journeyStartData = await loadJourneyStartData(modelService);
                                        const journeyStartPages = journeyStartData.journeyStartPages || {};
                                        startPage = journeyStartPages[message.pageRole];
                                        console.log("[Extension] Found start page for role", message.pageRole, ":", startPage);
                                    }
                                    
                                    // Import the page preview view function
                                    const { showPagePreviewWithSelection } = require('../webviews/pagepreview/pagePreviewView');
                                    
                                    // Open Page Preview with start page for preview and target page for journey setup
                                    await showPagePreviewWithSelection(context, modelService, startPage, message.targetPage);
                                } catch (error) {
                                    console.error('[Extension] Error opening Page Preview:', error);
                                    vscode.window.showErrorMessage('Failed to open Page Preview: ' + error.message);
                                }
                                break;

                            case 'openPageDetails':
                                console.log("[Extension] Opening Page Details for:", message.pageName, "type:", message.pageType);
                                try {
                                    if (message.pageType === 'form') {
                                        // Open form details view
                                        const mockTreeItem = {
                                            label: message.pageName,
                                            contextValue: 'form',
                                            tooltip: `${message.pageName}`
                                        };
                                        const { showFormDetails } = require('../webviews/formDetailsView');
                                        showFormDetails(mockTreeItem, modelService, context);
                                    } else if (message.pageType === 'report') {
                                        // Open report details view
                                        const mockTreeItem = {
                                            label: message.pageName,
                                            contextValue: 'report',
                                            tooltip: `${message.pageName}`
                                        };
                                        const { showReportDetails } = require('../webviews/reports/reportDetailsView');
                                        showReportDetails(mockTreeItem, modelService, context);
                                    } else {
                                        // For unknown page types, try to determine the type from the model
                                        const model = modelService.getCurrentModel();
                                        if (model && model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
                                            const namespace = model.namespace[0] as any;
                                            
                                            // Check if it's a form
                                            if (namespace.form && Array.isArray(namespace.form)) {
                                                const foundForm = namespace.form.find((f: any) => f.name === message.pageName);
                                                if (foundForm) {
                                                    const mockTreeItem = {
                                                        label: message.pageName,
                                                        contextValue: 'form',
                                                        tooltip: `${message.pageName}`
                                                    };
                                                    const { showFormDetails } = require('../webviews/formDetailsView');
                                                    showFormDetails(mockTreeItem, modelService, context);
                                                    break;
                                                }
                                            }
                                            
                                            // Check if it's a report
                                            if (namespace.report && Array.isArray(namespace.report)) {
                                                const foundReport = namespace.report.find((r: any) => r.name === message.pageName);
                                                if (foundReport) {
                                                    const mockTreeItem = {
                                                        label: message.pageName,
                                                        contextValue: 'report',
                                                        tooltip: `${message.pageName}`
                                                    };
                                                    const { showReportDetails } = require('../webviews/reports/reportDetailsView');
                                                    showReportDetails(mockTreeItem, modelService, context);
                                                    break;
                                                }
                                            }
                                        }
                                        
                                        vscode.window.showWarningMessage(`Unable to determine page type for "${message.pageName}". Please use the tree view to open page details.`);
                                    }
                                } catch (error) {
                                    console.error('[Extension] Error opening page details:', error);
                                    vscode.window.showErrorMessage(`Failed to open page details: ${error.message}`);
                                }
                                break;

                            case 'savePngToWorkspace':
                                try {
                                    const workspaceFolders = vscode.workspace.workspaceFolders;
                                    if (!workspaceFolders || workspaceFolders.length === 0) {
                                        vscode.window.showErrorMessage('No workspace folder is open');
                                        panel.webview.postMessage({
                                            command: 'pngSaveComplete',
                                            success: false,
                                            error: 'No workspace folder is open'
                                        });
                                        return;
                                    }
                                    const workspaceRoot = workspaceFolders[0].uri.fsPath;
                                    const filePath = path.join(workspaceRoot, message.data.filename);
                                    const buffer = Buffer.from(message.data.base64.replace(/^data:image\/png;base64,/, ''), 'base64');
                                    fs.writeFileSync(filePath, buffer);
                                    vscode.window.showInformationMessage(`PNG file saved to workspace: ${message.data.filename}`);
                                    panel.webview.postMessage({
                                        command: 'pngSaveComplete',
                                        success: true,
                                        filePath: message.data.filename,
                                        type: message.data.type
                                    });
                                    // Open the PNG file immediately
                                    const fileUri = vscode.Uri.file(filePath);
                                    vscode.commands.executeCommand('vscode.open', fileUri);
                                } catch (error) {
                                    console.error('[ERROR] User Stories Journey - Failed to save PNG:', error);
                                    vscode.window.showErrorMessage(`Failed to save PNG: ${error.message}`);
                                    panel.webview.postMessage({
                                        command: 'pngSaveComplete',
                                        success: false,
                                        error: error.message
                                    });
                                }
                                break;

                            case 'getPageUsageData':
                                console.log("[Extension] Getting page usage data");
                                try {
                                    const pageUsageData = await loadPageUsageData(modelService);
                                    panel.webview.postMessage({
                                        command: 'pageUsageDataReady',
                                        data: pageUsageData
                                    });
                                } catch (error) {
                                    console.error('[Extension] Error getting page usage data:', error);
                                    panel.webview.postMessage({
                                        command: 'pageUsageDataReady',
                                        success: false,
                                        error: error.message
                                    });
                                }
                                break;

                            default:
                                console.log("[Extension] Unknown message command:", message.command);
                                break;
                        }
                    },
                    undefined,
                    context.subscriptions
                );

            } catch (error) {
                console.error("Error opening user stories journey view:", error);
                vscode.window.showErrorMessage(`Failed to open User Stories Journey view: ${error.message}`);
            }
        }
    );

    context.subscriptions.push(userStoriesJourneyCommand);
}
