// filepath: c:\VR\Source\DP\vscode-extension\src\webviews\welcomeView.js
// Welcome view component for the AppDNA extension
// Created: May 4, 2025

"use strict";
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

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
}

/**
 * Manages the welcome view panel
 */
class WelcomePanel {
    static currentPanel = undefined;
    static viewType = "appDnaWelcome";

    constructor(extensionUri) {
        this.extensionUri = extensionUri;
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
        }
        .action-description {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        .feature-section {
            margin-top: 30px;
        }
        .feature-list {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 15px;
        }
        .feature-item {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            width: calc(50% - 15px);
        }
        .feature-title {
            font-weight: bold;
            margin-bottom: 5px;
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
        @media (max-width: 600px) {
            .feature-item {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="welcome-container">
        <div class="logo-container">
            <img src="${logoPath}" alt="AppDNA Logo" class="logo" onerror="this.style.display='none'">
            <h1>Welcome to AppDNA</h1>
            <p>A graphical editor for AppDNA model files</p>
        </div>

        <p>AppDNA provides a visual interface for editing, validating, and managing AppDNA model JSON files for your application. This extension helps you create and modify model files with a dynamic UI generated from a JSON schema.</p>

        <h2>Getting Started</h2>
        <div class="action-container">
            <div class="action-card" id="create-new">
                <div class="action-title">Create New Model</div>
                <div class="action-description">Start with a new AppDNA model file in your workspace.</div>
                <button class="button">Create New</button>
            </div>
            
            <div class="action-card" id="open-existing">
                <div class="action-title">Open Existing Model</div>
                <div class="action-description">Open an existing AppDNA model file.</div>
                <button class="button">Open File</button>
            </div>
            
            <div class="action-card" id="view-docs">
                <div class="action-title">Documentation</div>
                <div class="action-description">Read the documentation to learn more about using AppDNA.</div>
                <button class="button">Open Docs</button>
            </div>
        </div>

        <div class="feature-section">
            <h2>Key Features</h2>
            <div class="feature-list">
                <div class="feature-item">
                    <div class="feature-title">Dynamic UI Generation</div>
                    <p>Edit your model using UI controls automatically generated from the JSON schema.</p>
                </div>
                <div class="feature-item">
                    <div class="feature-title">Schema Validation</div>
                    <p>Validate your model against the schema to ensure correctness.</p>
                </div>
                <div class="feature-item">
                    <div class="feature-title">File Management</div>
                    <p>Create, open, and save AppDNA model files with ease.</p>
                </div>
                <div class="feature-item">
                    <div class="feature-title">Code Generation</div>
                    <p>Generate TypeScript and C# code from your model.</p>
                </div>
            </div>
        </div>

        <h3>Did You Know?</h3>
        <p>You can access all AppDNA commands through the Command Palette (Ctrl+Shift+P) by typing "AppDNA".</p>
    </div>

    <script>
        (function() {
            // Acquire the VS Code API
            const vscode = acquireVsCodeApi();
            
            // Add event listeners to action cards
            document.getElementById("create-new").addEventListener("click", () => {
                vscode.postMessage({ command: "createNewFile" });
            });
            
            document.getElementById("open-existing").addEventListener("click", () => {
                vscode.postMessage({ command: "openExistingFile" });
            });
            
            document.getElementById("view-docs").addEventListener("click", () => {
                vscode.postMessage({ command: "openDocumentation" });
            });
        })();
    </script>
</body>
</html>`;
    }
}

module.exports = {
    showWelcomeView
};