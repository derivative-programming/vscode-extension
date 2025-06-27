// SEARCH_TAG: command registration for VS Code extension
// Registers all extension commands.

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import JSZip from 'jszip';
import { JsonTreeItem } from '../models/types';
import { JsonTreeDataProvider } from '../providers/jsonTreeDataProvider';
import { openJsonEditor } from '../webviews/jsonEditor';
import { addFileCommand, addObjectCommand, removeObjectCommand, generateCodeCommand } from './objectCommands';
import { newProjectCommand, openProjectCommand, saveProjectCommand } from './projectCommands';
import { startMCPServerCommand, stopMCPServerCommand } from './mcpCommands';
import { startMCPHttpServerCommand, stopMCPHttpServerCommand } from './mcpHttpCommands';
import * as objectDetailsView from '../webviews/objectDetailsView';
import * as reportDetailsView from '../webviews/reportDetailsView';
import { ModelService } from '../services/modelService';
import { openModelExplorer } from '../webviews/modelExplorerView';
import { showWelcomeView, WelcomePanel } from '../webviews/welcomeView';
import { showHelpView } from '../webviews/helpView';
import { showLoginView } from '../webviews/loginView';
import { AuthService } from '../services/authService';
// Import showChangeRequestsListView and alias getWebviewContent
import { getWebviewContent as getChangeRequestsViewHtml, showChangeRequestsListView } from '../webviews/changeRequestsListView';
// Import showProjectSettings and related functions
import { showProjectSettings, getProjectSettingsPanel, closeProjectSettingsPanel } from '../webviews/projectSettingsView';
// Import showLexiconView and related functions
import { showLexiconView, getLexiconPanel, closeLexiconPanel } from '../webviews/lexiconView';
// Import showUserStoriesView and related functions
import { showUserStoriesView, getUserStoriesPanel, closeUserStoriesPanel } from '../webviews/userStoriesView';
import { registerModelValidationCommands, closeAllModelValidationPanels } from './modelValidationCommands';
import { registerModelAIProcessingCommands, closeAllModelAIProcessingPanels } from './modelAIProcessingCommands';
import { registerModelFabricationCommands, closeAllModelFabricationPanels } from './modelFabricationCommands';
import { registerReportCommands } from './reportCommands';
import { registerModelFeatureCatalogCommands, getModelFeatureCatalogPanel, closeModelFeatureCatalogPanel } from './modelFeatureCatalogCommands';
import { registerFabricationBlueprintCatalogCommands, getFabricationBlueprintCatalogPanel, closeFabricationBlueprintCatalogPanel } from './fabricationBlueprintCatalogCommands';
import { expandAllTopLevelCommand, collapseAllTopLevelCommand } from './expandCollapseCommands';
import { showHierarchyDiagram, getHierarchyPanel, closeHierarchyView } from '../webviews/hierarchyView';
import { showFilterInputCommand, clearFilterCommand, showReportFilterInputCommand, clearReportFilterCommand, showDataObjectFilterInputCommand, clearDataObjectFilterCommand } from './filterTreeViewCommands';

/**
 * Registers all commands for the AppDNA extension
 * @param context Extension context
 * @param jsonTreeDataProvider The tree data provider
 * @param appDNAFilePath Path to the app-dna.json file
 * @param modelService The model service instance
 */
export function registerCommands(
    context: vscode.ExtensionContext,
    jsonTreeDataProvider: JsonTreeDataProvider,
    appDNAFilePath: string | null,
    modelService: ModelService
): void {
    // Register a no-op command for the unsaved changes indicator
    const unsavedChangesIndicatorCommand = vscode.commands.registerCommand('appdna.unsavedChangesIndicator', () => {
        // This command does nothing - it's just a visual indicator
        console.log("Unsaved changes indicator clicked");
    });
    context.subscriptions.push(unsavedChangesIndicatorCommand);
      // Register refresh command
    const refreshCommand = vscode.commands.registerCommand('appdna.refresh', () => {
        jsonTreeDataProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);
    
    // Register refresh view command for the title bar button
    context.subscriptions.push(
        vscode.commands.registerCommand("appdna.refreshView", async () => {
            // Store references to any open object details panels before refreshing
            let openPanelsToReopen = [];
            if (objectDetailsView && typeof objectDetailsView.getOpenPanelItems === "function") {
                openPanelsToReopen = objectDetailsView.getOpenPanelItems();
            }
            
            // Store references to any open report details panels before refreshing
            let openReportPanelsToReopen = [];
            if (reportDetailsView && typeof reportDetailsView.getOpenPanelItems === "function") {
                openReportPanelsToReopen = reportDetailsView.getOpenPanelItems();
            }            // Store reference to project settings panel if open
            const projectSettingsData = typeof getProjectSettingsPanel === "function" ? getProjectSettingsPanel() : null;
            
            // Store reference to lexicon view panel if open
            const lexiconData = typeof getLexiconPanel === "function" ? getLexiconPanel() : null;
            
            // Store reference to user stories panel if open
            const userStoriesData = typeof getUserStoriesPanel === "function" ? getUserStoriesPanel() : null;
            
            // Store reference to model feature catalog panel if open
            const featureCatalogData = typeof getModelFeatureCatalogPanel === "function" ? getModelFeatureCatalogPanel() : null;
            
            // Store reference to fabrication blueprint catalog panel if open
            const fabricationBlueprintData = typeof getFabricationBlueprintCatalogPanel === "function" ? getFabricationBlueprintCatalogPanel() : null;
            
            // Store reference to hierarchy view panel if open
            const hierarchyData = typeof getHierarchyPanel === "function" ? getHierarchyPanel() : null;
              // Close all open object details panels
            if (objectDetailsView && typeof objectDetailsView.closeAllPanels === "function") {
                objectDetailsView.closeAllPanels();
            }
            
            // Close all open report details panels
            if (reportDetailsView && typeof reportDetailsView.closeAllPanels === "function") {
                reportDetailsView.closeAllPanels();
            }
            
            // Close project settings panel if open
            if (typeof closeProjectSettingsPanel === "function") {
                closeProjectSettingsPanel();
            }
            
            // Close lexicon view panel if open
            if (typeof closeLexiconPanel === "function") {
                closeLexiconPanel();
            }
            
            // Close user stories panel if open
            if (typeof closeUserStoriesPanel === "function") {
                closeUserStoriesPanel();
            }
            
            // Close model feature catalog panel if open
            if (typeof closeModelFeatureCatalogPanel === "function") {
                closeModelFeatureCatalogPanel();
            }
            
            // Close fabrication blueprint catalog panel if open
            if (typeof closeFabricationBlueprintCatalogPanel === "function") {
                closeFabricationBlueprintCatalogPanel();
            }
            
            // Close hierarchy view panel if open
            if (typeof closeHierarchyView === "function") {
                closeHierarchyView();
            }
            
            // Reload the model file into memory
            if (appDNAFilePath) {
                try {
                    await modelService.loadFile(appDNAFilePath);
                } catch (err) {
                    vscode.window.showErrorMessage("Failed to reload model: " + (err && err.message ? err.message : err));
                }
            }
            
            // Refresh the tree view
            jsonTreeDataProvider.refresh();
            
            // Wait a moment for the model to fully load
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Reopen any object details panels that were previously open with fresh data
            if (openPanelsToReopen.length > 0 && objectDetailsView) {
                for (const item of openPanelsToReopen) {
                    objectDetailsView.showObjectDetails(item, modelService);
                }
            }
            
            // Reopen any report details panels that were previously open with fresh data
            if (openReportPanelsToReopen.length > 0 && reportDetailsView) {
                for (const item of openReportPanelsToReopen) {
                    reportDetailsView.showReportDetails(item, modelService);
                }
            }
            
            // Reopen project settings panel if it was open
            if (projectSettingsData && projectSettingsData.context && projectSettingsData.modelService) {
                showProjectSettings(projectSettingsData.context, modelService);            }
            
            // Reopen lexicon view panel if it was open
            if (lexiconData && lexiconData.context && lexiconData.modelService) {
                showLexiconView(lexiconData.context, modelService);            }
            
            // Reopen user stories panel if it was open
            if (userStoriesData && userStoriesData.context && userStoriesData.modelService) {
                showUserStoriesView(userStoriesData.context, modelService);
            }
              // Reopen model feature catalog panel if it was open
            if (featureCatalogData && featureCatalogData.context && featureCatalogData.modelService) {
                vscode.commands.executeCommand('appdna.modelFeatureCatalog');
            }
            
            // Reopen fabrication blueprint catalog panel if it was open
            if (fabricationBlueprintData && fabricationBlueprintData.context && fabricationBlueprintData.modelService) {
                vscode.commands.executeCommand('appdna.fabricationBlueprintCatalog');
            }
            
            // Reopen hierarchy view panel if it was open
            if (hierarchyData && hierarchyData.context) {
                showHierarchyDiagram(hierarchyData.context, modelService);
            }        })
    );
    
        // Register expand all top level items command using the dedicated handler
    context.subscriptions.push(
        vscode.commands.registerCommand("appdna.expandAllTopLevel", async () => {
            await expandAllTopLevelCommand(jsonTreeDataProvider);
        })
    );
    
    // Register collapse all top level items command using the dedicated handler
    context.subscriptions.push(
        vscode.commands.registerCommand("appdna.collapseAllTopLevel", async () => {
            await collapseAllTopLevelCommand();
        })
    );

    // Register select data object command
    context.subscriptions.push(
        vscode.commands.registerCommand("appdna.selectDataObject", async (objectName: string) => {
            if (typeof objectName === 'string') {
                await jsonTreeDataProvider.selectDataObject(objectName);
            } else {
                console.error('selectDataObject command requires object name as string parameter');
            }
        })
    );

    // Register edit command
    const editCommand = vscode.commands.registerCommand('appdna.editObject', (node: JsonTreeItem) => {
        openJsonEditor(context, node.label);
    });
    context.subscriptions.push(editCommand);

    // Register add file command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addFile', async () => {
            await addFileCommand(context, appDNAFilePath, jsonTreeDataProvider, modelService);
        })
    );

    // Register add object command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addObject', async () => {
            await addObjectCommand(appDNAFilePath, jsonTreeDataProvider, modelService);
        })
    );

    // Register remove object command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.removeObject', async (node: JsonTreeItem) => {
            await removeObjectCommand(node, appDNAFilePath, jsonTreeDataProvider, modelService);
        })
    );

    // Register new project command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.newProject', async () => {
            await newProjectCommand(jsonTreeDataProvider);
        })
    );

    // Register open project command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.openProject', async () => {
            await openProjectCommand(jsonTreeDataProvider);
        })
    );

    // Register save project command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.saveProject', async () => {
            await saveProjectCommand(jsonTreeDataProvider);
        })
    );
    
    // Register generate code command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.generateCode', async () => {
            await generateCodeCommand(appDNAFilePath, modelService);
        })
    );
    
    // Register show details command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showDetails', (node: JsonTreeItem) => {
            // Ensure the objectDetailsView module is loaded correctly
            if (!objectDetailsView || typeof objectDetailsView.showObjectDetails !== 'function') {
                vscode.window.showErrorMessage('Failed to load objectDetailsView module. Please check the extension setup.');
                return;
            }

            // Use the objectDetailsView implementation with modelService only
            objectDetailsView.showObjectDetails(node, modelService);
        })
    );    
    
    // Register list all objects command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.listAllObjects', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Open the model explorer webview for objects
            openModelExplorer(context, modelService, 'objects');
        })
    );
    
    // Register list all reports command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.listAllReports', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Open the model explorer webview for reports
            openModelExplorer(context, modelService, 'reports');
        })
    );

    // Register save file command for the sidebar save button
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.saveFile', async () => {
            console.log("[DEBUG] Save command triggered");

            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage("No App DNA file is currently loaded.");
                return;
            }
            const model = modelService.getCurrentModel();
            if (!model) {
                vscode.window.showErrorMessage("No model is loaded in memory.");
                return;
            }
            // Debug: print the in-memory model structure
            try {
                console.log("[DEBUG] In-memory model before save:", JSON.stringify(model, null, 2));
            } catch (e) {
                console.log("[DEBUG] Could not stringify model");
            }
            try {
                await modelService.saveToFile(model);
                vscode.window.showInformationMessage("Model saved successfully.");
            } catch (err) {
                vscode.window.showErrorMessage("Failed to save model: " + (err && err.message ? err.message : err));
            }
        })
    );

    // Register show welcome view command
    const showWelcomeCommand = vscode.commands.registerCommand('appdna.showWelcome', () => {
        showWelcomeView(context);
    });
    context.subscriptions.push(showWelcomeCommand);
    
    // Register show help view command
    const showHelpCommand = vscode.commands.registerCommand('appdna.showHelp', () => {
        showHelpView(context);
    });
    context.subscriptions.push(showHelpCommand);
    
    // Register login command for Model Services
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.loginModelServices', async () => {
            // Initialize auth service with extension context
            const authService = AuthService.getInstance();
            authService.initialize(context);
            
            // Show login webview and refresh tree view on successful login
            await showLoginView(context, () => {
                // Refresh the tree view to update icons and available services
                jsonTreeDataProvider.refresh();
                vscode.commands.executeCommand('appdna.refreshView');
                
                // Open the welcome view after successful login
                showWelcomeView(context);
                
                // Update welcome view if it's currently open
                if (WelcomePanel.currentPanel) {
                    const authService = AuthService.getInstance();
                    WelcomePanel.currentPanel.updateLoginStatus(authService.isLoggedIn());
                }
            });
        })
    );
    
    // Register logout command for Model Services
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.logoutModelServices', async () => {
            const authService = AuthService.getInstance();
            authService.initialize(context);
            
            // Confirm logout
            const confirmed = await vscode.window.showWarningMessage(
                "Are you sure you want to log out from Model Services?",
                { modal: true },
                "Yes", "No"
            );
            
            if (confirmed === "Yes") {
                // Close all Model AI related panels before logout
                closeAllModelAIProcessingPanels();
                closeAllModelFabricationPanels();
                closeAllModelValidationPanels();
                
                // Close catalog views
                closeModelFeatureCatalogPanel();
                closeFabricationBlueprintCatalogPanel();
                
                await authService.logout();
                // vscode.window.showInformationMessage("Logged out from Model Services");
                
                // Refresh the tree view to update icons and available services
                jsonTreeDataProvider.refresh();
                
                // Update welcome view if it's currently open
                if (WelcomePanel.currentPanel) {
                    WelcomePanel.currentPanel.updateLoginStatus(false);
                }
            }
        })
    );

    // Register model validation commands
    registerModelValidationCommands(context, appDNAFilePath, modelService);
    
    // Register model feature catalog commands
    registerModelFeatureCatalogCommands(context, appDNAFilePath, modelService);
    
    // Register model AI processing commands
    registerModelAIProcessingCommands(context, appDNAFilePath, modelService);

    // Register show project settings command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showProjectSettings', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Show the project settings view
            showProjectSettings(context, modelService);        })
    );
    
    // Register show lexicon command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showLexicon', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Show the lexicon view
            showLexiconView(context, modelService);        })
    );
    
    // Register show user stories command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showUserStories', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Show the user stories view
            showUserStoriesView(context, modelService);
        })
    );
    
    // Register start MCP server command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.startMCPServer', async () => {
            await startMCPServerCommand();
        })
    );
    
    // Register stop MCP server command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.stopMCPServer', async () => {
            await stopMCPServerCommand();
        })
    );
    
    // Register start MCP HTTP server command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.startMCPHttpServer', async () => {
            await startMCPHttpServerCommand();
        })
    );    // Register stop MCP HTTP server command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.stopMCPHttpServer', async () => {
            await stopMCPHttpServerCommand();
        })
    );
    
    registerModelFabricationCommands(context, appDNAFilePath, modelService);
    
    // Register fabrication blueprint catalog commands
    registerFabricationBlueprintCatalogCommands(context, appDNAFilePath, modelService);
    
    // Register report-related commands
    registerReportCommands(context, modelService);

    // Register show hierarchy diagram command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showHierarchyDiagram', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Show the hierarchy diagram view
            await showHierarchyDiagram(context, modelService);
        })
    );
          
    // Register filter commands
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showFilter', async () => {
            await showFilterInputCommand(jsonTreeDataProvider);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.clearFilter', () => {
            clearFilterCommand(jsonTreeDataProvider);
          
        })
    );
    
    // Register report filter commands
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showReportFilter', async () => {
            await showReportFilterInputCommand(jsonTreeDataProvider);
        })    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.clearReportFilter', () => {
            clearReportFilterCommand(jsonTreeDataProvider);
        })
    );
    
    // Register data object filter commands
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showDataObjectFilter', async () => {
            await showDataObjectFilterInputCommand(jsonTreeDataProvider);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.clearDataObjectFilter', () => {
            clearDataObjectFilterCommand(jsonTreeDataProvider);
        })
    );
}