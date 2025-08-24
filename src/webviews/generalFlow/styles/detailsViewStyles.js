"use strict";

// Reuse the same details view styles as forms/pageinits for consistency
function getDetailViewStyles() {
    const { getDetailViewStyles: getFormStyles } = require("../../forms/styles/detailsViewStyles");
    const baseStyles = typeof getFormStyles === 'function' ? getFormStyles() : "";
    
    // Add general flow specific styles
    const generalFlowStyles = `
        /* Header layout to keep copy icon inline with title */
        .header-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        .header-title { margin: 0; }

        /* Copy General Flow Name Button Styles */
        .copy-general-flow-name-button {
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
        
        .copy-general-flow-name-button:hover {
            background: var(--vscode-toolbar-hoverBackground) !important;
            background-color: var(--vscode-toolbar-hoverBackground) !important;
        }
        
        .copy-general-flow-name-button:active {
            background: var(--vscode-toolbar-activeBackground);
            transform: scale(0.95);
        }
        
        .copy-general-flow-name-button .codicon {
            font-size: 16px;
        }
    `;
    
    return baseStyles + generalFlowStyles;
}

module.exports = { getDetailViewStyles };
