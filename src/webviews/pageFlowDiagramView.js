// pageFlowDiagramView.js
// Page flow diagram view for VS Code extension (refactored)
// Shows the flow between pages based on destination target names in buttons
// Created: July 12, 2025, Refactored: July 13, 2025

"use strict";

// Import the new modular page flow diagram view
const pageFlowView = require('./pageflow/pageFlowDiagramView');

// Re-export the functions for backward compatibility
module.exports = {
    showPageFlowDiagram: pageFlowView.showPageFlowDiagram,
    showPageFlowWithUserJourney: pageFlowView.showPageFlowWithUserJourney,
    getPageFlowPanel: pageFlowView.getPageFlowPanel,
    closePageFlowView: pageFlowView.closePageFlowView
};
