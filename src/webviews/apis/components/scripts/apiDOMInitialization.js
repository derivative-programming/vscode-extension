"use strict";

/**
 * File: apiDOMInitialization.js
 * Purpose: DOM initialization and setup functions for the API details view
 * Created: 2025-01-27
 * Modified: 2025-01-27 - Initial creation based on Forms domInitialization.js
 */

/**
 * Gets DOM initialization functions for the API details view
 * @returns {string} JavaScript code for DOM initialization
 */
function getAPIDOMInitialization() {
    return `
    // Initialize all DOM event listeners and functionality for API details
function initializeDOMEvents() {
    console.log('[DEBUG] Initializing API DOM events');
    
    // Set up settings input handlers for API changes
    setupSettingsInputHandlers();
    
    console.log('[DEBUG] API DOM events initialized');
}

// Initialize DOM events when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOM content loaded, initializing API events');
    initializeDOMEvents();
});

// Also initialize if document is already loaded
if (document.readyState === 'loading') {
    // Still loading, wait for DOMContentLoaded
    console.log('[DEBUG] Document still loading, waiting for DOMContentLoaded');
} else {
    // Already loaded, initialize immediately  
    console.log('[DEBUG] Document already loaded, initializing API events immediately');
    initializeDOMEvents();
}
    `;
}

module.exports = {
    getAPIDOMInitialization
};
