"use strict";
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

/**
 * Gets the main HTML template for the API details view
 * @param {Object} apiSite The API site data object
 * @param {number} endpointCount Number of endpoints in the API site
 * @param {string} settingsHtml HTML content for the settings tab
 * @param {string} endpointListViewFields HTML fields for endpoints list view
 * @param {string} clientScript JavaScript code for the client
 * @param {string} codiconsUri URI for the codicon CSS file
 * @returns {string} Complete HTML document
 */
function getMainTemplate(
    apiSite, 
    endpointCount,
    settingsHtml, 
    endpointListViewFields,
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
    ${codiconsUri ? `<link href="${codiconsUri}" rel="stylesheet" />` : ""}
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
    /* Ensure left-placed existence checkbox aligns tightly with input */
    .form-row .setting-checkbox { margin-left: 0; }
    </style>
</head>
<body>
    <div class="content">
        <!-- Header with API site name and copy button -->
        <div class="header-container">
            <h1 class="header-title">Details for ${apiSite.name || 'Unknown'} API Site</h1>
            <button type="button" class="copy-api-name-button" title="Copy API site name">
                <span class="codicon codicon-copy"></span>
            </button>
        </div>

        <!-- Tabs (match Forms view markup) -->
        <div class="tabs">
            <div class="tab active" data-tab="settings">Settings</div>
            <div class="tab" data-tab="endpoints">Endpoints (${endpointCount})</div>
        </div>

        <!-- Settings Tab Content -->
        <div id="settings" class="tab-content active">
            ${settingsHtml}
        </div>

        <!-- Endpoints Tab Content -->
        <div id="endpoints" class="tab-content">
            <div class="view-icons" data-tab="endpoints">
                <button id="add-endpoint-btn" class="add-prop-button">Add Endpoint</button>
            </div>

            <div id="endpointsListView" class="view-content active">
                <div class="list-container">
                    <select id="endpointsList" size="10">
                        ${(apiSite.apiEndPoint || []).map((endpoint, index) => {
                            const name = (endpoint && typeof endpoint === 'object' && endpoint.name) ? endpoint.name : 'Unnamed Endpoint';
                            return `<option value="${index}">${name}</option>`;
                        }).join('')}
                    </select>
                    <div class="list-buttons">
                        <button id="copyEndpointsButton" class="copy-props-button">Copy List</button>
                        <button id="moveUpEndpointsButton" class="move-button">Move Up</button>
                        <button id="moveDownEndpointsButton" class="move-button">Move Down</button>
                        <button id="reverseEndpointsButton" class="reverse-button">Reverse</button>
                    </div>
                </div>
                <div id="endpointDetailsContainer" class="details-container" style="display: none;">
                    <form id="endpointDetailsForm">
                        ${endpointListViewFields}
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