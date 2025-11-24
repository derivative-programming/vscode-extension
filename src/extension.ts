// SEARCH_TAG: extension entry point for VS Code extension
// This is the main entry for the extension.

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { setExtensionContext } from './utils/extensionContext';
import { updateFileExistsContext, updateConfigExistsContext } from './utils/fileUtils';
import { JsonTreeDataProvider } from './providers/jsonTreeDataProvider';
import { registerCommands } from './commands/registerCommands';
import * as objectDetailsView from './webviews/objectDetailsView';
import { ModelService } from './services/modelService';
import { AuthService } from './services/authService';
import { showWelcomeView } from './webviews/welcomeView';
import { showLexiconView } from './webviews/lexiconView';
import { configureMcpSettings } from './commands/mcpCommands';
import { McpBridge } from './services/mcpBridge';
import { registerMcpViewCommands } from './commands/mcpViewCommands';
import { AppDNAMcpProvider } from './mcp/mcpProvider';
import { generateChatmodeDocumentation as generateViewDocs, getToolNames as getViewToolNames } from './mcp/tools/registrations/registerViewTools';
import { generateChatmodeDocumentation as generateUserStoryDocs, getToolNames as getUserStoryToolNames } from './mcp/tools/registrations/registerUserStoryTools';
import { generateChatmodeDocumentation as generateDataObjectDocs, getToolNames as getDataObjectToolNames } from './mcp/tools/registrations/registerDataObjectTools';
import { generateChatmodeDocumentation as generateFormDocs, getToolNames as getFormToolNames } from './mcp/tools/registrations/registerFormTools';
import { generateChatmodeDocumentation as generateReportDocs, getToolNames as getReportToolNames } from './mcp/tools/registrations/registerReportTools';
import { generateChatmodeDocumentation as generatePageInitDocs, getToolNames as getPageInitToolNames } from './mcp/tools/registrations/registerPageInitTools';
import { generateChatmodeDocumentation as generateWorkflowDocs, getToolNames as getWorkflowToolNames } from './mcp/tools/registrations/registerWorkflowTools';
import { generateChatmodeDocumentation as generateGeneralFlowDocs, getToolNames as getGeneralFlowToolNames } from './mcp/tools/registrations/registerGeneralFlowTools';
import { generateChatmodeDocumentation as generateModelDocs, getToolNames as getModelToolNames } from './mcp/tools/registrations/registerModelTools';
import { generateChatmodeDocumentation as generateModelServiceDocs, getToolNames as getModelServiceToolNames } from './mcp/tools/registrations/registerModelServiceTools';

// Track whether welcome view has been shown in this session
let hasShownWelcomeView = false;

/**
 * Creates or updates the AppDNA chat mode configuration file for GitHub Copilot
 * @param workspacePath The workspace path
 */
async function createAppDNAChatMode(workspacePath: string): Promise<void> {
    const copilotInstructionsDir = path.join(workspacePath, '.github', 'chatmodes');
    const chatModeFile = path.join(copilotInstructionsDir, 'appdna.chatmode.md');

    console.log('[Extension] Chat mode directory:', copilotInstructionsDir);
    console.log('[Extension] Chat mode file:', chatModeFile);

    // Create the .github/chatmodes directory if it doesn't exist
    if (!fs.existsSync(copilotInstructionsDir)) {
        console.log('[Extension] Creating chat mode directory...');
        fs.mkdirSync(copilotInstructionsDir, { recursive: true });
    } else {
        console.log('[Extension] Chat mode directory already exists');
    }

    // Collect all tool names dynamically from registration files
    console.log('[Extension] Collecting tool names...');
    let allTools: string[] = [];
    try {
        allTools = [
            ...getUserStoryToolNames(),
            ...getDataObjectToolNames(),
            ...getFormToolNames(),
            ...getReportToolNames(),
            ...getPageInitToolNames(),
            ...getWorkflowToolNames(),
            ...getGeneralFlowToolNames(),
            ...getModelToolNames(),
            ...getModelServiceToolNames(),
            ...getViewToolNames()
        ];
        console.log('[Extension] Collected', allTools.length, 'tool names');
    } catch (error) {
        console.error('[Extension] Error collecting tool names:', error);
        throw error;
    }
    
    // Generate YAML tools list
    const toolsYaml = allTools.map(tool => `  - ${tool}`).join('\n');
    console.log('[Extension] Generated YAML tools list');

    // Chat mode configuration in Markdown format with YAML frontmatter
    console.log('[Extension] Building chat mode content...');
    let chatModeContent: string;
    try {
        chatModeContent = `---
description: Specialized chat mode for AppDNA model building and code generation with MCP tool integration
tools:
${toolsYaml}
---

# AppDNA Chat Mode

You are an expert assistant for the AppDNA VS Code extension, which provides a professional graphical interface for building application models and automatically generating source code for multiple platforms and languages.

## What is AppDNA?

AppDNA is a model-driven development platform that lets you design your application once, then generate complete source code for .NET, Python, Web applications, Mobile Apps, and AR/VR applications (planned). Transform your development workflow by designing your application model and letting AppDNA generate the implementation code.

## Why AppDNA?

**Software development should focus on business logic, complex services, and design-intensive UI.** Less time should be spent on straightforward structured boilerplate software code. AppDNA enables this principle by:

- **Automating Boilerplate**: Generate complete data access layers, CRUD operations, and standard UI components automatically
- **Focusing on Business Value**: Spend your development time on complex business rules, innovative features, and exceptional user experiences
- **Reducing Repetitive Coding**: Eliminate hours of writing similar database queries, form validations, and standard API endpoints
- **Accelerating Delivery**: Get from concept to working application faster by focusing on what makes your application unique

## Key Capabilities

### 🏗️ Model Builder
- **Dynamic UI Generation**: All forms and controls are automatically generated from your JSON structure
- **Real-time Validation**: Instant feedback as you edit with built-in validation
- **Professional Interface**: Clean, VS Code-integrated design with hierarchical tree view navigation

### 📝 Intelligent Model Editing
- **Tree View Navigation**: Navigate your project structure with organized sections:
  - **PROJECT**: Configuration settings, lexicon management, MCP servers
  - **DATA OBJECTS**: Business entities with hierarchical organization
  - **USER STORIES**: Comprehensive story management with 8 specialized views
  - **PAGES**: Forms and reports for UI design (advanced feature)
  - **FLOWS**: Workflow and flow management (advanced feature)
  - **APIS**: API site management (advanced feature)
  - **ANALYSIS**: Analytics dashboard with 9 analysis tools (advanced feature)
  - **MODEL SERVICES**: AI-powered processing, validation, and code generation

### 📱 Page Preview & UI Design
- **Page Preview**: Interactive preview of forms and reports before full implementation
- **Role-Based Filtering**: Filter page previews by user roles and access requirements
- **Real-Time Updates**: Preview updates automatically as you modify your model

### 🎯 User Story Development Management
Complete agile project management with 8 comprehensive tabs:
- **Details Tab**: 13-column sortable table with 6 filter types, bulk operations, inline editing
- **Dev Queue Tab**: Visual priority queue with drag-and-drop reordering and data object dependency ranking
- **Analysis Tab**: 6 real-time KPI metrics + 5 interactive D3.js charts (status, priority, velocity, cycle time, workload)
- **Board Tab**: Kanban board with 5 status columns and drag-and-drop workflow
- **Sprint Tab**: Sprint planning with backlog management + burndown chart visualization
- **Developers Tab**: Developer resource management, capacity planning, and hourly rate tracking
- **Forecast Tab**: Gantt chart timeline with configurable working hours, holidays, and risk assessment
- **Cost Tab**: Monthly cost analysis and projections by developer with budget tracking

### 📊 Analytics & Analysis Dashboard
- **Comprehensive Metrics**: Project-wide metrics and statistics
- **Data Object Analysis**: Storage size requirements, usage tracking, relationship hierarchy
- **Database Forecasting**: Configurable database growth predictions
- **User Story Analytics**: Role distribution analysis, user journey mapping

### ⚡ AI-Powered Code Generation
- **Model Services Integration**: Connect to cloud-based AI services
- **Model Validation**: Automated model validation with improvement suggestions
- **Fabrication Blueprint Catalog**: Select from fabrication templates
- **Multi-Platform Code Generation**: Generate source code for .NET, Python, Web, Mobile, AR/VR

## AppDNA Development Workflow (9 Steps)

Follow this comprehensive workflow for model-driven development:

1. **Create New Project Model** - Start with a new AppDNA JSON model file
2. **Update Project Settings** - Configure project metadata and context information
3. **Register/Login to Model Services** - Access AI-powered cloud services
4. **Add Model Features** - Browse and select features from the feature catalog
5. **Request Model AI Processing** - Enhance your model with AI assistance
6. **Request Model Validation** - Validate and improve your model structure
7. **Select Fabrication Blueprints** - Choose templates for code generation
8. **Request Model Fabrication** - Generate source code for multiple platforms
9. **Manual Model Editing** - Fine-tune your model and iterate

## How to Use AppDNA Effectively

The AppDNA extension provides comprehensive commands accessible through VS Code's Command Palette (\`Ctrl+Shift+P\` or \`Cmd+Shift+P\`). All AppDNA commands are prefixed with "AppDNA:" for easy discovery.

## Critical Guidelines

**ALWAYS** use the available MCP (Model Context Protocol) tools for modifying your AppDNA model. These tools provide safe, validated changes through the extension's interface and ensure your model remains consistent and valid.

## MCP Tool Reference

${generateViewDocs()}

${generateUserStoryDocs()}

${generateDataObjectDocs()}

${generateFormDocs()}

${generateReportDocs()}

${generatePageInitDocs()}

${generateWorkflowDocs()}

${generateGeneralFlowDocs()}

${generateModelDocs()}

${generateModelServiceDocs()}

## Tool Usage Patterns

**Command Synonyms:**
- **"create"** / **"add"** - Both mean creation/addition
  - \`create_\` prefix = new standalone entities (user stories, data objects, forms, reports, workflows)
  - \`add_\` prefix = adding elements to existing entities (properties, parameters, buttons, output variables)
- **"update"** / **"modify"** - Both mean modification (all use \`update_\` prefix)
- **"view"** / **"show"** / **"open"** - All mean opening views (use \`open_view\` tool)

**Views vs. Data Tools:**
- **Views** (\`open_view\`) - Interactive visual interfaces for exploration and editing
- **Get/List** tools - Raw JSON data for programmatic analysis
- **Preference**: Use views for exploration, get/list tools for automation

## Best Practices

**Getting Started:**
1. Create user stories to define requirements
2. Design data objects (business entities)
3. Build forms for user interfaces
4. Add workflows for business processes
5. Generate code for multiple platforms

**Configuration:**
- Model file: \`app-dna.json\` (configurable)
- Config file: \`app-dna.config.json\` (output paths, settings)
- Enable "Show Advanced Properties" for full feature access

## Getting Help

Use the AppDNA extension's built-in features:
- **Help View**: AppDNA: Show Help command
- **Welcome View**: AppDNA: Show Welcome command for new users
- **Tree Navigation**: Explore model structure via hierarchical tree
- **Page Preview**: See how forms/reports render before implementation
- **Analytics Dashboard**: Model complexity insights and metrics
- **Lexicon View**: Business terminology and definitions

**Always use MCP tools for model changes to ensure data integrity and validation.**`;
        console.log('[Extension] Chat mode content built successfully');
    } catch (error) {
        console.error('[Extension] Error building chat mode content:', error);
        throw error;
    }

    // Write the chat mode configuration file (always update to latest version)
    console.log('[Extension] Writing chat mode file...');
    console.log('[Extension] Content length:', chatModeContent.length, 'characters');
    fs.writeFileSync(chatModeFile, chatModeContent);
    console.log('[Extension] AppDNA chat mode file created/updated successfully at:', chatModeFile);
}

/**
 * Activates the extension
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "AppDNA" is now active!');
    
    // Set the extension context for use throughout the extension
    setExtensionContext(context);

    // Initialize the authentication service
    const authService = AuthService.getInstance();
    authService.initialize(context);

    // Get the workspace folder and model file path from config
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspacePath = workspaceFolder?.uri.fsPath;
    const modelFileName = workspacePath ? require('./utils/fileUtils').getModelFileNameFromConfig(workspacePath) : "app-dna.json";
    const appDNAFilePath = workspacePath ? path.join(workspacePath, modelFileName) : null;
    
    // Configure MCP server settings for GitHub Copilot
    if (workspaceFolder) {
        const extension = vscode.extensions.getExtension('derivative-programming.appdna');
        if (extension) {
            configureMcpSettings(workspaceFolder, extension.extensionPath).catch(error => {
                console.warn('Failed to configure MCP settings:', error);
            });
        }
    }

    // Create AppDNA chat mode for GitHub Copilot
    if (workspaceFolder) {
        console.log('[Extension] Creating AppDNA chat mode for workspace:', workspaceFolder.uri.fsPath);
        createAppDNAChatMode(workspaceFolder.uri.fsPath).catch(error => {
            console.error('[Extension] Failed to create AppDNA chat mode:', error);
            console.error('[Extension] Error stack:', error.stack);
        });
    } else {
        console.log('[Extension] No workspace folder found, skipping chat mode creation');
    }
    
    // Set initial context based on file existence
    const fileExists = appDNAFilePath && fs.existsSync(appDNAFilePath);
    updateFileExistsContext(appDNAFilePath);
    updateConfigExistsContext(workspacePath);
    
    // Load the objectDetailsView module safely
    try {
        console.log('objectDetailsView loaded successfully');
    } catch (err) {
        console.error('Failed to load objectDetailsView module:', err);
        // Create a fallback implementation in case of error
    }

    // Add a flag to track if a save is in progress
    let isSaving = false;

    // Patch ModelService.saveToFile to set/reset the flag
    const modelService = ModelService.getInstance();
    const originalSaveToFile = modelService.saveToFile.bind(modelService);
    modelService.saveToFile = async function(...args) {
        isSaving = true;
        try {
            const result = await originalSaveToFile(...args);
            return result;
        } finally {
            // Use a short timeout to ensure the file watcher sees the change
            setTimeout(() => { isSaving = false; }, 500);
        }
    };

    // Load model if model file exists
    if (appDNAFilePath && fs.existsSync(appDNAFilePath)) {
        modelService.loadFile(appDNAFilePath).then(() => {
            // Check if we should auto-expand nodes on load
            if (workspacePath) {
                const { getExpandNodesOnLoadFromConfig } = require('./utils/fileUtils');
                const shouldExpand = getExpandNodesOnLoadFromConfig(workspacePath);
                if (shouldExpand) {
                    // Small delay to ensure tree view is ready, then execute expand command
                    setTimeout(() => {
                        vscode.commands.executeCommand('appdna.expandAllTopLevel');
                    }, 100);
                }
            }
        }).catch(err => {
            console.error("Failed to load model:", err);
        });
    }    // Create the tree data provider (now with ModelService) and tree view
    const jsonTreeDataProvider = new JsonTreeDataProvider(appDNAFilePath, modelService);
    const treeView = vscode.window.createTreeView('appdna', { treeDataProvider: jsonTreeDataProvider });
    
    // Set the tree view in the tree data provider to enable title updates
    jsonTreeDataProvider.setTreeView(treeView);
    
    context.subscriptions.push(treeView);

    // Set up file system watcher for the model file
    if (workspaceFolder) {
        const fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, modelFileName)
        );
        
        // Watch for file creation
        fileWatcher.onDidCreate(() => {
            console.log(modelFileName + ' file was created');
            updateFileExistsContext(appDNAFilePath);
            vscode.commands.executeCommand("appdna.refreshView");
        });
        
        // Watch for file deletion
        fileWatcher.onDidDelete(() => {
            console.log(modelFileName + ' file was deleted');
            updateFileExistsContext(appDNAFilePath);
            vscode.commands.executeCommand("appdna.refreshView");
        });
        
        // Watch for file changes
        fileWatcher.onDidChange(() => {
            if (isSaving) {
                console.log("[DEBUG] Ignoring file change event triggered by our own save.");
                return;
            }
            console.log(modelFileName + ' file was changed');
            vscode.commands.executeCommand("appdna.refreshView");
        });
        
        // Make sure to dispose of the watcher when the extension is deactivated
        context.subscriptions.push(fileWatcher);
        
        // Set up file system watcher for the config file
        const configFileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, 'app-dna.config.json')
        );
        
        // Watch for config file creation
        configFileWatcher.onDidCreate(() => {
            console.log('app-dna.config.json file was created');
            vscode.commands.executeCommand("appdna.reloadConfig");
        });
        
        // Watch for config file deletion
        configFileWatcher.onDidDelete(() => {
            console.log('app-dna.config.json file was deleted');
            vscode.commands.executeCommand("appdna.reloadConfig");
        });
        
        // Watch for config file changes
        configFileWatcher.onDidChange(() => {
            console.log('app-dna.config.json file was changed');
            vscode.commands.executeCommand("appdna.reloadConfig");
        });
        
        // Make sure to dispose of the config watcher when the extension is deactivated
        context.subscriptions.push(configFileWatcher);
    }

    // Register all commands
    registerCommands(context, jsonTreeDataProvider, appDNAFilePath, modelService);

    // Register MCP-specific view commands (hidden from palette)
    registerMcpViewCommands(context);
    console.log('[Extension] MCP view commands registered');

    // Start MCP bridge for data and command access
    const mcpBridge = new McpBridge();
    mcpBridge.start(context);
    context.subscriptions.push(mcpBridge);
    console.log('[Extension] MCP bridge started');

    // Initialize AppDNA MCP Provider for VS Code Language Model Tools
    const mcpProvider = new AppDNAMcpProvider();
    context.subscriptions.push(mcpProvider);
    console.log('[Extension] MCP provider initialized - tools registered with VS Code');

    // Show welcome view if the AppDNA file doesn't exist and welcome view hasn't been shown yet
    if (!fileExists && !hasShownWelcomeView) {
        hasShownWelcomeView = true;
        
        // Small delay to allow VS Code to initialize properly before showing welcome view
        setTimeout(() => {
            showWelcomeView(context);
        }, 1000);
    }

    // Add command to show AppDNA panel when extension is activated
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.focus', () => {
            // If no file exists, show welcome view
            if (!fileExists && !hasShownWelcomeView) {
                hasShownWelcomeView = true;
                showWelcomeView(context);
            } else {
                treeView.reveal(undefined, { focus: true, expand: true });
            }
        })
    );
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
    console.log('Extension deactivated.');
    // Reset welcome view shown flag
    hasShownWelcomeView = false;
    
    // Clear model service cache on deactivation
    ModelService.getInstance().clearCache();
}
