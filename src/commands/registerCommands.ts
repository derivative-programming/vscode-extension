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
import * as reportDetailsView from '../webviews/reports/reportDetailsView';
import * as formDetailsView from '../webviews/formDetailsView';
import { ModelService } from '../services/modelService';
import { openModelExplorer } from '../webviews/modelExplorerView';
import { showWelcomeView, WelcomePanel } from '../webviews/welcomeView';
import { showHelpView } from '../webviews/helpView';
import { showLoginView } from '../webviews/loginView';
import { AuthService } from '../services/authService';
import { showLogoutConfirmationModal } from '../utils/logoutConfirmationModal';
// Import showChangeRequestsListView and alias getWebviewContent
import { getWebviewContent as getChangeRequestsViewHtml, showChangeRequestsListView } from '../webviews/changeRequestsListView';
// Import showProjectSettings and related functions
import { showProjectSettings, getProjectSettingsPanel, closeProjectSettingsPanel } from '../webviews/projectSettingsView';
// Import showLexiconView and related functions
import { showLexiconView, getLexiconPanel, closeLexiconPanel } from '../webviews/lexiconView';
// Import showUserStoriesView and related functions
import { showUserStoriesView, getUserStoriesPanel, closeUserStoriesPanel } from '../webviews/userStoriesView';
// Import showUserStoryRoleRequirementsView and related functions
import { showUserStoryRoleRequirementsView, getUserStoryRoleRequirementsPanel, closeUserStoryRoleRequirementsPanel } from '../webviews/userStoryRoleRequirementsView';
import { registerModelValidationCommands, closeAllModelValidationPanels } from './modelValidationCommands';
import { registerModelAIProcessingCommands, closeAllModelAIProcessingPanels } from './modelAIProcessingCommands';
import { registerModelFabricationCommands, closeAllModelFabricationPanels } from './modelFabricationCommands';
import { registerReportCommands } from './reportCommands';
import { registerModelFeatureCatalogCommands, getModelFeatureCatalogPanel, closeModelFeatureCatalogPanel } from './modelFeatureCatalogCommands';
import { registerPageListCommands, getPageListPanel, closePageListPanel } from './pageListCommands';
import { registerPageInitListCommands, getPageInitListPanel, closePageInitListPanel } from './pageInitListCommands';
import { registerWorkflowListCommands, getWorkflowListPanel, closeWorkflowListPanel } from './workflowListCommands';
import { registerGeneralListCommands, getGeneralListPanel, closeGeneralListPanel } from './generalListCommands';
import { registerDataObjectListCommands, getDataObjectListPanel, closeDataObjectListPanel } from './dataObjectListCommands';
import { registerRoleRequirementsCommands, getRoleRequirementsPanel, closeRoleRequirementsPanel } from './roleRequirementsCommands';
import { showRequirementsFulfillment, getRequirementsFulfillmentPanel, closeRequirementsFulfillmentPanel } from './requirementsFulfillmentCommands';
import { registerUserStoriesQACommands, getUserStoriesQAPanel, closeUserStoriesQAPanel } from './userStoriesQACommands';
import { registerUserStoriesPageMappingCommands, getUserStoriesPageMappingPanel, closeUserStoriesPageMappingPanel } from './userStoriesPageMappingCommands';
import { registerUserStoriesJourneyCommands, getUserStoriesJourneyPanel, closeUserStoriesJourneyPanel } from './userStoriesJourneyCommands';
import { registerFabricationBlueprintCatalogCommands, getFabricationBlueprintCatalogPanel, closeFabricationBlueprintCatalogPanel } from './fabricationBlueprintCatalogCommands';
import { expandAllTopLevelCommand, collapseAllTopLevelCommand } from './expandCollapseCommands';
import { showHierarchyDiagram, getHierarchyPanel, closeHierarchyView } from '../webviews/hierarchyView';
import { showPageFlowDiagram, getPageFlowPanel, closePageFlowView } from '../webviews/pageFlowDiagramView';
import { showPagePreview, getPagePreviewPanel, closePagePreviewView } from '../webviews/pagePreviewView';
import { showFilterInputCommand, clearFilterCommand, showReportFilterInputCommand, clearReportFilterCommand, showDataObjectFilterInputCommand, clearDataObjectFilterCommand, showFormFilterInputCommand, clearFormFilterCommand, showPageInitFilterInputCommand, clearPageInitFilterCommand, showWorkflowsFilterInputCommand, clearWorkflowsFilterCommand, showWorkflowTasksFilterInputCommand, clearWorkflowTasksFilterCommand, showGeneralFilterInputCommand, clearGeneralFilterCommand } from './filterTreeViewCommands';
// Import showAppDNASettingsView and related functions
import { showAppDNASettingsView, reloadAppDNASettingsPanel } from '../webviews/appDnaSettingsView';
// Import showRegisterView
import { showRegisterView } from '../webviews/registerView';
// Page Init Details wrapper
const pageInitDetailsView = require('../webviews/pageInitDetailsView.js');

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
            }
            
            // Store references to any open form details panels before refreshing
            let openFormPanelsToReopen = [];
            if (formDetailsView && typeof formDetailsView.getOpenPanelItems === "function") {
                openFormPanelsToReopen = formDetailsView.getOpenPanelItems();
            }

            // Store references to any open page-init details panels before refreshing
            let openPageInitPanelsToReopen: any[] = [];
            if (pageInitDetailsView && typeof pageInitDetailsView.getOpenPanelItems === "function") {
                openPageInitPanelsToReopen = pageInitDetailsView.getOpenPanelItems();
            }
            
            // Store reference to project settings panel if open
            const projectSettingsData = typeof getProjectSettingsPanel === "function" ? getProjectSettingsPanel() : null;
            
            // Store reference to lexicon view panel if open
            const lexiconData = typeof getLexiconPanel === "function" ? getLexiconPanel() : null;
            
            // Store reference to user stories panel if open
            const userStoriesData = typeof getUserStoriesPanel === "function" ? getUserStoriesPanel() : null;
            
            // Store reference to user story role requirements panel if open
            const roleRequirementsData = typeof getUserStoryRoleRequirementsPanel === "function" ? getUserStoryRoleRequirementsPanel() : null;
            
            // Store reference to requirements fulfillment panel if open
            const requirementsFulfillmentData = typeof getRequirementsFulfillmentPanel === "function" ? getRequirementsFulfillmentPanel() : null;
            
            // Store reference to user stories QA panel if open
            const userStoriesQAData = typeof getUserStoriesQAPanel === "function" ? getUserStoriesQAPanel() : null;
            
            // Store reference to user stories page mapping panel if open
            const userStoriesPageMappingData = typeof getUserStoriesPageMappingPanel === "function" ? getUserStoriesPageMappingPanel() : null;
            
            // Store reference to user stories journey panel if open
            const userStoriesJourneyData = typeof getUserStoriesJourneyPanel === "function" ? getUserStoriesJourneyPanel() : null;
            
            // Store reference to model feature catalog panel if open
            const featureCatalogData = typeof getModelFeatureCatalogPanel === "function" ? getModelFeatureCatalogPanel() : null;
            
            // Store reference to fabrication blueprint catalog panel if open
            const fabricationBlueprintData = typeof getFabricationBlueprintCatalogPanel === "function" ? getFabricationBlueprintCatalogPanel() : null;
            
            // Store reference to hierarchy view panel if open
            const hierarchyData = typeof getHierarchyPanel === "function" ? getHierarchyPanel() : null;
            
            // Store reference to page flow diagram panel if open
            const pageFlowData = typeof getPageFlowPanel === "function" ? getPageFlowPanel() : null;
            
            // Store reference to page preview panel if open
            const pagePreviewData = typeof getPagePreviewPanel === "function" ? getPagePreviewPanel() : null;
              // Close all open object details panels
            if (objectDetailsView && typeof objectDetailsView.closeAllPanels === "function") {
                objectDetailsView.closeAllPanels();
            }
            
            // Close all open report details panels
            if (reportDetailsView && typeof reportDetailsView.closeAllPanels === "function") {
                reportDetailsView.closeAllPanels();
            }
            
            // Close all open form details panels
            if (formDetailsView && typeof formDetailsView.closeAllPanels === "function") {
                formDetailsView.closeAllPanels();
            }

            // Close all open page-init details panels
            if (pageInitDetailsView && typeof pageInitDetailsView.closeAllPanels === "function") {
                pageInitDetailsView.closeAllPanels();
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
            
            // Close user story role requirements panel if open
            if (typeof closeUserStoryRoleRequirementsPanel === "function") {
                closeUserStoryRoleRequirementsPanel();
            }
            
            // Close requirements fulfillment panel if open
            if (typeof closeRequirementsFulfillmentPanel === "function") {
                closeRequirementsFulfillmentPanel();
            }
            
            // Close user stories QA panel if open
            if (typeof closeUserStoriesQAPanel === "function") {
                closeUserStoriesQAPanel();
            }
            
            // Close user stories page mapping panel if open
            if (typeof closeUserStoriesPageMappingPanel === "function") {
                closeUserStoriesPageMappingPanel();
            }
            
            // Close user stories journey panel if open
            if (typeof closeUserStoriesJourneyPanel === "function") {
                closeUserStoriesJourneyPanel();
            }
            
            // Close model feature catalog panel if open
            if (typeof closeModelFeatureCatalogPanel === "function") {
                closeModelFeatureCatalogPanel();
            }
            
            // Close page list panel if open
            if (typeof closePageListPanel === "function") {
                closePageListPanel();
            }
            
            // Close page init list panel if open
            if (typeof closePageInitListPanel === "function") {
                closePageInitListPanel();
            }
            
            // Close workflow list panel if open
            if (typeof closeWorkflowListPanel === "function") {
                closeWorkflowListPanel();
            }
            
            // Close general list panel if open
            if (typeof closeGeneralListPanel === "function") {
                closeGeneralListPanel();
            }
            
            // Close data objects list panel if open
            if (typeof closeDataObjectListPanel === "function") {
                closeDataObjectListPanel();
            }
            
            // Close fabrication blueprint catalog panel if open
            if (typeof closeFabricationBlueprintCatalogPanel === "function") {
                closeFabricationBlueprintCatalogPanel();
            }
            
            // Close hierarchy view panel if open
            if (typeof closeHierarchyView === "function") {
                closeHierarchyView();
            }
            
            // Close page flow diagram panel if open
            if (typeof closePageFlowView === "function") {
                closePageFlowView();
            }
            
            // Close page preview panel if open
            if (typeof closePagePreviewView === "function") {
                closePagePreviewView();
            }
            
            // Reload the model file into memory
            if (appDNAFilePath) {
                try {
                    await modelService.loadFile(appDNAFilePath);
                    
                    // Check if we should auto-expand nodes on load
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                    if (workspaceFolder) {
                        const { getExpandNodesOnLoadFromConfig } = require('../utils/fileUtils');
                        const shouldExpand = getExpandNodesOnLoadFromConfig(workspaceFolder);
                        if (shouldExpand) {
                            // Small delay to ensure tree view is ready after refresh, then execute expand command
                            setTimeout(() => {
                                vscode.commands.executeCommand('appdna.expandAllTopLevel');
                            }, 200);
                        }
                    }
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
                    reportDetailsView.showReportDetails(item, modelService, context);
                }
            }
            
            // Reopen any form details panels that were previously open with fresh data
            if (openFormPanelsToReopen.length > 0 && formDetailsView) {
                for (const item of openFormPanelsToReopen) {
                    formDetailsView.showFormDetails(item, modelService);
                }
            }

            // Reopen any page-init details panels that were previously open with fresh data
            if (openPageInitPanelsToReopen.length > 0 && pageInitDetailsView) {
                for (const item of openPageInitPanelsToReopen) {
                    pageInitDetailsView.showPageInitDetails(item, modelService, context);
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
            
            // Reopen user story role requirements panel if it was open
            if (roleRequirementsData && roleRequirementsData.context && roleRequirementsData.modelService) {
                showUserStoryRoleRequirementsView(roleRequirementsData.context, modelService);
            }
            
            // Reopen requirements fulfillment panel if it was open
            if (requirementsFulfillmentData && requirementsFulfillmentData.context && requirementsFulfillmentData.modelService) {
                showRequirementsFulfillment(requirementsFulfillmentData.context, modelService);
            }
            
            // Reopen user stories QA panel if it was open
            if (userStoriesQAData && userStoriesQAData.context && userStoriesQAData.modelService) {
                vscode.commands.executeCommand('appdna.userStoriesQA');
            }
            
            // Reopen user stories page mapping panel if it was open
            if (userStoriesPageMappingData && userStoriesPageMappingData.context && userStoriesPageMappingData.modelService) {
                vscode.commands.executeCommand('appdna.userStoriesPageMapping');
            }
            
            // Reopen user stories journey panel if it was open
            if (userStoriesJourneyData && userStoriesJourneyData.context && userStoriesJourneyData.modelService) {
                vscode.commands.executeCommand('appdna.userStoriesJourney');
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
            }
            
            // Reopen page flow diagram panel if it was open
            if (pageFlowData && pageFlowData.context) {
                showPageFlowDiagram(pageFlowData.context, modelService);
            }
            
            // Reopen page preview panel if it was open
            if (pagePreviewData && pagePreviewData.context) {
                showPagePreview(pagePreviewData.context, modelService);
            }
        })
    );

    // Register handler for PAGE_INIT workflow item command from tree
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showWorkflowDetails', (node: JsonTreeItem) => {
            try {
                if (pageInitDetailsView && typeof pageInitDetailsView.showPageInitDetails === 'function') {
                    pageInitDetailsView.showPageInitDetails(node, modelService, context);
                } else {
                    vscode.window.showErrorMessage('Page Init Details view is not available.');
                }
            } catch (err: any) {
                vscode.window.showErrorMessage(`Failed to open Page Init Details: ${err?.message || err}`);
            }
        })
    );
    
    // Register reload config command for config file changes
    context.subscriptions.push(
        vscode.commands.registerCommand("appdna.reloadConfig", async () => {
            // Refresh the tree view to apply any config changes (like showAdvancedProperties)
            jsonTreeDataProvider.refresh();
            
            // If the AppDNA settings panel is open, reload it with fresh config data
            if (typeof reloadAppDNASettingsPanel === "function") {
                reloadAppDNASettingsPanel();
            }
            
            // Log config reload for debugging
            console.log('AppDNA configuration reloaded due to config file change');
        })
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
    
    // Register show AppDNA settings view command
    const showAppDNASettingsCommand = vscode.commands.registerCommand('appdna.showAppDNASettings', () => {
        showAppDNASettingsView(context);
    });
    context.subscriptions.push(showAppDNASettingsCommand);
    
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
            
            // Show custom logout confirmation modal
            await showLogoutConfirmationModal(async () => {
                // Close all Model AI related panels before logout
                closeAllModelAIProcessingPanels();
                closeAllModelFabricationPanels();
                closeAllModelValidationPanels();
                
                // Close catalog views
                closeModelFeatureCatalogPanel();
                closePageListPanel();
                closePageInitListPanel();
                closeWorkflowListPanel();
                closeGeneralListPanel();
                closeDataObjectListPanel();
                closeFabricationBlueprintCatalogPanel();
                
                await authService.logout();
                // vscode.window.showInformationMessage("Logged out from Model Services");
                
                // Refresh the tree view to update icons and available services
                jsonTreeDataProvider.refresh();
                
                // Update welcome view if it's currently open
                if (WelcomePanel.currentPanel) {
                    WelcomePanel.currentPanel.updateLoginStatus(false);
                }
            });
        })
    );

    // Register model validation commands
    registerModelValidationCommands(context, appDNAFilePath, modelService);
    
    // Register model feature catalog commands
    registerModelFeatureCatalogCommands(context, appDNAFilePath, modelService);
    
    // Register page list commands
    registerPageListCommands(context, appDNAFilePath, modelService);
    
    // Register page init list commands
    registerPageInitListCommands(context, appDNAFilePath, modelService);
    
    // Register workflow list commands
    registerWorkflowListCommands(context, appDNAFilePath, modelService);
    
    // Register general list commands
    registerGeneralListCommands(context, appDNAFilePath, modelService);
    
    // Register data objects list commands
    registerDataObjectListCommands(context, appDNAFilePath, modelService);
    
    // Register role requirements commands
    registerRoleRequirementsCommands(context, appDNAFilePath, modelService);
    
    // Register user stories QA commands
    registerUserStoriesQACommands(context, modelService);
    
    // Register user stories page mapping commands
    registerUserStoriesPageMappingCommands(context, modelService);
    
    // Register user stories journey commands
    registerUserStoriesJourneyCommands(context, modelService);
    
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

    // Register show user story role requirements command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showUserStoryRoleRequirements', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Show the user story role requirements view
            showUserStoryRoleRequirementsView(context, modelService);
        })
    );

    // Register show role requirements command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showRoleRequirements', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Show the role requirements view - this will be handled by the roleRequirementsCommands.ts
            // The actual command is registered there as 'appdna.roleRequirements'
            vscode.commands.executeCommand('appdna.roleRequirements');
        })
    );

    // Register show requirements fulfillment command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showRequirementsFulfillment', async () => {
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Show the requirements fulfillment view
            showRequirementsFulfillment(context, modelService);
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

    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showPageFlowDiagram', async () => {
            console.log('[DEBUG] Page flow diagram command triggered');
            console.log('[DEBUG] modelService.isFileLoaded():', modelService.isFileLoaded());
            
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Additional debug info about the loaded model
            try {
                const currentModel = modelService.getCurrentModel();
                console.log('[DEBUG] Current model exists:', !!currentModel);
                if (currentModel) {
                    console.log('[DEBUG] Current model keys:', Object.keys(currentModel));
                    if (currentModel.namespace) {
                        console.log('[DEBUG] Number of namespaces:', currentModel.namespace.length);
                    }
                }
                
                const allObjects = modelService.getAllObjects();
                console.log('[DEBUG] getAllObjects() in command:', allObjects ? allObjects.length : 'null/undefined');
            } catch (error) {
                console.log('[DEBUG] Error getting model info:', error);
            }
            
            // Show the page flow diagram view
            await showPageFlowDiagram(context, modelService);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showPagePreview', async () => {
            console.log('[DEBUG] Page preview command triggered');
            console.log('[DEBUG] modelService.isFileLoaded():', modelService.isFileLoaded());
            
            if (!modelService.isFileLoaded()) {
                vscode.window.showWarningMessage('No App DNA file is currently loaded.');
                return;
            }
            
            // Additional debug info about the loaded model
            try {
                const currentModel = modelService.getCurrentModel();
                console.log('[DEBUG] Current model exists:', !!currentModel);
                if (currentModel) {
                    console.log('[DEBUG] Current model keys:', Object.keys(currentModel));
                    if (currentModel.namespace) {
                        console.log('[DEBUG] Number of namespaces:', currentModel.namespace.length);
                    }
                }
                
                const allObjects = modelService.getAllObjects();
                console.log('[DEBUG] getAllObjects() in command:', allObjects ? allObjects.length : 'null/undefined');
            } catch (error) {
                console.log('[DEBUG] Error getting model info:', error);
            }
            
            // Show the page preview view
            await showPagePreview(context, modelService);
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
    
    // Register register command for Model Services
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.registerModelServices', async () => {
            // Initialize auth service with extension context
            const authService = AuthService.getInstance();
            authService.initialize(context);
            
            // Show register webview and refresh tree view on successful registration
            await showRegisterView(context, () => {
                // Refresh the tree view to update icons and available services
                jsonTreeDataProvider.refresh();
                vscode.commands.executeCommand('appdna.refreshView');
                
                // Open the welcome view after successful registration
                showWelcomeView(context);
                
                // Update welcome view if it's currently open
                if (WelcomePanel.currentPanel) {
                    const authService = AuthService.getInstance();
                    WelcomePanel.currentPanel.updateLoginStatus(authService.isLoggedIn());
                }
            });
        })
    );

    // Register show form details command
    // Import and delegate to formCommands module
    const { showFormDetailsCommand, addFormCommand } = require('./formCommands');
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showFormDetails', (node: JsonTreeItem) => {
            showFormDetailsCommand(node, modelService, context);
        })
    );

    // Register add form command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addForm', () => {
            addFormCommand(modelService);
        })
    );

    // Register form filter commands
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showFormFilter', async () => {
            await showFormFilterInputCommand(jsonTreeDataProvider);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.clearFormFilter', () => {
            clearFormFilterCommand(jsonTreeDataProvider);
        })
    );

    // Register page init filter commands
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showPageInitFilter', async () => {
            await showPageInitFilterInputCommand(jsonTreeDataProvider);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.clearPageInitFilter', () => {
            clearPageInitFilterCommand(jsonTreeDataProvider);
        })
    );

    // Register workflows filter commands
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showWorkflowsFilter', async () => {
            await showWorkflowsFilterInputCommand(jsonTreeDataProvider);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.clearWorkflowsFilter', () => {
            clearWorkflowsFilterCommand(jsonTreeDataProvider);
        })
    );

    // Register workflow tasks filter commands
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showWorkflowTasksFilter', async () => {
            await showWorkflowTasksFilterInputCommand(jsonTreeDataProvider);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.clearWorkflowTasksFilter', () => {
            clearWorkflowTasksFilterCommand(jsonTreeDataProvider);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showGeneralFilter', async () => {
            await showGeneralFilterInputCommand(jsonTreeDataProvider);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.clearGeneralFilter', () => {
            clearGeneralFilterCommand(jsonTreeDataProvider);
        })
    );
}