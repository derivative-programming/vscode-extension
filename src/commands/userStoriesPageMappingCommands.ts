// Description: Handles registration of user stories page mapping view related commands.
// Created: August 5, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the user stories page mapping view
const userStoriesPageMappingPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the user stories page mapping panel if it's open
 */
export function getUserStoriesPageMappingPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('userStoriesPageMapping') && userStoriesPageMappingPanel.context && userStoriesPageMappingPanel.modelService) {
        return {
            type: 'userStoriesPageMapping',
            context: userStoriesPageMappingPanel.context,
            modelService: userStoriesPageMappingPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the user stories page mapping panel if it's open
 */
export function closeUserStoriesPageMappingPanel(): void {
    console.log(`Closing user stories page mapping panel if open`);
    const panel = activePanels.get('userStoriesPageMapping');
    if (panel) {
        panel.dispose();
        activePanels.delete('userStoriesPageMapping');
    }
    // Clean up panel reference
    userStoriesPageMappingPanel.panel = null;
}

/**
 * Load user stories page mapping data from both model and separate mapping file
 */
async function loadUserStoriesPageMappingData(panel: vscode.WebviewPanel, modelService: ModelService, sortColumn?: string, sortDescending?: boolean): Promise<void> {
    try {
        console.log("[Extension] Loading user stories page mapping data");
        const model = modelService.getCurrentModel();
        if (!model) {
            console.error("[Extension] No model available");
            panel.webview.postMessage({
                command: "setUserStoriesPageMappingData",
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
        let existingMappingData: any = { pageMappings: {} };
        let mappingFilePath = '';
        const modelFilePath = modelService.getCurrentFilePath();
        if (modelFilePath) {
            const modelDir = path.dirname(modelFilePath);
            mappingFilePath = path.join(modelDir, 'app-dna-user-story-page-mapping.json');
            try {
                if (fs.existsSync(mappingFilePath)) {
                    const mappingContent = fs.readFileSync(mappingFilePath, 'utf8');
                    existingMappingData = JSON.parse(mappingContent);
                    
                    // Migration: Convert string fields to arrays if needed
                    let needsMigration = false;
                    if (existingMappingData.pageMappings) {
                        Object.keys(existingMappingData.pageMappings).forEach(storyNumber => {
                            const mapping = existingMappingData.pageMappings[storyNumber];
                            
                            // Convert pageMapping from string to array
                            if (typeof mapping.pageMapping === 'string') {
                                mapping.pageMapping = mapping.pageMapping
                                    .split('\n')
                                    .map((line: string) => line.trim())
                                    .filter((line: string) => line.length > 0);
                                needsMigration = true;
                            }
                            
                            // Convert ignorePages from string to array
                            if (typeof mapping.ignorePages === 'string') {
                                mapping.ignorePages = mapping.ignorePages
                                    .split('\n')
                                    .map((line: string) => line.trim())
                                    .filter((line: string) => line.length > 0);
                                needsMigration = true;
                            }
                            
                            // Ensure arrays exist even if they were empty strings
                            if (!Array.isArray(mapping.pageMapping)) {
                                mapping.pageMapping = [];
                                needsMigration = true;
                            }
                            if (!Array.isArray(mapping.ignorePages)) {
                                mapping.ignorePages = [];
                                needsMigration = true;
                            }
                        });
                    }
                    
                    // Save migrated data if needed
                    if (needsMigration) {
                        await savePageMappingData(existingMappingData.pageMappings, mappingFilePath);
                        console.log("[Extension] Migrated page mapping data from strings to arrays");
                    }
                }
            } catch (error) {
                console.warn("[Extension] Could not load existing page mapping file:", error);
                existingMappingData = { pageMappings: {} };
            }
        }

        console.log(`[Extension] Found ${userStories.length} user stories`);

        // Build combined data array
        const combinedData: any[] = [];
        userStories.forEach(story => {
            const storyNumber = story.storyNumber || '';
            const existingMapping = existingMappingData.pageMappings[storyNumber];

            combinedData.push({
                storyId: story.name || '',
                storyNumber: storyNumber,
                storyText: story.storyText || '',
                pageMapping: existingMapping?.pageMapping || [],
                ignorePages: existingMapping?.ignorePages || [],
                mappingFilePath: mappingFilePath,
                selected: false // For checkbox functionality
            });
        });

        // Sort the data
        if (sortColumn) {
            combinedData.sort((a, b) => {
                let aVal = a[sortColumn] || '';
                let bVal = b[sortColumn] || '';
                
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

        console.log(`[Extension] Sending ${combinedData.length} page mapping items to webview`);

        // Send data to webview
        panel.webview.postMessage({
            command: "setUserStoriesPageMappingData",
            data: {
                items: combinedData,
                totalRecords: combinedData.length,
                sortColumn: sortColumn || 'storyNumber',
                sortDescending: sortDescending || false
            }
        });

    } catch (error) {
        console.error("[Extension] Error loading user stories page mapping data:", error);
        panel.webview.postMessage({
            command: "setUserStoriesPageMappingData",
            data: { items: [], totalRecords: 0, sortColumn: 'storyNumber', sortDescending: false, error: error.message }
        });
    }
}

/**
 * Save page mapping data to separate JSON file
 */
async function savePageMappingData(pageMappings: any, filePath: string): Promise<void> {
    try {
        // Load existing data to preserve other properties like journeyStartPages
        let existingData: any = {};
        try {
            if (fs.existsSync(filePath)) {
                const existingContent = fs.readFileSync(filePath, 'utf8');
                existingData = JSON.parse(existingContent);
            }
        } catch (error) {
            console.warn(`[Extension] Could not load existing data from ${filePath}, creating new file:`, error);
            existingData = {};
        }

        // Update only the pageMappings property while preserving other properties
        const data = {
            ...existingData,
            pageMappings: pageMappings
        };
        
        const content = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Extension] Page mapping data saved to ${filePath}`);
    } catch (error) {
        console.error(`[Extension] Error saving page mapping data:`, error);
        throw error;
    }
}

/**
 * Register user stories page mapping commands
 */
/**
 * Convert spaced words to camelCase (e.g., "Org Customers" -> "OrgCustomers")
 */
function convertToCamelCase(text: string): string {
    if (!text || typeof text !== "string") { return ""; }
    
    return text
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Convert plural words to singular (e.g., "Customer Email Requests" -> "Customer Email Request")
 * This handles common English pluralization patterns for better model object matching
 */
function convertToSingular(text: string): string {
    if (!text || typeof text !== "string") { return ""; }
    
    const words = text.trim().split(/\s+/);
    if (words.length === 0) { return ""; }
    
    // Get the last word and convert to singular
    const lastWord = words[words.length - 1];
    let singularLastWord = lastWord;
    
    // Common pluralization patterns
    if (lastWord.toLowerCase().endsWith('ies')) {
        singularLastWord = lastWord.slice(0, -3) + 'y';
    } else if (lastWord.toLowerCase().endsWith('es')) {
        // Check for -ses, -xes, -ches, -shes patterns
        if (lastWord.toLowerCase().endsWith('ses') || 
            lastWord.toLowerCase().endsWith('xes') || 
            lastWord.toLowerCase().endsWith('ches') || 
            lastWord.toLowerCase().endsWith('shes')) {
            singularLastWord = lastWord.slice(0, -2);
        } else {
            singularLastWord = lastWord.slice(0, -1);
        }
    } else if (lastWord.toLowerCase().endsWith('s') && lastWord.length > 1) {
        singularLastWord = lastWord.slice(0, -1);
    }
    
    // Replace the last word with singular form
    const singularWords = [...words.slice(0, -1), singularLastWord];
    return singularWords.join(' ');
}

/**
 * Find the parent object of a given object in the namespace
 */
function findParentObject(objectName: string, allObjects: any[]): any | null {
    for (const obj of allObjects) {
        // Check if this object has the target object as a child
        if (obj.object && Array.isArray(obj.object)) {
            const childFound = obj.object.find((child: any) => 
                child.name && child.name.toLowerCase() === objectName.toLowerCase()
            );
            if (childFound) {
                return obj;
            }
        }
        
        // Also check dataObjects if they exist
        if (obj.dataObject && Array.isArray(obj.dataObject)) {
            const childFound = obj.dataObject.find((child: any) => 
                child.name && child.name.toLowerCase() === objectName.toLowerCase()
            );
            if (childFound) {
                return obj;
            }
        }
    }
    return null;
}

/**
 * Get all parent objects in hierarchy order (immediate parent first, then grandparent, etc.)
 */
function getParentHierarchy(objectName: string, allObjects: any[]): any[] {
    const parents: any[] = [];
    let currentObjectName = objectName;
    
    while (currentObjectName) {
        const parent = findParentObject(currentObjectName, allObjects);
        if (parent && parent.name) {
            parents.push(parent);
            currentObjectName = parent.name;
        } else {
            break;
        }
    }
    
    return parents;
}

/**
 * Extract role from user story text
 */
function extractRoleFromStory(text: string): string {
    if (!text || typeof text !== "string") { return ""; }
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract role from: A [Role] wants to...
    const re1 = /^A\s+\[?(\w+(?:\s+\w+)*)\]?\s+wants to/i;
    const match1 = t.match(re1);
    if (match1) { return match1[1]; }
    
    // Regex to extract role from: As a [Role], I want to...
    const re2 = /^As a\s+\[?(\w+(?:\s+\w+)*)\]?\s*,?\s*I want to/i;
    const match2 = t.match(re2);
    if (match2) { return match2[1]; }
    
    return "";
}

/**
 * Extract action from user story text
 */
function extractActionFromStory(text: string): string {
    if (!text || typeof text !== "string") { return ""; }
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract action from: ...wants to [action]... (case insensitive)
    // Updated to handle "view all" properly without requiring additional "a|an|all" after it
    const re1 = /wants to\s+(view all|view|add|update|delete)(?:\s+(?:a|an|all))?\s+/i;
    const match1 = t.match(re1);
    if (match1) { return match1[1].toLowerCase(); }
    
    // Regex to extract action from: ...I want to [action]... (case insensitive)
    const re2 = /I want to\s+(view all|view|add|update|delete)(?:\s+(?:a|an|all))?\s+/i;
    const match2 = t.match(re2);
    if (match2) { return match2[1].toLowerCase(); }
    
    return "";
}

/**
 * Extract object from user story text
 */
function extractObjectFromStory(text: string): string {
    if (!text || typeof text !== "string") { return ""; }
    const t = text.trim().replace(/\s+/g, " ");
    
    // Regex to extract object from: ...[action] [object] (case insensitive)
    // Updated to handle phrases like "Org Customers in a Organization" - extract just "Org Customers"
    // Also handle "view all [object]" patterns
    const re = /(?:view all|view|add|update|delete)(?:\s+(?:a|an|all))?\s+([^.!?]+?)(?:\s+in\s+(?:a|an|the)\s+\w+|\s*[\.\!\?]|$)/i;
    const match = t.match(re);
    if (match) { 
        // Clean up the captured object text
        let objectText = match[1].trim();
        // Remove any trailing brackets or quotes
        objectText = objectText.replace(/[\]\)"']*$/, '');
        return objectText; 
    }
    
    return "";
}

/**
 * Check if the user story indicates application-level context (e.g., "in the application", "in the app")
 */
function isApplicationLevelContext(text: string): boolean {
    if (!text || typeof text !== "string") { return false; }
    const t = text.toLowerCase().trim();
    
    // Check for phrases that indicate application-level context
    return t.includes("in the application") || 
           t.includes("in the app") ||
           t.includes("in application") ||
           t.includes("application-wide") ||
           t.includes("across the application");
}

/**
 * Find the top-level parent object (Pac, Tac, or root object) in the namespace
 */
function findTopLevelParent(allObjects: any[]): any | null {
    // Look for objects commonly used as application root: Pac, Tac
    const commonRootNames = ['pac', 'tac', 'application', 'app'];
    
    for (const rootName of commonRootNames) {
        const found = allObjects.find(obj => 
            obj.name && obj.name.toLowerCase() === rootName
        );
        if (found) {
            return found;
        }
    }
    
    // If no common root found, look for objects that don't have parents
    // (i.e., objects that are not children of any other object)
    for (const obj of allObjects) {
        let isChild = false;
        for (const potentialParent of allObjects) {
            if (potentialParent === obj) { continue; }
            
            // Check if obj is a child of potentialParent
            if (potentialParent.object && Array.isArray(potentialParent.object)) {
                const childFound = potentialParent.object.find((child: any) => 
                    child.name && child.name.toLowerCase() === obj.name?.toLowerCase()
                );
                if (childFound) {
                    isChild = true;
                    break;
                }
            }
            
            if (potentialParent.dataObject && Array.isArray(potentialParent.dataObject)) {
                const childFound = potentialParent.dataObject.find((child: any) => 
                    child.name && child.name.toLowerCase() === obj.name?.toLowerCase()
                );
                if (childFound) {
                    isChild = true;
                    break;
                }
            }
        }
        
        // If this object is not a child of any other object, it's a root
        if (!isChild) {
            return obj;
        }
    }
    
    return null;
}

/**
 * Register user stories page mapping commands
 */
export function registerUserStoriesPageMappingCommands(context: vscode.ExtensionContext, modelService: ModelService): void {
    // Register user stories page mapping command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.userStoriesPageMapping', async () => {
            // Store references to context and modelService
            userStoriesPageMappingPanel.context = context;
            userStoriesPageMappingPanel.modelService = modelService;

            // Create a consistent panel ID
            const panelId = 'userStoriesPageMapping';
            console.log(`userStoriesPageMapping command called (panelId: ${panelId})`);

            // Check if panel already exists
            if (activePanels.has(panelId)) {
                console.log(`Panel already exists for user stories page mapping, revealing existing panel`);
                // Panel exists, reveal it instead of creating a new one
                activePanels.get(panelId)?.reveal(vscode.ViewColumn.One);
                return;
            }

            // Create new panel if one doesn't exist
            const panel = vscode.window.createWebviewPanel(
                'userStoriesPageMapping',
                'User Stories - Page Mapping',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );

            // Track this panel
            console.log(`Adding new panel to activePanels with id: ${panelId}`);
            activePanels.set(panelId, panel);
            userStoriesPageMappingPanel.panel = panel;

            // Cleanup when panel is disposed
            panel.onDidDispose(() => {
                console.log(`Panel disposed, removing from tracking: ${panelId}`);
                activePanels.delete(panelId);
                userStoriesPageMappingPanel.panel = null;
            });

            // Get the VS Code CSS and JS URI for the webview
            const codiconsUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
            );
            const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'webviews', 'userStoriesPageMappingView.js'));

            // Set the HTML content for the webview
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>User Stories Page Mapping</title>
                    <link href="${codiconsUri}" rel="stylesheet">
                    <style>
                        body { font-family: var(--vscode-font-family); margin: 0; padding: 10px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
                        .validation-header {
                            padding: 10px 0;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            margin-bottom: 15px;
                        }
                        .validation-header h2 {
                            margin: 0;
                            font-size: 1.3em;
                            font-weight: normal;
                            color: var(--vscode-editor-foreground);
                            margin-bottom: 15px;
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
                        button:hover:not(:disabled) {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        .page-mapping-input, .ignore-pages-input {
                            width: 100%;
                            padding: 4px 8px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 2px;
                            min-height: 60px;
                            resize: vertical;
                            font-family: var(--vscode-font-family);
                            font-size: 13px;
                        }
                        .page-mapping-input:focus, .ignore-pages-input:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
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
                            background-color: var(--vscode-button-secondaryHoverBackground);
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
                        
                        .page-mapping-column {
                            width: 250px;
                        }
                        
                        .ignore-pages-column {
                            width: 200px;
                        }
                        
                        .header-actions {
                            display: flex;
                            gap: 8px;
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
                        
                        .validation-summary {
                            margin-bottom: 15px;
                            padding: 10px;
                            border-radius: 3px;
                            border: 1px solid var(--vscode-inputValidation-errorBorder);
                            background-color: var(--vscode-inputValidation-errorBackground);
                        }
                        
                        .validation-summary h4 {
                            margin: 0 0 10px 0;
                            color: var(--vscode-errorForeground);
                            font-size: 14px;
                        }
                        
                        .error-list {
                            font-size: 13px;
                            color: var(--vscode-errorForeground);
                        }
                        
                        .error-item {
                            margin: 5px 0;
                            padding: 4px 0;
                            border-bottom: 1px solid var(--vscode-inputValidation-errorBorder);
                        }
                        
                        .error-item:last-child {
                            border-bottom: none;
                        }
                        
                        /* Page Lookup Modal Styles */
                        .page-lookup-modal {
                            display: none;
                            position: fixed;
                            z-index: 1000;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            backdrop-filter: blur(2px);
                        }
                        
                        .page-lookup-modal-content {
                            background-color: var(--vscode-sideBar-background);
                            margin: 5% auto;
                            padding: 0;
                            border: 1px solid var(--vscode-panel-border);
                            border-radius: 6px;
                            width: 600px;
                            max-width: 90%;
                            max-height: 80%;
                            display: flex;
                            flex-direction: column;
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        }
                        
                        .page-lookup-header {
                            background-color: var(--vscode-titleBar-activeBackground);
                            color: var(--vscode-titleBar-activeForeground);
                            padding: 12px 16px;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            border-radius: 6px 6px 0 0;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        
                        .page-lookup-header h3 {
                            margin: 0;
                            font-size: 14px;
                            font-weight: 600;
                        }
                        
                        .page-lookup-close {
                            background: none;
                            border: none;
                            color: var(--vscode-titleBar-activeForeground);
                            cursor: pointer;
                            padding: 4px;
                            border-radius: 3px;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .page-lookup-close:hover {
                            background-color: var(--vscode-titleBar-inactiveBackground);
                        }
                        
                        .page-lookup-body {
                            padding: 16px;
                            flex: 1;
                            overflow-y: auto;
                            min-height: 300px;
                        }
                        
                        .page-filter-container {
                            margin-bottom: 12px;
                        }
                        
                        .page-filter-input {
                            width: 100%;
                            padding: 8px 12px;
                            border: 1px solid var(--vscode-input-border);
                            background-color: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border-radius: 4px;
                            font-size: 13px;
                            font-family: var(--vscode-font-family);
                        }
                        
                        .page-filter-input:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                        
                        .page-list-container {
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 4px;
                            max-height: 300px;
                            overflow-y: auto;
                            background-color: var(--vscode-input-background);
                        }
                        
                        .page-list-item {
                            padding: 8px 12px;
                            cursor: pointer;
                            border-bottom: 1px solid var(--vscode-panel-border);
                            font-size: 13px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        
                        .page-list-item:last-child {
                            border-bottom: none;
                        }
                        
                        .page-list-item:hover {
                            background-color: var(--vscode-list-hoverBackground);
                        }
                        
                        .page-list-item.selected {
                            background-color: var(--vscode-list-activeSelectionBackground);
                            color: var(--vscode-list-activeSelectionForeground);
                        }
                        
                        .page-list-item-checkbox {
                            margin-right: 4px;
                        }
                        
                        .page-lookup-footer {
                            padding: 12px 16px;
                            border-top: 1px solid var(--vscode-panel-border);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            background-color: var(--vscode-sideBar-background);
                            border-radius: 0 0 6px 6px;
                        }
                        
                        .page-lookup-info {
                            font-size: 12px;
                            color: var(--vscode-descriptionForeground);
                        }
                        
                        .page-lookup-actions {
                            display: flex;
                            gap: 8px;
                        }
                        
                        .page-lookup-btn {
                            background-color: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 6px 12px;
                            cursor: pointer;
                            border-radius: 3px;
                            font-size: 12px;
                        }
                        
                        .page-lookup-btn:hover {
                            background-color: var(--vscode-button-hoverBackground);
                        }
                        
                        .page-lookup-btn.secondary {
                            background-color: var(--vscode-button-secondaryBackground);
                            color: var(--vscode-button-secondaryForeground);
                        }
                        
                        .page-lookup-btn.secondary:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground);
                        }
                        
                        .input-with-lookup {
                            display: flex;
                            gap: 4px;
                            align-items: stretch;
                        }
                        
                        .input-with-lookup textarea {
                            flex: 1;
                        }
                        
                        .lookup-icon-btn {
                            background: none;
                            border: 1px solid var(--vscode-input-border);
                            color: var(--vscode-foreground);
                            cursor: pointer;
                            padding: 4px 6px;
                            border-radius: 3px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 14px;
                            min-width: 24px;
                            height: auto;
                            align-self: flex-start;
                            margin-top: 1px;
                        }
                        
                        .lookup-icon-btn:hover {
                            background-color: var(--vscode-button-secondaryHoverBackground);
                            border-color: var(--vscode-focusBorder);
                        }
                        
                        .lookup-icon-btn:focus {
                            outline: 1px solid var(--vscode-focusBorder);
                            outline-offset: -1px;
                        }
                    </style>
                </head>
                <body>
                    <div class="validation-header">
                        <h2>User Stories - Page Mapping</h2>
                        <p style="margin-top: -5px; margin-bottom: 15px; color: var(--vscode-descriptionForeground);">
                            Only stories that have completed 'Model AI Processing' are listed.
                        </p>
                    </div>

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
                                    <label>Page Mapping:</label>
                                    <input type="text" id="filterPageMapping" placeholder="Filter by page mapping...">
                                </div>
                                <div class="filter-group">
                                    <label>Ignore Pages:</label>
                                    <input type="text" id="filterIgnorePages" placeholder="Filter by ignore pages...">
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                        <div class="header-actions">
                            <button id="bestGuessButton" class="icon-button" title="Generate Best Guess Page Mappings">
                                <i class="codicon codicon-lightbulb"></i>
                            </button>
                            <button id="validateButton" class="icon-button" title="Validate All Page Names">
                                <i class="codicon codicon-check"></i>
                            </button>
                            <button id="exportButton" class="icon-button" title="Download CSV">
                                <i class="codicon codicon-cloud-download"></i>
                            </button>
                            <button id="refreshButton" class="refresh-button" title="Refresh Table">
                                <i class="codicon codicon-refresh"></i>
                            </button>
                        </div>
                    </div>

                    <div id="validationSummary" class="validation-summary" style="display: none;">
                        <h4 id="validationTitle"></h4>
                        <div id="validationContent" class="error-list"></div>
                    </div>

                    <div class="table-container">
                        <table id="pageMappingTable">
                            <thead id="pageMappingTableHead">
                                <!-- Table headers will be dynamically generated -->
                            </thead>
                            <tbody id="pageMappingTableBody">
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

                    <div id="spinner-overlay" class="spinner-overlay" style="display: none;">
                        <div class="spinner"></div>
                    </div>

                    <!-- Page Lookup Modal -->
                    <div id="pageLookupModal" class="page-lookup-modal">
                        <div class="page-lookup-modal-content">
                            <div class="page-lookup-header">
                                <h3>Select Pages</h3>
                                <button class="page-lookup-close" onclick="closePageLookupModal()">
                                    <span class="codicon codicon-close"></span>
                                </button>
                            </div>
                            <div class="page-lookup-body">
                                <div class="page-filter-container">
                                    <input type="text" 
                                           id="pageFilterInput" 
                                           class="page-filter-input" 
                                           placeholder="Filter pages by name, role, or object..." 
                                           onkeyup="filterPageList()">
                                </div>
                                <div class="page-list-container">
                                    <div id="pageListContent">
                                        <!-- Page list will be populated dynamically -->
                                    </div>
                                </div>
                            </div>
                            <div class="page-lookup-footer">
                                <div class="page-lookup-info">
                                    <span id="pageSelectionInfo">0 pages selected</span>
                                </div>
                                <div class="page-lookup-actions">
                                    <button class="page-lookup-btn secondary" onclick="closePageLookupModal()">Cancel</button>
                                    <button class="page-lookup-btn" onclick="applySelectedPages()">Apply Selected</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <script src="${scriptUri}"></script>
                </body>
                </html>
            `;

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'UserStoriesPageMappingWebviewReady':
                            console.log("[Extension] UserStoriesPageMapping webview ready");
                            // Load initial page mapping data
                            await loadUserStoriesPageMappingData(panel, modelService);
                            break;

                        case 'refresh':
                            console.log("[Extension] UserStoriesPageMapping refresh requested");
                            await loadUserStoriesPageMappingData(panel, modelService);
                            break;

                        case 'sortUserStoriesPageMapping':
                            console.log("[Extension] UserStoriesPageMapping sort requested:", message.column, message.descending);
                            await loadUserStoriesPageMappingData(panel, modelService, message.column, message.descending);
                            break;

                        case 'savePageMappingChange':
                            console.log("[Extension] UserStoriesPageMapping change:", message.data);
                            try {
                                // Load current page mapping data
                                const filePath = message.data.mappingFilePath;
                                let mappingData: any = { pageMappings: {} };
                                if (fs.existsSync(filePath)) {
                                    const content = fs.readFileSync(filePath, 'utf8');
                                    mappingData = JSON.parse(content);
                                }
                                if (!mappingData.pageMappings) {
                                    mappingData.pageMappings = {};
                                }

                                // Update the mapping record using story number as key
                                const storyNumber = message.data.storyNumber;
                                if (storyNumber) {
                                    mappingData.pageMappings[storyNumber] = {
                                        pageMapping: message.data.pageMapping,
                                        ignorePages: message.data.ignorePages
                                    };

                                    // Save to file
                                    await savePageMappingData(mappingData.pageMappings, filePath);

                                    // Send success message
                                    panel.webview.postMessage({
                                        command: 'pageMappingChangeSaved',
                                        success: true
                                    });
                                }

                            } catch (error) {
                                console.error("[Extension] Error saving page mapping change:", error);
                                panel.webview.postMessage({
                                    command: 'pageMappingChangeSaved',
                                    success: false,
                                    error: error.message
                                });
                            }
                            break;

                        case 'exportToCSV':
                            console.log("[Extension] UserStoriesPageMapping export requested");
                            try {
                                // Generate CSV content
                                const items = message.data.items || [];
                                const csvHeaders = ['Story Number', 'Story Text', 'Page Mapping', 'Ignore Pages'];
                                const csvRows = [csvHeaders.join(',')];
                                
                                items.forEach((item: any) => {
                                    // Convert arrays to strings for CSV (join with semicolons for readability)
                                    const pageMapping = Array.isArray(item.pageMapping) ? item.pageMapping.join('; ') : (item.pageMapping || '');
                                    const ignorePages = Array.isArray(item.ignorePages) ? item.ignorePages.join('; ') : (item.ignorePages || '');
                                    
                                    const row = [
                                        `"${(item.storyNumber || '').replace(/"/g, '""')}"`,
                                        `"${(item.storyText || '').replace(/"/g, '""')}"`,
                                        `"${pageMapping.replace(/"/g, '""')}"`,
                                        `"${ignorePages.replace(/"/g, '""')}"`
                                    ];
                                    csvRows.push(row.join(','));
                                });

                                const csvContent = csvRows.join('\n');

                                // Send CSV content back to webview for download
                                panel.webview.postMessage({
                                    command: 'csvExportReady',
                                    csvContent: csvContent,
                                    filename: `user-stories-page-mapping-${new Date().toISOString().split('T')[0]}.csv`
                                });

                            } catch (error) {
                                console.error("[Extension] Error exporting page mapping data:", error);
                                panel.webview.postMessage({
                                    command: 'csvExportReady',
                                    success: false,
                                    error: error.message
                                });
                            }
                            break;

                        case 'saveCsvToWorkspace':
                            try {
                                console.log("[Extension] UserStoriesPageMapping saveCsvToWorkspace requested");
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
                                vscode.window.showErrorMessage('Failed to save CSV to workspace: ' + error.message);
                            }
                            break;

                        case 'getModelPageNames':
                            try {
                                console.log("[Extension] Getting model page names for validation");
                                const model = modelService.getCurrentModel();
                                const pageNames: string[] = [];
                                
                                if (model && model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
                                    const namespace = model.namespace[0] as any;
                                    
                                    // Check in object reports
                                    if (namespace.object && Array.isArray(namespace.object)) {
                                        namespace.object.forEach((obj: any) => {
                                            if (obj.report && Array.isArray(obj.report)) {
                                                obj.report.forEach((report: any) => {
                                                    if (report.isPage === "true" && report.name) {
                                                        pageNames.push(report.name);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    
                                    // Also check in object objectWorkflows
                                    if (namespace.object && Array.isArray(namespace.object)) {
                                        namespace.object.forEach((obj: any) => {
                                            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                                                obj.objectWorkflow.forEach((workflow: any) => {
                                                    if (workflow.isPage === "true" && workflow.name) {
                                                        pageNames.push(workflow.name);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                                
                                // Remove duplicates
                                const uniquePageNames = [...new Set(pageNames)];
                                
                                console.log(`[Extension] Found ${pageNames.length} total page names, ${uniquePageNames.length} unique page names`);
                                console.log(`[Extension] Page names:`, uniquePageNames);
                                
                                panel.webview.postMessage({
                                    command: 'modelPageNamesReady',
                                    pageNames: uniquePageNames,
                                    success: true
                                });
                                
                                console.log(`[Extension] Sent ${uniquePageNames.length} unique page names for validation`);
                                
                            } catch (error) {
                                console.error("[Extension] Error getting model page names:", error);
                                panel.webview.postMessage({
                                    command: 'modelPageNamesReady',
                                    success: false,
                                    error: error.message
                                });
                            }
                            break;

                        case 'getDetailedPageList':
                            try {
                                console.log("[Extension] Getting detailed page list for lookup modal");
                                const model = modelService.getCurrentModel();
                                const detailedPages: any[] = [];
                                
                                if (model && model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
                                    const namespace = model.namespace[0] as any;
                                    
                                    // Get pages from objects (data objects)
                                    if (namespace.object && Array.isArray(namespace.object)) {
                                        namespace.object.forEach((obj: any) => {
                                            // Get pages from object reports
                                            if (obj.report && Array.isArray(obj.report)) {
                                                obj.report.forEach((report: any) => {
                                                    if (report.isPage === "true" && report.name) {
                                                        detailedPages.push({
                                                            name: report.name,
                                                            type: 'Report',
                                                            visualizationType: report.visualizationType || 'N/A',
                                                            targetChildObject: report.targetChildObject || 'none',
                                                            roleRequired: report.roleRequired || 'N/A',
                                                            ownerObject: obj.name || 'N/A',
                                                            displayText: `${report.name} (${report.visualizationType || 'Report'}, owner: ${obj.name || 'N/A'}, target: ${report.targetChildObject || 'none'})`
                                                        });
                                                    }
                                                });
                                            }
                                            
                                            // Get pages from object objectWorkflows (forms)
                                            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                                                obj.objectWorkflow.forEach((workflow: any) => {
                                                    if (workflow.isPage === "true" && workflow.name) {
                                                        detailedPages.push({
                                                            name: workflow.name,
                                                            type: 'Form',
                                                            visualizationType: 'Form',
                                                            targetChildObject: 'none',
                                                            roleRequired: workflow.roleRequired || 'N/A',
                                                            ownerObject: obj.name || 'N/A',
                                                            displayText: `${workflow.name} (Form, owner: ${obj.name || 'N/A'})`
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                                
                                // Sort by name for better user experience
                                detailedPages.sort((a, b) => a.name.localeCompare(b.name));
                                
                                console.log(`[Extension] Found ${detailedPages.length} detailed pages for lookup`);
                                
                                panel.webview.postMessage({
                                    command: 'detailedPageListReady',
                                    pages: detailedPages,
                                    success: true
                                });
                                
                            } catch (error) {
                                console.error("[Extension] Error getting detailed page list:", error);
                                panel.webview.postMessage({
                                    command: 'detailedPageListReady',
                                    success: false,
                                    error: error.message
                                });
                            }
                            break;

                        case 'generateBestGuessPageMappings':
                            try {
                                console.log("[Extension] Generating best guess page mappings with hierarchical parent search");
                                const model = modelService.getCurrentModel();
                                const stories = message.data.stories || [];
                                const pageMappings: any[] = [];
                                
                                if (model && model.namespace && Array.isArray(model.namespace) && model.namespace.length > 0) {
                                    const namespace = model.namespace[0] as any;
                                    
                                    // Get all pages from the model
                                    const allPages: any[] = [];
                                    
                                    if (namespace.object && Array.isArray(namespace.object)) {
                                        console.log(`[Extension] Processing ${namespace.object.length} objects for best guess`);
                                        
                                        namespace.object.forEach((obj: any, index: number) => {
                                            console.log(`[Extension] Object ${index}: ${obj.name || 'unnamed'}`);
                                            
                                            // Get pages from object reports
                                            if (obj.report && Array.isArray(obj.report)) {
                                                obj.report.forEach((report: any) => {
                                                    if (report.isPage === "true" && report.name) {
                                                        allPages.push({
                                                            name: report.name,
                                                            type: 'report',
                                                            visualizationType: report.visualizationType,
                                                            targetChildObject: report.targetChildObject,
                                                            roleRequired: report.roleRequired,
                                                            ownerObject: obj.name
                                                        });
                                                    }
                                                });
                                            }
                                            
                                            // Get pages from object objectWorkflows (forms)
                                            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                                                obj.objectWorkflow.forEach((workflow: any) => {
                                                    if (workflow.isPage === "true" && workflow.name) {
                                                        allPages.push({
                                                            name: workflow.name,
                                                            type: 'form',
                                                            ownerObject: obj.name,
                                                            roleRequired: workflow.roleRequired
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    
                                    console.log(`[Extension] Found ${allPages.length} pages in model`);
                                    
                                    // Log all pages for debugging
                                    console.log(`[Extension] All pages found:`, allPages.map(p => `${p.name} (${p.type}, ${p.visualizationType || 'no-viz'}, owner: ${p.ownerObject || 'none'}, target: ${p.targetChildObject || 'none'})`));
                                    
                                    // Process each story
                                    stories.forEach((story: any) => {
                                        const storyText = story.storyText || '';
                                        const storyNumber = story.storyNumber || '';
                                        
                                        // Extract role, action, and object from story
                                        const role = extractRoleFromStory(storyText);
                                        const action = extractActionFromStory(storyText);
                                        const object = extractObjectFromStory(storyText);
                                        
                                        console.log(`[Extension] Story ${storyNumber}: "${storyText}"`);
                                        console.log(`[Extension] Story ${storyNumber}: EXTRACTION DETAILS:`);
                                        console.log(`[Extension] Story ${storyNumber}: - Raw story: "${storyText}"`);
                                        console.log(`[Extension] Story ${storyNumber}: - Extracted role: "${role}"`);
                                        console.log(`[Extension] Story ${storyNumber}: - Extracted action: "${action}"`);
                                        console.log(`[Extension] Story ${storyNumber}: - Extracted object: "${object}"`);
                                        
                                        // Validate extraction with expected results for debugging
                                        if (storyText.includes("view all Org Customers in a Organization")) {
                                            console.log(`[Extension] Story ${storyNumber}: VALIDATION - Expected action="view all", object="Org Customers"`);
                                            console.log(`[Extension] Story ${storyNumber}: VALIDATION - Actual action="${action}", object="${object}"`);
                                            console.log(`[Extension] Story ${storyNumber}: VALIDATION - ${action === "view all" && object === "Org Customers" ? "✅ PASS" : "❌ FAIL"}`);
                                            
                                            // Debug the regex matching with UPDATED pattern
                                            const debugText = storyText.trim().replace(/\s+/g, " ");
                                            const debugRe = /I want to\s+(view all|view|add|update|delete)(?:\s+(?:a|an|all))?\s+/i;
                                            const debugMatch = debugText.match(debugRe);
                                            console.log(`[Extension] Story ${storyNumber}: DEBUG - Normalized text: "${debugText}"`);
                                            console.log(`[Extension] Story ${storyNumber}: DEBUG - UPDATED Regex match result:`, debugMatch);
                                        }
                                        
                                        if (storyText.includes("view all Customer Email Requests in a Customer")) {
                                            console.log(`[Extension] Story ${storyNumber}: VALIDATION - Expected action="view all", object="Customer Email Requests"`);
                                            console.log(`[Extension] Story ${storyNumber}: VALIDATION - Actual action="${action}", object="${object}"`);
                                            console.log(`[Extension] Story ${storyNumber}: VALIDATION - ${action === "view all" && object === "Customer Email Requests" ? "✅ PASS" : "❌ FAIL"}`);
                                        }
                                        
                                        if (storyText.includes("view all Organizations in the application")) {
                                            console.log(`[Extension] Story ${storyNumber}: VALIDATION - Expected action="view all", object="Organizations"`);
                                            console.log(`[Extension] Story ${storyNumber}: VALIDATION - Actual action="${action}", object="${object}"`);
                                            console.log(`[Extension] Story ${storyNumber}: VALIDATION - ${action === "view all" && object === "Organizations" ? "✅ PASS" : "❌ FAIL"}`);
                                        }
                                        
                                        if (storyText.includes("in the application")) {
                                            console.log(`[Extension] Story ${storyNumber}: APPLICATION CONTEXT VALIDATION - Should detect application-level context`);
                                            console.log(`[Extension] Story ${storyNumber}: APPLICATION CONTEXT VALIDATION - isApplicationLevelContext result: ${isApplicationLevelContext(storyText)}`);
                                        }
                                        
                                        console.log(`[Extension] Story ${storyNumber}: role="${role}", action="${action}", object="${object}"`);
                                        
                                        const suggestedPages: string[] = [];
                                        
                                        if (role && action && object) {
                                            // Convert object to different forms for comprehensive matching
                                            const objectCamelCase = convertToCamelCase(object);
                                            const objectSingular = convertToSingular(object);
                                            const objectSingularCamelCase = convertToCamelCase(objectSingular);
                                            console.log(`[Extension] Story ${storyNumber}: Original="${object}", CamelCase="${objectCamelCase}", Singular="${objectSingular}", SingularCamelCase="${objectSingularCamelCase}"`);
                                            
                                            if (action === 'view all') {
                                                console.log(`[Extension] Story ${storyNumber}: Using hierarchical parent search for 'view all' action`);
                                                
                                                // Check if this is an application-level context (e.g., "in the application")
                                                if (isApplicationLevelContext(storyText)) {
                                                    console.log(`[Extension] Story ${storyNumber}: Detected application-level context, searching for top-level parent`);
                                                    
                                                    const allModelObjects = namespace.object || [];
                                                    const topLevelParent = findTopLevelParent(allModelObjects);
                                                    
                                                    if (topLevelParent) {
                                                        console.log(`[Extension] Story ${storyNumber}: Found top-level parent "${topLevelParent.name}" for application-level context`);
                                                        
                                                        // Look for grid reports in the top-level parent that have our target object as targetChildObject
                                                        const topLevelReports = allPages.filter(page => 
                                                            page.type === 'report' && 
                                                            page.ownerObject === topLevelParent.name &&
                                                            page.visualizationType === 'Grid' &&
                                                            ((page.targetChildObject && 
                                                              (page.targetChildObject.toLowerCase() === object.toLowerCase() ||
                                                               page.targetChildObject.toLowerCase() === objectCamelCase.toLowerCase() ||
                                                               page.targetChildObject.toLowerCase() === objectSingular.toLowerCase() ||
                                                               page.targetChildObject.toLowerCase() === objectSingularCamelCase.toLowerCase()))) &&
                                                            (!page.roleRequired || page.roleRequired.toLowerCase() === role.toLowerCase())
                                                        );
                                                        
                                                        console.log(`[Extension] Story ${storyNumber}: Application-level search - looking for owner="${topLevelParent.name}" with targets: "${object}"/"${objectCamelCase}"/"${objectSingular}"/"${objectSingularCamelCase}"`);
                                                        console.log(`[Extension] Story ${storyNumber}: Found ${topLevelReports.length} matching reports in "${topLevelParent.name}":`, topLevelReports.map(p => `${p.name} (target: ${p.targetChildObject})`));
                                                        
                                                        if (topLevelReports.length > 0) {
                                                            console.log(`[Extension] Story ${storyNumber}: Found ${topLevelReports.length} grid reports in top-level parent "${topLevelParent.name}"`);
                                                            topLevelReports.forEach(page => suggestedPages.push(page.name));
                                                        } else {
                                                            console.log(`[Extension] Story ${storyNumber}: No grid reports found in top-level parent "${topLevelParent.name}", trying other top-level objects`);
                                                            
                                                            // Also try other common top-level objects like Tac if Pac didn't work
                                                            const otherTopLevelNames = ['Tac', 'Pac', 'Application', 'App'].filter(name => name !== topLevelParent.name);
                                                            for (const altName of otherTopLevelNames) {
                                                                const altReports = allPages.filter(page => 
                                                                    page.type === 'report' && 
                                                                    page.visualizationType === 'Grid' &&
                                                                    page.ownerObject === altName &&
                                                                    page.targetChildObject && 
                                                                    (page.targetChildObject.toLowerCase() === object.toLowerCase() ||
                                                                     page.targetChildObject.toLowerCase() === objectCamelCase.toLowerCase() ||
                                                                     page.targetChildObject.toLowerCase() === objectSingular.toLowerCase() ||
                                                                     page.targetChildObject.toLowerCase() === objectSingularCamelCase.toLowerCase()) &&
                                                                    (!page.roleRequired || page.roleRequired.toLowerCase() === role.toLowerCase())
                                                                );
                                                                
                                                                if (altReports.length > 0) {
                                                                    console.log(`[Extension] Story ${storyNumber}: Found ${altReports.length} grid reports in alternative top-level object "${altName}":`, altReports.map(p => `${p.name} (target: ${p.targetChildObject})`));
                                                                    altReports.forEach(page => suggestedPages.push(page.name));
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                        console.log(`[Extension] Story ${storyNumber}: No top-level parent found for application-level context`);
                                                    }
                                                } else {
                                                    // Normal hierarchical parent search
                                                    console.log(`[Extension] Story ${storyNumber}: Using normal hierarchical parent search`);
                                                
                                                // For 'view all', traverse up the parent hierarchy to find reports
                                                const allModelObjects = namespace.object || [];
                                                
                                                console.log(`[Extension] Story ${storyNumber}: Searching for object in ${allModelObjects.length} model objects`);
                                                console.log(`[Extension] Story ${storyNumber}: Model object names:`, allModelObjects.map(obj => obj.name));
                                                console.log(`[Extension] Story ${storyNumber}: Looking for object forms: "${object}", "${objectCamelCase}", "${objectSingular}", "${objectSingularCamelCase}"`);
                                                
                                                // Get parent hierarchy for all forms of the object name
                                                const parentHierarchy = getParentHierarchy(object, allModelObjects);
                                                const parentHierarchyCamelCase = getParentHierarchy(objectCamelCase, allModelObjects);
                                                const parentHierarchySingular = getParentHierarchy(objectSingular, allModelObjects);
                                                const parentHierarchySingularCamelCase = getParentHierarchy(objectSingularCamelCase, allModelObjects);
                                                
                                                // Combine all hierarchies and remove duplicates
                                                const combinedParents = [...parentHierarchy];
                                                [parentHierarchyCamelCase, parentHierarchySingular, parentHierarchySingularCamelCase].forEach(hierarchy => {
                                                    hierarchy.forEach(parent => {
                                                        if (!combinedParents.find(p => p.name === parent.name)) {
                                                            combinedParents.push(parent);
                                                        }
                                                    });
                                                });
                                                
                                                console.log(`[Extension] Story ${storyNumber}: Parent hierarchy for "${object}":`, combinedParents.map(p => p.name));
                                                
                                                // Search through each parent level for grid reports
                                                let foundReports = false;
                                                for (const parentObj of combinedParents) {
                                                    console.log(`[Extension] Story ${storyNumber}: Checking parent "${parentObj.name}" for grid reports`);
                                                    
                                                    // Look for grid reports in this parent object that have our target object as targetChildObject
                                                    // Try all forms: plural, singular, camelCase versions
                                                    const parentReports = allPages.filter(page => 
                                                        page.type === 'report' && 
                                                        page.ownerObject === parentObj.name &&
                                                        page.visualizationType === 'grid' &&
                                                        ((page.targetChildObject && 
                                                          (page.targetChildObject.toLowerCase() === object.toLowerCase() ||
                                                           page.targetChildObject.toLowerCase() === objectCamelCase.toLowerCase() ||
                                                           page.targetChildObject.toLowerCase() === objectSingular.toLowerCase() ||
                                                           page.targetChildObject.toLowerCase() === objectSingularCamelCase.toLowerCase()))) &&
                                                        (!page.roleRequired || page.roleRequired.toLowerCase() === role.toLowerCase())
                                                    );
                                                    
                                                    if (parentReports.length > 0) {
                                                        console.log(`[Extension] Story ${storyNumber}: Found ${parentReports.length} grid reports in parent "${parentObj.name}"`);
                                                        parentReports.forEach(page => suggestedPages.push(page.name));
                                                        foundReports = true;
                                                        break; // Found reports at this level, stop searching higher
                                                    }
                                                    
                                                    console.log(`[Extension] Story ${storyNumber}: No grid reports found in parent "${parentObj.name}", checking next parent level`);
                                                }
                                                
                                                if (!foundReports) {
                                                    console.log(`[Extension] Story ${storyNumber}: No grid reports found in parent hierarchy, trying fallback matching`);
                                                    console.log(`[Extension] Story ${storyNumber}: Searching ${allPages.length} pages for direct target/owner matches`);
                                                    console.log(`[Extension] Story ${storyNumber}: Target objects needed: "${object}" / "${objectCamelCase}" / "${objectSingular}" / "${objectSingularCamelCase}"`);
                                                    
                                                    // Log available target objects for debugging
                                                    const allTargets = allPages.filter(p => p.targetChildObject).map(p => `${p.name}→${p.targetChildObject}`);
                                                    console.log(`[Extension] Story ${storyNumber}: Available target objects:`, allTargets);
                                                    
                                                    // Fall back to any grid reports that match (try all forms)
                                                    const fallbackReports = allPages.filter(page => 
                                                        page.type === 'report' && 
                                                        page.visualizationType === 'Grid' &&
                                                        ((page.targetChildObject && 
                                                          (page.targetChildObject.toLowerCase() === object.toLowerCase() ||
                                                           page.targetChildObject.toLowerCase() === objectCamelCase.toLowerCase() ||
                                                           page.targetChildObject.toLowerCase() === objectSingular.toLowerCase() ||
                                                           page.targetChildObject.toLowerCase() === objectSingularCamelCase.toLowerCase())) ||
                                                         (page.ownerObject && 
                                                          (page.ownerObject.toLowerCase() === object.toLowerCase() ||
                                                           page.ownerObject.toLowerCase() === objectCamelCase.toLowerCase() ||
                                                           page.ownerObject.toLowerCase() === objectSingular.toLowerCase() ||
                                                           page.ownerObject.toLowerCase() === objectSingularCamelCase.toLowerCase()))) &&
                                                        (!page.roleRequired || page.roleRequired.toLowerCase() === role.toLowerCase())
                                                    );
                                                    
                                                    console.log(`[Extension] Story ${storyNumber}: Found ${fallbackReports.length} fallback reports:`, fallbackReports.map(p => `${p.name} (owner: ${p.ownerObject}, target: ${p.targetChildObject})`));
                                                    fallbackReports.forEach(page => suggestedPages.push(page.name));
                                                }
                                                } // End of normal hierarchical search
                                                
                                            } else if (action === 'view') {
                                                // For 'view' action, use standard matching for DetailThreeColumn reports
                                                console.log(`[Extension] Story ${storyNumber}: Using standard matching for 'view' action`);
                                                
                                                const viewReports = allPages.filter(page => 
                                                    page.type === 'report' && 
                                                    page.visualizationType === 'DetailThreeColumn' &&
                                                    ((page.targetChildObject && 
                                                      (page.targetChildObject.toLowerCase() === object.toLowerCase() ||
                                                       page.targetChildObject.toLowerCase() === objectCamelCase.toLowerCase() ||
                                                       page.targetChildObject.toLowerCase() === objectSingular.toLowerCase() ||
                                                       page.targetChildObject.toLowerCase() === objectSingularCamelCase.toLowerCase())) ||
                                                     (page.ownerObject && 
                                                      (page.ownerObject.toLowerCase() === object.toLowerCase() ||
                                                       page.ownerObject.toLowerCase() === objectCamelCase.toLowerCase() ||
                                                       page.ownerObject.toLowerCase() === objectSingular.toLowerCase() ||
                                                       page.ownerObject.toLowerCase() === objectSingularCamelCase.toLowerCase()))) &&
                                                    (!page.roleRequired || page.roleRequired.toLowerCase() === role.toLowerCase())
                                                );
                                                viewReports.forEach(page => suggestedPages.push(page.name));
                                                
                                            } else if (action === 'add' || action === 'update') {
                                                // For forms, use standard matching with all forms
                                                console.log(`[Extension] Story ${storyNumber}: Looking for forms for ${action} action`);
                                                
                                                const formPages = allPages.filter(page => 
                                                    page.type === 'form' && 
                                                    page.ownerObject && 
                                                    (page.ownerObject.toLowerCase() === object.toLowerCase() ||
                                                     page.ownerObject.toLowerCase() === objectCamelCase.toLowerCase() ||
                                                     page.ownerObject.toLowerCase() === objectSingular.toLowerCase() ||
                                                     page.ownerObject.toLowerCase() === objectSingularCamelCase.toLowerCase()) &&
                                                    (!page.roleRequired || page.roleRequired.toLowerCase() === role.toLowerCase())
                                                );
                                                formPages.forEach(page => suggestedPages.push(page.name));
                                            }
                                        }
                                        
                                        // Comprehensive logging for debugging
                                        console.log(`[Extension] Story ${storyNumber}: FINAL RESULT - Found ${suggestedPages.length} suggested pages:`, suggestedPages);
                                        if (suggestedPages.length === 0) {
                                            console.log(`[Extension] Story ${storyNumber}: NO MATCHES FOUND for action="${action}", object="${object}"`);
                                        }
                                        
                                        pageMappings.push({
                                            storyNumber: storyNumber,
                                            role: role,
                                            action: action,
                                            object: object,
                                            suggestedPages: suggestedPages
                                        });
                                    });
                                }
                                
                                panel.webview.postMessage({
                                    command: 'bestGuessPageMappingsReady',
                                    mappings: pageMappings,
                                    success: true
                                });
                                
                                console.log(`[Extension] Generated best guess for ${pageMappings.length} stories with hierarchical parent search`);
                                
                                // Log summary of all mappings for debugging
                                console.log(`[Extension] BEST GUESS SUMMARY:`);
                                pageMappings.forEach((mapping, index) => {
                                    console.log(`[Extension] ${index + 1}. Story ${mapping.storyNumber}: action="${mapping.action}", object="${mapping.object}" → ${mapping.suggestedPages.length} pages: [${mapping.suggestedPages.join(', ')}]`);
                                });
                                
                            } catch (error) {
                                console.error("[Extension] Error generating best guess page mappings:", error);
                                panel.webview.postMessage({
                                    command: 'bestGuessPageMappingsReady',
                                    success: false,
                                    error: error.message
                                });
                            }
                            break;

                        case 'showNotification':
                            try {
                                const notificationType = message.data.type || 'info';
                                const notificationMessage = message.data.message || '';
                                
                                if (notificationType === 'info') {
                                    vscode.window.showInformationMessage(notificationMessage);
                                } else if (notificationType === 'warning') {
                                    vscode.window.showWarningMessage(notificationMessage);
                                } else if (notificationType === 'error') {
                                    vscode.window.showErrorMessage(notificationMessage);
                                }
                                
                            } catch (error) {
                                console.error("[Extension] Error showing notification:", error);
                            }
                            break;

                        default:
                            console.log("[Extension] Unknown command:", message.command);
                            break;
                    }
                }
            );
        })
    );
}
