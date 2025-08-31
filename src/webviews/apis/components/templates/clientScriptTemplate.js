"use strict";

// Import required script modules
const { getAPIControlUtilities } = require("../scripts/apiControlUtilities");
const { getAPIDOMInitialization } = require("../scripts/apiDOMInitialization");

const { getEndpointManagementFunctions } = require("../scripts/endpointManagementFunctions");

/**
 * Generates client-side JavaScript for the API details view
 * @param {Object} apiSite The API site data object
 * @param {Object} endpointSchema The endpoint schema properties
 * @returns {string} JavaScript code
 */
function getClientScriptTemplate(apiSite, endpointSchema = {}) {
    return `
        (function() {
            // vscode API is already available from main template
            let currentApiSite = ${JSON.stringify(apiSite)};
            let currentEndpoints = currentApiSite.apiEndPoint || [];
            let endpointSchema = ${JSON.stringify(endpointSchema)};

            // Tab behavior (Forms parity: .tab + data-tab targets #id)
            function initTabs() {
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        const target = tab.getAttribute('data-tab');
                        if (!target) return;
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                        tab.classList.add('active');
                        const content = document.getElementById(target);
                        if (content) content.classList.add('active');
                    });
                });
            }

            // Copy API site name
            function copyApiSiteName() {
                const name = currentApiSite.name || '';
                navigator.clipboard.writeText(name).catch(() => {});
            }

            function coerceValueByType(raw, type) {
                if (type === 'enum') return raw;
                if (type === 'boolean') return String(raw).toLowerCase() === 'true';
                if (type === 'number' || type === 'integer') {
                    const num = Number(raw);
                    if (isNaN(num)) return undefined;
                    return type === 'integer' ? Math.trunc(num) : num;
                }
                return raw;
            }

            // API Control Utilities
            ${getAPIControlUtilities()}

            // Endpoint Management Functions
            ${getEndpointManagementFunctions()}

            // Handle refresh endpoints list messages
            function refreshEndpointsList(newEndpoints, newSelection = null) {
                const endpointsList = document.getElementById('endpointsList');
                if (endpointsList) {
                    // Update the currentEndpoints array
                    currentEndpoints = newEndpoints;
                    
                    const currentSelection = newSelection !== null ? newSelection : endpointsList.selectedIndex;
                    endpointsList.innerHTML = '';
                    newEndpoints.forEach((endpoint, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = endpoint.name || 'Unnamed Endpoint';
                        endpointsList.appendChild(option);
                    });
                    
                    // Restore selection if still valid
                    if (currentSelection >= 0 && currentSelection < newEndpoints.length) {
                        endpointsList.selectedIndex = currentSelection;
                        
                        // Trigger the change event to update the details view
                        endpointsList.dispatchEvent(new Event('change'));
                    }
                    
                    // Update move button states
                    const moveUpButton = document.getElementById('moveUpEndpointsButton');
                    const moveDownButton = document.getElementById('moveDownEndpointsButton');
                    if (moveUpButton && moveDownButton) {
                        updateMoveButtonStates(endpointsList, moveUpButton, moveDownButton);
                    }
                    
                    console.log('[DEBUG] Endpoints list refreshed with', newEndpoints.length, 'items');
                }
            }
            
            // Update move button states helper function
            function updateMoveButtonStates(listElement, moveUpButton, moveDownButton) {
                if (!listElement || !moveUpButton || !moveDownButton) return;
                
                const selectedIndex = listElement.selectedIndex;
                const hasSelection = selectedIndex >= 0;
                const isFirstItem = selectedIndex === 0;
                const isLastItem = selectedIndex === listElement.options.length - 1;
                
                // Disable both buttons if no selection
                if (!hasSelection) {
                    moveUpButton.disabled = true;
                    moveDownButton.disabled = true;
                } else {
                    // Enable/disable based on position
                    moveUpButton.disabled = isFirstItem;
                    moveDownButton.disabled = isLastItem;
                }
            }

            // Message handlers for list refresh updates
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'refreshEndpointsList':
                        refreshEndpointsList(message.data, message.newSelection);
                        break;
                }
            });

            // API DOM Initialization  
            ${getAPIDOMInitialization()}

            document.addEventListener('DOMContentLoaded', () => {
                initTabs();
                initializeAPISettings();
                setupEndpointEventListeners();
                const copyBtn = document.querySelector('.copy-api-name-button');
                if (copyBtn) copyBtn.addEventListener('click', copyApiSiteName);
            });
        })();
    `;
}

module.exports = {
    getClientScriptTemplate
};