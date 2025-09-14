// Description: Handles registration of metrics analysis view related commands.
// Created: September 14, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the metrics analysis view
const metricsAnalysisPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the metrics analysis panel if it's open
 */
export function getMetricsAnalysisPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('metricsAnalysis') && metricsAnalysisPanel.context && metricsAnalysisPanel.modelService) {
        return {
            type: 'metricsAnalysis',
            context: metricsAnalysisPanel.context,
            modelService: metricsAnalysisPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the metrics analysis panel if it's open
 */
export function closeMetricsAnalysisPanel(): void {
    console.log(`Closing metrics analysis panel if open`);
    const panel = activePanels.get('metricsAnalysis');
    if (panel) {
        panel.dispose();
        activePanels.delete('metricsAnalysis');
    }
    // Clean up panel reference
    metricsAnalysisPanel.panel = null;
}

/**
 * Registers the metrics analysis command
 */
export function registerMetricsAnalysisCommands(context: vscode.ExtensionContext, modelService: ModelService) {
    
    // Register the show metrics analysis command
    const metricsAnalysisCommand = vscode.commands.registerCommand('appdna.metricsAnalysis', () => {
        console.log('Metrics analysis command executed');
        
        // Check if we already have a metrics analysis panel open
        if (activePanels.has('metricsAnalysis')) {
            // Focus the existing panel
            const existingPanel = activePanels.get('metricsAnalysis');
            if (existingPanel) {
                existingPanel.reveal();
                return;
            }
        }
        
        // Create and show new panel
        const panel = vscode.window.createWebviewPanel(
            'metricsAnalysis',
            'Analysis - Metrics',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media')),
                    vscode.Uri.file(path.join(context.extensionPath, 'src')),
                    vscode.Uri.file(path.join(context.extensionPath, 'node_modules', '@vscode', 'codicons'))
                ]
            }
        );

        // Store references
        activePanels.set('metricsAnalysis', panel);
        metricsAnalysisPanel.panel = panel;
        metricsAnalysisPanel.context = context;
        metricsAnalysisPanel.modelService = modelService;

        // Set the HTML content
        panel.webview.html = getMetricsAnalysisWebviewContent(panel.webview, context.extensionPath);

        // Handle dispose
        panel.onDidDispose(() => {
            activePanels.delete('metricsAnalysis');
            metricsAnalysisPanel.panel = null;
            metricsAnalysisPanel.context = null;
            metricsAnalysisPanel.modelService = null;
        });

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            console.log('Metrics analysis received message:', message);
            
            switch (message.command) {
                case 'getCurrentMetrics':
                    // Get current metrics data
                    const currentMetrics = getCurrentMetricsData(modelService);
                    
                    // Update metric history with current values
                    updateMetricHistory(currentMetrics, modelService);
                    
                    panel.webview.postMessage({
                        command: 'currentMetricsData',
                        data: currentMetrics
                    });
                    break;
                
                case 'getHistoryMetrics':
                    // Get historical metrics data
                    const historyMetrics = getHistoryMetricsData(modelService);
                    panel.webview.postMessage({
                        command: 'historyMetricsData',
                        data: historyMetrics
                    });
                    break;
                
                case 'exportToCSV':
                    console.log("[Extension] Metrics CSV export requested");
                    try {
                        const csvContent = await saveMetricsToCSV(message.data.items, modelService);
                        const now = new Date();
                        const pad = (n: number) => n.toString().padStart(2, '0');
                        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                        const filename = `metrics-analysis-${timestamp}.csv`;
                        
                        panel.webview.postMessage({
                            command: 'csvExportReady',
                            csvContent: csvContent,
                            filename: filename,
                            success: true
                        });
                    } catch (error) {
                        console.error('[Extension] Error exporting metrics CSV:', error);
                        panel.webview.postMessage({
                            command: 'csvExportReady',
                            success: false,
                            error: error.message
                        });
                    }
                    break;

                case 'saveCsvToWorkspace':
                    try {
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        
                        if (!workspaceFolders || workspaceFolders.length === 0) {
                            vscode.window.showErrorMessage('No workspace folder is open');
                            return;
                        }
                        
                        const workspaceRoot = workspaceFolders[0].uri.fsPath;
                        const filePath = path.join(workspaceRoot, message.data.filename);
                        
                        fs.writeFileSync(filePath, message.data.content, 'utf8');
                        vscode.window.showInformationMessage(`CSV file saved to workspace: ${message.data.filename}`);
                        
                        // Open the file in VS Code
                        const fileUri = vscode.Uri.file(filePath);
                        vscode.window.showTextDocument(fileUri);
                    } catch (error) {
                        console.error('[Extension] Error saving CSV to workspace:', error);
                        vscode.window.showErrorMessage(`Failed to save CSV: ${error.message}`);
                    }
                    break;
            }
        });
    });

    context.subscriptions.push(metricsAnalysisCommand);
}

/**
 * Convert display text to snake_case name
 */
function toSnakeCase(displayText: string): string {
    return displayText
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Load metric history from file
 */
function loadMetricHistory(modelService: ModelService): any {
    try {
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            return { metrics: [] };
        }
        
        const historyFilePath = path.join(path.dirname(modelFilePath), 'app-dna-analysis-metric-history.json');
        
        if (fs.existsSync(historyFilePath)) {
            const historyContent = fs.readFileSync(historyFilePath, 'utf8');
            return JSON.parse(historyContent);
        }
        
        return { metrics: [] };
    } catch (error) {
        console.error('Error loading metric history:', error);
        return { metrics: [] };
    }
}

/**
 * Save metric history to file
 */
function saveMetricHistory(historyData: any, modelService: ModelService): void {
    try {
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            return;
        }
        
        const historyFilePath = path.join(path.dirname(modelFilePath), 'app-dna-analysis-metric-history.json');
        fs.writeFileSync(historyFilePath, JSON.stringify(historyData, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving metric history:', error);
    }
}

/**
 * Update metric history with current values
 */
function updateMetricHistory(currentMetrics: any[], modelService: ModelService): void {
    try {
        const historyData = loadMetricHistory(modelService);
        const currentDateTime = new Date().toISOString();
        
        // Create a lookup for existing metrics
        const existingMetrics = new Map<string, any>();
        historyData.metrics.forEach((metric: any) => {
            existingMetrics.set(metric.name, metric);
        });
        
        // Process each current metric
        currentMetrics.forEach((currentMetric: any) => {
            const name = toSnakeCase(currentMetric.name);
            const displayText = currentMetric.name;
            const currentValue = currentMetric.value;
            
            let metricEntry = existingMetrics.get(name);
            
            if (!metricEntry) {
                // Create new metric entry and add initial history entry
                metricEntry = {
                    name: name,
                    display_text: displayText,
                    current_value: currentValue,
                    value_history: [
                        {
                            utc_date_time: currentDateTime,
                            value: currentValue
                        }
                    ]
                };
                historyData.metrics.push(metricEntry);
                existingMetrics.set(name, metricEntry);
                
                console.log(`[Extension] New metric created with initial history: ${displayText} = ${currentValue}`);
            } else {
                // Update display text in case it changed
                metricEntry.display_text = displayText;
                
                // Check if value has changed
                if (metricEntry.current_value !== currentValue) {
                    // Add to history
                    metricEntry.value_history.push({
                        utc_date_time: currentDateTime,
                        value: currentValue
                    });
                    
                    // Update current value
                    const previousValue = metricEntry.current_value;
                    metricEntry.current_value = currentValue;
                    
                    console.log(`[Extension] Metric history updated for ${displayText}: ${previousValue} -> ${currentValue}`);
                }
            }
        });
        
        // Save updated history
        saveMetricHistory(historyData, modelService);
        
    } catch (error) {
        console.error('Error updating metric history:', error);
    }
}

/**
 * Save metrics data to CSV file
 */
async function saveMetricsToCSV(items: any[], modelService: ModelService): Promise<string> {
    try {
        // Create CSV content
        const csvHeader = 'Metric Name,Value\n';
        const csvRows = items.map(item => {
            const name = (item.name || '').replace(/"/g, '""');
            const value = (item.value || '').replace(/"/g, '""');
            return `"${name}","${value}"`;
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        return csvContent;
    } catch (error) {
        console.error("[Extension] Error creating metrics CSV:", error);
        throw error;
    }
}

/**
 * Extracts the role name from a user story text.
 * @param text User story text
 * @returns The extracted role name or null if not found
 */
function extractRoleFromUserStory(text: string): string | null {
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
 * Gets current metrics data from the model
 */
function getCurrentMetricsData(modelService: ModelService): any[] {
    const metrics = [];
    
    // Data Object Count metric
    const dataObjectCount = modelService.getAllObjects().length;
    metrics.push({
        name: 'Data Object Count',
        value: dataObjectCount.toString()
    });
    
    // Page Count metric (forms with isPage=true + reports with isPage=true or undefined)
    const allObjects = modelService.getAllObjects();
    let pageCount = 0;
    
    allObjects.forEach((obj: any) => {
        // Count forms (object workflows with isPage=true)
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            obj.objectWorkflow.forEach((workflow: any) => {
                if (workflow.isPage === "true") {
                    pageCount++;
                }
            });
        }
        
        // Count reports (with isPage=true or undefined)
        if (obj.report && Array.isArray(obj.report)) {
            obj.report.forEach((report: any) => {
                if (report.isPage === "true" || report.isPage === undefined) {
                    pageCount++;
                }
            });
        }
    });
    
    metrics.push({
        name: 'Page Count',
        value: pageCount.toString()
    });
    
    // Report Count metric
    const reportCount = modelService.getAllReports().length;
    metrics.push({
        name: 'Report Count',
        value: reportCount.toString()
    });
    
    // Form Count metric (object workflows with isPage=true)
    const formCount = modelService.getAllPageObjectWorkflows().length;
    metrics.push({
        name: 'Form Count',
        value: formCount.toString()
    });
    
    // Page Init Count metric (workflows ending with 'initreport' or 'initobjwf')
    let pageInitCount = 0;
    allObjects.forEach((obj: any) => {
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            obj.objectWorkflow.forEach((workflow: any) => {
                if (workflow.name) {
                    const workflowName = workflow.name.toLowerCase();
                    if (workflowName.endsWith('initreport') || workflowName.endsWith('initobjwf')) {
                        pageInitCount++;
                    }
                }
            });
        }
    });
    
    metrics.push({
        name: 'Page Init Count',
        value: pageInitCount.toString()
    });
    
    // General Flow Count metric (workflows that meet specific criteria)
    let generalFlowCount = 0;
    allObjects.forEach((obj: any) => {
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            obj.objectWorkflow.forEach((workflow: any) => {
                if (workflow.name) {
                    const workflowName = workflow.name.toLowerCase();
                    
                    // Check all criteria (matching tree view logic exactly):
                    // 1. isDynaFlow property does not exist or is false
                    const isDynaFlowOk = !workflow.isDynaFlow || workflow.isDynaFlow === "false";
                    
                    // 2. isDynaFlowTask property does not exist or is false  
                    const isDynaFlowTaskOk = !workflow.isDynaFlowTask || workflow.isDynaFlowTask === "false";
                    
                    // 3. isPage property is false (matching tree view property check)
                    const isPageOk = workflow.isPage === "false";
                    
                    // 4. name does not end with initobjwf (matching tree view endsWith check)
                    const notInitObjWf = !workflowName.endsWith('initobjwf');
                    
                    // 5. name does not end with initreport
                    const notInitReport = !workflowName.endsWith('initreport');
                    
                    // All criteria must be true
                    if (isDynaFlowOk && isDynaFlowTaskOk && isPageOk && notInitObjWf && notInitReport) {
                        generalFlowCount++;
                    }
                }
            });
        }
    });
    
    metrics.push({
        name: 'General Flow Count',
        value: generalFlowCount.toString()
    });
    
    // Workflow Count metric (workflows where isDynaFlow is true)
    let workflowCount = 0;
    allObjects.forEach((obj: any) => {
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            obj.objectWorkflow.forEach((workflow: any) => {
                if (workflow.name && workflow.isDynaFlow === "true") {
                    workflowCount++;
                }
            });
        }
    });
    
    metrics.push({
        name: 'Workflow Count',
        value: workflowCount.toString()
    });
    
    // Workflow Task Count metric (workflows where isDynaFlowTask is true)
    let workflowTaskCount = 0;
    allObjects.forEach((obj: any) => {
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            obj.objectWorkflow.forEach((workflow: any) => {
                if (workflow.name && workflow.isDynaFlowTask === "true") {
                    workflowTaskCount++;
                }
            });
        }
    });
    
    metrics.push({
        name: 'Workflow Task Count',
        value: workflowTaskCount.toString()
    });
    
    // User Story Count metric
    const currentModel = modelService.getCurrentModel();
    let userStoryCount = 0;
    if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
        const namespace = currentModel.namespace[0];
        if (namespace.userStory && Array.isArray(namespace.userStory)) {
            userStoryCount = namespace.userStory.length;
        }
    }
    
    metrics.push({
        name: 'User Story Count',
        value: userStoryCount.toString()
    });
    
    // User Story Role Requirement Assignment Count metric (role requirements that are not 'Unassigned')
    let userStoryRoleAssignmentCount = 0;
    if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
        const namespace = currentModel.namespace[0];
        
        // Get all roles from the 'Role' data object's lookup items
        const roles = new Set<string>();
        if (namespace.object && Array.isArray(namespace.object)) {
            namespace.object.forEach((obj: any) => {
                if (obj.name && obj.name.toLowerCase() === 'role') {
                    // Get roles from the Role data object's lookup items
                    if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                        obj.lookupItem.forEach((item: any) => {
                            if (item.name && item.name.toLowerCase() !== 'unknown') {
                                roles.add(item.name);
                            }
                        });
                    }
                }
            });
        }
        
        // Get all data objects (non-lookup objects)
        const dataObjects: any[] = [];
        if (namespace.object && Array.isArray(namespace.object)) {
            namespace.object.forEach((obj: any) => {
                if (obj.isLookup !== "true") {
                    dataObjects.push({
                        name: obj.name,
                        id: obj.id || obj.name || ''
                    });
                }
            });
        }
        
        // Get role requirements from app-dna-user-story-role-requirements.json file
        const modelFilePath = ModelService.getInstance().getCurrentFilePath();
        if (modelFilePath) {
            const requirementsFilePath = path.join(path.dirname(modelFilePath), 'app-dna-user-story-role-requirements.json');
            if (fs.existsSync(requirementsFilePath)) {
                try {
                    const requirementsContent = fs.readFileSync(requirementsFilePath, 'utf8');
                    const requirementsData = JSON.parse(requirementsContent);
                    
                    if (requirementsData.roleRequirements && Array.isArray(requirementsData.roleRequirements)) {
                        const requirementsLookup = new Map<string, string>();
                        requirementsData.roleRequirements.forEach((req: any) => {
                            const key = `${req.role}|${req.dataObject}|${req.action}`;
                            requirementsLookup.set(key, req.access);
                        });
                        
                        // Count role requirements that are not 'Unassigned'
                        const actions = ['View All', 'View', 'Add', 'Update', 'Delete'];
                        Array.from(roles).forEach(role => {
                            // Skip 'Unknown' roles (same logic as role requirements view)
                            if (role && role.toLowerCase() === 'unknown') {
                                return;
                            }
                            
                            dataObjects.forEach(dataObject => {
                                actions.forEach(action => {
                                    const key = `${role}|${dataObject.name}|${action}`;
                                    const access = requirementsLookup.get(key) || 'Unassigned';
                                    if (access !== 'Unassigned') {
                                        userStoryRoleAssignmentCount++;
                                    }
                                });
                            });
                        });
                    }
                } catch (error) {
                    console.error('Error reading requirements.json:', error);
                }
            }
        }
    }
    
    metrics.push({
        name: 'User Story Role Requirement Assignment Count',
        value: userStoryRoleAssignmentCount.toString()
    });
    
    // User Story Role Requirement Not Assigned Count metric (role requirements that are 'Unassigned')
    let userStoryRoleNotAssignedCount = 0;
    if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
        const namespace = currentModel.namespace[0];
        
        // Get all roles from the 'Role' data object's lookup items
        const roles = new Set<string>();
        if (namespace.object && Array.isArray(namespace.object)) {
            namespace.object.forEach((obj: any) => {
                if (obj.name && obj.name.toLowerCase() === 'role') {
                    // Get roles from the Role data object's lookup items
                    if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                        obj.lookupItem.forEach((item: any) => {
                            if (item.name && item.name.toLowerCase() !== 'unknown') {
                                roles.add(item.name);
                            }
                        });
                    }
                }
            });
        }
        
        // Get all data objects (non-lookup objects)
        const dataObjects: any[] = [];
        if (namespace.object && Array.isArray(namespace.object)) {
            namespace.object.forEach((obj: any) => {
                if (obj.isLookup !== "true") {
                    dataObjects.push({
                        name: obj.name,
                        id: obj.id || obj.name || ''
                    });
                }
            });
        }
        
        // Get role requirements from app-dna-user-story-role-requirements.json file
        const modelFilePath = ModelService.getInstance().getCurrentFilePath();
        if (modelFilePath) {
            const requirementsFilePath = path.join(path.dirname(modelFilePath), 'app-dna-user-story-role-requirements.json');
            if (fs.existsSync(requirementsFilePath)) {
                try {
                    const requirementsContent = fs.readFileSync(requirementsFilePath, 'utf8');
                    const requirementsData = JSON.parse(requirementsContent);
                    
                    if (requirementsData.roleRequirements && Array.isArray(requirementsData.roleRequirements)) {
                        const requirementsLookup = new Map<string, string>();
                        requirementsData.roleRequirements.forEach((req: any) => {
                            const key = `${req.role}|${req.dataObject}|${req.action}`;
                            requirementsLookup.set(key, req.access);
                        });
                        
                        // Count role requirements that are 'Unassigned'
                        const actions = ['View All', 'View', 'Add', 'Update', 'Delete'];
                        Array.from(roles).forEach(role => {
                            // Skip 'Unknown' roles (same logic as role requirements view)
                            if (role && role.toLowerCase() === 'unknown') {
                                return;
                            }
                            
                            dataObjects.forEach(dataObject => {
                                actions.forEach(action => {
                                    const key = `${role}|${dataObject.name}|${action}`;
                                    const access = requirementsLookup.get(key) || 'Unassigned';
                                    if (access === 'Unassigned') {
                                        userStoryRoleNotAssignedCount++;
                                    }
                                });
                            });
                        });
                    }
                } catch (error) {
                    console.error('Error reading app-dna-user-story-role-requirements.json:', error);
                }
            }
        }
    }
    
    metrics.push({
        name: 'User Story Role Requirement Not Assigned Count',
        value: userStoryRoleNotAssignedCount.toString()
    });
    
    // Role Count metric
    let roleCount = 0;
    if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
        const namespace = currentModel.namespace[0];
        
        // Get all roles from the 'Role' data object's lookup items (same logic as role requirements)
        const roles = new Set<string>();
        if (namespace.object && Array.isArray(namespace.object)) {
            namespace.object.forEach((obj: any) => {
                if (obj.name && obj.name.toLowerCase() === 'role') {
                    // Get roles from the Role data object's lookup items
                    if (obj.lookupItem && Array.isArray(obj.lookupItem)) {
                        obj.lookupItem.forEach((item: any) => {
                            if (item.name && item.name.toLowerCase() !== 'unknown') {
                                roles.add(item.name);
                            }
                        });
                    }
                }
            });
        }
        
        roleCount = roles.size;
    }
    
    metrics.push({
        name: 'Role Count',
        value: roleCount.toString()
    });
    
    // Lookup Data Object Count metric
    let lookupDataObjectCount = 0;
    if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
        const namespace = currentModel.namespace[0];
        
        if (namespace.object && Array.isArray(namespace.object)) {
            namespace.object.forEach((obj: any) => {
                if (obj.isLookup === "true") {
                    lookupDataObjectCount++;
                }
            });
        }
    }
    
    metrics.push({
        name: 'Lookup Data Object Count',
        value: lookupDataObjectCount.toString()
    });
    
    // Non-Lookup Data Object Count metric
    let nonLookupDataObjectCount = 0;
    if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
        const namespace = currentModel.namespace[0];
        
        if (namespace.object && Array.isArray(namespace.object)) {
            namespace.object.forEach((obj: any) => {
                if (obj.isLookup !== "true") {
                    nonLookupDataObjectCount++;
                }
            });
        }
    }
    
    metrics.push({
        name: 'Non-Lookup Data Object Count',
        value: nonLookupDataObjectCount.toString()
    });
    
    return metrics;
}

/**
 * Gets historical metrics data from the history file
 */
function getHistoryMetricsData(modelService: ModelService): any[] {
    try {
        const historyData = loadMetricHistory(modelService);
        
        // Transform the data for the history view
        const historyItems: any[] = [];
        
        historyData.metrics.forEach((metric: any) => {
            if (metric.value_history && metric.value_history.length > 0) {
                metric.value_history.forEach((historyEntry: any) => {
                    historyItems.push({
                        metric_name: metric.display_text,
                        date: historyEntry.utc_date_time,
                        value: historyEntry.value
                    });
                });
            }
        });
        
        // Sort by date (newest first)
        historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return historyItems;
    } catch (error) {
        console.error('Error getting history metrics data:', error);
        return [];
    }
}

/**
 * Creates the HTML content for the metrics analysis webview
 */
function getMetricsAnalysisWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    // Get the local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.file(path.join(extensionPath, 'src', 'webviews', 'metricsAnalysisView.js'));
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    
    // Get the local path to codicons
    const codiconsPath = vscode.Uri.file(path.join(extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'));
    const codiconsUri = webview.asWebviewUri(codiconsPath);
    
    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}' https://cdn.jsdelivr.net; font-src ${webview.cspSource};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${codiconsUri}" rel="stylesheet">
    <script nonce="${nonce}" src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <script nonce="${nonce}" src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
    <title>Analysis - Metrics</title>
    
    <style nonce="${nonce}">
        body {
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
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
        
        /* Tab styling following form details pattern */
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
        
        /* Filter section styling following user journey pattern */
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
            padding: 6px 14px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
        }
        
        .filter-button-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        /* Header actions */
        .header-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .icon-button {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            padding: 5px;
            border-radius: 3px;
            cursor: pointer;
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
        
        /* Table styling */
        .table-container {
            overflow-x: auto;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: var(--vscode-editor-background);
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        th {
            background-color: var(--vscode-list-hoverBackground);
            font-weight: 600;
            cursor: pointer;
            user-select: none;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        th:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .sort-indicator {
            margin-left: 5px;
            opacity: 0.5;
            font-size: 12px;
        }
        
        .sort-indicator.active {
            opacity: 1;
            color: var(--vscode-focusBorder);
        }
        
        /* Table footer */
        .table-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            margin-top: 10px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .table-footer-right {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        
        .loading {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        /* Utility classes for show/hide */
        .hidden {
            display: none !important;
        }
        
        .show-block {
            display: block !important;
        }
        
        .show-flex {
            display: flex !important;
        }
        
        /* Spinner overlay */
        .spinner-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--vscode-panel-border);
            border-top: 4px solid var(--vscode-focusBorder);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Chart styling */
        .chart-container {
            margin: 20px 0;
            padding: 20px;
            background-color: var(--vscode-sideBar-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        #metricsChart {
            width: 100% !important;
            height: 400px !important;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
        }
        
        /* Date range selector styling */
        .date-range-container {
            margin: 20px 0 10px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .date-range-container label {
            color: var(--vscode-foreground);
            font-weight: 500;
            margin-right: 5px;
        }
        
        .date-range-select {
            padding: 6px 12px;
            background-color: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 3px;
            font-size: var(--vscode-font-size);
            font-family: var(--vscode-font-family);
            min-width: 120px;
            cursor: pointer;
        }
        
        .date-range-select:hover {
            background-color: var(--vscode-dropdown-listBackground);
        }
        
        .date-range-select:focus {
            outline: 1px solid var(--vscode-focusBorder);
            border-color: var(--vscode-focusBorder);
        }
        
        /* Metrics selection styling */
        .metrics-selection {
            margin: 20px 0;
            padding: 15px;
            background-color: var(--vscode-sideBar-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .metrics-selection h3 {
            margin: 0 0 15px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-editor-foreground);
        }
        
        .checkbox-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 8px;
        }
        
        .metric-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .metric-checkbox:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .metric-checkbox input[type="checkbox"] {
            margin: 0;
            cursor: pointer;
        }
        
        .metric-checkbox label {
            cursor: pointer;
            font-size: 13px;
            color: var(--vscode-editor-foreground);
            user-select: none;
        }
        
    </style>
</head>
<body>
    <div class="validation-header">
        <h2>Analysis - Metrics</h2>
        <p>Model metrics and measurement data with current and historical views</p>
    </div>
    
    <div class="tabs">
        <button class="tab active" data-tab="current">Current</button>
        <button class="tab" data-tab="history">History</button>
    </div>
    
    <div id="current-tab" class="tab-content active">
        <div class="filter-section">
            <div class="filter-header" onclick="toggleFilterSection()">
                <span class="codicon codicon-chevron-down" id="filterChevron"></span>
                <span>Filters</span>
            </div>
            <div class="filter-content" id="filterContent">
                <div class="filter-row">
                    <div class="filter-group">
                        <label>Metric Name:</label>
                        <input type="text" id="filterMetricName" placeholder="Filter by metric name...">
                    </div>
                    <div class="filter-group">
                        <label>Value:</label>
                        <input type="text" id="filterMetricValue" placeholder="Filter by value...">
                    </div>
                </div>
                <div class="filter-actions">
                    <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                </div>
            </div>
        </div>
        
        <div class="header-actions">
            <button id="exportButton" class="icon-button" title="Export to CSV">
                <i class="codicon codicon-cloud-download"></i>
            </button>
            <button id="refreshButton" class="icon-button" title="Refresh Data">
                <i class="codicon codicon-refresh"></i>
            </button>
        </div>
        
        <div id="current-loading" class="loading">Loading current metrics...</div>
        <div class="table-container hidden" id="current-table-container">
            <table id="current-metrics-table">
                <thead>
                    <tr>
                        <th data-column="name">Metric Name <span class="sort-indicator">▼</span></th>
                        <th data-column="value">Value <span class="sort-indicator">▼</span></th>
                    </tr>
                </thead>
                <tbody id="current-metrics-body">
                </tbody>
            </table>
        </div>
        
        <div class="table-footer">
            <div class="table-footer-left"></div>
            <div class="table-footer-right">
                <span id="current-record-info"></span>
            </div>
        </div>
    </div>
    
    <div id="history-tab" class="tab-content">
        <div id="history-loading" class="loading">Loading historical metrics...</div>
        
        <div class="date-range-container hidden" id="date-range-container">
            <label for="date-range-select">Time Range:</label>
            <select id="date-range-select" class="date-range-select">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all" selected>All</option>
            </select>
        </div>
        
        <div class="chart-container hidden" id="chart-container">
            <canvas id="metricsChart" width="800" height="400"></canvas>
        </div>
        
        <div class="metrics-selection hidden" id="metrics-selection">
            <h3>Select Metrics to Display</h3>
            <div id="metrics-checkboxes" class="checkbox-list">
                <!-- Checkboxes will be populated dynamically -->
            </div>
        </div>
        
        <div class="table-footer">
            <div class="table-footer-left"></div>
            <div class="table-footer-right">
                <span id="history-record-info"></span>
            </div>
        </div>
    </div>
    
    <div id="spinner-overlay" class="spinner-overlay hidden">
        <div class="spinner"></div>
    </div>
    
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}