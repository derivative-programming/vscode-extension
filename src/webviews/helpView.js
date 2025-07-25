// filepath: /home/runner/work/vscode-extension/vscode-extension/src/webviews/helpView.js
// Help view component for the AppDNA extension
// Created: December 24, 2024

"use strict";
const vscode = require("vscode");

/**
 * Shows a help view with information about the extension
 * @param {vscode.ExtensionContext} context The extension context
 */
function showHelpView(context) {
    // Check if the help panel is already open
    if (HelpPanel.currentPanel) {
        HelpPanel.currentPanel.reveal();
        return;
    }

    // Create and show the help panel
    const panel = new HelpPanel(context.extensionUri);
}

/**
 * Manages the help view panel
 */
class HelpPanel {
    static currentPanel = undefined;
    static viewType = "appDnaHelp";
    
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.panel = vscode.window.createWebviewPanel(
            HelpPanel.viewType,
            "AppDNA Help",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        // Set the webview's initial html content
        this.panel.webview.html = this._getWebviewContent();

        // Clean up resources when panel is disposed
        this.panel.onDidDispose(
            () => {
                HelpPanel.currentPanel = undefined;
            },
            null,
            []
        );

        // Set the current panel
        HelpPanel.currentPanel = this;
    }

    /**
     * Reveals the help panel
     */
    reveal() {
        this.panel.reveal();
    }

    /**
     * Generates the HTML content for the help view
     * @returns {string} HTML content
     */
    _getWebviewContent() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AppDNA Help</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .help-container {
            max-width: 600px;
            margin: 0 auto;
        }
        .help-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .help-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--vscode-editor-foreground);
        }
        .help-section {
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
        }
        .help-section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--vscode-editor-foreground);
        }
        .help-section-content {
            color: var(--vscode-descriptionForeground);
            line-height: 1.6;
        }
        .help-link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }
        .help-link:hover {
            color: var(--vscode-textLink-activeForeground);
            text-decoration: underline;
        }
        .icon {
            margin-right: 8px;
            vertical-align: middle;
        }
        h4 {
            color: var(--vscode-editor-foreground);
            margin-top: 15px;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
        }
        ul {
            margin-top: 8px;
            margin-bottom: 15px;
        }
        li {
            margin-bottom: 4px;
        }
        strong {
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
        }
    </style>
</head>
<body>
    <div class="help-container">
        <div class="help-header">
            <div class="help-title">🛠️ AppDNA Extension Help</div>
            <div class="help-section-content">Get help and support for the AppDNA VS Code extension</div>
        </div>

        <div class="help-section">
            <div class="help-section-title">📖 Learn More</div>
            <div class="help-section-content">
                Learn more about this extension on <a href="https://github.com/derivative-programming/vscode-extension" target="_blank" class="help-link">GitHub</a>.
                <br><br>
                Visit our repository to find detailed documentation and the latest updates.
                <br><br>
                Join the discussion at our <a href="https://github.com/derivative-programming/vscode-extension/discussions" target="_blank" class="help-link">discussion board</a> to ask questions, share ideas, and get community support.
                <br><br>
                A windows app version of this extension is available <a href="https://github.com/derivative-programming/ModelWinApp" target="_blank" class="help-link">here</a>.
            </div>
        </div>

        <div class="help-section">
            <div class="help-section-title">🐛 Report Issues</div>
            <div class="help-section-content">
                Found a bug or have a feature request? Please log any issues <a href="https://github.com/derivative-programming/vscode-extension/issues" target="_blank" class="help-link">here</a>.
                <br><br>
                When reporting issues, please include:
                <ul>
                    <li>VS Code version</li>
                    <li>Extension version</li>
                    <li>Steps to reproduce the issue</li>
                    <li>Expected vs actual behavior</li>
                </ul>
            </div>
        </div>

        <div class="help-section">
            <div class="help-section-title">⌨️ Keyboard Shortcuts</div>
            <div class="help-section-content">
                All shortcuts use the <strong>Alt+A</strong> prefix to avoid conflicts with VS Code shortcuts:
                
                <h4>File Operations</h4>
                <ul>
                    <li><strong>Alt+A N</strong> - Create new AppDNA model file</li>
                    <li><strong>Alt+A S</strong> - Save model to file</li>
                </ul>

                <h4>Add Items</h4>
                <ul>
                    <li><strong>Alt+A O</strong> - Add new data object</li>
                    <li><strong>Alt+A R</strong> - Add new report</li>
                    <li><strong>Alt+A F</strong> - Add new form</li>
                </ul>

                <h4>View Controls</h4>
                <ul>
                    <li><strong>Alt+A E</strong> - Expand all top level items</li>
                    <li><strong>Alt+A C</strong> - Collapse all top level items</li>
                    <li><strong>Alt+A T</strong> - Refresh view (re<strong>T</strong>resh)</li>
                    <li><strong>Alt+A I</strong> - Show filter (f<strong>I</strong>lter)</li>
                    <li><strong>Alt+A X</strong> - Clear filter (clear = <strong>X</strong>)</li>
                </ul>

                <h4>Diagrams & Views</h4>
                <ul>
                    <li><strong>Alt+A H</strong> - Show hierarchy diagram</li>
                    <li><strong>Alt+A P</strong> - Show page flow diagram</li>
                </ul>

                <h4>Settings & Help</h4>
                <ul>
                    <li><strong>Alt+A G</strong> - Show AppDNA settings (confi<strong>G</strong>)</li>
                    <li><strong>Alt+A W</strong> - Show welcome screen</li>
                    <li><strong>Alt+A Q</strong> - Show help (<strong>Q</strong>uestion)</li>
                </ul>
            </div>
        </div>

        <div class="help-section">
            <div class="help-section-title">💡 Quick Tips</div>
            <div class="help-section-content">
                <ul>
                    <li>Use the Welcome view to get started with AppDNA projects</li>
                    <li>Access the tree view to navigate your AppDNA model structure</li>
                    <li>Save your work frequently using the save button in the tree view</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;
    }
}

module.exports = {
    showHelpView,
    HelpPanel
};