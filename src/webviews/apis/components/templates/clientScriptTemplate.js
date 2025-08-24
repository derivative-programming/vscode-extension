"use strict";

// Import required script modules
const { getAPIControlUtilities } = require("../scripts/apiControlUtilities");
const { getAPIDOMInitialization } = require("../scripts/apiDOMInitialization");

/**
 * Generates client-side JavaScript for the API details view
 * @param {Object} apiSite The API site data object
 * @returns {string} JavaScript code
 */
function getClientScriptTemplate(apiSite) {
    return `
        (function() {
            const vscode = acquireVsCodeApi();
            let currentApiSite = ${JSON.stringify(apiSite)};

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

            // API DOM Initialization  
            ${getAPIDOMInitialization()}

            document.addEventListener('DOMContentLoaded', () => {
                initTabs();
                const copyBtn = document.querySelector('.copy-api-name-button');
                if (copyBtn) copyBtn.addEventListener('click', copyApiSiteName);
            });
            });
        })();
    `;
}

module.exports = {
    getClientScriptTemplate
};