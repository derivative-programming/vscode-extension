"use strict";

/**
 * Generates client-side JavaScript for the API details view
 * @param {Object} apiSite The API site data object
 * @returns {string} JavaScript code
 */
function getClientScriptTemplate(apiSite) {
    return `
        (function() {
            // Store current API site data
            let currentApiSite = ${JSON.stringify(apiSite)};
            
            // Tab functionality
            window.openTab = function(evt, tabName) {
                // Hide all tab content
                const tabContents = document.getElementsByClassName("tab-content");
                for (let i = 0; i < tabContents.length; i++) {
                    tabContents[i].classList.remove("active");
                }
                
                // Remove active class from all tab buttons
                const tabButtons = document.getElementsByClassName("tab-button");
                for (let i = 0; i < tabButtons.length; i++) {
                    tabButtons[i].classList.remove("active");
                }
                
                // Show the selected tab and mark button as active
                document.getElementById(tabName).classList.add("active");
                evt.currentTarget.classList.add("active");
            };
            
            // Copy API site name functionality
            window.copyApiSiteName = function() {
                const apiName = currentApiSite.name || '';
                navigator.clipboard.writeText(apiName).then(() => {
                    console.log('API site name copied to clipboard:', apiName);
                }).catch(err => {
                    console.error('Failed to copy API site name:', err);
                });
            };
            
            // Settings change handlers
            function setupSettingsInputHandlers() {
                // Listen for changes on all setting inputs
                const settingsInputs = document.querySelectorAll('#settings-form input, #settings-form select');
                settingsInputs.forEach(input => {
                    const propertyName = input.getAttribute('name');
                    const checkbox = input.parentElement.querySelector(\`input[data-prop="\${propertyName}"]\`);
                    
                    if (!propertyName || !checkbox) return;
                    
                    input.addEventListener('change', function() {
                        if (checkbox.checked) {
                            // Property exists, send update
                            vscode.postMessage({
                                command: 'updateSettings',
                                data: {
                                    property: propertyName,
                                    exists: true,
                                    value: input.value
                                }
                            });
                        }
                    });
                });
                
                // Listen for checkbox changes in settings tab
                const settingsCheckboxes = document.querySelectorAll('.setting-checkbox');
                settingsCheckboxes.forEach(checkbox => {
                    const key = checkbox.getAttribute('data-prop');
                    const field = checkbox.parentElement.querySelector(\`[name="\${key}"]\`);
                    if (!key || !field) return;
                    
                    checkbox.addEventListener('change', function() {
                        if (checkbox.checked) {
                            // Enable the field
                            field.readOnly = false;
                            field.disabled = false;
                            field.style.backgroundColor = 'var(--vscode-input-background)';
                            field.style.color = 'var(--vscode-input-foreground)';
                            
                            // Set default value if empty
                            if (!field.value && field.tagName === 'SELECT') {
                                if (field.options.length > 0) {
                                    field.value = field.options[0].value;
                                }
                            }
                            
                            // Send update to add property
                            vscode.postMessage({
                                command: 'updateSettings',
                                data: {
                                    property: key,
                                    exists: true,
                                    value: field.value
                                }
                            });
                        } else {
                            // Disable the field and remove property
                            field.readOnly = true;
                            field.disabled = true;
                            field.style.backgroundColor = 'var(--vscode-input-disabledBackground)';
                            field.style.color = 'var(--vscode-input-disabledForeground)';
                            
                            // Send update to remove property
                            vscode.postMessage({
                                command: 'updateSettings',
                                data: {
                                    property: key,
                                    exists: false,
                                    value: null
                                }
                            });
                        }
                    });
                });
            }
            
            // Initialize when DOM is ready
            document.addEventListener('DOMContentLoaded', function() {
                console.log('[DEBUG] API Details - DOM loaded, initializing...');
                
                // Set up settings input handlers
                setupSettingsInputHandlers();
                
                // Set up copy button
                const copyButton = document.querySelector('.copy-api-name-button');
                if (copyButton) {
                    copyButton.addEventListener('click', copyApiSiteName);
                }
                
                console.log('[DEBUG] API Details - Initialization complete');
            });
            
        })();
    `;
}

module.exports = {
    getClientScriptTemplate
};