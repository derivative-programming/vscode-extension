// flowBuilder.js
// Helper functions for building flow maps between pages
// Created: July 13, 2025

"use strict";

/**
 * Builds a flow map showing connections between pages
 * @param {Array} pages Array of page objects
 * @returns {Object} Flow map object
 */
function buildFlowMap(pages) {
    const flowMap = {
        pages: pages,
        connections: []
    };
    
    // Build connections based on destination target names
    pages.forEach(sourcePage => {
        sourcePage.buttons.forEach(button => {
            // Find the destination page
            const destinationPage = pages.find(page => page.name === button.destinationTargetName);
            if (destinationPage) {
                flowMap.connections.push({
                    from: sourcePage.name,
                    to: destinationPage.name,
                    buttonText: button.buttonText || button.buttonName,
                    buttonType: button.buttonType
                });
            }
        });
    });
    
    return flowMap;
}

module.exports = {
    buildFlowMap
};
