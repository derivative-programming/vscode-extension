// filepath: c:\VR\Source\DP\vscode-extension\src\webviews\welcomeView.js
// Welcome view component for the AppDNA extension
// Created: May 4, 2025
// Modified: May 25, 2025 - Added login step after step 1

"use strict";
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { AuthService } = require("../services/authService");
const { ModelService } = require("../services/modelService");

/**
 * Shows a welcome view with getting started information
 * @param {vscode.ExtensionContext} context The extension context
 */
function showWelcomeView(context) {
    // Check if the welcome panel is already open
    if (WelcomePanel.currentPanel) {
        WelcomePanel.currentPanel.reveal();
        return;
    }

    // Create and show the welcome panel
    const panel = new WelcomePanel(context.extensionUri);
    
    // Get authentication status and update the panel
    const authService = AuthService.getInstance();
    panel.updateLoginStatus(authService.isLoggedIn());
}

/**
 * Manages the welcome view panel
 */
class WelcomePanel {
    static currentPanel = undefined;
    static viewType = "appDnaWelcome";
    
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.isLoggedIn = false; // Default to not logged in
        this.panel = vscode.window.createWebviewPanel(
            WelcomePanel.viewType,
            "Welcome to AppDNA",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        // Set the HTML content
        this.panel.webview.html = this._getWebviewContent();

        // Set up message handling
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case "createNewFile":
                        vscode.commands.executeCommand("appdna.addFile");
                        break;
                    case "openExistingFile":
                        this._promptOpenFile();
                        break;
                    case "openDocumentation":
                        vscode.env.openExternal(vscode.Uri.parse("https://github.com/yourusername/appdna-extension"));
                        break;
                    case "checkFileExists":
                        this._checkFileExists();
                        break;
                    case "checkModelLoaded":
                        this._checkModelLoaded();
                        break;
                    case "openLoginView":
                        vscode.commands.executeCommand("appdna.loginModelServices");
                        break;
                    case "showModelFeatureCatalog":
                        vscode.commands.executeCommand("appdna.modelFeatureCatalog");
                        break;
                    case "showModelAIProcessing":
                        vscode.commands.executeCommand("appdna.modelAIProcessing");
                        break;
                    case "showModelValidation":
                        vscode.commands.executeCommand("appdna.modelValidation");
                        break;
                    case "showFabricationBlueprintCatalog":
                        vscode.commands.executeCommand("appdna.fabricationBlueprintCatalog");
                        break;
                    case "showModelFabrication":
                        vscode.commands.executeCommand("appdna.modelFabrication");
                        break;
                }
            },
            undefined,
            []
        );

        // Clean up resources when panel is disposed
        this.panel.onDidDispose(
            () => {
                WelcomePanel.currentPanel = undefined;
            },
            null,
            []
        );

        // Set the current panel
        WelcomePanel.currentPanel = this;
    }
    
    /**
     * Updates login status and refreshes the view accordingly
     * @param {boolean} isLoggedIn Whether user is logged in
     */
    updateLoginStatus(isLoggedIn) {
        this.isLoggedIn = isLoggedIn;
        this.panel.webview.postMessage({
            command: "updateLoginStatus",
            isLoggedIn: isLoggedIn
        });
    }

    /**
     * Reveals the welcome panel
     */
    reveal() {
        this.panel.reveal();
    }

    /**
     * Prompts user to select an existing AppDNA file
     */
    _promptOpenFile() {
        vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                "JSON Files": ["json"],
                "All Files": ["*"]
            },
            title: "Select AppDNA File"
        }).then(fileUri => {
            if (fileUri && fileUri[0]) {
                // Try to load the selected file
                vscode.commands.executeCommand("appdna.openProject", fileUri[0].fsPath);
            }
        });
    }

    /**
     * Checks if the AppDNA file exists and sends the result back to the webview
     */
    _checkFileExists() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const modelFileName = workspaceFolder ? require('../utils/fileUtils').getModelFileNameFromConfig(workspaceFolder) : "app-dna.json";
        const appDNAFilePath = workspaceFolder ? path.join(workspaceFolder, modelFileName) : null;
        const fileExists = appDNAFilePath && fs.existsSync(appDNAFilePath);
        
        this.panel.webview.postMessage({
            command: "fileExistsResult",
            fileExists
        });
    }

    /**
     * Checks if a model is currently loaded and sends the result back to the webview
     */
    _checkModelLoaded() {
        const modelService = ModelService.getInstance();
        const modelLoaded = modelService.isFileLoaded();
        
        this.panel.webview.postMessage({
            command: "modelLoadedResult",
            modelLoaded
        });
    }

    /**
     * Generates the HTML content for the welcome view
     * @returns {string} HTML content
     */
    _getWebviewContent() {
        const logoPath = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, "media", "appdna-logo.png")
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AppDNA</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        h1, h2, h3 {
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        .logo-container {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 180px;
            margin-bottom: 10px;
        }
        .welcome-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .action-container {
            display: flex;
            flex-wrap: wrap;
            margin-top: 20px;
            gap: 20px;
            justify-content: center;
        }
        .action-card {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            width: 200px;
            cursor: pointer;
            transition: border-color 0.3s, transform 0.2s;
        }
        .action-card:hover {
            border-color: var(--vscode-button-background);
            transform: translateY(-3px);
        }
        .action-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
            color: var(--vscode-editor-foreground);
        }        .action-description {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        .workflow-section {
            margin-top: 30px;
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
            margin-top: 10px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .button-disabled, .button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .workflow-container {
            margin-top: 20px;
        }
        .workflow-step {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
            position: relative;
        }
        .workflow-step:not(:last-child):after {
            content: "";
            position: absolute;
            bottom: -16px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 10px solid var(--vscode-panel-border);
        }
        .workflow-step-number {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            margin-right: 10px;
            float: left;
        }
        .workflow-step-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 8px;
            margin-left: 34px;
        }
        .workflow-step-description {
            margin-left: 34px;
            margin-bottom: 5px;
        }
        .workflow-note {
            font-style: italic;
            margin-left: 34px;
            color: var(--vscode-descriptionForeground);
            font-size: 13px;
            border-left: 3px solid var(--vscode-button-background);            padding-left: 10px;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="welcome-container">        <div class="logo-container">
            <img src="${logoPath}" alt="AppDNA Logo" class="logo" onerror="this.style.display='none'">
            <h1>Welcome to AppDNA</h1>
            <p>A graphical editor for AppDNA model files</p>
        </div>

        <p>AppDNA accelerates your development process by generating code based on your project model. This extension provides powerful tools to create, edit, and process your model through AI-assisted validation and fabrication services. With a user-friendly interface and guided workflow, you can transform your project requirements into code in significantly less time than traditional development approaches.</p>

        <div class="workflow-section">
            <h2>AppDNA Workflow</h2>
            <p>Follow these steps to create and develop your project using AppDNA:</p>
            
            <div class="workflow-container">
                <div class="workflow-step">
                    <div class="workflow-step-number">1</div>
                    <div class="workflow-step-title">Create A New Project Model</div>
                    <div class="workflow-step-description">Start by creating a new AppDNA model file for your project.</div>
                    <div class="workflow-note">A model is held in a JSON file in your project.</div>
                    <button id="createNewModelButton" class="button">Create A New Project Model</button>
                </div>

                <div class="workflow-step">
                    <div class="workflow-step-number">2</div>
                    <div class="workflow-step-title">Register or Login to AppDNA Model Services</div>
                    <div class="workflow-step-description">Create an account or sign in to access the AppDNA Model Services features.</div>
                    <div class="workflow-note">Model Services provide AI processing, validation, and code generation capabilities.</div>
                    <button id="loginButton" class="button">Register or Login</button>
                    <div id="loggedInMessage" style="display: none; margin-top: 10px; color: var(--vscode-terminal-ansiGreen);">✓ You are logged in</div>
                </div>

                <div class="workflow-step">
                    <div class="workflow-step-number">3</div>
                    <div class="workflow-step-title">Add Model Features</div>
                    <div class="workflow-step-description">From Model Services, browse and select from a catalog of features to add to your model.</div>
                    <button id="viewModelFeatureCatalogButton" class="button" style="display: none;">View Model Feature Catalog</button>
                </div>

                <div class="workflow-step">
                    <div class="workflow-step-number">4</div>
                    <div class="workflow-step-title">Request Model AI Processing</div>
                    <div class="workflow-step-description">From Model Services, submit the model to the Model AI processing service and download the results when complete.</div>
                    <div class="workflow-note">AI processing adds data to the model. It does not change existing data in the model.</div>
                    <button id="requestModelAIProcessingButton" class="button" style="display: none;">Request Model AI Processing</button>
                </div>

                <div class="workflow-step">
                    <div class="workflow-step-number">5</div>
                    <div class="workflow-step-title">Request Model Validation</div>
                    <div class="workflow-step-description">From Model Services, submit the model to the Model Validation service, download the results when complete, and approve and apply any change suggestions.</div>
                    <div class="workflow-note">Model Validation Change Requests adds and modifies the model.</div>
                    <button id="requestModelValidationButton" class="button" style="display: none;">Request Model Validation</button>
                </div>

                <div class="workflow-step">
                    <div class="workflow-step-number">6</div>
                    <div class="workflow-step-title">Select Blueprint</div>
                    <div class="workflow-step-description">From Model Services, select Blueprint Selection to define the type of files you want to fabricate.</div>
                    <button id="viewFabricationBlueprintCatalogButton" class="button" style="display: none;">View Fabrication Blueprint Catalog</button>
                </div>

                <div class="workflow-step">
                    <div class="workflow-step-number">7</div>
                    <div class="workflow-step-title">Request Model Fabrication</div>
                    <div class="workflow-step-description">From Model Services, submit the model to the Model Fabrication service and download the fabrication results when complete.</div>
                    <div class="workflow-note">In the fabrication_results folder, you will find generated files. Copy what you need from here to your project source code folder.</div>
                    <button id="requestModelFabricationButton" class="button" style="display: none;">Request Model Fabrication</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        (function() {
            // Acquire the VS Code API
            const vscode = acquireVsCodeApi();
            
            // Check if the plus sign in the tree view is visible
            function checkPlusSignVisibility() {
                vscode.postMessage({ command: "checkFileExists" });
            }

            // Check if a model is currently loaded
            function checkModelLoadedStatus() {
                vscode.postMessage({ command: "checkModelLoaded" });
            }
            
            // Add event listeners to action cards if they exist
            const createNew = document.getElementById("create-new");
            if (createNew) {
                createNew.addEventListener("click", () => {
                    vscode.postMessage({ command: "createNewFile" });
                });
            }
            
            const openExisting = document.getElementById("open-existing");
            if (openExisting) {
                openExisting.addEventListener("click", () => {
                    vscode.postMessage({ command: "openExistingFile" });
                });
            }
            
            const viewDocs = document.getElementById("view-docs");
            if (viewDocs) {
                viewDocs.addEventListener("click", () => {
                    vscode.postMessage({ command: "openDocumentation" });
                });
            }

            // Add event listener for Create New Project Model button
            const createNewModelButton = document.getElementById("createNewModelButton");
            if (createNewModelButton) {
                createNewModelButton.addEventListener("click", () => {
                    vscode.postMessage({ command: "createNewFile" });
                });
            }
            
            // Add event listener for Login button
            const loginButton = document.getElementById("loginButton");
            if (loginButton) {
                loginButton.addEventListener("click", () => {
                    vscode.postMessage({ command: "openLoginView" });
                });
            }

            // Add event listeners for model-dependent buttons
            const viewModelFeatureCatalogButton = document.getElementById("viewModelFeatureCatalogButton");
            if (viewModelFeatureCatalogButton) {
                viewModelFeatureCatalogButton.addEventListener("click", () => {
                    vscode.postMessage({ command: "showModelFeatureCatalog" });
                });
            }

            const requestModelAIProcessingButton = document.getElementById("requestModelAIProcessingButton");
            if (requestModelAIProcessingButton) {
                requestModelAIProcessingButton.addEventListener("click", () => {
                    vscode.postMessage({ command: "showModelAIProcessing" });
                });
            }

            const requestModelValidationButton = document.getElementById("requestModelValidationButton");
            if (requestModelValidationButton) {
                requestModelValidationButton.addEventListener("click", () => {
                    vscode.postMessage({ command: "showModelValidation" });
                });
            }

            const viewFabricationBlueprintCatalogButton = document.getElementById("viewFabricationBlueprintCatalogButton");
            if (viewFabricationBlueprintCatalogButton) {
                viewFabricationBlueprintCatalogButton.addEventListener("click", () => {
                    vscode.postMessage({ command: "showFabricationBlueprintCatalog" });
                });
            }

            const requestModelFabricationButton = document.getElementById("requestModelFabricationButton");
            if (requestModelFabricationButton) {
                requestModelFabricationButton.addEventListener("click", () => {
                    vscode.postMessage({ command: "showModelFabrication" });
                });
            }

            // Check file existence and model loading status initially and periodically update button state
            checkPlusSignVisibility();
            checkModelLoadedStatus();
            setInterval(() => {
                checkPlusSignVisibility();
                checkModelLoadedStatus();
            }, 1000);
            
            // Handle messages from the extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'fileExistsResult':
                        updateCreateButtonState(!message.fileExists);
                        break;
                    case 'modelLoadedResult':
                        updateModelDependentButtonsState(message.modelLoaded);
                        break;
                    case 'updateLoginStatus':
                        updateLoginButtonState(message.isLoggedIn);
                        break;
                }
            });
            
            // Update button state based on file existence
            function updateCreateButtonState(enabled) {
                const createNewModelButton = document.getElementById("createNewModelButton");
                if (createNewModelButton) {
                    createNewModelButton.disabled = !enabled;
                    
                    if (!enabled) {
                        createNewModelButton.title = "Project model already exists";
                        createNewModelButton.classList.add("button-disabled");
                    } else {
                        createNewModelButton.title = "Create a new project model file";
                        createNewModelButton.classList.remove("button-disabled");
                    }
                }
            }
            
            // Update login button state based on login status
            function updateLoginButtonState(isLoggedIn) {
                const loginButton = document.getElementById("loginButton");
                const loggedInMessage = document.getElementById("loggedInMessage");
                
                if (loginButton && loggedInMessage) {
                    if (isLoggedIn) {
                        loginButton.style.display = "none";
                        loggedInMessage.style.display = "block";
                    } else {
                        loginButton.style.display = "block";
                        loggedInMessage.style.display = "none";
                    }
                }
            }

            // Update model-dependent buttons state based on whether a model is loaded
            function updateModelDependentButtonsState(modelLoaded) {
                const modelDependentButtons = [
                    "viewModelFeatureCatalogButton",
                    "requestModelAIProcessingButton",
                    "requestModelValidationButton",
                    "viewFabricationBlueprintCatalogButton",
                    "requestModelFabricationButton"
                ];

                modelDependentButtons.forEach(buttonId => {
                    const button = document.getElementById(buttonId);
                    if (button) {
                        if (modelLoaded) {
                            button.style.display = "block";
                        } else {
                            button.style.display = "none";
                        }
                    }
                });
            }
        })();
    </script>
</body>
</html>`;
    }
}

module.exports = {
    showWelcomeView,
    WelcomePanel
};