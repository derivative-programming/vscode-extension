"use strict";
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

/**
 * Gets the main HTML template for the API details view
 * @param {Object} apiSite The API site data object
 * @param {string} settingsHtml HTML content for the settings tab
 * @param {string} clientScript JavaScript code for the client
 * @param {string} codiconsUri URI for the codicon CSS file
 * @returns {string} Complete HTML document
 */
function getMainTemplate(
    apiSite, 
    settingsHtml, 
    clientScript,
    codiconsUri
) {
    console.log('[DEBUG] API site object in mainTemplate:', apiSite);
    console.log('[DEBUG] API site keys:', Object.keys(apiSite));
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Details: ${apiSite.name || 'Unknown API Site'}</title>
    <link href="${codiconsUri}" rel="stylesheet" />
    <style>
        ${getDetailViewStyles()}
        
        /* Header Button Styles */
        .header-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .header-title {
            margin: 0;
        }
        
        .copy-api-name-button {
            background: transparent !important;
            background-color: transparent !important;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 6px;
            border-radius: 4px;
            transition: background 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 28px;
        }
        
        .copy-api-name-button:hover {
            background: var(--vscode-toolbar-hoverBackground) !important;
            background-color: var(--vscode-toolbar-hoverBackground) !important;
        }
        
        .copy-api-name-button:active {
            background: var(--vscode-toolbar-activeBackground);
            transform: scale(0.95);
        }
        
        .copy-api-name-button .codicon {
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="content">
        <!-- Header with API site name and copy button -->
        <div class="header-container">
            <h1 class="header-title">API Site: ${apiSite.name || 'Unknown'}</h1>
            <button type="button" class="copy-api-name-button" title="Copy API site name">
                <span class="codicon codicon-copy"></span>
            </button>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-container">
            <div class="tab-nav">
                <button class="tab-button active" onclick="openTab(event, 'settings-tab')">
                    <span class="codicon codicon-settings"></span>
                    Settings
                </button>
            </div>

            <!-- Settings Tab Content -->
            <div id="settings-tab" class="tab-content active">
                <div class="form-container">
                    <form id="settings-form">
                        ${settingsHtml}
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Store the API site data for reference
        const apiSite = ${JSON.stringify(apiSite)};
        
        ${clientScript}
    </script>
</body>
</html>`;
}

module.exports = {
    getMainTemplate
};