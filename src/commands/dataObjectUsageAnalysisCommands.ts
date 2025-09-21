// Description: Handles registration of data object usage analysis view related commands.
// Created: September 15, 2025

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelService } from '../services/modelService';
import { extractDataObjectsFromUserStory, isDataObjectMatch } from '../utils/userStoryUtils';

// Track active panels to avoid duplicates
const activePanels = new Map<string, vscode.WebviewPanel>();

// Track panel reference for the data object usage analysis view
const dataObjectUsageAnalysisPanel = {
    panel: null as vscode.WebviewPanel | null,
    context: null as vscode.ExtensionContext | null,
    modelService: null as ModelService | null
};

/**
 * Gets the reference to the data object usage analysis panel if it's open
 */
export function getDataObjectUsageAnalysisPanel(): { 
    type: string; 
    context: vscode.ExtensionContext; 
    modelService: ModelService 
} | null {
    if (activePanels.has('dataObjectUsageAnalysis') && dataObjectUsageAnalysisPanel.context && dataObjectUsageAnalysisPanel.modelService) {
        return {
            type: 'dataObjectUsageAnalysis',
            context: dataObjectUsageAnalysisPanel.context,
            modelService: dataObjectUsageAnalysisPanel.modelService
        };
    }
    return null;
}

/**
 * Closes the data object usage analysis panel if it's open
 */
export function closeDataObjectUsageAnalysisPanel(): void {
    console.log(`Closing data object usage analysis panel if open`);
    const panel = activePanels.get('dataObjectUsageAnalysis');
    if (panel) {
        panel.dispose();
        activePanels.delete('dataObjectUsageAnalysis');
    }
    // Clean up panel reference
    dataObjectUsageAnalysisPanel.panel = null;
}

/**
 * Registers the data object usage analysis command
 */
export function registerDataObjectUsageAnalysisCommands(context: vscode.ExtensionContext, modelService: ModelService) {
    
    // Register the show data object usage analysis command
    const dataObjectUsageAnalysisCommand = vscode.commands.registerCommand('appdna.dataObjectUsageAnalysis', () => {
        console.log('Data Object Usage Analysis command executed');
        
        // Check if we already have a data object usage analysis panel open
        if (activePanels.has('dataObjectUsageAnalysis')) {
            // Focus the existing panel
            const existingPanel = activePanels.get('dataObjectUsageAnalysis');
            if (existingPanel) {
                existingPanel.reveal();
                return;
            }
        }
        
        // Create and show new panel
        const panel = vscode.window.createWebviewPanel(
            'dataObjectUsageAnalysis',
            'Data Object Usage',
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
        activePanels.set('dataObjectUsageAnalysis', panel);
        dataObjectUsageAnalysisPanel.panel = panel;
        dataObjectUsageAnalysisPanel.context = context;
        dataObjectUsageAnalysisPanel.modelService = modelService;

        // Set the HTML content
        panel.webview.html = getDataObjectUsageAnalysisWebviewContent(panel.webview, context.extensionPath);

        // Handle dispose
        panel.onDidDispose(() => {
            activePanels.delete('dataObjectUsageAnalysis');
            dataObjectUsageAnalysisPanel.panel = null;
            dataObjectUsageAnalysisPanel.context = null;
            dataObjectUsageAnalysisPanel.modelService = null;
        });

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            console.log('Data Object Usage Analysis received message:', message);
            
            switch (message.command) {
                case 'getSummaryData':
                    // Get summary data (tab 1)
                    const summaryData = getUsageSummaryData(modelService);
                    panel.webview.postMessage({
                        command: 'summaryData',
                        data: summaryData
                    });
                    break;
                
                case 'getDetailData':
                    // Get detailed data (tab 2)
                    const detailData = getUsageDetailData(modelService);
                    panel.webview.postMessage({
                        command: 'detailData',
                        data: detailData
                    });
                    break;
                
                case 'exportToCSV':
                    console.log("[Extension] Data Object Usage CSV export requested");
                    try {
                        const csvContent = await saveUsageDataToCSV(message.data.items, modelService);
                        const now = new Date();
                        const pad = (n: number) => n.toString().padStart(2, '0');
                        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                        const filename = `data-object-usage-${timestamp}.csv`;
                        
                        panel.webview.postMessage({
                            command: 'csvExportReady',
                            csvContent: csvContent,
                            filename: filename,
                            success: true
                        });
                    } catch (error) {
                        console.error('[Extension] Error exporting data object usage CSV:', error);
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
                    
                case 'saveSvgToWorkspace':
                    try {
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        
                        if (!workspaceFolders || workspaceFolders.length === 0) {
                            vscode.window.showErrorMessage('No workspace folder is open');
                            panel.webview.postMessage({
                                command: 'svgSaveComplete',
                                success: false,
                                error: 'No workspace folder is open'
                            });
                            return;
                        }
                        
                        const workspaceRoot = workspaceFolders[0].uri.fsPath;
                        const filePath = path.join(workspaceRoot, message.data.filename);
                        
                        fs.writeFileSync(filePath, message.data.content, 'utf8');
                        vscode.window.showInformationMessage(`SVG file saved to workspace: ${message.data.filename}`);
                        
                        // Notify webview of successful save
                        panel.webview.postMessage({
                            command: 'svgSaveComplete',
                            success: true,
                            filePath: message.data.filename,
                            type: message.data.type
                        });
                        
                        // Optionally open the file in VS Code
                        const fileUri = vscode.Uri.file(filePath);
                        vscode.window.showTextDocument(fileUri);
                    } catch (error) {
                        console.error('[Extension] Error saving SVG to workspace:', error);
                        vscode.window.showErrorMessage(`Failed to save SVG: ${error.message}`);
                        panel.webview.postMessage({
                            command: 'svgSaveComplete',
                            success: false,
                            error: error.message
                        });
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
                    
                case 'showError':
                    vscode.window.showErrorMessage(message.error || 'An error occurred');
                    break;
                    
                case 'viewDetails':
                    // Handle opening detail view for the referenced item
                    try {
                        const { itemType, itemName, referenceType } = message.data;
                        
                        // Extract actual item name (for form parameters, remove the " / ParamName" suffix)
                        let actualItemName = itemName;
                        if (itemName.includes(' / ')) {
                            actualItemName = itemName.split(' / ')[0];
                        }
                        
                        if (itemType === 'form') {
                            // Open form details
                            const mockTreeItem = {
                                label: actualItemName,
                                contextValue: 'formItem',
                                tooltip: `${actualItemName}`
                            };
                            const { showFormDetails } = require('../webviews/forms/formDetailsView');
                            showFormDetails(mockTreeItem, modelService, dataObjectUsageAnalysisPanel.context);
                        } else if (itemType === 'report') {
                            // Open report details
                            const mockTreeItem = {
                                label: actualItemName,
                                contextValue: 'reportItem',
                                tooltip: `${actualItemName}`
                            };
                            const { showReportDetails } = require('../webviews/reports/reportDetailsView');
                            showReportDetails(mockTreeItem, modelService, dataObjectUsageAnalysisPanel.context);
                        } else if (itemType === 'flow') {
                            // Check the reference type to route to the appropriate detail view
                            if (referenceType && referenceType.includes('Page Init Flow')) {
                                // Open page init flow details
                                const mockTreeItem = {
                                    label: actualItemName,
                                    contextValue: 'pageInitItem',
                                    tooltip: `${actualItemName}`
                                };
                                const { showPageInitDetails } = require('../webviews/pageinits/pageInitDetailsView');
                                showPageInitDetails(mockTreeItem, modelService, dataObjectUsageAnalysisPanel.context);
                            } else if (referenceType && referenceType.includes('Workflow Task')) {
                                // Open workflow task details
                                const mockTreeItem = {
                                    label: actualItemName,
                                    contextValue: 'workflowTaskItem',
                                    tooltip: `${actualItemName}`
                                };
                                const { showWorkflowTaskDetails } = require('../webviews/workflowTasks/workflowTaskDetailsView');
                                showWorkflowTaskDetails(mockTreeItem, modelService, dataObjectUsageAnalysisPanel.context);
                            } else if (referenceType && referenceType.includes('Workflow') && !referenceType.includes('Workflow Task')) {
                                // Open workflow details (but not workflow task)
                                const mockTreeItem = {
                                    label: actualItemName,
                                    contextValue: 'workflowItem',
                                    tooltip: `${actualItemName}`
                                };
                                const { showWorkflowDetails } = require('../webviews/workflows/workflowDetailsView');
                                showWorkflowDetails(mockTreeItem, modelService, dataObjectUsageAnalysisPanel.context);
                            } else {
                                // For general flows, we need to find the parent object and open the general flow details
                                // Flow names are typically in format "ObjectName.FlowName"
                                let objectName = actualItemName;
                                if (actualItemName.includes('.')) {
                                    objectName = actualItemName.split('.')[0];
                                }
                                
                                const mockTreeItem = {
                                    label: actualItemName,
                                    contextValue: 'generalFlowItem',
                                    tooltip: `${actualItemName}`,
                                    // Add additional context for flow details
                                    parentObjectName: objectName
                                };
                                const { showGeneralFlowDetails } = require('../webviews/generalFlow/generalFlowDetailsView');
                                showGeneralFlowDetails(mockTreeItem, modelService, dataObjectUsageAnalysisPanel.context);
                            }
                        } else if (itemType === 'dataObject') {
                            // Open data object details
                            const mockTreeItem = {
                                label: actualItemName,
                                contextValue: 'dataObjectItem',
                                tooltip: `${actualItemName}`
                            };
                            const { showObjectDetails } = require('../webviews/objects/objectDetailsView');
                            showObjectDetails(mockTreeItem, modelService, dataObjectUsageAnalysisPanel.context);
                        }
                        // Add more item types as needed (workflows, page flows, etc.)
                    } catch (error) {
                        console.error('[ERROR] Data Object Usage Analysis - Failed to open details:', error);
                        vscode.window.showErrorMessage(`Failed to open details: ${error.message}`);
                    }
                    break;
            }
        });
    });

    context.subscriptions.push(dataObjectUsageAnalysisCommand);
}

/**
 * Gets summary data showing total reference counts for each data object
 */
function getUsageSummaryData(modelService: ModelService): any[] {
    const summaryData: any[] = [];
    
    try {
        if (!modelService || !modelService.isFileLoaded()) {
            console.log('No model service or file loaded');
            return summaryData;
        }
        
        const allObjects = modelService.getAllObjects();
        console.log('Found objects:', allObjects.length);
        if (allObjects.length > 0) {
            console.log('First object structure:', allObjects[0]);
        }
        
        allObjects.forEach(dataObject => {
            if (!dataObject.name) {
                return;
            }
            
            console.log(`Processing object: ${dataObject.name}`);
            
            let totalReferences = 0;
            let formReferences = 0;
            let reportReferences = 0;
            let flowReferences = 0;
            let userStoryReferences = 0;
            
            // Use the same detailed analysis function that the detail tab uses
            const references = findAllDataObjectReferences(dataObject.name, modelService);
            totalReferences = references.length;
            
            // Break down the references by type
            formReferences = references.filter(ref => ref.type.includes('Form')).length;
            reportReferences = references.filter(ref => ref.type.includes('Report')).length;
            flowReferences = references.filter(ref => ref.type.includes('Flow')).length;
            userStoryReferences = references.filter(ref => ref.type.includes('User Story')).length;
            
            // Calculate property count (complexity measure)
            let propertyCount = 0;
            if (dataObject.prop && Array.isArray(dataObject.prop)) {
                propertyCount = dataObject.prop.length;
            }
            
            // Calculate data object size in KB (alternative complexity measure)
            const dataSizeKB = calculateDataObjectSizeInKB(dataObject);
            
            console.log(`Object ${dataObject.name}: total=${totalReferences}, form=${formReferences}, report=${reportReferences}, flow=${flowReferences}, userStory=${userStoryReferences}, properties=${propertyCount}, size=${dataSizeKB}KB`);
            
            summaryData.push({
                dataObjectName: dataObject.name,
                totalReferences: totalReferences,
                formReferences: formReferences,
                reportReferences: reportReferences,
                flowReferences: flowReferences,
                userStoryReferences: userStoryReferences,
                propertyCount: propertyCount,
                dataSizeKB: dataSizeKB
            });
        });
        
        // Sort by data object name alphabetically
        summaryData.sort((a, b) => a.dataObjectName.localeCompare(b.dataObjectName));
        
    } catch (error) {
        console.error('Error getting usage summary data:', error);
    }
    
    return summaryData;
}

/**
 * Calculates the size of a data object in KB using the same logic as data object size analysis
 */
function calculateDataObjectSizeInKB(dataObject: any): number {
    let totalSizeBytes = 0;
    
    if (dataObject.prop && Array.isArray(dataObject.prop)) {
        dataObject.prop.forEach((prop: any) => {
            const propSize = calculatePropertySizeForUsageAnalysis(prop);
            totalSizeBytes += propSize;
        });
    }
    
    // Convert bytes to KB
    const sizeInKB = totalSizeBytes / 1024;
    return Math.round(sizeInKB * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate the size of a single property in bytes using the same logic as data object size analysis
 */
function calculatePropertySizeForUsageAnalysis(prop: any): number {
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
            return nvarcharSize * 2;
            
        case 'varchar':
            // ASCII string - 1 byte per character, default 100 characters
            const varcharSize = dataSize ? parseInt(dataSize) : 100;
            return varcharSize;
            
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
            if (dataSize) {
                const precision = parseInt(dataSize.split(',')[0]) || 18;
                if (precision <= 9) { return 5; }
                if (precision <= 19) { return 9; }
                if (precision <= 28) { return 13; }
                return 17;
            }
            return 9; // Default for decimal(18,0)
            
        default:
            console.warn(`Unknown data type for size calculation: ${dataType}`);
            return 0;
    }
}

/**
 * Gets detailed data showing where each data object is used
 */
function getUsageDetailData(modelService: ModelService): any[] {
    const detailData: any[] = [];
    
    try {
        if (!modelService || !modelService.isFileLoaded()) {
            console.log('No model service or file loaded for detail data');
            return detailData;
        }
        
        const allObjects = modelService.getAllObjects();
        console.log('Getting detail data for', allObjects.length, 'objects');
        
        allObjects.forEach((dataObject, index) => {
            if (!dataObject.name) {
                return;
            }
            
            console.log(`Processing detail data for object: ${dataObject.name}`);
            
            // Find all references to this data object
            const references = findAllDataObjectReferences(dataObject.name, modelService);
            console.log(`Found ${references.length} references for ${dataObject.name}`);
            
            // Add actual references if found
            references.forEach(ref => {
                detailData.push({
                    dataObjectName: dataObject.name,
                    referenceType: ref.type,
                    referencedBy: ref.referencedBy,
                    itemType: ref.itemType
                });
            });
        });
        
        // Sort by data object name, then by reference type
        detailData.sort((a, b) => {
            if (a.dataObjectName !== b.dataObjectName) {
                return a.dataObjectName.localeCompare(b.dataObjectName);
            }
            return a.referenceType.localeCompare(b.referenceType);
        });
        
    } catch (error) {
        console.error('Error getting usage detail data:', error);
    }
    
    return detailData;
}


/**
 * Finds all references to a data object with detailed information
 */
function findAllDataObjectReferences(dataObjectName: string, modelService: ModelService): any[] {
    const references: any[] = [];
    
    try {
        console.log(`Searching for references to '${dataObjectName}'...`);
        
        // Check Forms (page workflows) - find forms that belong to this data object
        console.log('Checking forms (page workflows)...');
        const allPageWorkflows = modelService.getAllPageObjectWorkflows();
        console.log(`Found ${allPageWorkflows.length} page workflows`);
        allPageWorkflows.forEach((workflow: any) => {
            // Get the owner object of this form
            const ownerObject = modelService.getFormOwnerObject(workflow.name);
            if (ownerObject && ownerObject.name === dataObjectName) {
                references.push({
                    type: 'Form Owner Object',
                    referencedBy: workflow.name || 'Unnamed Form',
                    itemType: 'form'
                });
            }
            // Also check if this data object is the target child object for this form
            if (workflow.targetChildObject === dataObjectName) {
                references.push({
                    type: 'Form Target Object',
                    referencedBy: workflow.name || 'Unnamed Form',
                    itemType: 'form'
                });
            }

            // NEW: Check form input control source references via objectWorkflowParam entries
            // Using schema fields: sourceObjectName (preferred) or legacy fKObjectName as fallback
            if (workflow.objectWorkflowParam && Array.isArray(workflow.objectWorkflowParam)) {
                workflow.objectWorkflowParam.forEach((param: any) => {
                    const sourceObj = param.sourceObjectName || param.fKObjectName; // support both
                    if (sourceObj === dataObjectName) {
                        references.push({
                            type: 'Form Input Control Source Object',
                            referencedBy: (workflow.name || 'Unnamed Form') + ' / ' + (param.name || 'Unnamed Param'),
                            itemType: 'form'
                        });
                    }
                });
            }

            // NEW: Check form output variable source references via objectWorkflowOutputVar entries
            if (workflow.objectWorkflowOutputVar && Array.isArray(workflow.objectWorkflowOutputVar)) {
                workflow.objectWorkflowOutputVar.forEach((outputVar: any) => {
                    if (outputVar.sourceObjectName === dataObjectName) {
                        references.push({
                            type: 'Form Output Variable Source Object',
                            referencedBy: (workflow.name || 'Unnamed Form') + ' / ' + (outputVar.name || 'Unnamed Output Var'),
                            itemType: 'form'
                        });
                    }
                });
            }
        });
        
        // Check Reports - find reports that belong to this data object
        console.log('Checking reports...');
        const allReports = modelService.getAllReports();
        console.log(`Found ${allReports.length} reports`);
        allReports.forEach((report: any) => {
            // Get the owner object of this report
            const ownerObject = modelService.getReportOwnerObject(report.name);
            if (ownerObject && ownerObject.name === dataObjectName) {
                references.push({
                    type: 'Report Owner Object',
                    referencedBy: report.name || 'Unnamed Report',
                    itemType: 'report'
                });
            }
            // Also check if this data object is the target child object
            if (report.targetChildObject === dataObjectName) {
                references.push({
                    type: 'Report Target Object',
                    referencedBy: report.name || 'Unnamed Report',
                    itemType: 'report'
                });
            }
            // Check report columns for references to this data object
            if (report.reportColumn && Array.isArray(report.reportColumn)) {
                report.reportColumn.forEach((column: any) => {
                    if (column.sourceObjectName === dataObjectName) {
                        references.push({
                            type: 'Report Column Source Object',
                            referencedBy: (report.name || 'Unnamed Report') + ' / ' + (column.name || 'Unnamed Column'),
                            itemType: 'report'
                        });
                    }
                });
            }
        });
        
        // Check All Flows - find flows that belong to this data object
        console.log('Checking flows...');
        const allObjects = modelService.getAllObjects();
        let totalFlows = 0;
        allObjects.forEach(obj => {
            if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                obj.objectWorkflow.forEach((workflow: any) => {
                    // Skip page workflows since they're handled as forms above
                    if (workflow.isPage === "true") {
                        return; // Skip forms, they're already counted above
                    }
                    
                    totalFlows++;
                    // The flow belongs to this object, so check if this object matches our target
                    if (obj.name === dataObjectName) {
                        let flowType = 'General Flow';
                        if (workflow.isDynaFlow === "true") {
                            flowType = 'Workflow';
                        } else if (workflow.isDynaFlowTask === "true") {
                            flowType = 'Workflow Task';
                        } else if (workflow.name && (workflow.name.toLowerCase().endsWith('initreport') || workflow.name.toLowerCase().endsWith('initobjwf'))) {
                            flowType = 'Page Init Flow';
                        }
                        
                        references.push({
                            type: flowType + ' Owner Object',
                            referencedBy: workflow.name || 'Unnamed Flow',
                            itemType: 'flow'
                        });
                    }

                    // NEW: Check flow input parameter source references via objectWorkflowParam entries
                    if (workflow.objectWorkflowParam && Array.isArray(workflow.objectWorkflowParam)) {
                        workflow.objectWorkflowParam.forEach((param: any) => {
                            const sourceObj = param.sourceObjectName || param.fKObjectName; // support both
                            if (sourceObj === dataObjectName) {
                                let flowType = 'General Flow';
                                if (workflow.isDynaFlow === "true") {
                                    flowType = 'Workflow';
                                } else if (workflow.isDynaFlowTask === "true") {
                                    flowType = 'Workflow Task';
                                } else if (workflow.name && (workflow.name.toLowerCase().endsWith('initreport') || workflow.name.toLowerCase().endsWith('initobjwf'))) {
                                    flowType = 'Page Init Flow';
                                }
                                
                                references.push({
                                    type: flowType + ' Input Parameter Source Object',
                                    referencedBy: (workflow.name || 'Unnamed Flow') + ' / ' + (param.name || 'Unnamed Param'),
                                    itemType: 'flow'
                                });
                            }
                        });
                    }

                    // NEW: Check flow output variable source references via objectWorkflowOutputVar entries
                    if (workflow.objectWorkflowOutputVar && Array.isArray(workflow.objectWorkflowOutputVar)) {
                        workflow.objectWorkflowOutputVar.forEach((outputVar: any) => {
                            if (outputVar.sourceObjectName === dataObjectName) {
                                let flowType = 'General Flow';
                                if (workflow.isDynaFlow === "true") {
                                    flowType = 'Workflow';
                                } else if (workflow.isDynaFlowTask === "true") {
                                    flowType = 'Workflow Task';
                                } else if (workflow.name && (workflow.name.toLowerCase().endsWith('initreport') || workflow.name.toLowerCase().endsWith('initobjwf'))) {
                                    flowType = 'Page Init Flow';
                                }
                                
                                references.push({
                                    type: flowType + ' Output Variable Source Object',
                                    referencedBy: (workflow.name || 'Unnamed Flow') + ' / ' + (outputVar.name || 'Unnamed Output Var'),
                                    itemType: 'flow'
                                });
                            }
                        });
                    }
                });
            }
        });
        console.log(`Found ${totalFlows} total flows across all objects`);
        
        // Check User Stories - find user stories that reference this data object
        console.log('Checking user stories...');
        const currentModel = modelService.getCurrentModel();
        if (currentModel?.namespace && Array.isArray(currentModel.namespace) && currentModel.namespace.length > 0) {
            const namespace = currentModel.namespace[0];
            if (namespace.userStory && Array.isArray(namespace.userStory)) {
                console.log(`Found ${namespace.userStory.length} user stories`);
                namespace.userStory.forEach((userStory: any) => {
                    if (userStory.storyText && typeof userStory.storyText === 'string') {
                        // Extract data objects from the user story text using the same logic as userStoriesView.js
                        const extractedObjects = extractDataObjectsFromUserStory(userStory.storyText);
                        
                        // Check if any extracted object matches our target data object
                        const isReferenced = extractedObjects.some(extractedName => 
                            isDataObjectMatch(extractedName, dataObjectName)
                        );
                        
                        if (isReferenced) {
                            references.push({
                                type: 'User Story Reference',
                                referencedBy: userStory.storyText || 'Unnamed User Story',
                                itemType: 'userStory'
                            });
                        }
                    }
                });
            }
        }
        
        console.log(`Total references found for '${dataObjectName}': ${references.length}`);
        if (references.length > 0) {
            console.log('Sample references:', references.slice(0, 3));
        }
        
        //dont track fk usage
        // Check Data Object Properties - find properties in other data objects that reference this one via foreign keys
        // console.log('Checking data object properties (foreign key references)...');
        // allObjects.forEach((dataObject) => {
        //     if (dataObject.prop && Array.isArray(dataObject.prop)) {
        //         dataObject.prop.forEach((prop: any) => {
        //             if (prop.fKObjectName === dataObjectName) {
        //                 references.push({
        //                     type: 'Data Object Property FK Reference',
        //                     referencedBy: (dataObject.name || 'Unnamed Object') + ' / ' + (prop.name || 'Unnamed Property'),
        //                     itemType: 'dataObject'
        //                 });
        //             }
        //         });
        //     }
        // });
        
    } catch (error) {
        console.error('Error finding data object references:', error);
    }
    
    return references;
}

/**
 * Saves usage data to CSV format
 */
async function saveUsageDataToCSV(items: any[], modelService: ModelService): Promise<string> {
    if (!items || items.length === 0) {
        return 'No data to export';
    }
    
    // Determine if this is summary or detail data based on the first item
    const isSummaryData = items[0].hasOwnProperty('totalReferences');
    
    let csvContent = '';
    
    if (isSummaryData) {
        // Summary CSV format with detailed breakdown
        csvContent = 'Data Object Name,Total Reference Count,Form References,Report References,Flow References,User Story References\n';
        
        items.forEach(item => {
            const dataObjectName = (item.dataObjectName || '').replace(/"/g, '""');
            const totalReferenceCount = item.totalReferences || 0;
            const formReferences = item.formReferences || 0;
            const reportReferences = item.reportReferences || 0;
            const flowReferences = item.flowReferences || 0;
            const userStoryReferences = item.userStoryReferences || 0;
            
            csvContent += `"${dataObjectName}",${totalReferenceCount},${formReferences},${reportReferences},${flowReferences},${userStoryReferences}\n`;
        });
    } else {
        // Detail CSV format
        csvContent = 'Data Object Name,Reference Type,Referenced By\n';
        
        items.forEach(item => {
            const dataObjectName = (item.dataObjectName || '').replace(/"/g, '""');
            const referenceType = (item.referenceType || '').replace(/"/g, '""');
            const referencedBy = (item.referencedBy || '').replace(/"/g, '""');
            
            csvContent += `"${dataObjectName}","${referenceType}","${referencedBy}"\n`;
        });
    }
    
    return csvContent;
}

/**
 * Creates the HTML content for the data object usage analysis webview
 */
function getDataObjectUsageAnalysisWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    // Get the local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.file(path.join(extensionPath, 'src', 'webviews', 'dataObjectUsageAnalysisView.js'));
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: ${webview.cspSource}; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}' https://d3js.org; font-src ${webview.cspSource};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${codiconsUri}" rel="stylesheet">
    <title>Data Object Usage</title>
    
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
            font-weight: 600;
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
        
        /* Tab content */
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
            border-radius: 3px;
            font-size: var(--vscode-font-size);
            font-family: var(--vscode-font-family);
        }
        
        .filter-group input:focus, .filter-group select:focus {
            outline: 1px solid var(--vscode-focusBorder);
            border-color: var(--vscode-focusBorder);
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
            font-size: 13px;
        }
        
        .filter-button-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        /* View Details button styling to match filter button */
        .view-details-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 13px;
        }
        
        .view-details-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        /* Edit Data Object button styling */
        .edit-data-object-btn {
            background: transparent;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 6px;
            border-radius: 2px;
            font-size: 13px;
            margin-right: 8px;
            transition: background 0.15s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        
        .edit-data-object-btn:hover {
            background: var(--vscode-toolbar-hoverBackground);
        }
        
        .edit-data-object-btn:active {
            background: var(--vscode-toolbar-activeBackground);
            transform: scale(0.95);
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
        
        /* Action buttons in table */
        .edit-button {
            background: transparent !important;
            background-color: transparent !important;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 4px;
            border-radius: 3px;
            transition: background 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        
        .edit-button:hover {
            background: var(--vscode-toolbar-hoverBackground) !important;
            background-color: var(--vscode-toolbar-hoverBackground) !important;
        }
        
        .edit-button:active {
            background: var(--vscode-toolbar-activeBackground);
            transform: scale(0.95);
        }
        
        .action-cell {
            text-align: center;
            width: 140px;
        }
        
        /* Treemap specific styles */
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
        
        .legend-color.high-usage {
            background-color: #d73a49;
        }
        
        .legend-color.medium-usage {
            background-color: #f66a0a;
        }
        
        .legend-color.low-usage {
            background-color: #28a745;
        }
        
        .legend-color.no-usage {
            background-color: var(--vscode-button-secondaryBackground);
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
        
        /* Histogram specific styles */
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
        
        .histogram-label {
            font-family: var(--vscode-font-family);
            font-size: 12px;
            fill: var(--vscode-foreground);
            text-anchor: middle;
        }
        
        .histogram-value {
            font-family: var(--vscode-font-family);
            font-size: 11px;
            fill: var(--vscode-foreground);
            text-anchor: middle;
            font-weight: bold;
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
        
        /* Bubble chart specific styles */
        .bubble-container {
            padding: 15px;
        }
        
        .bubble-header {
            margin-bottom: 20px;
        }
        
        .bubble-title h3 {
            margin: 0 0 5px 0;
            color: var(--vscode-foreground);
            font-size: 16px;
        }
        
        .bubble-title p {
            margin: 0;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        
        .bubble-header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
        }
        
        .bubble-title {
            flex: 1;
        }
        
        .bubble-actions {
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }
        
        .bubble-viz {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 15px;
            overflow: hidden;
        }
        
        .bubble-quadrants {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .quadrant-legend {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 12px;
            color: var(--vscode-foreground);
        }
        
        .quadrant-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        
        .quadrant-color {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .quadrant-color.high-usage-low-complexity {
            background-color: #28a745; /* Green - Good */
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
        
        /* Bubble chart elements */
        .bubble-circle {
            cursor: pointer;
            stroke: var(--vscode-panel-border);
            stroke-width: 1px;
            opacity: 0.8;
            transition: opacity 0.2s, stroke-width 0.2s;
        }
        
        .bubble-circle:hover {
            opacity: 1;
            stroke-width: 2px;
        }
        
        .bubble-text {
            font-family: var(--vscode-font-family);
            font-size: 10px;
            fill: var(--vscode-foreground);
            text-anchor: middle;
            dominant-baseline: middle;
            pointer-events: none;
        }
        
        .axis-line {
            stroke: var(--vscode-panel-border);
            stroke-width: 1px;
        }
        
        .axis-text {
            font-family: var(--vscode-font-family);
            font-size: 11px;
            fill: var(--vscode-foreground);
        }
        
        .axis-label {
            font-family: var(--vscode-font-family);
            font-size: 12px;
            fill: var(--vscode-foreground);
            font-weight: bold;
        }
        
        .grid-line {
            stroke: var(--vscode-panel-border);
            stroke-width: 0.5px;
            opacity: 0.3;
        }
        
        .bubble-tooltip {
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
        
    </style>
</head>
<body>
    <div class="validation-header">
        <h2>Data Object Usage</h2>
        <p>Data object usage analysis with summary counts and detailed reference information</p>
    </div>
    
    <div class="tabs">
        <button class="tab active" data-tab="summary">Summary</button>
        <button class="tab" data-tab="detail">Detail</button>
        <button class="tab" data-tab="treemap">Proportional Usage</button>
        <button class="tab" data-tab="histogram">Usage Distribution</button>
        <button class="tab" data-tab="bubble">Complexity vs. Usage</button>
    </div>
    
    <div id="summary-tab" class="tab-content active">
        <div class="filter-section">
            <div class="filter-header" onclick="toggleFilterSection()">
                <span class="codicon codicon-chevron-down" id="filterChevron"></span>
                <span>Filters</span>
            </div>
            <div class="filter-content" id="filterContent">
                <div class="filter-row">
                    <div class="filter-group">
                        <label>Data Object Name:</label>
                        <input type="text" id="summaryFilter" placeholder="Filter by data object name...">
                    </div>
                </div>
                <div class="filter-actions">
                    <button onclick="clearFilters()" class="filter-button-secondary">Clear All</button>
                </div>
            </div>
        </div>
        
        <div class="header-actions">
            <button id="exportSummaryBtn" class="icon-button" title="Export to CSV">
                <i class="codicon codicon-cloud-download"></i>
            </button>
            <button id="refreshSummaryButton" class="icon-button" title="Refresh Data">
                <i class="codicon codicon-refresh"></i>
            </button>
        </div>
        
        <div id="summary-loading" class="loading">Loading usage summary...</div>
        <div class="table-container hidden" id="summary-table-container">
            <table id="summary-table">
                <thead>
                    <tr>
                        <th data-sort-column="0" data-table="summary-table">Data Object Name <span class="sort-indicator">▼</span></th>
                        <th data-sort-column="1" data-table="summary-table">Total References <span class="sort-indicator">▼</span></th>
                        <th data-sort-column="2" data-table="summary-table">Form References <span class="sort-indicator">▼</span></th>
                        <th data-sort-column="3" data-table="summary-table">Report References <span class="sort-indicator">▼</span></th>
                        <th data-sort-column="4" data-table="summary-table">Flow References <span class="sort-indicator">▼</span></th>
                        <th data-sort-column="5" data-table="summary-table">User Story References <span class="sort-indicator">▼</span></th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="summaryTableBody">
                </tbody>
            </table>
        </div>
        
        <div class="table-footer">
            <div class="table-footer-left"></div>
            <div class="table-footer-right">
                <span id="summary-record-info"></span>
            </div>
        </div>
    </div>
    
    <div id="detail-tab" class="tab-content">
        <div class="filter-section">
            <div class="filter-header" onclick="toggleDetailFilterSection()">
                <span class="codicon codicon-chevron-down" id="detailFilterChevron"></span>
                <span>Filters</span>
            </div>
            <div class="filter-content" id="detailFilterContent">
                <div class="filter-row">
                    <div class="filter-group">
                        <label>Data Object Name:</label>
                        <input type="text" id="detailFilter" placeholder="Filter by data object name...">
                    </div>
                    <div class="filter-group">
                        <label>Reference Type:</label>
                        <select id="filterReferenceType">
                            <option value="">All Types</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Referenced By:</label>
                        <input type="text" id="filterReferencedBy" placeholder="Filter by referenced by...">
                    </div>
                </div>
                <div class="filter-actions">
                    <button onclick="clearDetailFilters()" class="filter-button-secondary">Clear All</button>
                </div>
            </div>
        </div>
        
        <div class="header-actions">
            <button id="exportDetailBtn" class="icon-button" title="Export to CSV">
                <i class="codicon codicon-cloud-download"></i>
            </button>
            <button id="refreshDetailButton" class="icon-button" title="Refresh Data">
                <i class="codicon codicon-refresh"></i>
            </button>
        </div>
        
        <div id="detail-loading" class="loading">Loading usage details...</div>
        <div class="table-container hidden" id="detail-table-container">
            <table id="detail-table">
                <thead>
                    <tr>
                        <th data-sort-column="0" data-table="detail-table">Data Object Name <span class="sort-indicator">▼</span></th>
                        <th data-sort-column="1" data-table="detail-table">Reference Type <span class="sort-indicator">▼</span></th>
                        <th data-sort-column="2" data-table="detail-table">Referenced By <span class="sort-indicator">▼</span></th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="detailTableBody">
                </tbody>
            </table>
        </div>
        
        <div class="table-footer">
            <div class="table-footer-left"></div>
            <div class="table-footer-right">
                <span id="detail-record-info"></span>
            </div>
        </div>
    </div>
    
    <div id="treemap-tab" class="tab-content">
        <div class="treemap-container">
            <div class="treemap-header">
                <div class="treemap-header-content">
                    <div class="treemap-title">
                        <h3>Data Object Usage Proportions</h3>
                        <p>Size represents total reference count. Hover for details.</p>
                    </div>
                    <div class="treemap-actions">
                        <button id="refreshTreemapButton" class="icon-button" title="Refresh Data">
                            <i class="codicon codicon-refresh"></i>
                        </button>
                        <button id="generateTreemapPngBtn" class="svg-export-btn">
                            <span class="codicon codicon-device-camera"></span>
                            Generate PNG
                        </button>
                    </div>
                </div>
            </div>
            <div id="treemap-loading" class="loading">Loading treemap...</div>
            <div id="treemap-visualization" class="treemap-viz hidden"></div>
            <div class="treemap-legend">
                <div class="legend-item">
                    <span class="legend-color high-usage"></span>
                    <span>High Usage (20+ references)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color medium-usage"></span>
                    <span>Medium Usage (5-19 references)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color low-usage"></span>
                    <span>Low Usage (1-4 references)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color no-usage"></span>
                    <span>No Usage (0 references)</span>
                </div>
            </div>
        </div>
    </div>
    
    <div id="histogram-tab" class="tab-content">
        <div class="histogram-container">
            <div class="histogram-header">
                <div class="histogram-header-content">
                    <div class="histogram-title">
                        <h3>Usage Distribution</h3>
                        <p>Distribution of data objects across usage categories</p>
                    </div>
                    <div class="histogram-actions">
                        <button id="refreshHistogramButton" class="icon-button" title="Refresh Data">
                            <i class="codicon codicon-refresh"></i>
                        </button>
                        <button id="generateHistogramPngBtn" class="svg-export-btn">
                            <span class="codicon codicon-device-camera"></span>
                            Generate PNG
                        </button>
                    </div>
                </div>
            </div>
            <div id="histogram-loading" class="loading">Loading histogram...</div>
            <div id="histogram-visualization" class="histogram-viz hidden"></div>
            <div class="histogram-legend">
                <div class="legend-item">
                    <span class="legend-color high-usage"></span>
                    <span>High Usage (20+ references)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color medium-usage"></span>
                    <span>Medium Usage (5-19 references)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color low-usage"></span>
                    <span>Low Usage (1-4 references)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color no-usage"></span>
                    <span>No Usage (0 references)</span>
                </div>
            </div>
        </div>
    </div>
    
    <div id="bubble-tab" class="tab-content">
        <div class="bubble-container">
            <div class="bubble-header">
                <div class="bubble-header-content">
                    <div class="bubble-title">
                        <h3>Complexity vs. Usage Analysis</h3>
                        <p id="bubble-axis-description">X-axis: Property Count (Complexity) • Y-axis: Total References (Usage) • Bubble Size: User Story References</p>
                    </div>
                    <div class="bubble-actions">
                        <button id="refreshBubbleButton" class="icon-button" title="Refresh Data">
                            <i class="codicon codicon-refresh"></i>
                        </button>
                        <button id="generateBubblePngBtn" class="svg-export-btn">
                            <span class="codicon codicon-device-camera"></span>
                            Generate PNG
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Complexity Metric Selection -->
            <div class="filter-section">
                <div class="filter-header" id="bubbleFilterHeader">
                    <span class="codicon codicon-chevron-down" id="bubbleFilterChevron"></span>
                    <span>Chart Configuration</span>
                </div>
                <div class="filter-content" id="bubbleFilterContent">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="complexityMetric">Complexity Metric:</label>
                            <select id="complexityMetric">
                                <option value="propertyCount">Property Count</option>
                                <option value="dataSizeKB">Data Object Size (KB)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="bubble-loading" class="loading">Loading bubble chart...</div>
            <div id="bubble-visualization" class="bubble-viz hidden"></div>
            <div class="bubble-quadrants">
                <div class="quadrant-legend">
                    <div class="quadrant-item">
                        <span class="quadrant-color high-usage-low-complexity"></span>
                        <span><strong>High Usage, Low Complexity:</strong> Well-designed core objects</span>
                    </div>
                    <div class="quadrant-item">
                        <span class="quadrant-color high-usage-high-complexity"></span>
                        <span><strong>High Usage, High Complexity:</strong> Critical objects needing attention</span>
                    </div>
                    <div class="quadrant-item">
                        <span class="quadrant-color low-usage-low-complexity"></span>
                        <span><strong>Low Usage, Low Complexity:</strong> Simple utility objects</span>
                    </div>
                    <div class="quadrant-item">
                        <span class="quadrant-color low-usage-high-complexity"></span>
                        <span><strong>Low Usage, High Complexity:</strong> Potential over-engineering</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="spinner-overlay" class="spinner-overlay hidden">
        <div class="spinner"></div>
    </div>
    
    <script src="https://d3js.org/d3.v7.min.js"></script>
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