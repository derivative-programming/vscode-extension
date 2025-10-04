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
                    
                    // Load history to get data point counts
                    const historyData = loadMetricHistory(modelService);
                    const historyCountMap = new Map<string, number>();
                    
                    // Build a map of metric name to history count
                    historyData.metrics.forEach((metric: any) => {
                        if (metric.value_history && Array.isArray(metric.value_history)) {
                            historyCountMap.set(metric.display_text, metric.value_history.length);
                        }
                    });
                    
                    // Add history count to each metric
                    currentMetrics.forEach((metric: any) => {
                        metric.historyCount = historyCountMap.get(metric.name) || 0;
                    });
                    
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
                            filePath: message.data.filename
                        });
                        const fileUri = vscode.Uri.file(filePath);
                        vscode.commands.executeCommand('vscode.open', fileUri);
                    } catch (error) {
                        console.error('[Extension] Error saving PNG to workspace:', error);
                        vscode.window.showErrorMessage(`Failed to save PNG: ${error.message}`);
                        panel.webview.postMessage({
                            command: 'pngSaveComplete',
                            success: false,
                            error: error.message
                        });
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
        const csvHeader = 'Metric Name,Value,Historical Data Points Count\n';
        const csvRows = items.map(item => {
            const name = (item.name || '').replace(/"/g, '""');
            const value = (item.value || '').replace(/"/g, '""');
            const historyCount = item.historyCount !== undefined ? item.historyCount : 0;
            return `"${name}","${value}","${historyCount}"`;
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
 * Calculate data object count metric
 */
function calculateDataObjectCount(modelService: ModelService): number {
    try {
        return modelService.getAllObjects().length;
    } catch (error) {
        console.error('Error calculating data object count:', error);
        return 0;
    }
}

/**
 * Calculate page count metric (forms with isPage=true + reports with isPage=true or undefined)
 */
function calculatePageCount(modelService: ModelService): number {
    try {
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
        
        return pageCount;
    } catch (error) {
        console.error('Error calculating page count:', error);
        return 0;
    }
}

/**
 * Calculate report count metric
 */
function calculateReportCount(modelService: ModelService): number {
    try {
        return modelService.getAllReports().length;
    } catch (error) {
        console.error('Error calculating report count:', error);
        return 0;
    }
}

/**
 * Calculate form count metric (object workflows with isPage=true)
 */
function calculateFormCount(modelService: ModelService): number {
    try {
        return modelService.getAllPageObjectWorkflows().length;
    } catch (error) {
        console.error('Error calculating form count:', error);
        return 0;
    }
}

/**
 * Calculate form page count metric (object workflows with isPage=true)
 */
function calculateFormPageCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let formPageCount = 0;
        
        allObjects.forEach((obj: any) => {
            // Count forms (object workflows with isPage=true)
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === "true") {
                        formPageCount++;
                    }
                });
            }
        });
        
        return formPageCount;
    } catch (error) {
        console.error('Error calculating form page count:', error);
        return 0;
    }
}

/**
 * Calculate report page count metric (reports with isPage=true or undefined)
 */
function calculateReportPageCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let reportPageCount = 0;
        
        allObjects.forEach((obj: any) => {
            // Count reports (with isPage=true or undefined)
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if (report.isPage === "true" || report.isPage === undefined) {
                        reportPageCount++;
                    }
                });
            }
        });
        
        return reportPageCount;
    } catch (error) {
        console.error('Error calculating report page count:', error);
        return 0;
    }
}

/**
 * Calculate report to form ratio metric (balance between data display and entry)
 */
function calculateReportToFormRatio(modelService: ModelService): string {
    try {
        const formPageCount = calculateFormPageCount(modelService);
        const reportPageCount = calculateReportPageCount(modelService);
        
        if (formPageCount === 0) {
            return reportPageCount > 0 ? 'All Reports' : '0:0';
        }
        
        if (reportPageCount === 0) {
            return 'All Forms';
        }
        
        // Calculate ratio and format to 2 decimal places
        const ratio = reportPageCount / formPageCount;
        return `${ratio.toFixed(2)}:1`;
    } catch (error) {
        console.error('Error calculating report to form ratio:', error);
        return '0:0';
    }
}

/**
 * Calculate page init count metric (workflows ending with 'initreport' or 'initobjwf')
 */
function calculatePageInitCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let pageInitCount = 0;
        
        allObjects.forEach((obj: any) => {
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.name) {
                        const workflowName = workflow.name.toLowerCase();
                        if (workflowName.toLowerCase().endsWith('initreport') || workflowName.toLowerCase().endsWith('initobjwf')) {
                            pageInitCount++;
                        }
                    }
                });
            }
        });
        
        return pageInitCount;
    } catch (error) {
        console.error('Error calculating page init count:', error);
        return 0;
    }
}

/**
 * Calculate general flow count metric (workflows that meet specific criteria)
 */
function calculateGeneralFlowCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
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
                        const notInitObjWf = !workflowName.toLowerCase().endsWith('initobjwf');
                        
                        // 5. name does not end with initreport
                        const notInitReport = !workflowName.toLowerCase().endsWith('initreport');
                        
                        // All criteria must be true
                        if (isDynaFlowOk && isDynaFlowTaskOk && isPageOk && notInitObjWf && notInitReport) {
                            generalFlowCount++;
                        }
                    }
                });
            }
        });
        
        return generalFlowCount;
    } catch (error) {
        console.error('Error calculating general flow count:', error);
        return 0;
    }
}

/**
 * Calculate workflow count metric (workflows where isDynaFlow is true)
 */
function calculateWorkflowCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
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
        
        return workflowCount;
    } catch (error) {
        console.error('Error calculating workflow count:', error);
        return 0;
    }
}

/**
 * Calculate workflow task count metric (workflows where isDynaFlowTask is true)
 */
function calculateWorkflowTaskCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
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
        
        return workflowTaskCount;
    } catch (error) {
        console.error('Error calculating workflow task count:', error);
        return 0;
    }
}

/**
 * Calculate authorization-required pages count metric
 */
function calculateAuthorizationRequiredPagesCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let authRequiredPagesCount = 0;
        
        allObjects.forEach((obj: any) => {
            // Count forms (object workflows with isPage=true and isAuthorizationRequired=true)
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === "true" && workflow.isAuthorizationRequired === "true") {
                        authRequiredPagesCount++;
                    }
                });
            }
            
            // Count reports (with isPage=true or undefined, and isAuthorizationRequired=true)
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if ((report.isPage === "true" || report.isPage === undefined) && report.isAuthorizationRequired === "true") {
                        authRequiredPagesCount++;
                    }
                });
            }
        });
        
        return authRequiredPagesCount;
    } catch (error) {
        console.error('Error calculating authorization-required pages count:', error);
        return 0;
    }
}

/**
 * Calculate public pages count metric (pages with no authorization required)
 */
function calculatePublicPagesCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let publicPagesCount = 0;
        
        allObjects.forEach((obj: any) => {
            // Count forms (object workflows with isPage=true and isAuthorizationRequired is not "true")
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === "true" && workflow.isAuthorizationRequired !== "true") {
                        publicPagesCount++;
                    }
                });
            }
            
            // Count reports (with isPage=true or undefined, and isAuthorizationRequired is not "true")
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if ((report.isPage === "true" || report.isPage === undefined) && report.isAuthorizationRequired !== "true") {
                        publicPagesCount++;
                    }
                });
            }
        });
        
        return publicPagesCount;
    } catch (error) {
        console.error('Error calculating public pages count:', error);
        return 0;
    }
}

/**
 * Calculate page count by role metrics
 */
function calculatePageCountsByRole(modelService: ModelService): Map<string, number> {
    try {
        const allObjects = modelService.getAllObjects();
        const rolePageCounts = new Map<string, number>();
        
        allObjects.forEach((obj: any) => {
            // Count forms (object workflows with isPage=true and specific roleRequired)
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === "true" && workflow.roleRequired && workflow.roleRequired.trim() !== "") {
                        const role = workflow.roleRequired.trim();
                        rolePageCounts.set(role, (rolePageCounts.get(role) || 0) + 1);
                    }
                });
            }
            
            // Count reports (with isPage=true or undefined, and specific roleRequired)
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if ((report.isPage === "true" || report.isPage === undefined) && report.roleRequired && report.roleRequired.trim() !== "") {
                        const role = report.roleRequired.trim();
                        rolePageCounts.set(role, (rolePageCounts.get(role) || 0) + 1);
                    }
                });
            }
        });
        
        return rolePageCounts;
    } catch (error) {
        console.error('Error calculating page counts by role:', error);
        return new Map();
    }
}

/**
 * Calculate user story count metric
 */
function calculateUserStoryCount(modelService: ModelService): number {
    try {
        const currentModel = modelService.getCurrentModel();
        
        if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
            const namespace = currentModel.namespace[0];
            if (namespace.userStory && Array.isArray(namespace.userStory)) {
                return namespace.userStory.length;
            }
        }
        
        return 0;
    } catch (error) {
        console.error('Error calculating user story count:', error);
        return 0;
    }
}

/**
 * Calculate user story count by role metrics
 */
function calculateUserStoryCountsByRole(modelService: ModelService): Map<string, number> {
    try {
        const currentModel = modelService.getCurrentModel();
        const roleUserStoryCounts = new Map<string, number>();
        
        if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
            const namespace = currentModel.namespace[0];
            
            if (namespace.userStory && Array.isArray(namespace.userStory)) {
                namespace.userStory.forEach((story: any) => {
                    if (story.storyText) {
                        // Extract role from user story text
                        const role = extractRoleFromUserStory(story.storyText);
                        if (role && role.trim() !== "") {
                            const roleKey = role.trim();
                            roleUserStoryCounts.set(roleKey, (roleUserStoryCounts.get(roleKey) || 0) + 1);
                        }
                    }
                });
            }
        }
        
        return roleUserStoryCounts;
    } catch (error) {
        console.error('Error calculating user story counts by role:', error);
        return new Map();
    }
}

/**
 * Calculate role count metric
 */
function calculateRoleCount(modelService: ModelService): number {
    try {
        const currentModel = modelService.getCurrentModel();
        
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
            
            return roles.size;
        }
        
        return 0;
    } catch (error) {
        console.error('Error calculating role count:', error);
        return 0;
    }
}

/**
 * Calculate lookup and non-lookup data object counts
 */
function calculateDataObjectCounts(modelService: ModelService): { lookup: number; nonLookup: number } {
    try {
        const currentModel = modelService.getCurrentModel();
        let lookupCount = 0;
        let nonLookupCount = 0;
        
        if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
            const namespace = currentModel.namespace[0];
            
            if (namespace.object && Array.isArray(namespace.object)) {
                namespace.object.forEach((obj: any) => {
                    if (obj.isLookup === "true") {
                        lookupCount++;
                    } else {
                        nonLookupCount++;
                    }
                });
            }
        }
        
        return { lookup: lookupCount, nonLookup: nonLookupCount };
    } catch (error) {
        console.error('Error calculating data object counts:', error);
        return { lookup: 0, nonLookup: 0 };
    }
}

/**
 * Calculate user story role requirement metrics (both assigned and unassigned)
 */
function calculateUserStoryRoleRequirements(modelService: ModelService): { assigned: number; unassigned: number } {
    try {
        const currentModel = modelService.getCurrentModel();
        let assignedCount = 0;
        let unassignedCount = 0;
        
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
                            
                            // Count role requirements
                            const actions = ['View All', 'View', 'Add', 'Update', 'Delete'];
                            Array.from(roles).forEach(role => {
                                // Skip 'Unknown' roles
                                if (role && role.toLowerCase() === 'unknown') {
                                    return;
                                }
                                
                                dataObjects.forEach(dataObject => {
                                    actions.forEach(action => {
                                        const key = `${role}|${dataObject.name}|${action}`;
                                        const access = requirementsLookup.get(key) || 'Unassigned';
                                        if (access === 'Unassigned') {
                                            unassignedCount++;
                                        } else {
                                            assignedCount++;
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
        
        return { assigned: assignedCount, unassigned: unassignedCount };
    } catch (error) {
        console.error('Error calculating user story role requirements:', error);
        return { assigned: 0, unassigned: 0 };
    }
}

/**
 * Calculate total QA stories metric
 */
function calculateQAStoriesTotal(modelService: ModelService): number {
    try {
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            return 0;
        }
        
        const qaFilePath = path.join(path.dirname(modelFilePath), 'app-dna-user-story-qa.json');
        
        if (!fs.existsSync(qaFilePath)) {
            return 0;
        }
        
        const qaContent = fs.readFileSync(qaFilePath, 'utf8');
        const qaData = JSON.parse(qaContent);
        
        if (!qaData.qaData || !Array.isArray(qaData.qaData)) {
            return 0;
        }
        
        return qaData.qaData.length;
    } catch (error) {
        console.error('Error calculating QA stories total:', error);
        return 0;
    }
}

/**
 * Calculate QA stories by status
 */
function calculateQAStoriesByStatus(modelService: ModelService, status: string): number {
    try {
        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            return 0;
        }
        
        const qaFilePath = path.join(path.dirname(modelFilePath), 'app-dna-user-story-qa.json');
        
        if (!fs.existsSync(qaFilePath)) {
            return 0;
        }
        
        const qaContent = fs.readFileSync(qaFilePath, 'utf8');
        const qaData = JSON.parse(qaContent);
        
        if (!qaData.qaData || !Array.isArray(qaData.qaData)) {
            return 0;
        }
        
        return qaData.qaData.filter((item: any) => 
            (item.qaStatus || 'pending') === status
        ).length;
    } catch (error) {
        console.error(`Error calculating QA stories ${status}:`, error);
        return 0;
    }
}

/**
 * Calculate QA stories pending metric
 */
function calculateQAStoriesPending(modelService: ModelService): number {
    return calculateQAStoriesByStatus(modelService, 'pending');
}

/**
 * Calculate QA stories ready to test metric
 */
function calculateQAStoriesReadyToTest(modelService: ModelService): number {
    return calculateQAStoriesByStatus(modelService, 'ready-to-test');
}

/**
 * Calculate QA stories started metric
 */
function calculateQAStoriesStarted(modelService: ModelService): number {
    return calculateQAStoriesByStatus(modelService, 'started');
}

/**
 * Calculate QA stories success metric
 */
function calculateQAStoriesSuccess(modelService: ModelService): number {
    return calculateQAStoriesByStatus(modelService, 'success');
}

/**
 * Calculate QA stories failure metric
 */
function calculateQAStoriesFailure(modelService: ModelService): number {
    return calculateQAStoriesByStatus(modelService, 'failure');
}

/**
 * Calculate QA success rate metric (percentage)
 */
function calculateQASuccessRate(modelService: ModelService): string {
    try {
        const total = calculateQAStoriesTotal(modelService);
        if (total === 0) {
            return '0.0';
        }
        
        const successCount = calculateQAStoriesSuccess(modelService);
        const successRate = (successCount / total) * 100;
        
        return successRate.toFixed(1);
    } catch (error) {
        console.error('Error calculating QA success rate:', error);
        return '0.0';
    }
}

/**
 * Calculates the storage size in bytes for a single property based on its SQL Server data type
 * (Reused from data object size analysis logic)
 */
function calculatePropertySizeForMetrics(prop: any): number {
    const dataType = prop.sqlServerDBDataType?.toLowerCase();
    const dataSize = prop.sqlServerDBDataTypeSize;
    
    if (!dataType) {
        return 0; // Unknown type, assume no size
    }
    
    switch (dataType) {
        case 'text':
            return 20000; // As specified: text props count as 20,000 bytes
            
        case 'nvarchar':
            // Unicode string - 2 bytes per character, default 100 characters
            const nvarcharSize = dataSize ? parseInt(dataSize) : 100;
            const safeNvarcharSize = isNaN(nvarcharSize) ? 100 : nvarcharSize;
            return safeNvarcharSize * 2;
            
        case 'varchar':
            // ASCII string - 1 byte per character, default 100 characters
            const varcharSize = dataSize ? parseInt(dataSize) : 100;
            const safeVarcharSize = isNaN(varcharSize) ? 100 : varcharSize;
            return safeVarcharSize;
            
        case 'bit':
            return 1; // 1 bit, but minimum storage is 1 byte
            
        case 'datetime':
            return 8; // 8 bytes for datetime
            
        case 'date':
            return 3; // 3 bytes for date only
            
        case 'int':
            return 4; // 4 bytes for integer
            
        case 'bigint':
            return 8; // 8 bytes for big integer
            
        case 'uniqueidentifier':
            return 16; // 16 bytes for GUID
            
        case 'money':
            return 8; // 8 bytes for money
            
        case 'float':
            return 8; // 8 bytes for float (double precision)
            
        case 'decimal':
            // Decimal size varies by precision - approximate based on precision
            if (dataSize && typeof dataSize === 'string') {
                try {
                    const precision = parseInt(dataSize.split(',')[0]) || 18;
                    if (isNaN(precision)) { return 9; }
                    if (precision <= 9) { return 5; }
                    if (precision <= 19) { return 9; }
                    if (precision <= 28) { return 13; }
                    return 17;
                } catch (e) {
                    console.warn(`Error parsing decimal precision from '${dataSize}':`, e);
                    return 9;
                }
            }
            return 9; // Default for decimal(18,0)
            
        default:
            console.warn(`Unknown data type for size calculation: ${dataType}`);
            return 0;
    }
}

/**
 * Calculate total data object size metric (sum of all data object sizes in KB)
 */
function calculateTotalDataObjectSize(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let totalSizeBytes = 0;
        
        console.log(`[calculateTotalDataObjectSize] Processing ${allObjects.length} objects`);
        
        allObjects.forEach(dataObject => {
            if (dataObject.prop && Array.isArray(dataObject.prop)) {
                dataObject.prop.forEach((prop: any) => {
                    const propSize = calculatePropertySizeForMetrics(prop);
                    if (isNaN(propSize)) {
                        console.warn(`[calculateTotalDataObjectSize] NaN propSize for object ${dataObject.name}, prop ${prop.name}, type ${prop.sqlServerDBDataType}, size ${prop.sqlServerDBDataTypeSize}`);
                    } else {
                        totalSizeBytes += propSize;
                    }
                });
            }
        });
        
        console.log(`[calculateTotalDataObjectSize] Total size bytes: ${totalSizeBytes}`);
        
        // Convert bytes to KB and round to 2 decimal places
        const sizeInKB = totalSizeBytes / 1024;
        const result = Math.round(sizeInKB * 100) / 100;
        
        console.log(`[calculateTotalDataObjectSize] Result: ${result} KB`);
        
        if (isNaN(result)) {
            console.error(`[calculateTotalDataObjectSize] Result is NaN! totalSizeBytes=${totalSizeBytes}, sizeInKB=${sizeInKB}`);
            return 0;
        }
        
        return result;
    } catch (error) {
        console.error('Error calculating total data object size:', error);
        return 0;
    }
}

/**
 * Calculate average data object size metric (average size in KB)
 */
function calculateAverageDataObjectSize(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        if (allObjects.length === 0) {
            return 0;
        }
        
        let totalSizeBytes = 0;
        
        console.log(`[calculateAverageDataObjectSize] Processing ${allObjects.length} objects`);
        
        allObjects.forEach(dataObject => {
            if (dataObject.prop && Array.isArray(dataObject.prop)) {
                dataObject.prop.forEach((prop: any) => {
                    const propSize = calculatePropertySizeForMetrics(prop);
                    if (isNaN(propSize)) {
                        console.warn(`[calculateAverageDataObjectSize] NaN propSize for object ${dataObject.name}, prop ${prop.name}, type ${prop.sqlServerDBDataType}, size ${prop.sqlServerDBDataTypeSize}`);
                    } else {
                        totalSizeBytes += propSize;
                    }
                });
            }
        });
        
        console.log(`[calculateAverageDataObjectSize] Total size bytes: ${totalSizeBytes}`);
        
        // Convert to KB and calculate average
        const totalSizeKB = totalSizeBytes / 1024;
        const averageSize = totalSizeKB / allObjects.length;
        const result = Math.round(averageSize * 100) / 100;
        
        console.log(`[calculateAverageDataObjectSize] Result: ${result} KB (total: ${totalSizeKB} KB, objects: ${allObjects.length})`);
        
        if (isNaN(result)) {
            console.error(`[calculateAverageDataObjectSize] Result is NaN! totalSizeBytes=${totalSizeBytes}, totalSizeKB=${totalSizeKB}, averageSize=${averageSize}`);
            return 0;
        }
        
        return result;
    } catch (error) {
        console.error('Error calculating average data object size:', error);
        return 0;
    }
}

/**
 * Calculate maximum data object size metric (largest single object size in KB)
 */
function calculateMaxDataObjectSize(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let maxSizeBytes = 0;
        
        allObjects.forEach(dataObject => {
            let objectSizeBytes = 0;
            
            if (dataObject.prop && Array.isArray(dataObject.prop)) {
                dataObject.prop.forEach((prop: any) => {
                    const propSize = calculatePropertySizeForMetrics(prop);
                    objectSizeBytes += propSize;
                });
            }
            
            if (objectSizeBytes > maxSizeBytes) {
                maxSizeBytes = objectSizeBytes;
            }
        });
        
        // Convert bytes to KB and round to 2 decimal places
        const sizeInKB = maxSizeBytes / 1024;
        return Math.round(sizeInKB * 100) / 100;
    } catch (error) {
        console.error('Error calculating max data object size:', error);
        return 0;
    }
}

/**
 * Calculate minimum data object size metric (smallest single object size in KB)
 */
function calculateMinDataObjectSize(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        if (allObjects.length === 0) {
            return 0;
        }
        
        let minSizeBytes = Number.MAX_SAFE_INTEGER;
        
        allObjects.forEach(dataObject => {
            let objectSizeBytes = 0;
            
            if (dataObject.prop && Array.isArray(dataObject.prop)) {
                dataObject.prop.forEach((prop: any) => {
                    const propSize = calculatePropertySizeForMetrics(prop);
                    objectSizeBytes += propSize;
                });
            }
            
            if (objectSizeBytes < minSizeBytes) {
                minSizeBytes = objectSizeBytes;
            }
        });
        
        // Convert bytes to KB and round to 2 decimal places
        const sizeInKB = minSizeBytes / 1024;
        return Math.round(sizeInKB * 100) / 100;
    } catch (error) {
        console.error('Error calculating min data object size:', error);
        return 0;
    }
}

/**
 * Calculate average page control count metric (all pages: forms + reports)
 */
function calculateAveragePageControlCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let totalControls = 0;
        let pageCount = 0;
        
        allObjects.forEach((obj: any) => {
            // Process forms (object workflows with isPage=true)
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === "true") {
                        const buttons = (workflow.objectWorkflowButton && Array.isArray(workflow.objectWorkflowButton)) ? workflow.objectWorkflowButton.length : 0;
                        const inputs = (workflow.objectWorkflowParam && Array.isArray(workflow.objectWorkflowParam)) ? workflow.objectWorkflowParam.length : 0;
                        const outputVars = (workflow.objectWorkflowOutputVar && Array.isArray(workflow.objectWorkflowOutputVar)) ? workflow.objectWorkflowOutputVar.length : 0;
                        
                        totalControls += buttons + inputs + outputVars;
                        pageCount++;
                    }
                });
            }
            
            // Process reports (with isPage=true or undefined)
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if (report.isPage === "true" || report.isPage === undefined) {
                        const buttons = (report.reportButton && Array.isArray(report.reportButton)) ? report.reportButton.length : 0;
                        const columns = (report.reportColumn && Array.isArray(report.reportColumn)) ? report.reportColumn.length : 0;
                        const params = (report.reportParam && Array.isArray(report.reportParam)) ? report.reportParam.length : 0;
                        
                        totalControls += buttons + columns + params;
                        pageCount++;
                    }
                });
            }
        });
        
        if (pageCount === 0) {
            return 0;
        }
        
        const average = totalControls / pageCount;
        return Math.round(average * 100) / 100; // Round to 2 decimal places
    } catch (error) {
        console.error('Error calculating average page control count:', error);
        return 0;
    }
}

/**
 * Calculate average form page control count metric (forms only)
 */
function calculateAverageFormPageControlCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let totalControls = 0;
        let formPageCount = 0;
        
        allObjects.forEach((obj: any) => {
            // Process forms (object workflows with isPage=true)
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    if (workflow.isPage === "true") {
                        const buttons = (workflow.objectWorkflowButton && Array.isArray(workflow.objectWorkflowButton)) ? workflow.objectWorkflowButton.length : 0;
                        const inputs = (workflow.objectWorkflowParam && Array.isArray(workflow.objectWorkflowParam)) ? workflow.objectWorkflowParam.length : 0;
                        const outputVars = (workflow.objectWorkflowOutputVar && Array.isArray(workflow.objectWorkflowOutputVar)) ? workflow.objectWorkflowOutputVar.length : 0;
                        
                        totalControls += buttons + inputs + outputVars;
                        formPageCount++;
                    }
                });
            }
        });
        
        if (formPageCount === 0) {
            return 0;
        }
        
        const average = totalControls / formPageCount;
        return Math.round(average * 100) / 100; // Round to 2 decimal places
    } catch (error) {
        console.error('Error calculating average form page control count:', error);
        return 0;
    }
}

/**
 * Calculate average report page control count metric (reports only)
 */
function calculateAverageReportPageControlCount(modelService: ModelService): number {
    try {
        const allObjects = modelService.getAllObjects();
        let totalControls = 0;
        let reportPageCount = 0;
        
        allObjects.forEach((obj: any) => {
            // Process reports (with isPage=true or undefined)
            if (obj.report && Array.isArray(obj.report)) {
                obj.report.forEach((report: any) => {
                    if (report.isPage === "true" || report.isPage === undefined) {
                        const buttons = (report.reportButton && Array.isArray(report.reportButton)) ? report.reportButton.length : 0;
                        const columns = (report.reportColumn && Array.isArray(report.reportColumn)) ? report.reportColumn.length : 0;
                        const params = (report.reportParam && Array.isArray(report.reportParam)) ? report.reportParam.length : 0;
                        
                        totalControls += buttons + columns + params;
                        reportPageCount++;
                    }
                });
            }
        });
        
        if (reportPageCount === 0) {
            return 0;
        }
        
        const average = totalControls / reportPageCount;
        return Math.round(average * 100) / 100; // Round to 2 decimal places
    } catch (error) {
        console.error('Error calculating average report page control count:', error);
        return 0;
    }
}

/**
 * Calculate user story with journey count metric (user stories that have calculated journey distances)
 */
function calculateUserStoryWithJourneyCount(modelService: ModelService): number {
    try {
        const currentModel = modelService.getCurrentModel();
        if (!currentModel?.namespace?.[0]?.userStory) {
            return 0;
        }

        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            return 0;
        }

        const modelDir = path.dirname(modelFilePath);
        const pageMappingFilePath = path.join(modelDir, 'app-dna-user-story-page-mapping.json');
        const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');
        
        // Load page mappings
        let existingPageMappingData = { pageMappings: {} };
        if (fs.existsSync(pageMappingFilePath)) {
            try {
                const pageMappingContent = fs.readFileSync(pageMappingFilePath, 'utf8');
                existingPageMappingData = JSON.parse(pageMappingContent);
            } catch (error) {
                console.warn('Error reading page mapping file:', error);
            }
        }

        // Load journey distance data
        let journeyData: any = { pageDistances: [] };
        if (fs.existsSync(journeyFilePath)) {
            try {
                const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                journeyData = JSON.parse(journeyContent);
            } catch (error) {
                console.warn('Error reading journey data file:', error);
            }
        }

        const userStories = currentModel.namespace[0].userStory.filter(story => 
            story.isStoryProcessed === "true" && story.isIgnored !== "true"
        );

        let storiesWithJourneyCount = 0;
        userStories.forEach(story => {
            const storyNumber = story.storyNumber;
            const existingMapping = existingPageMappingData.pageMappings[storyNumber];
            const pages = existingMapping?.pageMapping || [];
            
            // Check if any page in this story has a calculated distance (not -1)
            let hasCalculatedJourney = false;
            pages.forEach((page: string) => {
                const pageDistanceData = journeyData.pageDistances?.find((pd: any) => pd.destinationPage === page);
                const journeyPageDistance = pageDistanceData ? pageDistanceData.distance : -1;
                if (journeyPageDistance >= 0) {
                    hasCalculatedJourney = true;
                }
            });
            
            if (hasCalculatedJourney) {
                storiesWithJourneyCount++;
            }
        });

        return storiesWithJourneyCount;
    } catch (error) {
        console.error('Error calculating user story with journey count:', error);
        return 0;
    }
}

/**
 * Calculate user story with no journey count metric (user stories without calculated journey distances)
 */
function calculateUserStoryWithNoJourneyCount(modelService: ModelService): number {
    try {
        const currentModel = modelService.getCurrentModel();
        if (!currentModel?.namespace?.[0]?.userStory) {
            return 0;
        }

        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            return 0;
        }

        const modelDir = path.dirname(modelFilePath);
        const pageMappingFilePath = path.join(modelDir, 'app-dna-user-story-page-mapping.json');
        const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');
        
        // Load page mappings
        let existingPageMappingData = { pageMappings: {} };
        if (fs.existsSync(pageMappingFilePath)) {
            try {
                const pageMappingContent = fs.readFileSync(pageMappingFilePath, 'utf8');
                existingPageMappingData = JSON.parse(pageMappingContent);
            } catch (error) {
                console.warn('Error reading page mapping file:', error);
            }
        }

        // Load journey distance data
        let journeyData: any = { pageDistances: [] };
        if (fs.existsSync(journeyFilePath)) {
            try {
                const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                journeyData = JSON.parse(journeyContent);
            } catch (error) {
                console.warn('Error reading journey data file:', error);
            }
        }

        const userStories = currentModel.namespace[0].userStory.filter(story => 
            story.isStoryProcessed === "true" && story.isIgnored !== "true"
        );

        let storiesWithNoJourneyCount = 0;
        userStories.forEach(story => {
            const storyNumber = story.storyNumber;
            const existingMapping = existingPageMappingData.pageMappings[storyNumber];
            const pages = existingMapping?.pageMapping || [];
            
            // Check if story has no pages OR all pages have no calculated distance (-1)
            let hasCalculatedJourney = false;
            if (pages.length > 0) {
                pages.forEach((page: string) => {
                    const pageDistanceData = journeyData.pageDistances?.find((pd: any) => pd.destinationPage === page);
                    const journeyPageDistance = pageDistanceData ? pageDistanceData.distance : -1;
                    if (journeyPageDistance >= 0) {
                        hasCalculatedJourney = true;
                    }
                });
            }
            
            if (!hasCalculatedJourney) {
                storiesWithNoJourneyCount++;
            }
        });

        return storiesWithNoJourneyCount;
    } catch (error) {
        console.error('Error calculating user story with no journey count:', error);
        return 0;
    }
}

/**
 * Calculate user story journey count average metric (average journey distance for stories with calculated journeys)
 */
function calculateUserStoryJourneyCountAverage(modelService: ModelService): number {
    try {
        const currentModel = modelService.getCurrentModel();
        if (!currentModel?.namespace?.[0]?.userStory) {
            return 0;
        }

        const modelFilePath = modelService.getCurrentFilePath();
        if (!modelFilePath) {
            return 0;
        }

        const modelDir = path.dirname(modelFilePath);
        const pageMappingFilePath = path.join(modelDir, 'app-dna-user-story-page-mapping.json');
        const journeyFilePath = path.join(modelDir, 'app-dna-user-story-user-journey.json');
        
        // Load page mappings
        let existingPageMappingData = { pageMappings: {} };
        if (fs.existsSync(pageMappingFilePath)) {
            try {
                const pageMappingContent = fs.readFileSync(pageMappingFilePath, 'utf8');
                existingPageMappingData = JSON.parse(pageMappingContent);
            } catch (error) {
                console.warn('Error reading page mapping file:', error);
            }
        }

        // Load journey distance data
        let journeyData: any = { pageDistances: [] };
        if (fs.existsSync(journeyFilePath)) {
            try {
                const journeyContent = fs.readFileSync(journeyFilePath, 'utf8');
                journeyData = JSON.parse(journeyContent);
            } catch (error) {
                console.warn('Error reading journey data file:', error);
            }
        }

        const userStories = currentModel.namespace[0].userStory.filter(story => 
            story.isStoryProcessed === "true" && story.isIgnored !== "true"
        );

        let totalDistance = 0;
        let storiesWithJourney = 0;

        userStories.forEach(story => {
            const storyNumber = story.storyNumber;
            const existingMapping = existingPageMappingData.pageMappings[storyNumber];
            const pages = existingMapping?.pageMapping || [];
            
            // Find the maximum journey distance for this story (like the treemap logic)
            let maxDistance = -1;
            pages.forEach((page: string) => {
                const pageDistanceData = journeyData.pageDistances?.find((pd: any) => pd.destinationPage === page);
                const journeyPageDistance = pageDistanceData ? pageDistanceData.distance : -1;
                if (journeyPageDistance >= 0 && journeyPageDistance > maxDistance) {
                    maxDistance = journeyPageDistance;
                }
            });
            
            if (maxDistance >= 0) {
                totalDistance += maxDistance;
                storiesWithJourney++;
            }
        });

        if (storiesWithJourney === 0) {
            return 0;
        }

        const average = totalDistance / storiesWithJourney;
        return Math.round(average * 100) / 100; // Round to 2 decimal places
    } catch (error) {
        console.error('Error calculating user story journey count average:', error);
        return 0;
    }
}

/**
 * Gets current metrics data from the model
 */
function getCurrentMetricsData(modelService: ModelService): any[] {
    const metrics = [];
    
    // Calculate all metrics using individual functions
    const dataObjectCount = calculateDataObjectCount(modelService);
    metrics.push({
        name: 'Data Object Count',
        value: dataObjectCount.toString()
    });
    
    const pageCount = calculatePageCount(modelService);
    metrics.push({
        name: 'Page Count',
        value: pageCount.toString()
    });
    
    const reportCount = calculateReportCount(modelService);
    metrics.push({
        name: 'Report Count',
        value: reportCount.toString()
    });
    
    const formCount = calculateFormCount(modelService);
    metrics.push({
        name: 'Form Count',
        value: formCount.toString()
    });
    
    const formPageCount = calculateFormPageCount(modelService);
    metrics.push({
        name: 'Form Page Count',
        value: formPageCount.toString()
    });
    
    const reportPageCount = calculateReportPageCount(modelService);
    metrics.push({
        name: 'Report Page Count',
        value: reportPageCount.toString()
    });
    
    const reportToFormRatio = calculateReportToFormRatio(modelService);
    metrics.push({
        name: 'Report to Form Ratio',
        value: reportToFormRatio
    });
    
    const pageInitCount = calculatePageInitCount(modelService);
    metrics.push({
        name: 'Page Init Count',
        value: pageInitCount.toString()
    });
    
    const generalFlowCount = calculateGeneralFlowCount(modelService);
    metrics.push({
        name: 'General Flow Count',
        value: generalFlowCount.toString()
    });
    
    const workflowCount = calculateWorkflowCount(modelService);
    metrics.push({
        name: 'Workflow Count',
        value: workflowCount.toString()
    });
    
    const workflowTaskCount = calculateWorkflowTaskCount(modelService);
    metrics.push({
        name: 'Workflow Task Count',
        value: workflowTaskCount.toString()
    });
    
    const userStoryCount = calculateUserStoryCount(modelService);
    metrics.push({
        name: 'User Story Count',
        value: userStoryCount.toString()
    });
    
    const userStoryJourneyCountAvg = calculateUserStoryJourneyCountAverage(modelService);
    metrics.push({
        name: 'User Story Journey Count Avg',
        value: userStoryJourneyCountAvg.toString()
    });
    
    const userStoryWithJourneyCount = calculateUserStoryWithJourneyCount(modelService);
    metrics.push({
        name: 'User Story With Journey Count',
        value: userStoryWithJourneyCount.toString()
    });
    
    const userStoryWithNoJourneyCount = calculateUserStoryWithNoJourneyCount(modelService);
    metrics.push({
        name: 'User Story With No Journey Count',
        value: userStoryWithNoJourneyCount.toString()
    });
    
    const roleRequirements = calculateUserStoryRoleRequirements(modelService);
    metrics.push({
        name: 'User Story Role Requirement Assignment Count',
        value: roleRequirements.assigned.toString()
    });
    
    metrics.push({
        name: 'User Story Role Requirement Not Assigned Count',
        value: roleRequirements.unassigned.toString()
    });
    
    const roleCount = calculateRoleCount(modelService);
    metrics.push({
        name: 'Role Count',
        value: roleCount.toString()
    });
    
    const dataObjectCounts = calculateDataObjectCounts(modelService);
    metrics.push({
        name: 'Lookup Data Object Count',
        value: dataObjectCounts.lookup.toString()
    });
    
    metrics.push({
        name: 'Non-Lookup Data Object Count',
        value: dataObjectCounts.nonLookup.toString()
    });
    
    // Add data object size metrics
    const totalDataObjectSize = calculateTotalDataObjectSize(modelService);
    metrics.push({
        name: 'Total Data Object Size (KB)',
        value: totalDataObjectSize.toString()
    });
    
    const avgDataObjectSize = calculateAverageDataObjectSize(modelService);
    metrics.push({
        name: 'Avg Data Object Size (KB)',
        value: avgDataObjectSize.toString()
    });
    
    const avgFormPageControlCount = calculateAverageFormPageControlCount(modelService);
    metrics.push({
        name: 'Avg Form Page Control Count',
        value: avgFormPageControlCount.toString()
    });
    
    const avgPageControlCount = calculateAveragePageControlCount(modelService);
    metrics.push({
        name: 'Avg Page Control Count',
        value: avgPageControlCount.toString()
    });
    
    const avgReportPageControlCount = calculateAverageReportPageControlCount(modelService);
    metrics.push({
        name: 'Avg Report Page Control Count',
        value: avgReportPageControlCount.toString()
    });
    
    const maxDataObjectSize = calculateMaxDataObjectSize(modelService);
    metrics.push({
        name: 'Max Data Object Size (KB)',
        value: maxDataObjectSize.toString()
    });
    
    const minDataObjectSize = calculateMinDataObjectSize(modelService);
    metrics.push({
        name: 'Min Data Object Size (KB)',
        value: minDataObjectSize.toString()
    });
    
    // Add authorization metrics
    const authRequiredPagesCount = calculateAuthorizationRequiredPagesCount(modelService);
    metrics.push({
        name: 'Authorization-Required Pages Count',
        value: authRequiredPagesCount.toString()
    });
    
    const publicPagesCount = calculatePublicPagesCount(modelService);
    metrics.push({
        name: 'Public Pages Count',
        value: publicPagesCount.toString()
    });
    
    // Add role-specific page counts
    const rolePageCounts = calculatePageCountsByRole(modelService);
    Array.from(rolePageCounts.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([role, count]) => {
        metrics.push({
            name: `Role ${role} Page Count`,
            value: count.toString()
        });
    });
    
    // Add role-specific user story counts
    const roleUserStoryCounts = calculateUserStoryCountsByRole(modelService);
    Array.from(roleUserStoryCounts.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([role, count]) => {
        metrics.push({
            name: `Role ${role} User Story Count`,
            value: count.toString()
        });
    });
    
    // Add QA metrics
    const qaStoriesTotal = calculateQAStoriesTotal(modelService);
    metrics.push({
        name: 'QA Stories - Total',
        value: qaStoriesTotal.toString()
    });
    
    const qaStoriesPending = calculateQAStoriesPending(modelService);
    metrics.push({
        name: 'QA Stories - Pending',
        value: qaStoriesPending.toString()
    });
    
    const qaStoriesReadyToTest = calculateQAStoriesReadyToTest(modelService);
    metrics.push({
        name: 'QA Stories - Ready to Test',
        value: qaStoriesReadyToTest.toString()
    });
    
    const qaStoriesStarted = calculateQAStoriesStarted(modelService);
    metrics.push({
        name: 'QA Stories - Started',
        value: qaStoriesStarted.toString()
    });
    
    const qaStoriesSuccess = calculateQAStoriesSuccess(modelService);
    metrics.push({
        name: 'QA Stories - Success',
        value: qaStoriesSuccess.toString()
    });
    
    const qaStoriesFailure = calculateQAStoriesFailure(modelService);
    metrics.push({
        name: 'QA Stories - Failure',
        value: qaStoriesFailure.toString()
    });
    
    const qaSuccessRate = calculateQASuccessRate(modelService);
    metrics.push({
        name: 'QA Success Rate (%)',
        value: qaSuccessRate
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
        
        .history-header-actions {
            justify-content: space-between;
            align-items: center;
        }
        
        .header-actions-right {
            display: flex;
            gap: 8px;
            align-items: center;
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
            outline: none;
        }
        
        .icon-button:focus-visible {
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
        
        /* Actions column styling */
        .actions-column {
            width: 80px;
            text-align: center;
            cursor: default !important;
        }
        
        .actions-column:hover {
            background-color: var(--vscode-list-hoverBackground) !important;
        }
        
        .action-button {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            padding: 4px;
            border-radius: 3px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        
        .action-button:hover {
            background: var(--vscode-toolbar-hoverBackground);
            color: var(--vscode-focusBorder);
        }
        
        .action-button:focus {
            outline: none;
        }
        
        .action-button:focus-visible {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }
        
        .action-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        
        .action-button:disabled:hover {
            background: none;
            color: var(--vscode-foreground);
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
            position: relative;
        }
        
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .chart-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .chart-export-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .chart-export-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .chart-export-btn:focus {
            outline: none;
        }
        
        .chart-export-btn:focus-visible {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }
        
        .chart-export-btn .codicon {
            font-size: 16px;
        }
        
        #metricsChart {
            width: 100% !important;
            height: 400px !important;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
        }
        
        /* Date range selector styling */
        .date-range-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .date-range-container label {
            color: var(--vscode-foreground);
            font-weight: 500;
            font-size: 13px;
        }
        
        .date-range-select {
            padding: 4px 8px;
            background-color: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 3px;
            font-size: 13px;
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
                    <div class="filter-group">
                        <label>History Count:</label>
                        <input type="text" id="filterHistoryCount" placeholder="Filter by history count...">
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
                        <th data-column="historyCount">Historical Data Points Count <span class="sort-indicator">▼</span></th>
                        <th class="actions-column">Actions</th>
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
        <div class="header-actions history-header-actions">
            <div class="date-range-container" id="date-range-container">
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
            <div class="header-actions-right">
                <button id="generateChartPngBtn" class="icon-button" title="Generate PNG">
                    <i class="codicon codicon-device-camera"></i>
                </button>
                <button id="historyRefreshButton" class="icon-button" title="Refresh Data">
                    <i class="codicon codicon-refresh"></i>
                </button>
            </div>
        </div>
        
        <div id="history-loading" class="loading">Loading historical metrics...</div>
        
        <div class="chart-container hidden" id="chart-container">
            <div class="chart-header">
                <div class="chart-title">Metrics History Over Time</div>
            </div>
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